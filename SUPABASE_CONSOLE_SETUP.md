# 在Supabase控制台中设置数据库表

本指南将帮助您在Supabase控制台中手动创建数据库表和策略。

## 1. 登录Supabase控制台

1. 访问 [Supabase官网](https://supabase.com/) 并登录
2. 选择您的项目

## 2. 访问SQL编辑器

1. 在左侧导航栏中点击 "Table Editor"
2. 点击 "SQL Editor" 标签

## 3. 创建数据库表

### 3.1 创建待办事项表 (todos)

```sql
-- 1. 待办事项表
CREATE TABLE todos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  priority INTEGER DEFAULT 1,
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 为待办事项表创建索引
CREATE INDEX idx_todos_user_id ON todos(user_id);
CREATE INDEX idx_todos_completed ON todos(completed);
CREATE INDEX idx_todos_due_date ON todos(due_date);

-- 启用行级安全策略
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- 创建行级安全策略
CREATE POLICY "用户只能查看自己的待办事项" ON todos
  FOR ALL USING (auth.uid() = user_id);

-- 创建触发器
CREATE TRIGGER update_todos_updated_at 
  BEFORE UPDATE ON todos 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
```

### 3.2 创建用户个人资料表 (user_profiles)

```sql
-- 2. 用户个人资料表
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

-- 启用行级安全策略
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 创建行级安全策略
CREATE POLICY "用户可以查看所有公开资料" ON user_profiles
  FOR SELECT USING (true);
  
CREATE POLICY "用户只能更新自己的资料" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "用户只能插入自己的资料" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 创建触发器
CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
```

### 3.3 创建工作排班表 (work_schedules)

```sql
-- 3. 排班表
CREATE TABLE work_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shop_name VARCHAR(255) NOT NULL,
  work_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_duration DECIMAL(3,1) DEFAULT 0.0,  -- 休息时长（小时）
  duration DECIMAL(5,2),
  hourly_rate DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 为排班表创建索引
CREATE INDEX idx_work_schedules_user_id ON work_schedules(user_id);
CREATE INDEX idx_work_schedules_work_date ON work_schedules(work_date);

-- 启用行级安全策略
ALTER TABLE work_schedules ENABLE ROW LEVEL SECURITY;

-- 创建行级安全策略
CREATE POLICY "用户只能查看自己的排班" ON work_schedules
  FOR ALL USING (auth.uid() = user_id);

-- 创建触发器
CREATE TRIGGER update_work_schedules_updated_at 
  BEFORE UPDATE ON work_schedules 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
```

### 3.4 创建店铺时薪表 (shop_hourly_rates)

```sql
-- 4. 店铺时薪表
CREATE TABLE shop_hourly_rates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shop_name VARCHAR(255) NOT NULL,
  day_shift_rate DECIMAL(10,2) DEFAULT 0.00,  -- 白班时薪（8:00-22:00）
  night_shift_rate DECIMAL(10,2) DEFAULT 0.00,  -- 夜班时薪（22:00-8:00）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 为店铺时薪表创建索引
CREATE INDEX idx_shop_hourly_rates_user_id ON shop_hourly_rates(user_id);
CREATE INDEX idx_shop_hourly_rates_shop_name ON shop_hourly_rates(shop_name);

-- 启用行级安全策略
ALTER TABLE shop_hourly_rates ENABLE ROW LEVEL SECURITY;

-- 创建行级安全策略
CREATE POLICY "用户只能查看自己的店铺时薪" ON shop_hourly_rates
  FOR ALL USING (auth.uid() = user_id);

-- 创建触发器
CREATE TRIGGER update_shop_hourly_rates_updated_at 
  BEFORE UPDATE ON shop_hourly_rates 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
```

### 3.5 创建必要的函数和触发器

```sql
-- 创建自动更新updated_at字段的函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

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
```

## 4. 执行SQL脚本

1. 将上述SQL代码复制到SQL编辑器中
2. 点击 "RUN" 按钮执行
3. 确认所有表和策略都已正确创建

## 5. 验证设置

1. 返回 "Table Editor" 查看创建的表
2. 检查每个表的结构和索引
3. 验证RLS策略是否已应用
4. 测试数据插入和查询功能

## 6. 后续步骤

1. 配置应用连接到Supabase数据库
2. 更新前端代码以使用新的数据库结构
3. 测试所有功能确保正常工作