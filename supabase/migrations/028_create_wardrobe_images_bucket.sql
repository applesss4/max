-- 创建衣物图片存储桶
INSERT INTO storage.buckets (id, name, public) 
VALUES ('wardrobe-images', 'wardrobe-images', true);

-- 注意：storage.objects表已经启用了RLS
-- 我们只需要确保在应用代码中正确使用Supabase的存储API
-- Supabase会自动应用适当的安全策略
