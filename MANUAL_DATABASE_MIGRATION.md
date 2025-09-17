# 手动数据库迁移指南

本指南说明如何手动迁移个人生活管家应用到Supabase数据库，包括完整的CRUD操作和实时监控功能配置。

## 迁移概述

应用原先使用浏览器的LocalStorage来存储排班数据，现已迁移到Supabase数据库以提供更好的数据持久性和跨设备同步能力。

## 数据库表结构创建

### 1. todos (待办事项表)
```sql
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
```

### 2. health_tracks (健康追踪表)
```sql
CREATE TABLE health_tracks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  weight DECIMAL(5,2),
  height DECIMAL(5,2),
  blood_pressure_sys INTEGER,
  blood_pressure_dia INTEGER,
  heart_rate INTEGER,
  steps INTEGER,
  sleep_hours DECIMAL(4,2),
  water_intake DECIMAL(5,2),
  notes TEXT,
  tracked_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. user_profiles (用户个人资料表)
```sql
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username VARCHAR(50) UNIQUE,
  full_name VARCHAR(100),
  avatar_url TEXT,
  website VARCHAR(255),
  bio TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. work_schedules (排班表)
```sql
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
```

### 5. shop_hourly_rates (店铺时薪表)
```sql
CREATE TABLE shop_hourly_rates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shop_name VARCHAR(255) NOT NULL,
  day_shift_rate DECIMAL(10,2) DEFAULT 0.00,  -- 白班时薪（8:00-22:00）
  night_shift_rate DECIMAL(10,2) DEFAULT 0.00,  -- 夜班时薪（22:00-8:00）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 索引创建

为提高查询性能，需要为各表创建适当的索引：

```sql
-- 待办事项表索引
CREATE INDEX idx_todos_user_id ON todos(user_id);
CREATE INDEX idx_todos_completed ON todos(completed);
CREATE INDEX idx_todos_due_date ON todos(due_date);

-- 健康追踪表索引
CREATE INDEX idx_health_tracks_user_id ON health_tracks(user_id);
CREATE INDEX idx_health_tracks_tracked_date ON health_tracks(tracked_date);

-- 用户个人资料表索引
CREATE INDEX idx_user_profiles_username ON user_profiles(username);

-- 排班表索引
CREATE INDEX idx_work_schedules_user_id ON work_schedules(user_id);
CREATE INDEX idx_work_schedules_work_date ON work_schedules(work_date);

-- 店铺时薪表索引
CREATE INDEX idx_shop_hourly_rates_user_id ON shop_hourly_rates(user_id);
CREATE INDEX idx_shop_hourly_rates_shop_name ON shop_hourly_rates(shop_name);
```

## 行级安全策略(RLS)配置

为确保数据安全，需要为所有表启用行级安全策略：

```sql
-- 启用RLS
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_hourly_rates ENABLE ROW LEVEL SECURITY;

-- 创建策略
-- 待办事项表策略
CREATE POLICY "用户只能查看自己的待办事项" ON todos
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

-- 排班表策略
CREATE POLICY "用户只能查看自己的排班" ON work_schedules
  FOR ALL USING (auth.uid() = user_id);

-- 店铺时薪表策略
CREATE POLICY "用户只能查看自己的店铺时薪" ON shop_hourly_rates
  FOR ALL USING (auth.uid() = user_id);
```

## 触发器和函数配置

创建自动更新updated_at字段的函数和触发器：

```sql
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

CREATE TRIGGER update_health_tracks_updated_at 
  BEFORE UPDATE ON health_tracks 
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

## 实时监控配置

为启用Supabase的实时监控功能，需要将表添加到实时发布中：

```sql
-- 启用实时监控功能
ALTER PUBLICATION supabase_realtime ADD TABLE todos;
ALTER PUBLICATION supabase_realtime ADD TABLE health_tracks;
ALTER PUBLICATION supabase_realtime ADD TABLE user_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE work_schedules;
ALTER PUBLICATION supabase_realtime ADD TABLE shop_hourly_rates;
```

## CRUD操作示例

### 创建操作 (Create)
```sql
-- 创建待办事项
INSERT INTO todos (user_id, title, description, priority, due_date)
VALUES ('用户ID', '完成项目报告', '编写并提交季度项目报告', 2, '2025-09-30');

-- 创建健康记录
INSERT INTO health_tracks (user_id, weight, height, steps, tracked_date)
VALUES ('用户ID', 70.5, 175.0, 8000, '2025-09-20');

-- 创建排班
INSERT INTO work_schedules (user_id, shop_name, work_date, start_time, end_time, break_duration)
VALUES ('用户ID', '便利店', '2025-09-20', '08:00:00', '16:00:00', 0.5);

-- 创建店铺时薪设置
INSERT INTO shop_hourly_rates (user_id, shop_name, day_shift_rate, night_shift_rate)
VALUES ('用户ID', '便利店', 15.00, 20.00);
```

### 查询操作 (Read)
```sql
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
```

### 更新操作 (Update)
```sql
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
SET end_time = '17:00:00', break_duration = 1.0
WHERE id = '排班ID' AND user_id = '用户ID';

-- 更新店铺时薪
UPDATE shop_hourly_rates 
SET day_shift_rate = 16.00, night_shift_rate = 22.00
WHERE id = '时薪设置ID' AND user_id = '用户ID';
```

### 删除操作 (Delete)
```sql
-- 删除待办事项
DELETE FROM todos WHERE id = '待办事项ID' AND user_id = '用户ID';

-- 删除健康记录
DELETE FROM health_tracks WHERE id = '健康记录ID' AND user_id = '用户ID';

-- 删除排班信息
DELETE FROM work_schedules WHERE id = '排班ID' AND user_id = '用户ID';

-- 删除店铺时薪设置
DELETE FROM shop_hourly_rates WHERE id = '时薪设置ID' AND user_id = '用户ID';
```

## 实时监控使用说明

在前端应用中使用Supabase JavaScript客户端订阅表变更:

```javascript
// 订阅待办事项的实时更新
const realtimeTodos = supabase
  .from('todos')
  .on('*', payload => {
    console.log('待办事项变更:', payload)
  })
  .subscribe()

// 订阅排班信息的实时更新
const realtimeSchedules = supabase
  .from('work_schedules')
  .on('*', payload => {
    console.log('排班信息变更:', payload)
  })
  .subscribe()

// 可以监听特定事件类型:
// - INSERT: .on('INSERT', handler)
// - UPDATE: .on('UPDATE', handler)
// - DELETE: .on('DELETE', handler)
// - ALL: .on('*', handler)

// 实时监控支持过滤条件:
const subscription = supabase
  .from('todos')
  .eq('user_id', userId)
  .on('*', payload => {
    console.log('我的待办事项变更:', payload)
  })
  .subscribe()

// 记得在组件卸载时取消订阅以避免内存泄漏:
supabase.removeSubscription(subscription)
```

## 聚合查询示例

```sql
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
```

## 迁移的服务层

### 旧实现 (LocalStorage)
- 文件: `src/services/localStorageService.ts`
- 功能: 使用浏览器LocalStorage存储数据

### 新实现 (Supabase)
- 文件: `src/services/workScheduleService.ts`
- 功能: 使用Supabase数据库存储数据
- 接口保持一致，便于前端无缝切换

## API变更

所有API接口保持不变，仅实现方式从LocalStorage切换到Supabase:

1. `getUserWorkSchedules(userId)` - 获取用户排班数据
2. `createWorkSchedule(schedule)` - 创建排班
3. `updateWorkSchedule(id, updates)` - 更新排班
4. `deleteWorkSchedule(id)` - 删除排班
5. `getShopHourlyRates(userId)` - 获取店铺时薪数据
6. `createShopHourlyRate(rate)` - 创建店铺时薪设置
7. `updateShopHourlyRate(id, updates)` - 更新店铺时薪设置
8. `deleteShopHourlyRate(id)` - 删除店铺时薪设置

## 数据访问权限

通过Supabase的行级安全策略(RLS)确保数据安全：
- 用户只能访问自己的数据
- 所有操作都经过身份验证检查

## 本地开发和线上部署

### 本地开发
使用Supabase CLI启动本地开发环境：
```bash
supabase start
```

### 线上部署
连接到Supabase线上项目：
1. 更新 `.env.local` 中的凭证
2. 运行数据库迁移
3. 部署应用

## 测试

确保所有功能在新数据库实现下正常工作：
1. 排班创建、读取、更新、删除
2. 店铺时薪设置管理
3. 数据权限控制
4. 跨设备数据同步
5. 实时监控功能