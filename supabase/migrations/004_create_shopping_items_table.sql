-- 创建购物清单表
CREATE TABLE shopping_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit VARCHAR(50) DEFAULT '个',
  price DECIMAL(10,2) DEFAULT 0.00,
  purchased BOOLEAN DEFAULT FALSE,
  priority VARCHAR(10) DEFAULT 'medium', -- low, medium, high
  notes TEXT,
  purchased_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 为购物清单表创建索引
CREATE INDEX idx_shopping_items_user_id ON shopping_items(user_id);
CREATE INDEX idx_shopping_items_purchased ON shopping_items(purchased);
CREATE INDEX idx_shopping_items_category ON shopping_items(category);
CREATE INDEX idx_shopping_items_priority ON shopping_items(priority);

-- 启用行级安全策略 (RLS)
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;

-- 创建行级安全策略
CREATE POLICY "用户只能查看自己的购物清单" ON shopping_items
  FOR ALL USING (auth.uid() = user_id);

-- 创建自动更新updated_at字段的触发器
CREATE TRIGGER update_shopping_items_updated_at 
  BEFORE UPDATE ON shopping_items 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();