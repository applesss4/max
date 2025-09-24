export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Tables: {
      todos: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          completed: boolean
          priority: number
          due_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          completed?: boolean
          priority?: number
          due_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          completed?: boolean
          priority?: number
          due_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      schedules: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          start_time: string
          end_time: string
          location: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          start_time: string
          end_time: string
          location?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          start_time?: string
          end_time?: string
          location?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          website: string | null
          bio: string | null
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
          bio?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
          bio?: string | null
          updated_at?: string
        }
      }
      work_schedules: {
        Row: {
          id: string
          user_id: string
          shop_name: string
          work_date: string
          start_time: string
          end_time: string
          break_duration: number | null
          duration: number | null
          hourly_rate: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          shop_name: string
          work_date: string
          start_time: string
          end_time: string
          break_duration?: number | null
          duration?: number | null
          hourly_rate?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          shop_name?: string
          work_date?: string
          start_time?: string
          end_time?: string
          break_duration?: number | null
          duration?: number | null
          hourly_rate?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      shop_hourly_rates: {
        Row: {
          id: string
          user_id: string
          shop_name: string
          day_shift_rate: number
          night_shift_rate: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          shop_name: string
          day_shift_rate: number
          night_shift_rate: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          shop_name?: string
          day_shift_rate?: number
          night_shift_rate?: number
          created_at?: string
          updated_at?: string
        }
      }
      shopping_items: {
        Row: {
          id: string
          user_id: string
          name: string
          category: string
          quantity: number
          unit: string
          price: number
          purchased: boolean
          priority: string
          notes: string | null
          purchased_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          category: string
          quantity?: number
          unit?: string
          price?: number
          purchased?: boolean
          priority?: string
          notes?: string | null
          purchased_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          category?: string
          quantity?: number
          unit?: string
          price?: number
          purchased?: boolean
          priority?: string
          notes?: string | null
          purchased_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      news: {
        Row: {
          id: string
          title: string
          link: string
          pub_date: string
          summary: string | null
          source: string
          category: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          link: string
          pub_date: string
          summary?: string | null
          source: string
          category?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          link?: string
          pub_date?: string
          summary?: string | null
          source?: string
          category?: string | null
          created_at?: string
        }
      }
      // 添加衣柜物品表类型定义
      wardrobe_items: {
        Row: {
          id: string
          user_id: string
          name: string
          category: string
          color: string | null
          season: string | null
          image_url: string | null
          purchase_date: string | null
          brand: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          category: string
          color?: string | null
          season?: string | null
          image_url?: string | null
          purchase_date?: string | null
          brand?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          category?: string
          color?: string | null
          season?: string | null
          image_url?: string | null
          purchase_date?: string | null
          brand?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      // 添加穿搭历史表类型定义
      outfit_history: {
        Row: {
          id: string
          user_id: string
          outfit_date: string
          items: Json | null
          weather: Json | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          outfit_date?: string
          items?: Json | null
          weather?: Json | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          outfit_date?: string
          items?: Json | null
          weather?: Json | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
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
  }
}
