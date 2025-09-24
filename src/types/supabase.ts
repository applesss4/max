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
          tags: string[] | null
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
          tags?: string[] | null
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
          tags?: string[] | null
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
      // 电商相关表类型定义
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          category: string
          image_url: string | null
          stock_quantity: number
          shop_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price: number
          category: string
          image_url?: string | null
          stock_quantity?: number
          shop_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price?: number
          category?: string
          image_url?: string | null
          stock_quantity?: number
          shop_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      shops: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      shopping_carts: {
        Row: {
          id: string
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      cart_items: {
        Row: {
          id: string
          cart_id: string
          product_id: string
          quantity: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cart_id: string
          product_id: string
          quantity?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cart_id?: string
          product_id?: string
          quantity?: number
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          total_amount: number
          status: string
          shipping_address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          total_amount: number
          status?: string
          shipping_address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          total_amount?: number
          status?: string
          shipping_address?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          price: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity?: number
          price: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          price?: number
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      // 添加搭配预览表类型定义
      outfit_previews: {
        Row: {
          id: string
          user_id: string
          name: string
          items: Json | null
          network_image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          items?: Json | null
          network_image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          items?: Json | null
          network_image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      // 添加电商相关函数
      create_order_with_items: {
        Args: {
          user_id: string
          shipping_address: string
          total_amount: number
        }
        Returns: {
          id: string
          user_id: string
          total_amount: number
          status: string
          shipping_address: string | null
          created_at: string
          updated_at: string
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
