-- 为搭配预览表添加网络图片URL字段
ALTER TABLE outfit_previews 
ADD COLUMN IF NOT EXISTS network_image_url TEXT;

-- 添加注释
COMMENT ON COLUMN outfit_previews.network_image_url IS '网络推荐搭配图URL';