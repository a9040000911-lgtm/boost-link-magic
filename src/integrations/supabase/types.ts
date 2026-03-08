export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_audit_logs: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          is_enabled: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          is_enabled?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          is_enabled?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      exchange_rates: {
        Row: {
          base_currency: string
          fetched_at: string
          id: string
          rate: number
          source: string
          target_currency: string
        }
        Insert: {
          base_currency?: string
          fetched_at?: string
          id?: string
          rate?: number
          source?: string
          target_currency?: string
        }
        Update: {
          base_currency?: string
          fetched_at?: string
          id?: string
          rate?: number
          source?: string
          target_currency?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string
          id: string
          link: string
          platform: string | null
          price: number
          progress: number
          project_id: string | null
          provider: string | null
          provider_order_id: string | null
          provider_service_id: string | null
          quantity: number
          refund_status: string | null
          refunded_amount: number | null
          refunded_at: string | null
          refunded_by: string | null
          service_id: string | null
          service_name: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link: string
          platform?: string | null
          price?: number
          progress?: number
          project_id?: string | null
          provider?: string | null
          provider_order_id?: string | null
          provider_service_id?: string | null
          quantity?: number
          refund_status?: string | null
          refunded_amount?: number | null
          refunded_at?: string | null
          refunded_by?: string | null
          service_id?: string | null
          service_name: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string
          platform?: string | null
          price?: number
          progress?: number
          project_id?: string | null
          provider?: string | null
          provider_order_id?: string | null
          provider_service_id?: string | null
          quantity?: number
          refund_status?: string | null
          refunded_amount?: number | null
          refunded_at?: string | null
          refunded_by?: string | null
          service_id?: string | null
          service_name?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_provider_service_id_fkey"
            columns: ["provider_service_id"]
            isOneToOne: false
            referencedRelation: "provider_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          balance: number
          bio: string | null
          created_at: string
          discount: number
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          balance?: number
          bio?: string | null
          created_at?: string
          discount?: number
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          balance?: number
          bio?: string | null
          created_at?: string
          discount?: number
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          platform: string | null
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          platform?: string | null
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          platform?: string | null
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      provider_services: {
        Row: {
          can_cancel: boolean
          can_refill: boolean
          category: string
          created_at: string
          description: string | null
          id: string
          is_enabled: boolean
          markup_percent: number | null
          max_quantity: number
          min_quantity: number
          name: string
          network: string
          our_price: number | null
          provider: string
          provider_service_id: number
          rate: number
          type: string
          updated_at: string
        }
        Insert: {
          can_cancel?: boolean
          can_refill?: boolean
          category: string
          created_at?: string
          description?: string | null
          id?: string
          is_enabled?: boolean
          markup_percent?: number | null
          max_quantity?: number
          min_quantity?: number
          name: string
          network: string
          our_price?: number | null
          provider?: string
          provider_service_id: number
          rate?: number
          type?: string
          updated_at?: string
        }
        Update: {
          can_cancel?: boolean
          can_refill?: boolean
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_enabled?: boolean
          markup_percent?: number | null
          max_quantity?: number
          min_quantity?: number
          name?: string
          network?: string
          our_price?: number | null
          provider?: string
          provider_service_id?: number
          rate?: number
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      providers: {
        Row: {
          api_key_env: string
          api_url: string
          balance: number | null
          balance_currency: string | null
          created_at: string
          health_latency_ms: number | null
          health_status: string | null
          id: string
          is_enabled: boolean
          key: string
          label: string
          last_health_check: string | null
          rate_currency: string
          services_count: number | null
          updated_at: string
        }
        Insert: {
          api_key_env: string
          api_url: string
          balance?: number | null
          balance_currency?: string | null
          created_at?: string
          health_latency_ms?: number | null
          health_status?: string | null
          id?: string
          is_enabled?: boolean
          key: string
          label: string
          last_health_check?: string | null
          rate_currency?: string
          services_count?: number | null
          updated_at?: string
        }
        Update: {
          api_key_env?: string
          api_url?: string
          balance?: number | null
          balance_currency?: string | null
          created_at?: string
          health_latency_ms?: number | null
          health_status?: string | null
          id?: string
          is_enabled?: boolean
          key?: string
          label?: string
          last_health_check?: string | null
          rate_currency?: string
          services_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      service_provider_mappings: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          priority: number
          provider_service_id: string
          service_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          priority?: number
          provider_service_id: string
          service_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          priority?: number
          provider_service_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_provider_mappings_provider_service_id_fkey"
            columns: ["provider_service_id"]
            isOneToOne: false
            referencedRelation: "provider_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_provider_mappings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_enabled: boolean
          max_quantity: number
          min_quantity: number
          name: string
          network: string
          price: number
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_enabled?: boolean
          max_quantity?: number
          min_quantity?: number
          name: string
          network?: string
          price?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_enabled?: boolean
          max_quantity?: number
          min_quantity?: number
          name?: string
          network?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      staff_permissions: {
        Row: {
          created_at: string
          granted_by: string
          id: string
          permission: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by: string
          id?: string
          permission: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string
          id?: string
          permission?: string
          user_id?: string
        }
        Relationships: []
      }
      support_bans: {
        Row: {
          ban_expires_at: string | null
          ban_type: string | null
          banned_at: string | null
          banned_by: string | null
          created_at: string
          id: string
          is_banned: boolean
          unban_reason: string | null
          updated_at: string
          user_id: string
          warnings: number
        }
        Insert: {
          ban_expires_at?: string | null
          ban_type?: string | null
          banned_at?: string | null
          banned_by?: string | null
          created_at?: string
          id?: string
          is_banned?: boolean
          unban_reason?: string | null
          updated_at?: string
          user_id: string
          warnings?: number
        }
        Update: {
          ban_expires_at?: string | null
          ban_type?: string | null
          banned_at?: string | null
          banned_by?: string | null
          created_at?: string
          id?: string
          is_banned?: boolean
          unban_reason?: string | null
          updated_at?: string
          user_id?: string
          warnings?: number
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          attachment_name: string | null
          attachment_type: string | null
          attachment_url: string | null
          created_at: string
          id: string
          is_admin: boolean
          message: string
          ticket_id: string
          user_id: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          created_at?: string
          id?: string
          is_admin?: boolean
          message: string
          ticket_id: string
          user_id: string
        }
        Update: {
          attachment_name?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          created_at?: string
          id?: string
          is_admin?: boolean
          message?: string
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          auto_close_at: string | null
          auto_closed: boolean
          channel: string
          created_at: string
          id: string
          last_admin_reply_at: string | null
          priority: string
          reopened_at: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_close_at?: string | null
          auto_closed?: boolean
          channel?: string
          created_at?: string
          id?: string
          last_admin_reply_at?: string | null
          priority?: string
          reopened_at?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_close_at?: string | null
          auto_closed?: boolean
          channel?: string
          created_at?: string
          id?: string
          last_admin_reply_at?: string | null
          priority?: string
          reopened_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string | null
          id: string
          order_id: string | null
          status: string
          type: string
          user_id: string
        }
        Insert: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string | null
          status?: string
          type?: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string | null
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
