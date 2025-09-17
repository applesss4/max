-- 创建独立的超市表用于电商功能
CREATE TABLE IF NOT EXISTS shops (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 为shops表创建索引
CREATE INDEX idx_shops_user_id ON shops(user_id);

-- 为shops表启用行级安全
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;

-- shops表的行级安全策略
CREATE POLICY "用户只能查看自己的超市" ON shops
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "用户只能创建自己的超市" ON shops
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "用户只能更新自己的超市" ON shops
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "用户只能删除自己的超市" ON shops
  FOR DELETE USING (user_id = auth.uid());

-- 更新商品表，使其关联到新的shops表而不是shop_hourly_rates表
ALTER TABLE products 
DROP CONSTRAINT IF EXISTS products_shop_id_fkey;

ALTER TABLE products 
ADD CONSTRAINT products_shop_id_fkey 
FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE SET NULL;

-- 更新商品表的行级安全策略
DROP POLICY IF EXISTS "用户可以查看自己店铺的商品" ON products;
CREATE POLICY "用户可以查看自己店铺的商品" ON products
  FOR SELECT USING (
    shop_id IS NULL OR 
    EXISTS (
      SELECT 1 FROM shops 
      WHERE shops.id = products.shop_id 
      AND shops.user_id = auth.uid()
    )
  );