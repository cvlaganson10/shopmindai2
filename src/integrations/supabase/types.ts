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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          conversation_id: string | null
          created_at: string | null
          customer_id: string | null
          event_data: Json | null
          event_type: string
          id: string
          product_id: string | null
          session_id: string | null
          store_id: string | null
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          product_id?: string | null
          session_id?: string | null
          store_id?: string | null
        }
        Update: {
          conversation_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          product_id?: string | null
          session_id?: string | null
          store_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "store_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          channel: string | null
          created_at: string | null
          customer_id: string | null
          first_message_at: string | null
          id: string
          last_message_at: string | null
          message_count: number | null
          metadata: Json | null
          resolved_at: string | null
          sentiment: string | null
          status: string | null
          store_id: string
          topic: string | null
        }
        Insert: {
          channel?: string | null
          created_at?: string | null
          customer_id?: string | null
          first_message_at?: string | null
          id?: string
          last_message_at?: string | null
          message_count?: number | null
          metadata?: Json | null
          resolved_at?: string | null
          sentiment?: string | null
          status?: string | null
          store_id: string
          topic?: string | null
        }
        Update: {
          channel?: string | null
          created_at?: string | null
          customer_id?: string | null
          first_message_at?: string | null
          id?: string
          last_message_at?: string | null
          message_count?: number | null
          metadata?: Json | null
          resolved_at?: string | null
          sentiment?: string | null
          status?: string | null
          store_id?: string
          topic?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "store_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string | null
          email: string | null
          first_seen_at: string | null
          full_name: string | null
          id: string
          last_seen_at: string | null
          metadata: Json | null
          session_id: string | null
          store_id: string
          total_conversations: number | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          first_seen_at?: string | null
          full_name?: string | null
          id?: string
          last_seen_at?: string | null
          metadata?: Json | null
          session_id?: string | null
          store_id: string
          total_conversations?: number | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          first_seen_at?: string | null
          full_name?: string | null
          id?: string
          last_seen_at?: string | null
          metadata?: Json | null
          session_id?: string | null
          store_id?: string
          total_conversations?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "store_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_chunks: {
        Row: {
          chunk_index: number
          content: string
          content_hash: string | null
          created_at: string | null
          document_id: string
          embedding: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          store_id: string
        }
        Insert: {
          chunk_index: number
          content: string
          content_hash?: string | null
          created_at?: string | null
          document_id: string
          embedding?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          store_id: string
        }
        Update: {
          chunk_index?: number
          content?: string
          content_hash?: string | null
          created_at?: string | null
          document_id?: string
          embedding?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "knowledge_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_chunks_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "store_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_documents: {
        Row: {
          chunk_count: number | null
          created_at: string | null
          error_message: string | null
          file_name: string
          file_size_bytes: number | null
          file_type: string
          id: string
          is_active: boolean | null
          progress: number | null
          status: string | null
          storage_path: string
          store_id: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          chunk_count?: number | null
          created_at?: string | null
          error_message?: string | null
          file_name: string
          file_size_bytes?: number | null
          file_type: string
          id?: string
          is_active?: boolean | null
          progress?: number | null
          status?: string | null
          storage_path: string
          store_id: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          chunk_count?: number | null
          created_at?: string | null
          error_message?: string | null
          file_name?: string
          file_size_bytes?: number | null
          file_type?: string
          id?: string
          is_active?: boolean | null
          progress?: number | null
          status?: string | null
          storage_path?: string
          store_id?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_documents_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "store_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          audio_url: string | null
          content: string
          content_type: string | null
          conversation_id: string
          created_at: string | null
          id: string
          latency_ms: number | null
          products_referenced: string[] | null
          role: string
          store_id: string
          tokens_used: number | null
        }
        Insert: {
          audio_url?: string | null
          content: string
          content_type?: string | null
          conversation_id: string
          created_at?: string | null
          id?: string
          latency_ms?: number | null
          products_referenced?: string[] | null
          role: string
          store_id: string
          tokens_used?: number | null
        }
        Update: {
          audio_url?: string | null
          content?: string
          content_type?: string | null
          conversation_id?: string
          created_at?: string | null
          id?: string
          latency_ms?: number | null
          products_referenced?: string[] | null
          role?: string
          store_id?: string
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "store_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          carrier: string | null
          created_at: string | null
          currency: string | null
          customer_id: string | null
          estimated_delivery_date: string | null
          external_order_id: string
          id: string
          items: Json | null
          shipping_address: Json | null
          status: string | null
          store_id: string
          total_amount: number | null
          tracking_number: string | null
          updated_at: string | null
        }
        Insert: {
          carrier?: string | null
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          estimated_delivery_date?: string | null
          external_order_id: string
          id?: string
          items?: Json | null
          shipping_address?: Json | null
          status?: string | null
          store_id: string
          total_amount?: number | null
          tracking_number?: string | null
          updated_at?: string | null
        }
        Update: {
          carrier?: string | null
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          estimated_delivery_date?: string | null
          external_order_id?: string
          id?: string
          items?: Json | null
          shipping_address?: Json | null
          status?: string | null
          store_id?: string
          total_amount?: number | null
          tracking_number?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "store_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          compare_at_price: number | null
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          image_urls: string[] | null
          in_stock: boolean | null
          is_active: boolean | null
          name: string
          price: number | null
          product_url: string | null
          related_product_ids: string[] | null
          sku: string | null
          source_document_id: string | null
          specifications: Json | null
          stock_quantity: number | null
          store_id: string
          tags: string[] | null
          updated_at: string | null
          variants: Json | null
        }
        Insert: {
          category?: string | null
          compare_at_price?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          image_urls?: string[] | null
          in_stock?: boolean | null
          is_active?: boolean | null
          name: string
          price?: number | null
          product_url?: string | null
          related_product_ids?: string[] | null
          sku?: string | null
          source_document_id?: string | null
          specifications?: Json | null
          stock_quantity?: number | null
          store_id: string
          tags?: string[] | null
          updated_at?: string | null
          variants?: Json | null
        }
        Update: {
          category?: string | null
          compare_at_price?: number | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          image_urls?: string[] | null
          in_stock?: boolean | null
          is_active?: boolean | null
          name?: string
          price?: number | null
          product_url?: string | null
          related_product_ids?: string[] | null
          sku?: string | null
          source_document_id?: string | null
          specifications?: Json | null
          stock_quantity?: number | null
          store_id?: string
          tags?: string[] | null
          updated_at?: string | null
          variants?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "store_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      store_profiles: {
        Row: {
          agent_name: string | null
          agent_voice_id: string | null
          brand_tone: string | null
          created_at: string | null
          escalation_email: string | null
          id: string
          industry: string | null
          is_active: boolean | null
          logo_url: string | null
          owner_id: string
          plan: string | null
          primary_color: string | null
          store_name: string
          store_url: string | null
          system_prompt_override: string | null
          updated_at: string | null
          welcome_message: string | null
        }
        Insert: {
          agent_name?: string | null
          agent_voice_id?: string | null
          brand_tone?: string | null
          created_at?: string | null
          escalation_email?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          owner_id: string
          plan?: string | null
          primary_color?: string | null
          store_name: string
          store_url?: string | null
          system_prompt_override?: string | null
          updated_at?: string | null
          welcome_message?: string | null
        }
        Update: {
          agent_name?: string | null
          agent_voice_id?: string | null
          brand_tone?: string | null
          created_at?: string | null
          escalation_email?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          owner_id?: string
          plan?: string | null
          primary_color?: string | null
          store_name?: string
          store_url?: string | null
          system_prompt_override?: string | null
          updated_at?: string | null
          welcome_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_profiles_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_logs: {
        Row: {
          conversation_id: string | null
          created_at: string | null
          id: string
          message_id: string | null
          output_audio_url: string | null
          output_text: string | null
          store_id: string | null
          stt_latency_ms: number | null
          total_latency_ms: number | null
          transcript: string | null
          tts_latency_ms: number | null
          voice_id: string | null
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          message_id?: string | null
          output_audio_url?: string | null
          output_text?: string | null
          store_id?: string | null
          stt_latency_ms?: number | null
          total_latency_ms?: number | null
          transcript?: string | null
          tts_latency_ms?: number | null
          voice_id?: string | null
        }
        Update: {
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          message_id?: string | null
          output_audio_url?: string | null
          output_text?: string | null
          store_id?: string | null
          stt_latency_ms?: number | null
          total_latency_ms?: number | null
          transcript?: string | null
          tts_latency_ms?: number | null
          voice_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_logs_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_logs_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_logs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "store_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_knowledge_chunks: {
        Args: {
          match_count?: number
          match_store_id: string
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
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
