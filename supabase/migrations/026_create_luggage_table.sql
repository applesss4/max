-- 创建行李箱表
CREATE TABLE luggage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 为行李箱表创建索引
CREATE INDEX idx_luggage_user_id ON luggage(user_id);
CREATE INDEX idx_luggage_name ON luggage(name);

-- 行李箱表策略
CREATE POLICY "用户只能查看自己的行李箱" ON luggage
  FOR ALL USING (auth.uid() = user_id);

-- 启用行李箱表的行级安全策略
ALTER TABLE luggage ENABLE ROW LEVEL SECURITY;

-- 创建自动更新updated_at字段的触发器
CREATE TRIGGER update_luggage_updated_at 
  BEFORE UPDATE ON luggage 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 修改衣柜表，添加行李箱关联字段
ALTER TABLE wardrobe_items 
ADD COLUMN luggage_id UUID REFERENCES luggage(id) ON DELETE SET NULL;

-- 为行李箱ID创建索引
CREATE INDEX idx_wardrobe_items_luggage_id ON wardrobe_items(luggage_id);