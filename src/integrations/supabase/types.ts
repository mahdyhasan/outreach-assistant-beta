export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      campaign_enrollments: {
        Row: {
          campaign_id: string
          completed_at: string | null
          current_sequence_step: number
          enrolled_at: string
          id: string
          lead_id: string
          next_email_date: string | null
          status: string
        }
        Insert: {
          campaign_id: string
          completed_at?: string | null
          current_sequence_step?: number
          enrolled_at?: string
          id?: string
          lead_id: string
          next_email_date?: string | null
          status?: string
        }
        Update: {
          campaign_id?: string
          completed_at?: string | null
          current_sequence_step?: number
          enrolled_at?: string
          id?: string
          lead_id?: string
          next_email_date?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_enrollments_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_enrollments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_sync_history: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          crm_system: string
          error_count: number
          error_details: Json | null
          id: string
          leads_count: number
          started_at: string
          status: string
          success_count: number
          sync_filters: Json | null
          sync_type: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          crm_system?: string
          error_count?: number
          error_details?: Json | null
          id?: string
          leads_count?: number
          started_at?: string
          status?: string
          success_count?: number
          sync_filters?: Json | null
          sync_type: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          crm_system?: string
          error_count?: number
          error_details?: Json | null
          id?: string
          leads_count?: number
          started_at?: string
          status?: string
          success_count?: number
          sync_filters?: Json | null
          sync_type?: string
        }
        Relationships: []
      }
      email_campaigns: {
        Row: {
          created_at: string
          description: string | null
          emails_sent: number
          id: string
          leads_count: number
          name: string
          responses_count: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          emails_sent?: number
          id?: string
          leads_count?: number
          name: string
          responses_count?: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          emails_sent?: number
          id?: string
          leads_count?: number
          name?: string
          responses_count?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_sequences: {
        Row: {
          created_at: string
          delay_days: number
          description: string | null
          email_content: string
          id: string
          is_active: boolean
          name: string
          sequence_order: number
          subject_line: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          delay_days?: number
          description?: string | null
          email_content: string
          id?: string
          is_active?: boolean
          name: string
          sequence_order: number
          subject_line: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          delay_days?: number
          description?: string | null
          email_content?: string
          id?: string
          is_active?: boolean
          name?: string
          sequence_order?: number
          subject_line?: string
          updated_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          ai_score: number
          assigned_to: string | null
          company_name: string
          company_size: string
          contact_name: string
          created_at: string | null
          email: string
          enrichment_data: Json | null
          final_score: number
          followup_count: number | null
          human_feedback: Json | null
          human_score: number | null
          id: string
          industry: string
          job_title: string
          last_contact_date: string | null
          linkedin_url: string | null
          location: string
          next_followup_date: string | null
          phone: string | null
          priority: string
          response_tag: string | null
          score_reason: string[] | null
          source: string
          status: string
          updated_at: string | null
          website: string | null
        }
        Insert: {
          ai_score: number
          assigned_to?: string | null
          company_name: string
          company_size: string
          contact_name: string
          created_at?: string | null
          email: string
          enrichment_data?: Json | null
          final_score: number
          followup_count?: number | null
          human_feedback?: Json | null
          human_score?: number | null
          id?: string
          industry: string
          job_title: string
          last_contact_date?: string | null
          linkedin_url?: string | null
          location: string
          next_followup_date?: string | null
          phone?: string | null
          priority: string
          response_tag?: string | null
          score_reason?: string[] | null
          source: string
          status: string
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          ai_score?: number
          assigned_to?: string | null
          company_name?: string
          company_size?: string
          contact_name?: string
          created_at?: string | null
          email?: string
          enrichment_data?: Json | null
          final_score?: number
          followup_count?: number | null
          human_feedback?: Json | null
          human_score?: number | null
          id?: string
          industry?: string
          job_title?: string
          last_contact_date?: string | null
          linkedin_url?: string | null
          location?: string
          next_followup_date?: string | null
          phone?: string | null
          priority?: string
          response_tag?: string | null
          score_reason?: string[] | null
          source?: string
          status?: string
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      mining_settings: {
        Row: {
          auto_approval_threshold: number | null
          daily_limit: number | null
          frequency: string | null
          icp_criteria: Json | null
          id: string
          updated_at: string | null
        }
        Insert: {
          auto_approval_threshold?: number | null
          daily_limit?: number | null
          frequency?: string | null
          icp_criteria?: Json | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          auto_approval_threshold?: number | null
          daily_limit?: number | null
          frequency?: string | null
          icp_criteria?: Json | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      outreach_activities: {
        Row: {
          id: string
          lead_id: string | null
          message: string
          response_at: string | null
          response_content: string | null
          sent_at: string | null
          status: string
          subject: string | null
          type: string
        }
        Insert: {
          id?: string
          lead_id?: string | null
          message: string
          response_at?: string | null
          response_content?: string | null
          sent_at?: string | null
          status: string
          subject?: string | null
          type: string
        }
        Update: {
          id?: string
          lead_id?: string | null
          message?: string
          response_at?: string | null
          response_content?: string | null
          sent_at?: string | null
          status?: string
          subject?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "outreach_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      signals: {
        Row: {
          company_name: string
          created_at: string
          detected_at: string
          id: string
          lead_id: string | null
          priority: string
          processed: boolean
          signal_description: string | null
          signal_title: string
          signal_type: string
          signal_url: string | null
          updated_at: string
        }
        Insert: {
          company_name: string
          created_at?: string
          detected_at?: string
          id?: string
          lead_id?: string | null
          priority?: string
          processed?: boolean
          signal_description?: string | null
          signal_title: string
          signal_type: string
          signal_url?: string | null
          updated_at?: string
        }
        Update: {
          company_name?: string
          created_at?: string
          detected_at?: string
          id?: string
          lead_id?: string | null
          priority?: string
          processed?: boolean
          signal_description?: string | null
          signal_title?: string
          signal_type?: string
          signal_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "signals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
