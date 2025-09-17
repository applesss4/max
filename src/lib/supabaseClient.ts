import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

// Supabase配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// 创建Supabase客户端
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// 创建服务端Supabase客户端（用于服务器组件）
export const createServerSupabaseClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  })
}