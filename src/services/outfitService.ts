import { supabase } from '@/lib/supabaseClient'

// 获取用户衣柜物品
export const getWardrobeItems = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('wardrobe_items')
      .select('*')
      .eq('user_id', userId)
      .is('luggage_id', null) // 只获取未放入行李箱的衣物
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('获取衣柜物品失败:', error)
    return { data: null, error }
  }
}

// 获取所有衣柜物品（包括已放入行李箱的）
export const getAllWardrobeItems = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('wardrobe_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('获取所有衣柜物品失败:', error)
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

    if (error) throw error
    // 返回数组中的第一个元素，而不是使用.single()
    return { data: data?.[0] || null, error: null }
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
      // @ts-ignore
      .eq('id', id)
      .select()

    if (error) throw error
    // 返回数组中的第一个元素，而不是使用.single()
    return { data: data?.[0] || null, error: null }
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

    if (error) throw error
    // 返回数组中的第一个元素，而不是使用.single()
    return { data: data?.[0] || null, error: null }
  } catch (error) {
    console.error('保存穿搭历史失败:', error)
    return { data: null, error }
  }
}

// 获取搭配预览
export const getOutfitPreviews = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('outfit_previews')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    
    // 确保返回的数据格式正确
    const processedData = data?.map((item: any) => {
      // 确保 items 字段是数组格式
      if (typeof item.items === 'string') {
        try {
          item.items = JSON.parse(item.items);
        } catch (e) {
          console.warn('解析items字段失败:', e);
          item.items = [];
        }
      }
      
      // 确保 items 是数组
      if (!Array.isArray(item.items)) {
        item.items = [];
      }
      
      return item;
    }) || [];
    
    return { data: processedData, error: null }
  } catch (error) {
    console.error('获取搭配预览失败:', error)
    return { data: null, error }
  }
}

// 保存搭配预览
export const saveOutfitPreview = async (preview: any) => {
  try {
    // 确保 items 字段是 JSON 字符串格式
    const previewToSave = {
      ...preview,
      items: Array.isArray(preview.items) ? JSON.stringify(preview.items) : preview.items
    };
    
    // @ts-ignore
    const { data, error } = await supabase
      .from('outfit_previews')
      .insert(previewToSave)
      .select()

    if (error) throw error
    // 返回数组中的第一个元素，而不是使用.single()
    return { data: data?.[0] || null, error: null }
  } catch (error) {
    console.error('保存搭配预览失败:', error)
    return { data: null, error }
  }
}

// 更新搭配预览
export const updateOutfitPreview = async (id: string, updates: any) => {
  try {
    // @ts-ignore
    const { data, error } = await supabase
      .from('outfit_previews')
      .update(updates)
      // @ts-ignore
      .eq('id', id)
      .select()

    if (error) throw error
    // 返回数组中的第一个元素，而不是使用.single()
    return { data: data?.[0] || null, error: null }
  } catch (error) {
    console.error('更新搭配预览失败:', error)
    return { data: null, error }
  }
}

// 删除搭配预览
export const deleteOutfitPreview = async (id: string) => {
  try {
    // @ts-ignore
    const { error } = await supabase
      .from('outfit_previews')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('删除搭配预览失败:', error)
    return { error }
  }
}

// 根据天气和衣柜物品生成穿搭推荐（简化版，用于向后兼容）
export const generateOutfitRecommendation = (
  weather: { temperature: number; condition: string },
  wardrobeItems: any[]
) => {
  // 使用优化的推荐逻辑
  return generateOptimizedOutfitRecommendation(weather, wardrobeItems)
}

// 优化的穿搭推荐逻辑，参考网络上的穿搭和色彩搭配原则
export const generateOptimizedOutfitRecommendation = (
  weather: { temperature: number; condition: string },
  wardrobeItems: any[]
) => {
  // 推荐的衣物组合
  let recommendedItems: any[] = []
  
  // 获取所有可用的颜色
  const availableColors = [...new Set(wardrobeItems.map((item: any) => item.color).filter(Boolean))] as string[]
  
  // 根据天气和温度推荐基础搭配
  if (weather.temperature > 28) {
    // 夏季炎热：推荐轻薄透气的搭配
    recommendedItems = generateSummerOutfit(wardrobeItems);
  } else if (weather.temperature > 20) {
    // 春秋季：推荐舒适适中的搭配
    recommendedItems = generateSpringAutumnOutfit(wardrobeItems);
  } else if (weather.temperature > 10) {
    // 早春晚秋：推荐稍厚一些的搭配
    recommendedItems = generateEarlyLateSeasonOutfit(wardrobeItems);
  } else {
    // 冬季寒冷：推荐保暖搭配
    recommendedItems = generateWinterOutfit(wardrobeItems);
  }
  
  // 添加配饰（根据色彩搭配原则）
  recommendedItems = addAccessories(recommendedItems, wardrobeItems);
  
  // 应用色彩搭配原则优化推荐
  const optimizedItems = applyColorCoordinationPrinciples(recommendedItems, availableColors);
  
  // 生成详细的推荐说明
  const notes = generateDetailedRecommendationNotes(weather, optimizedItems);
  
  return {
    items: optimizedItems,
    notes
  }
}

// 生成夏季穿搭
const generateSummerOutfit = (wardrobeItems: any[]): any[] => {
  const recommendedItems: any[] = [];
  
  // 上衣
  const tops = wardrobeItems.filter((item: any) => 
    item.category === '上衣' && (item.season === '夏' || item.season === '四季')
  )
  
  // 裤子/裙子
  const bottoms = wardrobeItems.filter((item: any) => 
    (item.category === '裤子' || item.category === '裙子') && (item.season === '夏' || item.season === '四季')
  )
  
  // 鞋子
  const shoes = wardrobeItems.filter((item: any) => 
    item.category === '鞋子' && (item.season === '夏' || item.season === '四季')
  )
  
  // 选择上衣
  if (tops.length > 0) {
    // 优先选择浅色上衣（夏季推荐）
    const lightColoredTops = tops.filter((item: any) => 
      item.color && (item.color.includes('白') || item.color.includes('浅') || item.color.includes('米'))
    )
    
    if (lightColoredTops.length > 0) {
      recommendedItems.push(lightColoredTops[0])
    } else {
      recommendedItems.push(tops[0])
    }
  }
  
  // 选择下装
  if (bottoms.length > 0) {
    // 优先选择浅色下装
    const lightColoredBottoms = bottoms.filter((item: any) => 
      item.color && (item.color.includes('白') || item.color.includes('浅') || item.color.includes('米') || item.color.includes('卡其'))
    )
    
    if (lightColoredBottoms.length > 0) {
      recommendedItems.push(lightColoredBottoms[0])
    } else {
      recommendedItems.push(bottoms[0])
    }
  }
  
  // 选择鞋子
  if (shoes.length > 0) {
    recommendedItems.push(shoes[0])
  }
  
  return recommendedItems;
}

// 生成春秋季穿搭
const generateSpringAutumnOutfit = (wardrobeItems: any[]): any[] => {
  const recommendedItems: any[] = [];
  
  // 上衣
  const tops = wardrobeItems.filter((item: any) => 
    item.category === '上衣' && (item.season === '春' || item.season === '秋' || item.season === '四季')
  )
  
  // 裤子/裙子
  const bottoms = wardrobeItems.filter((item: any) => 
    (item.category === '裤子' || item.category === '裙子') && (item.season === '春' || item.season === '秋' || item.season === '四季')
  )
  
  // 鞋子
  const shoes = wardrobeItems.filter((item: any) => 
    item.category === '鞋子' && (item.season === '春' || item.season === '秋' || item.season === '四季')
  )
  
  // 选择上衣
  if (tops.length > 0) {
    recommendedItems.push(tops[0])
  }
  
  // 选择下装
  if (bottoms.length > 0) {
    recommendedItems.push(bottoms[0])
  }
  
  // 选择鞋子
  if (shoes.length > 0) {
    recommendedItems.push(shoes[0])
  }
  
  return recommendedItems;
}

// 生成早春晚秋穿搭
const generateEarlyLateSeasonOutfit = (wardrobeItems: any[]): any[] => {
  const recommendedItems: any[] = [];
  
  // 外套
  const outerwear = wardrobeItems.filter((item: any) => 
    item.category === '外套' && (item.season === '春' || item.season === '秋' || item.season === '四季')
  )
  
  // 上衣
  const tops = wardrobeItems.filter((item: any) => 
    item.category === '上衣' && (item.season === '春' || item.season === '秋' || item.season === '四季')
  )
  
  // 裤子/裙子
  const bottoms = wardrobeItems.filter((item: any) => 
    (item.category === '裤子' || item.category === '裙子') && (item.season === '春' || item.season === '秋' || item.season === '四季')
  )
  
  // 鞋子
  const shoes = wardrobeItems.filter((item: any) => 
    item.category === '鞋子' && (item.season === '春' || item.season === '秋' || item.season === '四季')
  )
  
  // 选择外套
  if (outerwear.length > 0) {
    recommendedItems.push(outerwear[0])
  }
  
  // 选择上衣
  if (tops.length > 0) {
    recommendedItems.push(tops[0])
  }
  
  // 选择下装
  if (bottoms.length > 0) {
    recommendedItems.push(bottoms[0])
  }
  
  // 选择鞋子
  if (shoes.length > 0) {
    recommendedItems.push(shoes[0])
  }
  
  return recommendedItems;
}

// 生成冬季穿搭
const generateWinterOutfit = (wardrobeItems: any[]): any[] => {
  const recommendedItems: any[] = [];
  
  // 外套
  const outerwear = wardrobeItems.filter((item: any) => 
    item.category === '外套' && (item.season === '冬' || item.season === '四季')
  )
  
  // 上衣
  const tops = wardrobeItems.filter((item: any) => 
    item.category === '上衣' && (item.season === '冬' || item.season === '四季')
  )
  
  // 裤子/裙子
  const bottoms = wardrobeItems.filter((item: any) => 
    (item.category === '裤子' || item.category === '裙子') && (item.season === '冬' || item.season === '四季')
  )
  
  // 鞋子
  const shoes = wardrobeItems.filter((item: any) => 
    item.category === '鞋子' && (item.season === '冬' || item.season === '四季')
  )
  
  // 选择外套
  if (outerwear.length > 0) {
    recommendedItems.push(outerwear[0])
  }
  
  // 选择上衣
  if (tops.length > 0) {
    recommendedItems.push(tops[0])
  }
  
  // 选择下装
  if (bottoms.length > 0) {
    recommendedItems.push(bottoms[0])
  }
  
  // 选择鞋子
  if (shoes.length > 0) {
    recommendedItems.push(shoes[0])
  }
  
  return recommendedItems;
}

// 添加配饰
const addAccessories = (recommendedItems: any[], wardrobeItems: any[]): any[] => {
  // 添加配饰（根据色彩搭配原则）
  const accessories = wardrobeItems.filter((item: any) => 
    item.category === '配饰'
  )
  
  // 根据色彩搭配原则选择配饰
  if (accessories.length > 0 && recommendedItems.length > 0) {
    // 获取主要衣物的颜色
    const mainItemColors = recommendedItems
      .map(item => item.color)
      .filter(Boolean) as string[]
    
    // 寻找与主要衣物颜色相呼应的配饰
    const matchingAccessories = accessories.filter((item: any) => {
      if (!item.color) return false
      // 寻找相同或相似颜色的配饰
      return mainItemColors.some(mainColor => 
        item.color.includes(mainColor) || mainColor.includes(item.color)
      )
    })
    
    // 如果找到匹配的配饰，添加1-2个
    if (matchingAccessories.length > 0) {
      recommendedItems.push(...matchingAccessories.slice(0, 2))
    } else {
      // 否则添加中性色配饰（黑、白、灰、米色等）
      const neutralAccessories = accessories.filter((item: any) => {
        if (!item.color) return false
        return item.color.includes('黑') || item.color.includes('白') || 
               item.color.includes('灰') || item.color.includes('米') ||
               item.color.includes('棕') || item.color.includes('卡其')
      })
      
      if (neutralAccessories.length > 0) {
        recommendedItems.push(...neutralAccessories.slice(0, 2))
      } else {
        // 如果没有中性色配饰，添加任意配饰
        recommendedItems.push(...accessories.slice(0, 2))
      }
    }
  }
  
  return recommendedItems;
}

// 生成详细的推荐说明
const generateDetailedRecommendationNotes = (
  weather: { temperature: number; condition: string },
  items: any[]
): string => {
  // 根据温度生成描述
  let temperatureDescription = '';
  if (weather.temperature > 28) {
    temperatureDescription = '炎热的夏季';
  } else if (weather.temperature > 20) {
    temperatureDescription = '舒适的春秋季节';
  } else if (weather.temperature > 10) {
    temperatureDescription = '稍凉的早春晚秋';
  } else {
    temperatureDescription = '寒冷的冬季';
  }
  
  // 根据天气状况添加建议
  let weatherAdvice = '';
  if (weather.condition.includes('雨')) {
    weatherAdvice = '今天有雨，建议携带雨具。';
  } else if (weather.condition.includes('雪')) {
    weatherAdvice = '今天有雪，注意保暖防滑。';
  } else if (weather.condition.includes('晴')) {
    weatherAdvice = '今天天气晴朗，适合户外活动。';
  } else if (weather.condition.includes('云') || weather.condition.includes('阴')) {
    weatherAdvice = '今天多云，温度适中。';
  }
  
  // 生成搭配说明
  const colorAdvice = getColorCoordinationAdvice(items);
  
  // 生成风格建议
  let styleAdvice = '';
  const categories = items.map(item => item.category);
  if (categories.includes('外套')) {
    styleAdvice = '这套搭配层次分明，适合多种场合。';
  } else if (categories.includes('裙子')) {
    styleAdvice = '这套搭配优雅时尚，适合日常或约会场合。';
  } else {
    styleAdvice = '这套搭配简洁舒适，适合日常工作和生活。';
  }
  
  return `根据今日${weather.temperature}°C的${temperatureDescription}和${weather.condition}天气，为您推荐这套穿搭。${weatherAdvice}${colorAdvice}${styleAdvice}`;
}

// 获取温度描述
const getTemperatureDescription = (temperature: number): string => {
  if (temperature > 28) return '清凉夏季'
  if (temperature > 20) return '舒适春秋'
  if (temperature > 10) return '温暖春秋季'
  return '保暖冬季'
}

// 应用色彩搭配原则
const applyColorCoordinationPrinciples = (items: any[], availableColors: string[]): any[] => {
  if (items.length === 0) return items
  
  // 获取所有物品的颜色
  const itemColors = items
    .map(item => item.color)
    .filter(Boolean) as string[]
  
  // 如果颜色种类超过3种，尝试优化
  const uniqueColors = [...new Set(itemColors)]
  if (uniqueColors.length > 3) {
    // 保留主要衣物颜色，替换部分配饰颜色
    const mainItems = items.filter(item => 
      item.category === '上衣' || item.category === '裤子' || 
      item.category === '裙子' || item.category === '外套'
    )
    
    const accessoryItems = items.filter(item => 
      item.category === '配饰' || item.category === '鞋子'
    )
    
    // 优先保留与主要衣物颜色协调的配饰
    const mainItemColors = mainItems
      .map(item => item.color)
      .filter(Boolean) as string[]
    
    const coordinatedAccessories = accessoryItems.filter(item => {
      if (!item.color) return true
      return mainItemColors.some(mainColor => 
        isColorCoordinated(mainColor, item.color)
      )
    })
    
    // 如果协调的配饰不够，添加中性色配饰
    const neutralAccessories = accessoryItems.filter(item => {
      if (!item.color) return false
      return isNeutralColor(item.color)
    })
    
    // 组合优化后的物品
    const optimizedItems = [...mainItems, ...coordinatedAccessories]
    
    // 如果配饰数量不足，添加中性色配饰
    const neededAccessories = 3 - coordinatedAccessories.length
    if (neededAccessories > 0 && neutralAccessories.length > 0) {
      optimizedItems.push(...neutralAccessories.slice(0, neededAccessories))
    }
    
    return optimizedItems
  }
  
  return items
}

// 判断颜色是否协调
const isColorCoordinated = (color1: string, color2: string): boolean => {
  // 相同颜色
  if (color1 === color2) return true
  
  // 相似颜色（包含关系）
  if (color1.includes(color2) || color2.includes(color1)) return true
  
  // 中性色与任何颜色都协调
  if (isNeutralColor(color1) || isNeutralColor(color2)) return true
  
  // 特定的颜色组合（如经典的黑白、蓝白等）
  const classicCombinations = [
    ['黑', '白'], ['蓝', '白'], ['红', '黑'], 
    ['灰', '白'], ['棕', '米'], ['卡其', '白']
  ]
  
  for (const [c1, c2] of classicCombinations) {
    if ((color1.includes(c1) && color2.includes(c2)) || 
        (color1.includes(c2) && color2.includes(c1))) {
      return true
    }
  }
  
  return false
}

// 判断是否为中性色
const isNeutralColor = (color: string): boolean => {
  const neutralColors = ['黑', '白', '灰', '米', '棕', '卡其', '驼']
  return neutralColors.some(neutral => color.includes(neutral))
}

// 生成色彩搭配建议
const getColorCoordinationAdvice = (items: any[]): string => {
  if (items.length === 0) return ''
  
  const colors = items
    .map(item => item.color)
    .filter(Boolean) as string[]
  
  const uniqueColors = [...new Set(colors)]
  
  if (uniqueColors.length === 0) return '这套搭配注重款式协调。'
  if (uniqueColors.length === 1) return `这套搭配采用单色系设计，简洁大方。`
  if (uniqueColors.length === 2) return `这套搭配运用了${uniqueColors.join('与')}的双色搭配，经典耐看。`
  if (uniqueColors.length === 3) return `这套搭配采用了${uniqueColors.slice(0, 2).join('、')}与${uniqueColors[2]}的三色搭配，层次丰富。`
  
  return `这套搭配色彩丰富，注意整体协调性。`
}
