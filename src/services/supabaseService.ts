import { supabase } from '@/lib/supabaseClient'
import { Session } from '@supabase/supabase-js'

// 待办事项类型
export interface Todo {
  id: string
  user_id: string
  title: string
  description: string
  completed: boolean
  priority: number
  due_date: string
  created_at: string
  updated_at: string
}

// 日程安排类型
export interface Schedule {
  id: string
  user_id: string
  title: string
  description: string
  start_time: string
  end_time: string
  location: string
  created_at: string
  updated_at: string
}

// 用户个人资料类型
export interface UserProfile {
  id: string
  username: string
  full_name: string
  avatar_url: string
  website: string
  bio: string
  updated_at: string
}

// 获取当前用户
export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getSession()
  if (error) {
    console.error('获取用户会话失败:', error)
    return null
  }
  return data.session?.user || null
}

// 获取用户待办事项（优化查询）
export const getUserTodos = async (userId: string): Promise<{ data: Todo[] | null, error: any }> => {
  const { data, error } = await supabase
    .from('todos')
    .select(`
      id,
      user_id,
      title,
      description,
      completed,
      priority,
      due_date,
      created_at,
      updated_at
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100) // 限制返回数量以提高性能
  
  return { data, error }
}

// 创建待办事项
export const createTodo = async (todo: Omit<Todo, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: Todo | null, error: any }> => {
  const { data, error } = await supabase
    .from('todos')
    .insert([todo])
    .select()
    .single()
  
  return { data, error }
}

// 更新待办事项
export const updateTodo = async (id: string, updates: Partial<Todo>): Promise<{ data: Todo | null, error: any }> => {
  const { data, error } = await supabase
    .from('todos')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  return { data, error }
}

// 删除待办事项
export const deleteTodo = async (id: string): Promise<{ data: null, error: any }> => {
  const { data, error } = await supabase
    .from('todos')
    .delete()
    .eq('id', id)
  
  return { data, error }
}

// 获取用户日程安排（优化查询）
export const getUserSchedules = async (userId: string): Promise<{ data: Schedule[] | null, error: any }> => {
  const { data, error } = await supabase
    .from('schedules')
    .select(`
      id,
      user_id,
      title,
      description,
      start_time,
      end_time,
      location,
      created_at,
      updated_at
    `)
    .eq('user_id', userId)
    .gte('start_time', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // 只获取最近30天的数据
    .order('start_time', { ascending: true })
    .limit(100) // 限制返回数量以提高性能
  
  return { data, error }
}

// 创建日程安排
export const createSchedule = async (schedule: Omit<Schedule, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: Schedule | null, error: any }> => {
  const { data, error } = await supabase
    .from('schedules')
    .insert([schedule])
    .select()
    .single()
  
  return { data, error }
}

// 更新日程安排
export const updateSchedule = async (id: string, updates: Partial<Schedule>): Promise<{ data: Schedule | null, error: any }> => {
  const { data, error } = await supabase
    .from('schedules')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  return { data, error }
}

// 删除日程安排
export const deleteSchedule = async (id: string): Promise<{ data: null, error: any }> => {
  const { data, error } = await supabase
    .from('schedules')
    .delete()
    .eq('id', id)
  
  return { data, error }
}

// 获取用户个人资料
export const getUserProfile = async (userId: string): Promise<{ data: UserProfile | null, error: any }> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select(`
      id,
      username,
      full_name,
      avatar_url,
      website,
      bio,
      updated_at
    `)
    .eq('id', userId)
    .single()
  
  return { data, error }
}

// 更新用户个人资料
export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>): Promise<{ data: UserProfile | null, error: any }> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  
  return { data, error }
}