-- 专门修复购物车创建问题的脚本

-- 1. 确保更新时间戳函数存在
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. 删除并重新创建购物车表（如果结构有问题）
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS shopping_carts;

-- 重新创建购物车表
CREATE TABLE shopping_carts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 重新创建购物车项表
CREATE TABLE cart_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cart_id UUID REFERENCES shopping_carts(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(cart_id, product_id)
);

-- 3. 为购物车表启用RLS
ALTER TABLE shopping_carts ENABLE ROW LEVEL SECURITY;

-- 4. 删除已存在的购物车RLS策略
DROP POLICY IF EXISTS "用户只能查看自己的购物车" ON shopping_carts;
DROP POLICY IF EXISTS "用户只能查看自己购物车中的商品" ON cart_items;

-- 5. 重新创建购物车RLS策略
-- 用户只能查看自己的购物车
CREATE POLICY "用户只能查看自己的购物车" ON shopping_carts
  FOR ALL USING (auth.uid() = user_id);

-- 用户只能查看自己购物车中的商品
CREATE POLICY "用户只能查看自己购物车中的商品" ON cart_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM shopping_carts 
      WHERE shopping_carts.id = cart_items.cart_id 
      AND shopping_carts.user_id = auth.uid()
    )
  );

-- 6. 创建触发器
DROP TRIGGER IF EXISTS update_shopping_carts_updated_at ON shopping_carts;
DROP TRIGGER IF EXISTS update_cart_items_updated_at ON cart_items;

CREATE TRIGGER update_shopping_carts_updated_at 
  BEFORE UPDATE ON shopping_carts 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at 
  BEFORE UPDATE ON cart_items 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 7. 创建索引
CREATE INDEX IF NOT EXISTS idx_shopping_carts_user_id ON shopping_carts(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);

-- 8. 测试插入数据
-- 这个语句应该能成功执行，如果失败则说明还有问题
INSERT INTO shopping_carts (user_id) 
VALUES ('8ec8cc4c-b5cf-4794-bc22-3446a07a3fec')
ON CONFLICT (user_id) DO NOTHING;

-- 9. 验证数据插入
SELECT * FROM shopping_carts WHERE user_id = '8ec8cc4c-b5cf-4794-bc22-3446a07a3fec';