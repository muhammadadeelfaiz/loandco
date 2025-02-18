export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string | null
          id: string
          image_url: string | null
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string | null
          name?: string
        }
        Relationships: []
      }
      product_wishlists: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          availability: boolean | null
          category: string
          created_at: string | null
          id: string
          name: string
          price: number
          retailer_id: string | null
          store_id: string | null
        }
        Insert: {
          availability?: boolean | null
          category: string
          created_at?: string | null
          id?: string
          name: string
          price: number
          retailer_id?: string | null
          store_id?: string | null
        }
        Update: {
          availability?: boolean | null
          category?: string
          created_at?: string | null
          id?: string
          name?: string
          price?: number
          retailer_id?: string | null
          store_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_retailer_id_fkey"
            columns: ["retailer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      retailer_wishlists: {
        Row: {
          created_at: string | null
          id: string
          retailer_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          retailer_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          retailer_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "retailer_wishlists_retailer_id_fkey"
            columns: ["retailer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          email: string | null
          id: string
          is_verified: boolean | null
          latitude: number
          logo_url: string | null
          longitude: number
          name: string
          opening_hours: Json | null
          owner_id: string | null
          phone: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          is_verified?: boolean | null
          latitude: number
          logo_url?: string | null
          longitude: number
          name: string
          opening_hours?: Json | null
          owner_id?: string | null
          phone?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          is_verified?: boolean | null
          latitude?: number
          logo_url?: string | null
          longitude?: number
          name?: string
          opening_hours?: Json | null
          owner_id?: string | null
          phone?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stores_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          date_of_birth: string | null
          email: string
          id: string
          name: string
          role: string
          username: string | null
        }
        Insert: {
          created_at?: string | null
          date_of_birth?: string | null
          email: string
          id?: string
          name: string
          role: string
          username?: string | null
        }
        Update: {
          created_at?: string | null
          date_of_birth?: string | null
          email?: string
          id?: string
          name?: string
          role?: string
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_secrets: {
        Args: {
          secret_names: string[]
        }
        Returns: Json
      }
      retailer_has_verified_store: {
        Args: {
          retailer_id: string
        }
        Returns: boolean
      }
      search_products: {
        Args: {
          search_term: string
        }
        Returns: {
          id: string
          name: string
          price: number
          category: string
          availability: boolean
          retailer_id: string
          created_at: string
          retailer_name: string
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
