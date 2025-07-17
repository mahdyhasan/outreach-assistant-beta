import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.51.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  fromName?: string;
}

// Simple SMTP client implementation
class SMTPClient {
  private host: string;
  private port: number;
  private username: string;
  private password: string;
  private conn: Deno.TcpConn | null = null;

  constructor(host: string, port: number, username: string, password: string) {
    this.host = host;
    this.port = port;
    this.username = username;
    this.password = password;
  }

  async connect(): Promise<void> {
    try {
      this.conn = await Deno.connect({
        hostname: this.host,
        port: this.port,
      });
      
      // Read server greeting
      await this.readResponse();
      
      // Send EHLO
      await this.sendCommand('EHLO ' + this.host);
      
      // Start TLS
      await this.sendCommand('STARTTLS');
      
      // Re-send EHLO after TLS
      await this.sendCommand('EHLO ' + this.host);
      
      // Authenticate
      await this.sendCommand('AUTH LOGIN');
      await this.sendCommand(btoa(this.username));
      await this.sendCommand(btoa(this.password));
      
    } catch (error) {
      console.error('SMTP connection error:', error);
      throw new Error(`Failed to connect to SMTP server: ${error.message}`);
    }
  }

  async sendEmail(email: EmailRequest): Promise<string> {
    if (!this.conn) {
      throw new Error('Not connected to SMTP server');
    }

    try {
      // Send MAIL FROM
      await this.sendCommand(`MAIL FROM:<${this.username}>`);
      
      // Send RCPT TO
      await this.sendCommand(`RCPT TO:<${email.to}>`);
      
      // Send DATA
      await this.sendCommand('DATA');
      
      // Prepare email content
      const fromAddress = email.fromName 
        ? `"${email.fromName}" <${this.username}>`
        : this.username;
        
      const emailData = [
        `From: ${fromAddress}`,
        `To: ${email.to}`,
        `Subject: ${email.subject}`,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=UTF-8',
        '',
        email.htmlContent,
        '.'
      ].join('\r\n');
      
      await this.sendRaw(emailData);
      const response = await this.readResponse();
      
      // Generate message ID
      const messageId = `${Date.now()}@${this.host}`;
      
      return messageId;
      
    } catch (error) {
      console.error('SMTP send error:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.conn) {
      try {
        await this.sendCommand('QUIT');
      } catch (error) {
        console.error('Error during QUIT:', error);
      }
      this.conn.close();
      this.conn = null;
    }
  }

  private async sendCommand(command: string): Promise<string> {
    await this.sendRaw(command + '\r\n');
    return await this.readResponse();
  }

  private async sendRaw(data: string): Promise<void> {
    if (!this.conn) throw new Error('Not connected');
    
    const encoder = new TextEncoder();
    await this.conn.write(encoder.encode(data));
  }

  private async readResponse(): Promise<string> {
    if (!this.conn) throw new Error('Not connected');
    
    const buffer = new Uint8Array(4096);
    const bytesRead = await this.conn.read(buffer);
    
    if (!bytesRead) {
      throw new Error('No response from server');
    }
    
    const decoder = new TextDecoder();
    const response = decoder.decode(buffer.subarray(0, bytesRead));
    console.log('SMTP Response:', response.trim());
    
    // Check for error responses
    if (response.startsWith('4') || response.startsWith('5')) {
      throw new Error(`SMTP Error: ${response.trim()}`);
    }
    
    return response;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const emailRequest: EmailRequest = await req.json();
    console.log('Email request received for:', emailRequest.to);

    // Get Zoho SMTP configuration from user settings
    const { data: userSettings, error: settingsError } = await supabase
      .from('user_settings')
      .select('api_keys')
      .eq('user_id', user.id)
      .single();

    if (settingsError) {
      throw new Error(`Failed to get user settings: ${settingsError.message}`);
    }

    const apiKeys = userSettings?.api_keys as any;
    const zohoConfig = apiKeys?.['zoho-email'];

    if (!zohoConfig || !zohoConfig.isActive) {
      throw new Error('Zoho Email configuration not found or not active');
    }

    if (!zohoConfig.emailHost || !zohoConfig.emailUsername || !zohoConfig.emailPassword) {
      throw new Error('Incomplete Zoho Email configuration. Please check SMTP settings.');
    }

    console.log('Using Zoho SMTP configuration for:', zohoConfig.emailUsername);

    // Create SMTP client and send email
    const smtpClient = new SMTPClient(
      zohoConfig.emailHost,
      587, // Standard SMTP port for Zoho
      zohoConfig.emailUsername,
      zohoConfig.emailPassword
    );

    let messageId: string;
    try {
      await smtpClient.connect();
      messageId = await smtpClient.sendEmail(emailRequest);
      console.log('Email sent successfully with ID:', messageId);
    } finally {
      await smtpClient.disconnect();
    }

    // Log the email send to database
    await supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
        entity_type: 'email',
        action: 'sent',
        metadata: {
          to: emailRequest.to,
          subject: emailRequest.subject,
          smtp_provider: 'zoho',
          message_id: messageId
        }
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId,
        message: 'Email sent successfully via Zoho SMTP'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in send-smtp-email function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});