-- 创建衣柜图片存储桶
INSERT INTO storage.buckets (id, name, public)
VALUES ('wardrobe-images', 'wardrobe-images', true);

-- 为存储桶创建RLS策略
CREATE POLICY "允许公开访问衣柜图片"
ON storage.objects FOR SELECT
USING (bucket_id = 'wardrobe-images');

CREATE POLICY "允许认证用户上传衣柜图片"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'wardrobe-images');

CREATE POLICY "允许用户删除自己的衣柜图片"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'wardrobe-images' AND owner_id = auth.uid());