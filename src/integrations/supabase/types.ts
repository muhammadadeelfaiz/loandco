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
        }
        Insert: {
          availability?: boolean | null
          category: string
          created_at?: string | null
          id?: string
          name: string
          price: number
          retailer_id?: string | null
        }
        Update: {
          availability?: boolean | null
          category?: string
          created_at?: string | null
          id?: string
          name?: string
          price?: number
          retailer_id?: string | null
        }
      }
      stores: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          latitude: number
          longitude: number
          name: string
          owner_id: string | null
          phone: string | null
          email: string | null
          website: string | null
          opening_hours: Json | null
          is_verified: boolean | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          latitude: number
          longitude: number
          name: string
          owner_id?: string | null
          phone?: string | null
          email?: string | null
          website?: string | null
          opening_hours?: Json | null
          is_verified?: boolean | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          latitude?: number
          longitude?: number
          name?: string
          owner_id?: string | null
          phone?: string | null
          email?: string | null
          website?: string | null
          opening_hours?: Json | null
          is_verified?: boolean | null
          updated_at?: string | null
        }
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
      }
    }
  }
}