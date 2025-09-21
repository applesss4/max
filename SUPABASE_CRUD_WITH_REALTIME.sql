-- Supabase数据库完整CRUD操作和实时监控配置脚本
-- 个人生活管家应用

-- 1. 创建所有核心表
-- 1.1 待办事项表
CREATE TABLE IF NOT EXISTS todos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  priority INTEGER DEFAULT 1, -- 1:低, 2:中, 3:高
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.2 用户个人资料表
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username VARCHAR(50) UNIQUE,
  full_name VARCHAR(100),
  avatar_url TEXT,
  website VARCHAR(255),
  bio TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.3 排班表
CREATE TABLE IF NOT EXISTS work_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shop_name VARCHAR(255) NOT NULL,
  work_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_duration DECIMAL(3,1) DEFAULT 0.0,  -- 休息时长（小时）
  duration DECIMAL(5,2),     -- 工作时长（小时）
  hourly_rate DECIMAL(10,2), -- 时薪
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.4 店铺时薪表
CREATE TABLE IF NOT EXISTS shop_hourly_rates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shop_name VARCHAR(255) NOT NULL,
  day_shift_rate DECIMAL(10,2) NOT NULL, -- 白班时薪（8:00-22:00）
  night_shift_rate DECIMAL(10,2) NOT NULL, -- 夜班时薪（22:00-8:00）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.5 条形码表
CREATE TABLE IF NOT EXISTS barcodes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  barcode_value VARCHAR(255) NOT NULL, -- 条形码值
  barcode_type VARCHAR(50) NOT NULL, -- 条形码类型 (如: EAN-13, QR Code等)
  product_name VARCHAR(255), -- 产品名称
  product_description TEXT, -- 产品描述
  product_price DECIMAL(10,2), -- 产品价格
  product_category VARCHAR(100), -- 产品分类
  product_image_url TEXT, -- 产品图片URL
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- 扫描时间
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.6 电商表结构
-- 商品表
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  image_url TEXT,
  stock_quantity INTEGER DEFAULT 0,
  shop_id UUID REFERENCES shop_hourly_rates(id) ON DELETE SET NULL, -- 超市ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 购物车表
CREATE TABLE IF NOT EXISTS shopping_carts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 购物车项表
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cart_id UUID REFERENCES shopping_carts(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(cart_id, product_id)
);

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, paid, shipped, completed, cancelled
  shipping_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 订单项表
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL, -- 下单时的价格
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 为各表创建索引
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(completed);
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_work_schedules_user_id ON work_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_work_schedules_work_date ON work_schedules(work_date);
CREATE INDEX IF NOT EXISTS idx_shop_hourly_rates_user_id ON shop_hourly_rates(user_id);
CREATE INDEX IF NOT EXISTS idx_shop_hourly_rates_shop_name ON shop_hourly_rates(shop_name);
CREATE INDEX IF NOT EXISTS idx_barcodes_user_id ON barcodes(user_id);
CREATE INDEX IF NOT EXISTS idx_barcodes_barcode_value ON barcodes(barcode_value);
CREATE INDEX IF NOT EXISTS idx_barcodes_scanned_at ON barcodes(scanned_at);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_shop_id ON products(shop_id);
CREATE INDEX IF NOT EXISTS idx_shopping_carts_user_id ON shopping_carts(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- 2. 启用行级安全策略 (RLS)
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_hourly_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE barcodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 3. 创建行级安全策略
-- 3.1 待办事项表策略
CREATE POLICY "用户只能查看自己的待办事项" ON todos
  FOR ALL USING (auth.uid() = user_id);

-- 3.2 用户个人资料表策略
CREATE POLICY "用户可以查看所有公开资料" ON user_profiles
  FOR SELECT USING (true);
  
CREATE POLICY "用户只能更新自己的资料" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "用户只能插入自己的资料" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 3.3 排班表策略
CREATE POLICY "用户只能查看自己的排班" ON work_schedules
  FOR ALL USING (auth.uid() = user_id);

-- 3.4 店铺时薪表策略
CREATE POLICY "用户只能查看自己的店铺时薪" ON shop_hourly_rates
  FOR ALL USING (auth.uid() = user_id);

-- 3.5 条形码表策略
CREATE POLICY "用户只能查看自己的条形码" ON barcodes
  FOR ALL USING (auth.uid() = user_id);

-- 3.6 商品表策略
CREATE POLICY "用户可以查看自己店铺的商品" ON products
  FOR SELECT USING (
    shop_id IS NULL OR 
    EXISTS (
      SELECT 1 FROM shop_hourly_rates 
      WHERE shop_hourly_rates.id = products.shop_id 
      AND shop_hourly_rates.user_id = auth.uid()
    )
  );

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

-- 3.7 购物车表策略
CREATE POLICY "用户只能查看自己的购物车" ON shopping_carts
  FOR ALL USING (auth.uid() = user_id);

-- 3.8 购物车项表策略
CREATE POLICY "用户只能查看自己购物车中的商品" ON cart_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM shopping_carts 
      WHERE shopping_carts.id = cart_items.cart_id 
      AND shopping_carts.user_id = auth.uid()
    )
  );

-- 3.9 订单表策略
CREATE POLICY "用户只能查看自己的订单" ON orders
  FOR ALL USING (auth.uid() = user_id);

-- 3.10 订单项表策略
CREATE POLICY "用户只能查看自己订单中的商品" ON order_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- 4. 创建自动更新updated_at字段的函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. 为表创建触发器
CREATE TRIGGER update_todos_updated_at 
  BEFORE UPDATE ON todos 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_schedules_updated_at 
  BEFORE UPDATE ON work_schedules 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shop_hourly_rates_updated_at 
  BEFORE UPDATE ON shop_hourly_rates 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_barcodes_updated_at 
  BEFORE UPDATE ON barcodes 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

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

-- 6. 创建存储过程来处理新用户注册时的个人资料创建
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, username, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 创建触发器来自动处理新用户注册
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. 启用实时监控功能
-- 为所有表启用实时订阅
ALTER PUBLICATION supabase_realtime ADD TABLE todos;
ALTER PUBLICATION supabase_realtime ADD TABLE user_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE work_schedules;
ALTER PUBLICATION supabase_realtime ADD TABLE shop_hourly_rates;
ALTER PUBLICATION supabase_realtime ADD TABLE barcodes;
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE shopping_carts;
ALTER PUBLICATION supabase_realtime ADD TABLE cart_items;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;

-- 9. CRUD操作示例
-- 9.1 创建操作 (Create)
-- 创建待办事项
INSERT INTO todos (user_id, title, description, priority, due_date)
VALUES ('用户ID', '完成项目报告', '编写并提交季度项目报告', 2, '2025-09-30');

-- 创建健康记录
INSERT INTO health_tracks (user_id, weight, height, steps, tracked_date)
VALUES ('用户ID', 70.5, 175.0, 8000, '2025-09-20');

-- 9.2 读取操作 (Read)
-- 获取用户的所有待办事项
SELECT * FROM todos WHERE user_id = '用户ID' ORDER BY created_at DESC;

-- 获取用户最近的健康记录
SELECT * FROM health_tracks WHERE user_id = '用户ID' ORDER BY tracked_date DESC LIMIT 10;

-- 9.3 更新操作 (Update)
-- 更新待办事项状态
UPDATE todos 
SET completed = true, updated_at = NOW() 
WHERE id = '待办事项ID' AND user_id = '用户ID';

-- 更新健康记录
UPDATE health_tracks 
SET weight = 69.8, updated_at = NOW() 
WHERE id = '健康记录ID' AND user_id = '用户ID';

-- 9.4 删除操作 (Delete)
-- 删除待办事项
DELETE FROM todos WHERE id = '待办事项ID' AND user_id = '用户ID';

-- 删除健康记录
DELETE FROM health_tracks WHERE id = '健康记录ID' AND user_id = '用户ID';

-- 10. 实时监控示例
-- 在应用中监听待办事项表的实时变化
-- const todosSubscription = supabase
--   .from('todos')
--   .on('*', payload => {
--     console.log('待办事项变化:', payload);
--   })
--   .subscribe();

-- 11. 数据验证和约束
-- 为排班表添加时间约束
ALTER TABLE work_schedules 
ADD CONSTRAINT check_work_schedule_time 
CHECK (end_time > start_time);

-- 为店铺时薪表添加非负约束
ALTER TABLE shop_hourly_rates 
ADD CONSTRAINT check_day_shift_rate_positive 
CHECK (day_shift_rate >= 0);

ALTER TABLE shop_hourly_rates 
ADD CONSTRAINT check_night_shift_rate_positive 
CHECK (night_shift_rate >= 0);

-- 12. 性能优化建议
-- 创建复合索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_todos_user_completed ON todos(user_id, completed);
CREATE INDEX IF NOT EXISTS idx_work_schedules_user_date ON work_schedules(user_id, work_date);

-- 13. 数据清理和维护
-- 定期清理过期数据的示例函数
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
  -- 删除30天前的已完成待办事项
  DELETE FROM todos 
  WHERE completed = true 
  AND updated_at < NOW() - INTERVAL '30 days';
  
  -- 删除90天前的健康记录（可选）
  -- DELETE FROM health_tracks 
  -- WHERE updated_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- 14. 备份和恢复
-- 导出数据的示例命令（在终端中运行）
-- pg_dump -h your-host -U your-user -d your-database -t todos > todos_backup.sql

-- 15. 故障排除
-- 检查RLS策略是否正确应用
-- SELECT * FROM pg_policy WHERE polname LIKE '%用户%';

-- 查看表的RLS状态
-- SELECT tablename, relrowsecurity FROM pg_class c JOIN pg_namespace n ON c.relnamespace = n.oid WHERE n.nspname = 'public';