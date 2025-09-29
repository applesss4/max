import { supabase } from '@/lib/supabaseClient'

// 上传文件到Supabase存储
export const uploadFile = async (file: File, bucketName: string = 'wardrobe-images', folderPath: string = 'items') => {
  try {
    console.log('开始上传文件:', file.name, '大小:', file.size, '类型:', file.type);
    
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
    
    console.log('上传文件到存储桶:', bucketName, '文件名:', fileName);
    
    // 尝试上传文件
    const { data, error } = await supabase
      .storage
      .from(bucketName)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      })

    if (error) {
      console.error('文件上传错误:', error);
      
      // 如果是权限错误，提供更友好的错误信息
      if (error.message.includes('Unauthorized') || error.message.includes('403')) {
        throw new Error('文件上传权限不足，请联系管理员配置存储策略');
      }
      
      throw error;
    }
    
    console.log('文件上传成功:', data);
    
    // 获取公共URL
    const { data: { publicUrl } } = supabase
      .storage
      .from(bucketName)
      .getPublicUrl(fileName)

    console.log('获取到公共URL:', publicUrl);
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

    if (error) {
      console.error('文件删除错误:', error);
      
      // 如果是权限错误，提供更友好的错误信息
      if (error.message.includes('Unauthorized') || error.message.includes('403')) {
        throw new Error('文件删除权限不足，请联系管理员配置存储策略');
      }
      
      throw error;
    }
    return { error: null }
  } catch (error) {
    console.error('文件删除失败:', error)
    return { error }
  }
}