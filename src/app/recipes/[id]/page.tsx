import { createServerSupabaseClient } from '@/lib/supabaseClient'

interface Recipe {
  id: string
  name: string
  description: string
  image_url: string | null
  video_url: string | null
  created_at: string
}

// 服务器组件部分
export default async function RecipeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // 等待params解析
  const { id } = await params
  
  // 创建服务端Supabase客户端
  const supabase = createServerSupabaseClient()
  
  // 在服务器端获取菜谱数据
  const { data: recipe, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .single()

  // 检查错误类型，如果是找不到记录的错误，则传递null给客户端组件
  if (error) {
    // PGRST116 错误表示没有找到记录，这是正常情况
    if (error.code === 'PGRST116') {
      return <ClientRecipeDetail initialRecipe={null} />
    }
    
    // 其他错误记录到控制台并传递null给客户端组件
    console.error('获取菜谱详情失败:', error)
    return <ClientRecipeDetail initialRecipe={null} />
  }

  // 将数据传递给客户端组件
  return <ClientRecipeDetail initialRecipe={recipe} />
}

import ClientRecipeDetail from './client-page'