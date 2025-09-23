import { supabase } from '@/lib/supabaseClient'

// 获取用户衣柜物品
export const getWardrobeItems = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('wardrobe_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('获取衣柜物品失败:', error)
    return { data: null, error }
  }
}

// 添加衣柜物品
export const addWardrobeItem = async (item: any) => {
  try {
    // @ts-ignore
    const { data, error } = await supabase
      .from('wardrobe_items')
      .insert(item)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('添加衣柜物品失败:', error)
    return { data: null, error }
  }
}

// 更新衣柜物品
export const updateWardrobeItem = async (id: string, updates: any) => {
  try {
    // @ts-ignore
    const { data, error } = await supabase
      .from('wardrobe_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('更新衣柜物品失败:', error)
    return { data: null, error }
  }
}

// 删除衣柜物品
export const deleteWardrobeItem = async (id: string) => {
  try {
    // @ts-ignore
    const { error } = await supabase
      .from('wardrobe_items')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('删除衣柜物品失败:', error)
    return { error }
  }
}

// 获取穿搭历史
export const getOutfitHistory = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('outfit_history')
      .select('*')
      .eq('user_id', userId)
      .order('outfit_date', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('获取穿搭历史失败:', error)
    return { data: null, error }
  }
}

// 保存穿搭历史
export const saveOutfitHistory = async (outfit: any) => {
  try {
    // @ts-ignore
    const { data, error } = await supabase
      .from('outfit_history')
      .insert(outfit)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('保存穿搭历史失败:', error)
    return { data: null, error }
  }
}

// 根据天气和衣柜物品生成穿搭推荐
export const generateOutfitRecommendation = (
  weather: { temperature: number; condition: string },
  wardrobeItems: any[]
) => {
  // 简单的推荐逻辑（实际应用中可以更复杂）
  // 根据天气温度和季节推荐合适的衣物
  let recommendedItems: any[] = []
  
  // 根据温度推荐
  if (weather.temperature > 25) {
    // 夏季推荐：T恤、短裤等
    recommendedItems = wardrobeItems.filter((item: any) => 
      item.category === '上衣' && (item.season === '夏' || item.season === '四季')
    ).slice(0, 1)
    
    const pants = wardrobeItems.filter((item: any) => 
      item.category === '裤子' && (item.season === '夏' || item.season === '四季')
    ).slice(0, 1)
    
    recommendedItems = [...recommendedItems, ...pants]
  } else if (weather.temperature > 15) {
    // 春秋季推荐：长袖、长裤等
    recommendedItems = wardrobeItems.filter((item: any) => 
      item.category === '上衣' && (item.season === '春' || item.season === '秋' || item.season === '四季')
    ).slice(0, 1)
    
    const pants = wardrobeItems.filter((item: any) => 
      item.category === '裤子' && (item.season === '春' || item.season === '秋' || item.season === '四季')
    ).slice(0, 1)
    
    recommendedItems = [...recommendedItems, ...pants]
  } else {
    // 冬季推荐：外套、毛衣等
    const outer = wardrobeItems.filter((item: any) => 
      item.category === '外套' && (item.season === '冬' || item.season === '四季')
    ).slice(0, 1)
    
    const inner = wardrobeItems.filter((item: any) => 
      item.category === '上衣' && (item.season === '冬' || item.season === '四季')
    ).slice(0, 1)
    
    const pants = wardrobeItems.filter((item: any) => 
      item.category === '裤子' && (item.season === '冬' || item.season === '四季')
    ).slice(0, 1)
    
    recommendedItems = [...outer, ...inner, ...pants]
  }
  
  // 添加配饰
  const accessories = wardrobeItems.filter((item: any) => 
    item.category === '配饰'
  ).slice(0, 2)
  
  recommendedItems = [...recommendedItems, ...accessories]
  
  // 生成推荐说明
  const notes = `根据今日${weather.temperature}°C的${weather.condition}天气，为您推荐这套穿搭。`
  
  return {
    items: recommendedItems,
    notes
  }
}