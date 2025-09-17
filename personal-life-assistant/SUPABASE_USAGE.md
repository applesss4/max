# Supabase 使用指南

本指南将帮助您设置和使用Supabase数据库来支持个人生活管家应用。

## 数据库表结构

### 1. 待办事项表 (todos)
存储用户的待办事项信息。

字段：
- `id` (UUID): 主键
- `user_id` (UUID): 外键，关联到用户
- `title` (VARCHAR): 标题
- `description` (TEXT): 描述
- `completed` (BOOLEAN): 是否完成
- `priority` (INTEGER): 优先级 (1:低, 2:中, 3:高)
- `due_date` (DATE): 截止日期
- `created_at` (TIMESTAMP): 创建时间
- `updated_at` (TIMESTAMP): 更新时间

### 2. 健康追踪表 (health_tracks)
存储用户的健康数据。

字段：
- `id` (UUID): 主键
- `user_id` (UUID): 外键，关联到用户
- `weight` (DECIMAL): 体重 (kg)
- `height` (DECIMAL): 身高 (cm)
- `blood_pressure_sys` (INTEGER): 收缩压
- `blood_pressure_dia` (INTEGER): 舒张压
- `heart_rate` (INTEGER): 心率
- `steps` (INTEGER): 步数
- `sleep_hours` (DECIMAL): 睡眠小时数
- `water_intake` (DECIMAL): 饮水量 (升)
- `notes` (TEXT): 备注
- `tracked_date` (DATE): 记录日期
- `created_at` (TIMESTAMP): 创建时间
- `updated_at` (TIMESTAMP): 更新时间

### 3. 用户个人资料表 (user_profiles)
存储用户的个人资料信息。

字段：
- `id` (UUID): 主键，关联到用户
- `username` (VARCHAR): 用户名
- `full_name` (VARCHAR): 全名
- `avatar_url` (TEXT): 头像URL
- `website` (VARCHAR): 网站
- `bio` (TEXT): 个人简介
- `updated_at` (TIMESTAMP): 更新时间

### 4. 工作排班表 (work_schedules)
存储用户的工作排班信息。

字段：
- `id` (UUID): 主键
- `user_id` (UUID): 外键，关联到用户
- `shop_name` (VARCHAR): 店铺名称
- `work_date` (DATE): 工作日期
- `start_time` (TIME): 开始时间
- `end_time` (TIME): 结束时间
- `break_duration` (DECIMAL): 休息时长（小时）
- `duration` (DECIMAL): 工作时长（小时）
- `hourly_rate` (DECIMAL): 时薪
- `created_at` (TIMESTAMP): 创建时间
- `updated_at` (TIMESTAMP): 更新时间

### 5. 店铺时薪表 (shop_hourly_rates)
存储不同店铺的时薪设置。

字段：
- `id` (UUID): 主键
- `user_id` (UUID): 外键，关联到用户
- `shop_name` (VARCHAR): 店铺名称
- `day_shift_rate` (DECIMAL): 白班时薪（8:00-22:00）
- `night_shift_rate` (DECIMAL): 夜班时薪（22:00-8:00）
- `created_at` (TIMESTAMP): 创建时间
- `updated_at` (TIMESTAMP): 更新时间

## 行级安全策略 (RLS)

所有表都启用了行级安全策略，确保用户只能访问自己的数据：

- 用户只能查看、更新、删除自己的数据
- 用户只能创建与自己关联的数据

## API 使用示例

### 获取用户待办事项
```typescript
const { data, error } = await supabase
  .from('todos')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
```

### 创建待办事项
```typescript
const { data, error } = await supabase
  .from('todos')
  .insert([
    {
      user_id: userId,
      title: '新任务',
      description: '任务描述',
      completed: false,
      priority: 1
    }
  ])
  .select()
```

### 更新待办事项
```typescript
const { data, error } = await supabase
  .from('todos')
  .update({ completed: true })
  .eq('id', todoId)
  .select()
```

### 删除待办事项
```typescript
const { data, error } = await supabase
  .from('todos')
  .delete()
  .eq('id', todoId)
```

### 获取用户排班信息
```typescript
const { data, error } = await supabase
  .from('work_schedules')
  .select('*')
  .eq('user_id', userId)
  .order('work_date', { ascending: false })
  .limit(100)
```

### 创建排班
```typescript
const { data, error } = await supabase
  .from('work_schedules')
  .insert([
    {
      user_id: userId,
      shop_name: '便利店',
      work_date: '2025-09-20',
      start_time: '08:00:00',
      end_time: '16:00:00',
      break_duration: 0.5
    }
  ])
  .select()
```

### 获取店铺时薪设置
```typescript
const { data, error } = await supabase
  .from('shop_hourly_rates')
  .select('*')
  .eq('user_id', userId)
  .order('shop_name', { ascending: true })
```

### 创建店铺时薪设置
```typescript
const { data, error } = await supabase
  .from('shop_hourly_rates')
  .insert([
    {
      user_id: userId,
      shop_name: '便利店',
      day_shift_rate: 15.00,
      night_shift_rate: 20.00
    }
  ])
  .select()
```

## 环境变量配置

确保在 `.env.local` 文件中设置以下环境变量：

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## 服务层使用

应用使用服务层来封装数据库操作，位于 `src/services/supabaseService.ts` 文件中。

示例用法：
```typescript
import { getUserTodos } from '@/services/supabaseService'

const { data, error } = await getUserTodos(userId)
```