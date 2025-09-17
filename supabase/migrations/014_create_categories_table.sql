-- 创建商品分类表
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 为分类表创建索引
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

-- 启用行级安全策略 (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 创建行级安全策略
-- 用户只能查看和管理自己的分类
DROP POLICY IF EXISTS "用户只能查看自己的分类" ON categories;
CREATE POLICY "用户只能查看自己的分类" ON categories
  FOR ALL USING (auth.uid() = user_id);

-- 创建自动更新updated_at字段的触发器
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at 
  BEFORE UPDATE ON categories 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 移除了默认分类数据的插入，因为会导致外键约束违反
-- 分类数据应该由用户在应用中创建
