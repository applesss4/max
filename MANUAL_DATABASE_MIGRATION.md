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

### 2. user_profiles (用户个人资料表)
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

### 3. work_schedules (排班表)
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

### 4. shop_hourly_rates (店铺时薪表)
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
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_hourly_rates ENABLE ROW LEVEL SECURITY;

-- 创建策略
-- 待办事项表策略
CREATE POLICY "用户只能查看自己的待办事项" ON todos
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

## CRUD操作示例

### 1. 待办事项操作

```sql
-- 创建待办事项
INSERT INTO todos (user_id, title, description, priority, due_date)
VALUES ('用户ID', '完成项目报告', '编写并提交季度项目报告', 2, '2025-09-30');

-- 查询待办事项
SELECT * FROM todos WHERE user_id = '用户ID' ORDER BY created_at DESC;

-- 更新待办事项
UPDATE todos 
SET title = '更新后的标题', completed = true 
WHERE id = '待办事项ID' AND user_id = '用户ID';

-- 删除待办事项
DELETE FROM todos WHERE id = '待办事项ID' AND user_id = '用户ID';
```

### 2. 排班操作

```sql
-- 创建排班
INSERT INTO work_schedules (user_id, shop_name, work_date, start_time, end_time, break_duration, duration, hourly_rate)
VALUES ('用户ID', '超市A', '2025-09-20', '09:00:00', '17:00:00', 1.0, 7.0, 25.0);

-- 查询排班
SELECT * FROM work_schedules WHERE user_id = '用户ID' AND work_date >= '2025-09-01' ORDER BY work_date;

-- 更新排班
UPDATE work_schedules 
SET hourly_rate = 28.0 
WHERE id = '排班ID' AND user_id = '用户ID';

-- 删除排班
DELETE FROM work_schedules WHERE id = '排班ID' AND user_id = '用户ID';
```

### 3. 店铺时薪操作

```sql
-- 创建店铺时薪设置
INSERT INTO shop_hourly_rates (user_id, shop_name, day_shift_rate, night_shift_rate)
VALUES ('用户ID', '超市A', 25.00, 30.00);

-- 查询店铺时薪
SELECT * FROM shop_hourly_rates WHERE user_id = '用户ID';

-- 更新店铺时薪
UPDATE shop_hourly_rates 
SET day_shift_rate = 28.00, night_shift_rate = 33.00
WHERE id = '时薪ID' AND user_id = '用户ID';

-- 删除店铺时薪
DELETE FROM shop_hourly_rates WHERE id = '时薪ID' AND user_id = '用户ID';
```

## 实时监控配置

为启用实时监控功能，需要将表添加到supabase_realtime发布中：

```sql
-- 启用实时监控功能
ALTER PUBLICATION supabase_realtime ADD TABLE todos;
ALTER PUBLICATION supabase_realtime ADD TABLE user_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE work_schedules;
ALTER PUBLICATION supabase_realtime ADD TABLE shop_hourly_rates;
```

## 数据迁移脚本

如果需要从旧的LocalStorage数据迁移到新的数据库结构，可以使用以下脚本：

```javascript
// 示例：迁移排班数据
async function migrateWorkSchedules() {
  // 从LocalStorage获取旧数据
  const oldSchedules = JSON.parse(localStorage.getItem('workSchedules') || '[]');
  
  // 迁移到数据库
  for (const schedule of oldSchedules) {
    await supabase
      .from('work_schedules')
      .insert({
        user_id: schedule.userId,
        shop_name: schedule.shopName,
        work_date: schedule.workDate,
        start_time: schedule.startTime,
        end_time: schedule.endTime,
        break_duration: schedule.breakDuration || 0,
        duration: schedule.duration,
        hourly_rate: schedule.hourlyRate
      });
  }
  
  // 清理LocalStorage
  localStorage.removeItem('workSchedules');
}
```

## 验证和测试

完成迁移后，应该进行以下验证：

1. 确认所有表结构正确创建
2. 验证索引已创建
3. 检查RLS策略是否生效
4. 测试CRUD操作
5. 验证触发器功能
6. 测试实时监控功能

## 故障排除

如果遇到问题，请检查：

1. 表结构是否正确
2. 索引是否创建
3. RLS策略是否正确配置
4. 触发器是否正常工作
5. 数据库连接是否正常
6. 用户权限是否正确设置