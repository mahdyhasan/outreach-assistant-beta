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
      activity_logs: {
        Row: {
          action: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          ai_score: number | null
          company_name: string
          country: string | null
          created_at: string
          description: string | null
          employee_size: string | null
          employee_size_numeric: number | null
          enrichment_data: Json | null
          founded: string | null
          founded_year: number | null
          id: string
          industry: string | null
          linkedin_profile: string | null
          location: string | null
          public_email: string | null
          public_phone: string | null
          source: string | null
          status: string | null
          updated_at: string
          user_id: string | null
          website: string | null
        }
        Insert: {
          ai_score?: number | null
          company_name: string
          country?: string | null
          created_at?: string
          description?: string | null
          employee_size?: string | null
          employee_size_numeric?: number | null
          enrichment_data?: Json | null
          founded?: string | null
          founded_year?: number | null
          id?: string
          industry?: string | null
          linkedin_profile?: string | null
          location?: string | null
          public_email?: string | null
          public_phone?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
          website?: string | null
        }
        Update: {
          ai_score?: number | null
          company_name?: string
          country?: string | null
          created_at?: string
          description?: string | null
          employee_size?: string | null
          employee_size_numeric?: number | null
          enrichment_data?: Json | null
          founded?: string | null
          founded_year?: number | null
          id?: string
          industry?: string | null
          linkedin_profile?: string | null
          location?: string | null
          public_email?: string | null
          public_phone?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
          website?: string | null
        }
        Relationships: []
      }
      decision_makers: {
        Row: {
          company_id: string
          confidence_score: number | null
          contact_type: string | null
          created_at: string
          designation: string
          email: string | null
          email_status: string | null
          facebook_profile: string | null
          first_name: string
          id: string
          instagram_profile: string | null
          last_name: string
          linkedin_profile: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          confidence_score?: number | null
          contact_type?: string | null
          created_at?: string
          designation: string
          email?: string | null
          email_status?: string | null
          facebook_profile?: string | null
          first_name: string
          id?: string
          instagram_profile?: string | null
          last_name: string
          linkedin_profile?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          confidence_score?: number | null
          contact_type?: string | null
          created_at?: string
          designation?: string
          email?: string | null
          email_status?: string | null
          facebook_profile?: string | null
          first_name?: string
          id?: string
          instagram_profile?: string | null
          last_name?: string
          linkedin_profile?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "decision_makers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaign_steps: {
        Row: {
          campaign_id: string | null
          channel: string | null
          created_at: string | null
          delay_days: number | null
          id: string
          step_order: number | null
          template_id: string | null
        }
        Insert: {
          campaign_id?: string | null
          channel?: string | null
          created_at?: string | null
          delay_days?: number | null
          id?: string
          step_order?: number | null
          template_id?: string | null
        }
        Update: {
          campaign_id?: string | null
          channel?: string | null
          created_at?: string | null
          delay_days?: number | null
          id?: string
          step_order?: number | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_campaign_steps_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaign_steps_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          schedule_time: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          schedule_time?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          schedule_time?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      email_queue: {
        Row: {
          campaign_id: string | null
          created_at: string
          decision_maker_id: string
          id: string
          last_opened: string | null
          open_count: number | null
          scheduled_time: string
          sent_time: string | null
          status: string
          template_id: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          decision_maker_id: string
          id?: string
          last_opened?: string | null
          open_count?: number | null
          scheduled_time: string
          sent_time?: string | null
          status?: string
          template_id: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          decision_maker_id?: string
          id?: string
          last_opened?: string | null
          open_count?: number | null
          scheduled_time?: string
          sent_time?: string | null
          status?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_queue_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_queue_decision_maker_id_fkey"
            columns: ["decision_maker_id"]
            isOneToOne: false
            referencedRelation: "decision_makers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_queue_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          content: string
          created_at: string
          id: string
          is_default: boolean | null
          name: string
          subject: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          name: string
          subject: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          name?: string
          subject?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      enrichment_history: {
        Row: {
          company_id: string
          created_at: string
          data: Json | null
          enrichment_type: string
          error_message: string | null
          id: string
          success: boolean
        }
        Insert: {
          company_id: string
          created_at?: string
          data?: Json | null
          enrichment_type: string
          error_message?: string | null
          id?: string
          success: boolean
        }
        Update: {
          company_id?: string
          created_at?: string
          data?: Json | null
          enrichment_type?: string
          error_message?: string | null
          id?: string
          success?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "enrichment_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      export_items: {
        Row: {
          company_id: string | null
          created_at: string
          decision_maker_id: string | null
          export_id: string
          id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          decision_maker_id?: string | null
          export_id: string
          id?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          decision_maker_id?: string | null
          export_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "export_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "export_items_decision_maker_id_fkey"
            columns: ["decision_maker_id"]
            isOneToOne: false
            referencedRelation: "decision_makers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "export_items_export_id_fkey"
            columns: ["export_id"]
            isOneToOne: false
            referencedRelation: "exports"
            referencedColumns: ["id"]
          },
        ]
      }
      exports: {
        Row: {
          completed_at: string | null
          created_at: string
          file_path: string | null
          filters: Json | null
          format: string
          id: string
          name: string
          status: string
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          file_path?: string | null
          filters?: Json | null
          format?: string
          id?: string
          name: string
          status?: string
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          file_path?: string | null
          filters?: Json | null
          format?: string
          id?: string
          name?: string
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_score_history: {
        Row: {
          breakdown: Json | null
          company_id: string | null
          created_at: string | null
          id: string
          reason: string | null
          total_score: number | null
        }
        Insert: {
          breakdown?: Json | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          reason?: string | null
          total_score?: number | null
        }
        Update: {
          breakdown?: Json | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          reason?: string | null
          total_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_score_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      mining_results: {
        Row: {
          company_id: string
          created_at: string
          id: string
          matched_criteria: Json | null
          session_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          matched_criteria?: Json | null
          session_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          matched_criteria?: Json | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mining_results_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mining_results_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "mining_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      mining_sessions: {
        Row: {
          companies_found: number | null
          completed_at: string | null
          created_at: string
          criteria: Json
          error_message: string | null
          id: string
          name: string
          started_at: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          companies_found?: number | null
          completed_at?: string | null
          created_at?: string
          criteria?: Json
          error_message?: string | null
          id?: string
          name: string
          started_at?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          companies_found?: number | null
          completed_at?: string | null
          created_at?: string
          criteria?: Json
          error_message?: string | null
          id?: string
          name?: string
          started_at?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mining_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_name: string | null
          created_at: string
          full_name: string | null
          id: string
          job_title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          job_title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          job_title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      signals: {
        Row: {
          company_id: string
          created_at: string
          detected_at: string
          id: string
          priority: string | null
          processed: boolean | null
          signal_description: string | null
          signal_title: string
          signal_type: string
          signal_url: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          detected_at?: string
          id?: string
          priority?: string | null
          processed?: boolean | null
          signal_description?: string | null
          signal_title: string
          signal_type: string
          signal_url?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          detected_at?: string
          id?: string
          priority?: string | null
          processed?: boolean | null
          signal_description?: string | null
          signal_title?: string
          signal_type?: string
          signal_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "signals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          api_keys: Json | null
          auto_approval_threshold: number | null
          created_at: string | null
          daily_limit: number | null
          daily_send_limit: number | null
          email_prompt: string | null
          email_signature: string | null
          frequency: string | null
          id: string
          mining_preferences: Json | null
          reply_monitoring: boolean | null
          scoring_weights: Json | null
          target_countries: Json | null
          tracking_duration: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          api_keys?: Json | null
          auto_approval_threshold?: number | null
          created_at?: string | null
          daily_limit?: number | null
          daily_send_limit?: number | null
          email_prompt?: string | null
          email_signature?: string | null
          frequency?: string | null
          id?: string
          mining_preferences?: Json | null
          reply_monitoring?: boolean | null
          scoring_weights?: Json | null
          target_countries?: Json | null
          tracking_duration?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          api_keys?: Json | null
          auto_approval_threshold?: number | null
          created_at?: string | null
          daily_limit?: number | null
          daily_send_limit?: number | null
          email_prompt?: string | null
          email_signature?: string | null
          frequency?: string | null
          id?: string
          mining_preferences?: Json | null
          reply_monitoring?: boolean | null
          scoring_weights?: Json | null
          target_countries?: Json | null
          tracking_duration?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          updated_at?: string
        }
        Relationships: []
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
