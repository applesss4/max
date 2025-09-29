import { supabase } from '@/lib/supabaseClient';

/**
 * 上传文件到Supabase存储
 * @param file 要上传的文件
 * @param bucketName 存储桶名称
 * @param folderPath 文件夹路径
 * @returns 上传结果，包含公共URL和错误信息
 */
export const uploadFile = async (file: File, bucketName: string = 'uploads', folderPath: string = 'files') => {
  try {
    // 生成唯一文件名
    const fileExt = file.name.split('.').pop();
    const fileName = `${folderPath}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    // 上传文件
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file);

    if (error) {
      console.error('文件上传失败:', error);
      return { publicUrl: null, error };
    }

    // 获取公共URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    return { publicUrl, error: null };
  } catch (error) {
    console.error('文件上传时发生错误:', error);
    return { publicUrl: null, error };
  }
};

/**
 * 删除Supabase存储中的文件
 * @param fileName 文件名
 * @param bucketName 存储桶名称
 * @returns 删除结果
 */
export const deleteFile = async (fileName: string, bucketName: string = 'uploads') => {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .remove([fileName]);

    if (error) {
      console.error('文件删除失败:', error);
      return { error };
    }

    return { error: null };
  } catch (error) {
    console.error('文件删除时发生错误:', error);
    return { error };
  }
};