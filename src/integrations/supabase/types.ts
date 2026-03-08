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
      ai_api_keys: {
        Row: {
          api_key: string
          created_at: string
          error_count: number
          id: string
          is_enabled: boolean
          label: string
          last_error: string | null
          last_used_at: string | null
          model: string
          provider: string
          updated_at: string
          usage_count: number
        }
        Insert: {
          api_key: string
          created_at?: string
          error_count?: number
          id?: string
          is_enabled?: boolean
          label?: string
          last_error?: string | null
          last_used_at?: string | null
          model?: string
          provider?: string
          updated_at?: string
          usage_count?: number
        }
        Update: {
          api_key?: string
          created_at?: string
          error_count?: number
          id?: string
          is_enabled?: boolean
          label?: string
          last_error?: string | null
          last_used_at?: string | null
          model?: string
          provider?: string
          updated_at?: string
          usage_count?: number
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      bot_button_library: {
        Row: {
          action_type: string
          action_value: string | null
          category: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_system: boolean
          label: string
        }
        Insert: {
          action_type?: string
          action_value?: string | null
          category?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id: string
          is_system?: boolean
          label: string
        }
        Update: {
          action_type?: string
          action_value?: string | null
          category?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean
          label?: string
        }
        Relationships: []
      }
      bot_templates: {
        Row: {
          bot_type: string
          buttons: Json
          category: string
          confirm_message: string
          created_at: string
          description: string | null
          id: string
          name: string
          preview_image: string | null
          settings: Json
          sort_order: number
          welcome_message: string
        }
        Insert: {
          bot_type?: string
          buttons?: Json
          category?: string
          confirm_message?: string
          created_at?: string
          description?: string | null
          id: string
          name: string
          preview_image?: string | null
          settings?: Json
          sort_order?: number
          welcome_message?: string
        }
        Update: {
          bot_type?: string
          buttons?: Json
          category?: string
          confirm_message?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          preview_image?: string | null
          settings?: Json
          sort_order?: number
          welcome_message?: string
        }
        Relationships: []
      }
      bug_reports: {
        Row: {
          attachment_name: string | null
          attachment_url: string | null
          created_at: string
          description: string
          id: string
          priority: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_url?: string | null
          created_at?: string
          description: string
          id?: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attachment_name?: string | null
          attachment_url?: string | null
          created_at?: string
          description?: string
          id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
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
      faq_items: {
        Row: {
          answer: string
          created_at: string
          id: string
          is_published: boolean
          question: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          is_published?: boolean
          question: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          is_published?: boolean
          question?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      financial_alerts: {
        Row: {
          actor_id: string | null
          alert_type: string
          created_at: string
          details: Json | null
          id: string
          resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          user_id: string | null
        }
        Insert: {
          actor_id?: string | null
          alert_type: string
          created_at?: string
          details?: Json | null
          id?: string
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          user_id?: string | null
        }
        Update: {
          actor_id?: string | null
          alert_type?: string
          created_at?: string
          details?: Json | null
          id?: string
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          user_id?: string | null
        }
        Relationships: []
      }
      guest_inquiries: {
        Row: {
          admin_reply: string | null
          created_at: string
          email: string
          id: string
          message: string
          name: string
          replied_at: string | null
          replied_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_reply?: string | null
          created_at?: string
          email: string
          id?: string
          message: string
          name?: string
          replied_at?: string | null
          replied_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_reply?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          replied_at?: string | null
          replied_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      licenses: {
        Row: {
          activated_at: string | null
          created_at: string
          domain: string
          expires_at: string | null
          id: string
          is_active: boolean
          license_key: string
          max_users: number | null
          metadata: Json | null
          plan: string
          updated_at: string
        }
        Insert: {
          activated_at?: string | null
          created_at?: string
          domain: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          license_key: string
          max_users?: number | null
          metadata?: Json | null
          plan?: string
          updated_at?: string
        }
        Update: {
          activated_at?: string | null
          created_at?: string
          domain?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          license_key?: string
          max_users?: number | null
          metadata?: Json | null
          plan?: string
          updated_at?: string
        }
        Relationships: []
      }
      link_patterns: {
        Row: {
          category_id: string | null
          created_at: string
          extract_id_group: number | null
          extract_username_group: number | null
          id: string
          is_enabled: boolean
          label: string
          link_type: string
          pattern: string
          platform: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          extract_id_group?: number | null
          extract_username_group?: number | null
          id?: string
          is_enabled?: boolean
          label: string
          link_type?: string
          pattern: string
          platform: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          extract_id_group?: number | null
          extract_username_group?: number | null
          id?: string
          is_enabled?: boolean
          label?: string
          link_type?: string
          pattern?: string
          platform?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "link_patterns_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      order_idempotency: {
        Row: {
          created_at: string
          idempotency_key: string
          order_id: string | null
        }
        Insert: {
          created_at?: string
          idempotency_key: string
          order_id?: string | null
        }
        Update: {
          created_at?: string
          idempotency_key?: string
          order_id?: string | null
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
      pages: {
        Row: {
          content: string | null
          created_at: string
          custom_css: string | null
          id: string
          is_published: boolean
          meta_description: string | null
          meta_title: string | null
          og_image: string | null
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          custom_css?: string | null
          id?: string
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          og_image?: string | null
          slug: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          custom_css?: string | null
          id?: string
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          og_image?: string | null
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      platforms: {
        Row: {
          color: string | null
          created_at: string
          domains: string[]
          icon: string | null
          id: string
          is_enabled: boolean
          key: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          domains?: string[]
          icon?: string | null
          id?: string
          is_enabled?: boolean
          key: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          domains?: string[]
          icon?: string | null
          id?: string
          is_enabled?: boolean
          key?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
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
          telegram_chat_id: string | null
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
          telegram_chat_id?: string | null
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
          telegram_chat_id?: string | null
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
      promocode_usages: {
        Row: {
          discount_amount: number
          id: string
          order_id: string | null
          promocode_id: string
          used_at: string
          user_id: string
        }
        Insert: {
          discount_amount?: number
          id?: string
          order_id?: string | null
          promocode_id: string
          used_at?: string
          user_id: string
        }
        Update: {
          discount_amount?: number
          id?: string
          order_id?: string | null
          promocode_id?: string
          used_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promocode_usages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promocode_usages_promocode_id_fkey"
            columns: ["promocode_id"]
            isOneToOne: false
            referencedRelation: "promocodes"
            referencedColumns: ["id"]
          },
        ]
      }
      promocodes: {
        Row: {
          applies_to: string
          applies_to_id: string | null
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          min_order_amount: number | null
          starts_at: string | null
          updated_at: string
          used_count: number
        }
        Insert: {
          applies_to?: string
          applies_to_id?: string | null
          code: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_amount?: number | null
          starts_at?: string | null
          updated_at?: string
          used_count?: number
        }
        Update: {
          applies_to?: string
          applies_to_id?: string | null
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_amount?: number | null
          starts_at?: string | null
          updated_at?: string
          used_count?: number
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
      reviews: {
        Row: {
          attachment_name: string | null
          attachment_url: string | null
          created_at: string
          id: string
          is_approved: boolean
          message: string
          name: string
          rating: number
          user_id: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_url?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean
          message: string
          name?: string
          rating?: number
          user_id: string
        }
        Update: {
          attachment_name?: string | null
          attachment_url?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean
          message?: string
          name?: string
          rating?: number
          user_id?: string
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
          guarantee: string
          id: string
          is_enabled: boolean
          max_quantity: number
          min_quantity: number
          name: string
          network: string
          price: number
          speed: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          guarantee?: string
          id?: string
          is_enabled?: boolean
          max_quantity?: number
          min_quantity?: number
          name: string
          network?: string
          price?: number
          speed?: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          guarantee?: string
          id?: string
          is_enabled?: boolean
          max_quantity?: number
          min_quantity?: number
          name?: string
          network?: string
          price?: number
          speed?: string
          updated_at?: string
        }
        Relationships: []
      }
      staff_2fa_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          ip_address: string | null
          used: boolean
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: string | null
          used?: boolean
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: string | null
          used?: boolean
          user_id?: string
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
          reply_to_id: string | null
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
          reply_to_id?: string | null
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
          reply_to_id?: string | null
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "support_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_response_templates: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          is_enabled: boolean
          shortcut: string | null
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          id?: string
          is_enabled?: boolean
          shortcut?: string | null
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_enabled?: boolean
          shortcut?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
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
      telegram_bots: {
        Row: {
          bot_type: string
          buttons: Json
          confirm_message: string
          created_at: string
          description: string | null
          id: string
          is_enabled: boolean
          name: string
          settings: Json
          template_id: string | null
          token: string
          updated_at: string
          webhook_active: boolean
          webhook_url: string | null
          welcome_message: string
        }
        Insert: {
          bot_type?: string
          buttons?: Json
          confirm_message?: string
          created_at?: string
          description?: string | null
          id?: string
          is_enabled?: boolean
          name: string
          settings?: Json
          template_id?: string | null
          token?: string
          updated_at?: string
          webhook_active?: boolean
          webhook_url?: string | null
          welcome_message?: string
        }
        Update: {
          bot_type?: string
          buttons?: Json
          confirm_message?: string
          created_at?: string
          description?: string | null
          id?: string
          is_enabled?: boolean
          name?: string
          settings?: Json
          template_id?: string | null
          token?: string
          updated_at?: string
          webhook_active?: boolean
          webhook_url?: string | null
          welcome_message?: string
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
      unrecognized_links: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          resolved: boolean
          resolved_at: string | null
          url: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          resolved?: boolean
          resolved_at?: string | null
          url: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          resolved?: boolean
          resolved_at?: string | null
          url?: string
          user_agent?: string | null
        }
        Relationships: []
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
      cleanup_expired_2fa_codes: { Args: never; Returns: undefined }
      cleanup_idempotency_keys: { Args: never; Returns: undefined }
      credit_balance: {
        Args: { p_amount: number; p_user_id: string }
        Returns: number
      }
      deduct_balance: {
        Args: { p_amount: number; p_user_id: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_ai_key_error: { Args: { key_id: string }; Returns: undefined }
      increment_ai_key_usage: { Args: { key_id: string }; Returns: undefined }
      validate_promocode: { Args: { p_code: string }; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "ceo" | "investor"
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
      app_role: ["admin", "moderator", "user", "ceo", "investor"],
    },
  },
} as const
