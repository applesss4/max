-- 修复电商表的RLS策略和触发器配置

-- 1. 确保更新时间戳函数存在
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. 为电商表启用RLS（如果尚未启用）
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 3. 删除已存在的电商表RLS策略（避免冲突）
DROP POLICY IF EXISTS "用户只能查看自己的购物车" ON shopping_carts;
DROP POLICY IF EXISTS "用户只能查看自己购物车中的商品" ON cart_items;
DROP POLICY IF EXISTS "用户只能查看自己的订单" ON orders;
DROP POLICY IF EXISTS "用户只能查看自己订单中的商品" ON order_items;
DROP POLICY IF EXISTS "所有人都可以查看商品" ON products;

-- 4. 重新创建RLS策略
-- 购物车表策略
CREATE POLICY "用户只能查看自己的购物车" ON shopping_carts
  FOR ALL USING (auth.uid() = user_id);

-- 购物车项表策略
CREATE POLICY "用户只能查看自己购物车中的商品" ON cart_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM shopping_carts 
      WHERE shopping_carts.id = cart_items.cart_id 
      AND shopping_carts.user_id = auth.uid()
    )
  );

-- 订单表策略
CREATE POLICY "用户只能查看自己的订单" ON orders
  FOR ALL USING (auth.uid() = user_id);

-- 订单项表策略
CREATE POLICY "用户只能查看自己订单中的商品" ON order_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- 商品表允许所有人查看
CREATE POLICY "所有人都可以查看商品" ON products
  FOR SELECT USING (true);

-- 5. 删除已存在的触发器（避免冲突）
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
DROP TRIGGER IF EXISTS update_shopping_carts_updated_at ON shopping_carts;
DROP TRIGGER IF EXISTS update_cart_items_updated_at ON cart_items;
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
DROP TRIGGER IF EXISTS update_order_items_updated_at ON order_items;

-- 6. 重新创建触发器
CREATE TRIGGER update_products_updated_at 
  BEFORE UPDATE ON products 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shopping_carts_updated_at 
  BEFORE UPDATE ON shopping_carts 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at 
  BEFORE UPDATE ON cart_items 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at 
  BEFORE UPDATE ON orders 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_items_updated_at 
  BEFORE UPDATE ON order_items 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 7. 修复购物车表的唯一约束（如果需要）
ALTER TABLE shopping_carts
DROP CONSTRAINT IF EXISTS shopping_carts_user_id_key,
ADD CONSTRAINT shopping_carts_user_id_key UNIQUE (user_id);

-- 8. 修复购物车项表的唯一约束（如果需要）
ALTER TABLE cart_items
DROP CONSTRAINT IF EXISTS cart_items_cart_id_product_id_key,
ADD CONSTRAINT cart_items_cart_id_product_id_key UNIQUE (cart_id, product_id);

-- 9. 检查并修复外键约束
ALTER TABLE shopping_carts
DROP CONSTRAINT IF EXISTS shopping_carts_user_id_fkey,
ADD CONSTRAINT shopping_carts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE cart_items
DROP CONSTRAINT IF EXISTS cart_items_cart_id_fkey,
ADD CONSTRAINT cart_items_cart_id_fkey 
FOREIGN KEY (cart_id) REFERENCES shopping_carts(id) ON DELETE CASCADE;

ALTER TABLE cart_items
DROP CONSTRAINT IF EXISTS cart_items_product_id_fkey,
ADD CONSTRAINT cart_items_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE orders
DROP CONSTRAINT IF EXISTS orders_user_id_fkey,
ADD CONSTRAINT orders_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE order_items
DROP CONSTRAINT IF EXISTS order_items_order_id_fkey,
ADD CONSTRAINT order_items_order_id_fkey 
FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

ALTER TABLE order_items
DROP CONSTRAINT IF EXISTS order_items_product_id_fkey,
ADD CONSTRAINT order_items_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- 10. 确保索引存在
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_shopping_carts_user_id ON shopping_carts(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- 11. 重新创建订单存储过程（如果不存在）
CREATE OR REPLACE FUNCTION create_order_with_items(
  user_id UUID,
  shipping_address TEXT,
  total_amount DECIMAL(10,2)
)
RETURNS orders AS $$
DECLARE
  new_order orders;
  cart_record RECORD;
BEGIN
  -- 创建订单
  INSERT INTO orders (user_id, total_amount, shipping_address, status)
  VALUES (user_id, total_amount, shipping_address, 'pending')
  RETURNING * INTO new_order;
  
  -- 获取购物车ID
  SELECT id INTO cart_record FROM shopping_carts WHERE shopping_carts.user_id = create_order_with_items.user_id;
  
  -- 将购物车项复制到订单项
  INSERT INTO order_items (order_id, product_id, quantity, price)
  SELECT new_order.id, cart_items.product_id, cart_items.quantity, products.price
  FROM cart_items
  JOIN products ON cart_items.product_id = products.id
  WHERE cart_items.cart_id = cart_record.id;
  
  -- 返回新创建的订单
  RETURN new_order;
END;
$$ LANGUAGE plpgsql;