import { supabase } from '@/lib/supabaseClient'

// 上传文件到Supabase存储
export const uploadFile = async (file: File, bucketName: string = 'wardrobe-images', folderPath: string = 'items') => {
  try {
    // 检查文件大小（最大5MB）
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('文件大小不能超过5MB')
    }

    // 检查文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      throw new Error('只支持 JPG, PNG, GIF, WebP 格式的图片')
    }

    // 生成唯一文件名
    const fileExt = file.name.split('.').pop()
    const fileName = `${folderPath}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    
    // 上传文件
    const { data, error } = await supabase
      .storage
      .from(bucketName)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      })

    if (error) throw error
    
    // 获取公共URL
    const { data: { publicUrl } } = supabase
      .storage
      .from(bucketName)
      .getPublicUrl(fileName)

    return { publicUrl, error: null }
  } catch (error) {
    console.error('文件上传失败:', error)
    return { publicUrl: null, error }
  }
}

// 删除存储中的文件
export const deleteFile = async (fileName: string, bucketName: string = 'wardrobe-images') => {
  try {
    const { error } = await supabase
      .storage
      .from(bucketName)
      .remove([fileName])

    if (error) throw error
    return { error: null }
  } catch (error) {
    console.error('文件删除失败:', error)
    return { error }
  }
}