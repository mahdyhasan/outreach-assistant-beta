import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScoringRequest {
  leadId: string;
  companyData: {
    company_name: string;
    company_size: string;
    industry: string;
    location: string;
    website?: string;
    enrichment_data?: any;
  };
  scoringWeights: {
    companySize: number;
    techStack: number;
    funding: number;
    jobPostings: number;
    geographic: number;
  };
  geographicScoring: {
    uk: number;
    australia: number;
    singapore: number;
    malaysia: number;
    qatar: number;
    westernEurope: number;
    other: number;
  };
  openaiApiKey: string;
}

interface OpenAIResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { leadId, companyData, scoringWeights, geographicScoring, openaiApiKey }: ScoringRequest = await req.json();

    if (!openaiApiKey) {
      throw new Error('OpenAI API key is required');
    }

    console.log(`Scoring lead ${leadId} for company: ${companyData.company_name}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate base scores
    let scores = {
      companySize: 0,
      techStack: 0,
      funding: 0,
      jobPostings: 0,
      geographic: 0,
    };

    // Company Size Scoring (target: 11-200 employees)
    const sizeMatch = companyData.company_size.match(/(\d+)/g);
    if (sizeMatch) {
      const size = parseInt(sizeMatch[0]);
      if (size >= 11 && size <= 200) {
        scores.companySize = 100;
      } else if (size >= 5 && size <= 500) {
        scores.companySize = 70;
      } else if (size >= 201 && size <= 1000) {
        scores.companySize = 50;
      } else {
        scores.companySize = 20;
      }
    }

    // Geographic Scoring
    const location = companyData.location.toLowerCase();
    if (location.includes('uk') || location.includes('united kingdom') || location.includes('england') || location.includes('scotland') || location.includes('wales')) {
      scores.geographic = geographicScoring.uk;
    } else if (location.includes('australia')) {
      scores.geographic = geographicScoring.australia;
    } else if (location.includes('singapore')) {
      scores.geographic = geographicScoring.singapore;
    } else if (location.includes('malaysia')) {
      scores.geographic = geographicScoring.malaysia;
    } else if (location.includes('qatar')) {
      scores.geographic = geographicScoring.qatar;
    } else if (location.includes('germany') || location.includes('france') || location.includes('spain') || location.includes('italy') || location.includes('netherlands') || location.includes('belgium')) {
      scores.geographic = geographicScoring.westernEurope;
    } else {
      scores.geographic = geographicScoring.other;
    }

    // Enrichment-based scoring
    if (companyData.enrichment_data?.apollo_data) {
      const apolloData = companyData.enrichment_data.apollo_data;
      
      // Tech Stack Score
      if (apolloData.technologies && apolloData.technologies.length > 0) {
        const relevantTech = apolloData.technologies.filter((tech: string) => 
          ['salesforce', 'hubspot', 'microsoft', 'aws', 'google', 'crm', 'analytics'].some(keyword => 
            tech.toLowerCase().includes(keyword)
          )
        );
        scores.techStack = Math.min(100, (relevantTech.length / apolloData.technologies.length) * 100);
      }

      // Funding Score
      if (apolloData.recent_funding) {
        const fundingAmount = apolloData.recent_funding.amount;
        if (fundingAmount > 50000000) scores.funding = 100;
        else if (fundingAmount > 10000000) scores.funding = 80;
        else if (fundingAmount > 1000000) scores.funding = 60;
        else scores.funding = 30;
      } else if (apolloData.total_funding > 0) {
        scores.funding = 40;
      }
    }

    // Use OpenAI for advanced analysis
    const prompt = `
Analyze this B2B lead and provide additional scoring insights:

Company: ${companyData.company_name}
Industry: ${companyData.industry}
Size: ${companyData.company_size}
Location: ${companyData.location}
Website: ${companyData.website || 'N/A'}

Enrichment Data: ${JSON.stringify(companyData.enrichment_data || {}, null, 2)}

Based on this information, analyze:
1. Job posting likelihood (0-100): How likely are they to be hiring/growing?
2. Overall lead quality factors
3. Key selling points to focus on
4. Potential objections or challenges

Respond in JSON format:
{
  "job_posting_score": number,
  "quality_factors": ["factor1", "factor2"],
  "selling_points": ["point1", "point2"],
  "potential_objections": ["objection1", "objection2"],
  "overall_assessment": "brief assessment"
}
`;

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a B2B lead scoring expert. Analyze companies for sales potential and provide structured insights.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
      }),
    });

    let aiAnalysis = null;
    if (openaiResponse.ok) {
      const aiData: OpenAIResponse = await openaiResponse.json();
      try {
        aiAnalysis = JSON.parse(aiData.choices[0].message.content);
        scores.jobPostings = aiAnalysis.job_posting_score || 50;
      } catch (e) {
        console.error('Error parsing AI response:', e);
        scores.jobPostings = 50; // Default score
      }
    } else {
      console.error('OpenAI API error:', await openaiResponse.text());
      scores.jobPostings = 50; // Default score
    }

    // Calculate final weighted score
    const finalScore = Math.round(
      (scores.companySize * scoringWeights.companySize / 100) +
      (scores.techStack * scoringWeights.techStack / 100) +
      (scores.funding * scoringWeights.funding / 100) +
      (scores.jobPostings * scoringWeights.jobPostings / 100) +
      (scores.geographic * scoringWeights.geographic / 100)
    );

    // Determine priority and status
    let priority = 'nurture';
    let status = 'new';
    
    if (finalScore >= 70) {
      priority = 'immediate';
      status = 'hot';
    } else if (finalScore >= 40) {
      priority = 'queue';
      status = 'warm';
    }

    // Create score reasons
    const scoreReasons = [];
    if (scores.companySize >= 70) scoreReasons.push(`Good company size match (${companyData.company_size})`);
    if (scores.geographic > 20) scoreReasons.push(`Target geographic location (${companyData.location})`);
    if (scores.funding >= 60) scoreReasons.push('Recent significant funding');
    if (scores.techStack >= 60) scoreReasons.push('Uses relevant technology stack');
    if (scores.jobPostings >= 70) scoreReasons.push('High likelihood of hiring/growth');
    if (aiAnalysis?.quality_factors) scoreReasons.push(...aiAnalysis.quality_factors.slice(0, 2));

    // Update lead with scoring results
    const { error: updateError } = await supabase
      .from('leads')
      .update({
        ai_score: finalScore,
        final_score: finalScore,
        priority,
        status,
        score_reason: scoreReasons,
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId);

    if (updateError) {
      console.error('Error updating lead score:', updateError);
      throw new Error(`Database update error: ${updateError.message}`);
    }

    console.log(`Successfully scored lead ${leadId}: ${finalScore} points`);

    return new Response(
      JSON.stringify({
        success: true,
        final_score: finalScore,
        priority,
        status,
        scores,
        score_reasons: scoreReasons,
        ai_analysis: aiAnalysis,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in lead-scoring function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});