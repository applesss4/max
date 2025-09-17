-- 为products表添加完整的RLS策略

-- 首先删除现有的策略（如果存在）
DROP POLICY IF EXISTS "用户可以添加自己店铺的商品" ON products;
DROP POLICY IF EXISTS "用户可以更新自己店铺的商品" ON products;
DROP POLICY IF EXISTS "用户可以删除自己店铺的商品" ON products;

-- 添加INSERT策略，允许用户向自己的店铺添加商品
CREATE POLICY "用户可以添加自己店铺的商品" ON products
  FOR INSERT WITH CHECK (
    shop_id IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM shops 
      WHERE shops.id = products.shop_id 
      AND shops.user_id = auth.uid()
    )
  );

-- 添加UPDATE策略，允许用户更新自己店铺的商品
CREATE POLICY "用户可以更新自己店铺的商品" ON products
  FOR UPDATE USING (
    shop_id IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM shops 
      WHERE shops.id = products.shop_id 
      AND shops.user_id = auth.uid()
    )
  );

-- 添加DELETE策略，允许用户删除自己店铺的商品
CREATE POLICY "用户可以删除自己店铺的商品" ON products
  FOR DELETE USING (
    shop_id IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM shops 
      WHERE shops.id = products.shop_id 
      AND shops.user_id = auth.uid()
    )
  );