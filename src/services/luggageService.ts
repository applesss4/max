import { supabase } from '@/lib/supabaseClient'

// 行李箱数据类型
export interface Luggage {
  id: string
  user_id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

// 创建行李箱参数类型
export interface CreateLuggageParams {
  user_id: string
  name: string
  description?: string
}

// 更新行李箱参数类型
export interface UpdateLuggageParams {
  name?: string
  description?: string
}

// 获取用户行李箱
export const getUserLuggage = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('luggage')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('获取行李箱失败:', error)
    return { data: null, error }
  }
}

// 创建行李箱
export const createLuggage = async (luggage: CreateLuggageParams) => {
  try {
    const { data, error } = await supabase
      .from('luggage')
      .insert(luggage)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('创建行李箱失败:', error)
    return { data: null, error }
  }
}

// 更新行李箱
export const updateLuggage = async (id: string, updates: UpdateLuggageParams) => {
  try {
    const { data, error } = await supabase
      .from('luggage')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('更新行李箱失败:', error)
    return { data: null, error }
  }
}

// 删除行李箱
export const deleteLuggage = async (id: string) => {
  try {
    const { error } = await supabase
      .from('luggage')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('删除行李箱失败:', error)
    return { error }
  }
}

// 将衣物移动到行李箱
export const moveWardrobeItemToLuggage = async (wardrobeItemId: string, luggageId: string | null) => {
  try {
    const { data, error } = await supabase
      .from('wardrobe_items')
      .update({ luggage_id: luggageId })
      .eq('id', wardrobeItemId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('移动衣物到行李箱失败:', error)
    return { data: null, error }
  }
}

// 获取行李箱中的衣物
export const getWardrobeItemsInLuggage = async (luggageId: string) => {
  try {
    const { data, error } = await supabase
      .from('wardrobe_items')
      .select('*')
      .eq('luggage_id', luggageId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('获取行李箱中的衣物失败:', error)
    return { data: null, error }
  }
}