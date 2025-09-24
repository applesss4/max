import { createClient } from '@supabase/supabase-js'

// Supabase配置 - 添加默认值以防止undefined
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bcahnkgczieiogyyxyml.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjYWhua2djemllaW9neXl4eW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMzc0MTcsImV4cCI6MjA3MzYxMzQxN30.bBRylsq9ihPZ9Kbor1kJcgNgOyqDY9e3euGBwxj1QAw'

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Anon Key exists:', !!supabaseAnonKey)

// 创建Supabase客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 创建服务端Supabase客户端（用于服务器组件）
export const createServerSupabaseClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjYWhua2djemllaW9neXl4eW1sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODAzNzQxNywiZXhwIjoyMDczNjEzNDE3fQ.rtBp-QWWtw_VpI2vNGYi_lXpBIgwiM1nbumP_q96iTU'
  // @ts-ignore
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  })
}