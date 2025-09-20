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

-- 1.2 健康追踪表
CREATE TABLE IF NOT EXISTS health_tracks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  weight DECIMAL(5,2), -- 体重 (kg)
  height DECIMAL(5,2), -- 身高 (cm)
  blood_pressure_sys INTEGER, -- 收缩压
  blood_pressure_dia INTEGER, -- 舒张压
  heart_rate INTEGER, -- 心率
  steps INTEGER, -- 步数
  sleep_hours DECIMAL(4,2), -- 睡眠小时数
  water_intake DECIMAL(5,2), -- 饮水量 (升)
  notes TEXT, -- 备注
  tracked_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.3 用户个人资料表
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username VARCHAR(50) UNIQUE,
  full_name VARCHAR(100),
  avatar_url TEXT,
  website VARCHAR(255),
  bio TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.4 排班表
CREATE TABLE IF NOT EXISTS work_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shop_name VARCHAR(255) NOT NULL,
  work_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration DECIMAL(5,2),     -- 工作时长（小时）
  hourly_rate DECIMAL(10,2), -- 时薪
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.5 店铺时薪表
CREATE TABLE IF NOT EXISTS shop_hourly_rates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shop_name VARCHAR(255) NOT NULL,
  day_shift_rate DECIMAL(10,2) NOT NULL, -- 白班时薪（8:00-22:00）
  night_shift_rate DECIMAL(10,2) NOT NULL, -- 夜班时薪（22:00-8:00）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.6 条形码表
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

-- 1.7 电商表结构
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
CREATE INDEX IF NOT EXISTS idx_health_tracks_user_id ON health_tracks(user_id);
CREATE INDEX IF NOT EXISTS idx_health_tracks_tracked_date ON health_tracks(tracked_date);
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
ALTER TABLE health_tracks ENABLE ROW LEVEL SECURITY;
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

-- 3.2 健康追踪表策略
CREATE POLICY "用户只能查看自己的健康数据" ON health_tracks
  FOR ALL USING (auth.uid() = user_id);

-- 3.3 用户个人资料表策略
CREATE POLICY "用户可以查看所有公开资料" ON user_profiles
  FOR SELECT USING (true);
  
CREATE POLICY "用户只能更新自己的资料" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "用户只能插入自己的资料" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 3.4 排班表策略
CREATE POLICY "用户只能查看自己的排班" ON work_schedules
  FOR ALL USING (auth.uid() = user_id);

-- 3.5 店铺时薪表策略
CREATE POLICY "用户只能查看自己的店铺时薪" ON shop_hourly_rates
  FOR ALL USING (auth.uid() = user_id);

-- 3.6 条形码表策略
CREATE POLICY "用户可以查看自己的条形码" ON barcodes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可以插入自己的条形码" ON barcodes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的条形码" ON barcodes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的条形码" ON barcodes
  FOR DELETE USING (auth.uid() = user_id);

-- 3.7 商品表策略
CREATE POLICY "用户可以查看自己店铺的商品" ON products
  FOR SELECT USING (
    shop_id IS NULL OR 
    EXISTS (
      SELECT 1 FROM shop_hourly_rates 
      WHERE shop_hourly_rates.id = products.shop_id 
      AND shop_hourly_rates.user_id = auth.uid()
    )
  );

-- 3.8 购物车表策略
CREATE POLICY "用户只能查看自己的购物车" ON shopping_carts
  FOR ALL USING (auth.uid() = user_id);

-- 3.9 购物车项表策略
CREATE POLICY "用户只能查看自己购物车中的商品" ON cart_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM shopping_carts 
      WHERE shopping_carts.id = cart_items.cart_id 
      AND shopping_carts.user_id = auth.uid()
    )
  );

-- 3.10 订单表策略
CREATE POLICY "用户只能查看自己的订单" ON orders
  FOR ALL USING (auth.uid() = user_id);

-- 3.11 订单项表策略
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
CREATE TRIGGER IF NOT EXISTS update_todos_updated_at 
  BEFORE UPDATE ON todos 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_health_tracks_updated_at 
  BEFORE UPDATE ON health_tracks 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_work_schedules_updated_at 
  BEFORE UPDATE ON work_schedules 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_shop_hourly_rates_updated_at 
  BEFORE UPDATE ON shop_hourly_rates 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_barcodes_updated_at 
  BEFORE UPDATE ON barcodes 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_products_updated_at 
  BEFORE UPDATE ON products 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_shopping_carts_updated_at 
  BEFORE UPDATE ON shopping_carts 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_cart_items_updated_at 
  BEFORE UPDATE ON cart_items 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_orders_updated_at 
  BEFORE UPDATE ON orders 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_order_items_updated_at 
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
ALTER PUBLICATION supabase_realtime ADD TABLE health_tracks;
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

-- 创建排班
INSERT INTO work_schedules (user_id, shop_name, work_date, start_time, end_time)
VALUES ('用户ID', '便利店', '2025-09-20', '08:00:00', '16:00:00');

-- 创建店铺时薪设置
INSERT INTO shop_hourly_rates (user_id, shop_name, day_shift_rate, night_shift_rate)
VALUES ('用户ID', '便利店', 15.00, 20.00);

-- 创建条形码记录
INSERT INTO barcodes (user_id, barcode_value, barcode_type, product_name, product_price)
VALUES ('用户ID', '1234567890123', 'EAN-13', '示例产品', 29.99);

-- 9.2 查询操作 (Read)
-- 查询用户的所有待办事项
SELECT * FROM todos WHERE user_id = '用户ID' ORDER BY created_at DESC;

-- 查询用户的健康数据
SELECT * FROM health_tracks 
WHERE user_id = '用户ID' 
AND tracked_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY tracked_date DESC;

-- 查询用户的排班信息
SELECT * FROM work_schedules 
WHERE user_id = '用户ID' 
AND work_date >= CURRENT_DATE 
ORDER BY work_date;

-- 查询用户的店铺时薪设置
SELECT * FROM shop_hourly_rates 
WHERE user_id = '用户ID' 
ORDER BY shop_name;

-- 查询用户的条形码记录
SELECT * FROM barcodes 
WHERE user_id = '用户ID' 
ORDER BY scanned_at DESC;

-- 9.3 更新操作 (Update)
-- 更新待办事项状态
UPDATE todos 
SET completed = true, updated_at = NOW()
WHERE id = '待办事项ID' AND user_id = '用户ID';

-- 更新健康记录
UPDATE health_tracks 
SET weight = 69.8, steps = 10000
WHERE id = '健康记录ID' AND user_id = '用户ID';

-- 更新排班信息
UPDATE work_schedules 
SET end_time = '17:00:00', hourly_rate = 16.50
WHERE id = '排班ID' AND user_id = '用户ID';

-- 更新店铺时薪
UPDATE shop_hourly_rates 
SET day_shift_rate = 16.00, night_shift_rate = 22.00
WHERE id = '时薪设置ID' AND user_id = '用户ID';

-- 更新条形码信息
UPDATE barcodes 
SET product_name = '更新的产品名称', product_price = 39.99
WHERE id = '条形码ID' AND user_id = '用户ID';

-- 9.4 删除操作 (Delete)
-- 删除待办事项
DELETE FROM todos WHERE id = '待办事项ID' AND user_id = '用户ID';

-- 删除健康记录
DELETE FROM health_tracks WHERE id = '健康记录ID' AND user_id = '用户ID';

-- 删除排班信息
DELETE FROM work_schedules WHERE id = '排班ID' AND user_id = '用户ID';

-- 删除店铺时薪设置
DELETE FROM shop_hourly_rates WHERE id = '时薪设置ID' AND user_id = '用户ID';

-- 删除条形码记录
DELETE FROM barcodes WHERE id = '条形码ID' AND user_id = '用户ID';

-- 10. 实时监控查询示例
-- 订阅待办事项的实时更新
-- 在应用代码中使用:
-- const realtimeTodos = supabase
--   .from('todos')
--   .on('*', payload => {
--     console.log('待办事项变更:', payload)
--   })
--   .subscribe()

-- 订阅条形码记录的实时更新
-- const realtimeBarcodes = supabase
--   .from('barcodes')
--   .on('*', payload => {
--     console.log('条形码记录变更:', payload)
--   })
--   .subscribe()

-- 11. 聚合查询示例
-- 统计用户待办事项完成情况
SELECT 
  COUNT(*) as total_todos,
  COUNT(CASE WHEN completed = true THEN 1 END) as completed_todos,
  COUNT(CASE WHEN completed = false THEN 1 END) as pending_todos
FROM todos 
WHERE user_id = '用户ID';

-- 统计用户本周健康数据平均值
SELECT 
  AVG(weight) as avg_weight,
  AVG(steps) as avg_steps,
  AVG(sleep_hours) as avg_sleep_hours
FROM health_tracks 
WHERE user_id = '用户ID' 
AND tracked_date >= CURRENT_DATE - INTERVAL '7 days';

-- 统计用户月度工作时长和收入
SELECT 
  SUM(duration) as total_hours,
  SUM(duration * hourly_rate) as total_earnings
FROM work_schedules 
WHERE user_id = '用户ID' 
AND work_date >= DATE_TRUNC('month', CURRENT_DATE)
AND work_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';

-- 统计用户条形码记录数量
SELECT COUNT(*) as total_barcodes
FROM barcodes 
WHERE user_id = '用户ID';