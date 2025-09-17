-- 为商品表添加超市ID字段
ALTER TABLE products 
ADD COLUMN shop_id UUID REFERENCES shop_hourly_rates(id) ON DELETE SET NULL;

-- 为超市ID字段创建索引
CREATE INDEX idx_products_shop_id ON products(shop_id);

-- 更新商品表的行级安全策略，允许用户查看自己店铺的商品
-- 注意：这需要根据实际业务需求调整
DROP POLICY IF EXISTS "所有人都可以查看商品" ON products;
CREATE POLICY "用户可以查看自己店铺的商品" ON products
  FOR SELECT USING (
    shop_id IS NULL OR 
    EXISTS (
      SELECT 1 FROM shop_hourly_rates 
      WHERE shop_hourly_rates.id = products.shop_id 
      AND shop_hourly_rates.user_id = auth.uid()
    )
  );

-- 为已有的商品数据设置默认shop_id（如果有且仅有一个店铺）
-- 这个操作需要根据实际业务需求来决定是否执行