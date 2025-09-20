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
      health_tracks: {
        Row: {
          id: string
          user_id: string
          weight: number | null
          height: number | null
          blood_pressure_sys: number | null
          blood_pressure_dia: number | null
          heart_rate: number | null
          steps: number | null
          sleep_hours: number | null
          water_intake: number | null
          notes: string | null
          tracked_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          weight?: number | null
          height?: number | null
          blood_pressure_sys?: number | null
          blood_pressure_dia?: number | null
          heart_rate?: number | null
          steps?: number | null
          sleep_hours?: number | null
          water_intake?: number | null
          notes?: string | null
          tracked_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          weight?: number | null
          height?: number | null
          blood_pressure_sys?: number | null
          blood_pressure_dia?: number | null
          heart_rate?: number | null
          steps?: number | null
          sleep_hours?: number | null
          water_intake?: number | null
          notes?: string | null
          tracked_date?: string
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

// 添加条形码类型定义
export interface Barcode {
  id: string
  user_id: string
  barcode_value: string
  barcode_type: string
  product_name: string | null
  product_description: string | null
  product_price: number | null
  product_category: string | null
  product_image_url: string | null
  scanned_at: string
  created_at: string
  updated_at: string
}
