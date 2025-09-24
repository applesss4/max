-- 创建搭配预览表
CREATE TABLE outfit_previews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  items JSONB, -- 搭配物品列表 [{id, name, category, image_url, color, season, tags}]
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 为搭配预览表创建索引
CREATE INDEX idx_outfit_previews_user_id ON outfit_previews(user_id);
CREATE INDEX idx_outfit_previews_created_at ON outfit_previews(created_at);

-- 搭配预览表策略
CREATE POLICY "用户只能查看自己的搭配预览" ON outfit_previews
  FOR ALL USING (auth.uid() = user_id);

-- 启用搭配预览表的行级安全策略
ALTER TABLE outfit_previews ENABLE ROW LEVEL SECURITY;

-- 创建自动更新updated_at字段的触发器
CREATE TRIGGER update_outfit_previews_updated_at 
  BEFORE UPDATE ON outfit_previews 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();