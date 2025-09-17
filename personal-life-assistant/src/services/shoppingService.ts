import { supabase } from '@/lib/supabaseClient'

// 购物清单项类型
export interface ShoppingItem {
  id: string
  user_id: string
  name: string
  category: string
  quantity: number
  unit: string
  price: number
  purchased: boolean
  priority: 'low' | 'medium' | 'high'
  notes: string
  purchased_at: string | null
  created_at: string
  updated_at: string
}

// 获取用户购物清单
export const getUserShoppingItems = async (userId: string): Promise<{ data: ShoppingItem[] | null, error: any }> => {
  const { data, error } = await supabase
    .from('shopping_items')
    .select(`
      id,
      user_id,
      name,
      category,
      quantity,
      unit,
      price,
      purchased,
      priority,
      notes,
      purchased_at,
      created_at,
      updated_at
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100) // 限制返回数量以提高性能
  
  return { data, error }
}

// 创建购物清单项
export const createShoppingItem = async (item: Omit<ShoppingItem, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: ShoppingItem | null, error: any }> => {
  const { data, error } = await supabase
    .from('shopping_items')
    .insert([item])
    .select()
    .single()
  
  return { data, error }
}

// 更新购物清单项
export const updateShoppingItem = async (id: string, updates: Partial<ShoppingItem>): Promise<{ data: ShoppingItem | null, error: any }> => {
  const { data, error } = await supabase
    .from('shopping_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  return { data, error }
}

// 删除购物清单项
export const deleteShoppingItem = async (id: string): Promise<{ data: null, error: any }> => {
  const { data, error } = await supabase
    .from('shopping_items')
    .delete()
    .eq('id', id)
  
  return { data, error }
}

// 批量更新购物清单项状态
export const updateShoppingItemsStatus = async (ids: string[], purchased: boolean): Promise<{ data: ShoppingItem[] | null, error: any }> => {
  const { data, error } = await supabase
    .from('shopping_items')
    .update({ 
      purchased,
      purchased_at: purchased ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    })
    .in('id', ids)
    .select()
  
  return { data, error }
}