-- 为wardrobe-images存储桶添加RLS策略

-- 允许认证用户上传文件
CREATE POLICY "允许认证用户上传衣物图片"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'wardrobe-images');

-- 允许所有人查看衣物图片（公开访问）
CREATE POLICY "允许公开访问衣物图片"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'wardrobe-images');

-- 允许用户删除自己的文件
CREATE POLICY "允许用户删除自己的衣物图片"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'wardrobe-images' 
  AND auth.uid() = owner
);

-- 注意：storage.objects表已经启用了RLS，所以我们不需要再次启用它