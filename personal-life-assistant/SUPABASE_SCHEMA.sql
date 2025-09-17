-- Supabase数据库表结构
-- 个人生活管家应用

-- 1. 待办事项表
CREATE TABLE todos (
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

-- 为待办事项表创建索引
CREATE INDEX idx_todos_user_id ON todos(user_id);
CREATE INDEX idx_todos_completed ON todos(completed);
CREATE INDEX idx_todos_due_date ON todos(due_date);

-- 2. 日程安排表
CREATE TABLE schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 确保结束时间在开始时间之后
  CONSTRAINT check_schedule_time CHECK (end_time > start_time)
);

-- 为日程安排表创建索引
CREATE INDEX idx_schedules_user_id ON schedules(user_id);
CREATE INDEX idx_schedules_start_time ON schedules(start_time);

-- 3. 健康追踪表
CREATE TABLE health_tracks (
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

-- 为健康追踪表创建索引
CREATE INDEX idx_health_tracks_user_id ON health_tracks(user_id);
CREATE INDEX idx_health_tracks_tracked_date ON health_tracks(tracked_date);

-- 4. 用户个人资料表
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username VARCHAR(50) UNIQUE,
  full_name VARCHAR(100),
  avatar_url TEXT,
  website VARCHAR(255),
  bio TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 为用户个人资料表创建索引
CREATE INDEX idx_user_profiles_username ON user_profiles(username);

-- 启用行级安全策略 (RLS)
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 创建行级安全策略
-- 待办事项表策略
CREATE POLICY "用户只能查看自己的待办事项" ON todos
  FOR ALL USING (auth.uid() = user_id);

-- 日程安排表策略
CREATE POLICY "用户只能查看自己的日程安排" ON schedules
  FOR ALL USING (auth.uid() = user_id);

-- 健康追踪表策略
CREATE POLICY "用户只能查看自己的健康数据" ON health_tracks
  FOR ALL USING (auth.uid() = user_id);

-- 用户个人资料表策略
CREATE POLICY "用户可以查看所有公开资料" ON user_profiles
  FOR SELECT USING (true);
  
CREATE POLICY "用户只能更新自己的资料" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "用户只能插入自己的资料" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 创建自动更新updated_at字段的函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- 为表创建触发器
CREATE TRIGGER update_todos_updated_at 
  BEFORE UPDATE ON todos 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at 
  BEFORE UPDATE ON schedules 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_tracks_updated_at 
  BEFORE UPDATE ON health_tracks 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 创建存储过程来处理新用户注册时的个人资料创建
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, username, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器来自动处理新用户注册
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. 排班表
CREATE TABLE work_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shop_name VARCHAR(255) NOT NULL,
  work_date DATE NOT NULL,  -- 修复：使用DATE类型而不是TIMESTAMP
  start_time TIME NOT NULL,  -- 修复：使用TIME类型
  end_time TIME NOT NULL,    -- 修复：使用TIME类型
  break_duration DECIMAL(3,1) DEFAULT 0.0,  -- 休息时长（小时）
  duration DECIMAL(5,2),     -- 工作时长（小时）
  hourly_rate DECIMAL(10,2), -- 时薪
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 为排班表创建索引
CREATE INDEX idx_work_schedules_user_id ON work_schedules(user_id);
CREATE INDEX idx_work_schedules_work_date ON work_schedules(work_date);

-- 排班表策略
CREATE POLICY "用户只能查看自己的排班" ON work_schedules
  FOR ALL USING (auth.uid() = user_id);

-- 启用排班表的行级安全策略
ALTER TABLE work_schedules ENABLE ROW LEVEL SECURITY;

-- 创建触发器
CREATE TRIGGER update_work_schedules_updated_at 
  BEFORE UPDATE ON work_schedules 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 6. 店铺时薪表
CREATE TABLE shop_hourly_rates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shop_name VARCHAR(255) NOT NULL,
  day_shift_rate DECIMAL(10,2) DEFAULT 0.00, -- 白班时薪（8:00-22:00）
  night_shift_rate DECIMAL(10,2) DEFAULT 0.00, -- 夜班时薪（22:00-8:00）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 为店铺时薪表创建索引
CREATE INDEX idx_shop_hourly_rates_user_id ON shop_hourly_rates(user_id);
CREATE INDEX idx_shop_hourly_rates_shop_name ON shop_hourly_rates(shop_name);

-- 店铺时薪表策略
CREATE POLICY "用户只能查看自己的店铺时薪" ON shop_hourly_rates
  FOR ALL USING (auth.uid() = user_id);

-- 启用店铺时薪表的行级安全策略
ALTER TABLE shop_hourly_rates ENABLE ROW LEVEL SECURITY;

-- 创建触发器
CREATE TRIGGER update_shop_hourly_rates_updated_at 
  BEFORE UPDATE ON shop_hourly_rates 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 7. 电商表结构
-- 商品表
CREATE TABLE products (
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

-- 为商品表创建索引
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_shop_id ON products(shop_id);

-- 商品表策略
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

-- 启用商品表的行级安全策略
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 购物车表
CREATE TABLE shopping_carts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 为购物车表创建索引
CREATE INDEX idx_shopping_carts_user_id ON shopping_carts(user_id);

-- 购物车表策略
CREATE POLICY "用户只能查看自己的购物车" ON shopping_carts
  FOR ALL USING (auth.uid() = user_id);

-- 启用购物车表的行级安全策略
ALTER TABLE shopping_carts ENABLE ROW LEVEL SECURITY;

-- 购物车商品表
CREATE TABLE cart_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cart_id UUID REFERENCES shopping_carts(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 为购物车商品表创建索引
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);

-- 购物车商品表策略
CREATE POLICY "用户只能查看自己的购物车商品" ON cart_items
  FOR ALL USING (auth.uid() = (SELECT user_id FROM shopping_carts WHERE id = cart_items.cart_id));

-- 启用购物车商品表的行级安全策略
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
