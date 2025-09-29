-- 为wardrobe_items表添加多图片支持
-- 添加额外图片URL字段

-- 添加额外图片URL字段（用于存储多张衣物图片）
ALTER TABLE wardrobe_items 
ADD COLUMN IF NOT EXISTS image_urls TEXT[];

-- 添加字段注释
COMMENT ON COLUMN wardrobe_items.image_urls IS '额外图片URL列表，用于存储多张衣物图片';