-- 创建商品表
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  image_url TEXT,
  stock_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建购物车表
CREATE TABLE shopping_carts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 创建购物车项表
CREATE TABLE cart_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cart_id UUID REFERENCES shopping_carts(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(cart_id, product_id)
);

-- 创建订单表
CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, paid, shipped, completed, cancelled
  shipping_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建订单项表
CREATE TABLE order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL, -- 下单时的价格
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 为各表创建索引
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_shopping_carts_user_id ON shopping_carts(user_id);
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- 启用行级安全策略 (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 创建行级安全策略
CREATE POLICY "用户只能查看自己的购物车" ON shopping_carts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "用户只能查看自己购物车中的商品" ON cart_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM shopping_carts 
      WHERE shopping_carts.id = cart_items.cart_id 
      AND shopping_carts.user_id = auth.uid()
    )
  );

CREATE POLICY "用户只能查看自己的订单" ON orders
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "用户只能查看自己订单中的商品" ON order_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- 商品表允许所有人查看（在真实应用中可能需要根据业务需求调整）
CREATE POLICY "所有人都可以查看商品" ON products
  FOR SELECT USING (true);

-- 创建自动更新updated_at字段的触发器
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

-- 插入一些示例商品数据
INSERT INTO products (name, description, price, category, image_url, stock_quantity) VALUES
('苹果', '新鲜红富士苹果，营养丰富', 5.50, '食品饮料', 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=200', 100),
('牛奶', '优质纯牛奶，富含钙质', 12.80, '食品饮料', 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=200', 50),
('洗发水', '深层清洁去屑洗发水', 29.90, '个人护理', 'https://images.unsplash.com/photo-1561948955-5d3d4f7a3b3d?w=200', 30),
('洗衣液', '高效去污洗衣液', 25.00, '清洁用品', 'https://images.unsplash.com/photo-1561948955-5d3d4f7a3b3d?w=200', 40),
('面包', '全麦营养面包', 8.50, '食品饮料', 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=200', 20);

-- 创建订单的存储过程
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