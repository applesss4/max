-- 添加tags字段到wardrobe_items表
ALTER TABLE wardrobe_items 
ADD COLUMN IF NOT EXISTS tags TEXT[];