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
      companies: {
        Row: {
          ai_score: number | null
          company_name: string
          created_at: string
          description: string | null
          employee_size: string | null
          enrichment_data: Json | null
          founded: string | null
          id: string
          industry: string | null
          linkedin_profile: string | null
          public_email: string | null
          public_phone: string | null
          source: string | null
          status: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          ai_score?: number | null
          company_name: string
          created_at?: string
          description?: string | null
          employee_size?: string | null
          enrichment_data?: Json | null
          founded?: string | null
          id?: string
          industry?: string | null
          linkedin_profile?: string | null
          public_email?: string | null
          public_phone?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          ai_score?: number | null
          company_name?: string
          created_at?: string
          description?: string | null
          employee_size?: string | null
          enrichment_data?: Json | null
          founded?: string | null
          id?: string
          industry?: string | null
          linkedin_profile?: string | null
          public_email?: string | null
          public_phone?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string
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
