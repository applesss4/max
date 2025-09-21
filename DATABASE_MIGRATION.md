# 数据库迁移指南

## 概述

本文档记录了数据库的迁移历史和操作步骤，确保数据库结构的版本控制和一致性。

## 迁移历史

### 迁移 001: 初始化数据库结构
- 文件: `supabase/migrations/001_init_schema.sql`
- 描述: 创建基础表结构，包括待办事项、用户个人资料等表

### 迁移 002: 更新店铺时薪表
- 文件: `supabase/migrations/002_update_shop_hourly_rates.sql`
- 描述: 更新店铺时薪表结构，支持白班和夜班不同的时薪设置

### 迁移 003: 添加休息时长字段到排班表
- 文件: `supabase/migrations/003_add_break_duration_to_work_schedules.sql`
- 描述: 在排班表中添加休息时长字段，用于更精确的工时计算

### 迁移 004: 创建购物清单表
- 文件: `supabase/migrations/004_create_shopping_items_table.sql`
- 描述: 创建购物清单表，支持居家购物功能

## 执行迁移

要执行数据库迁移，请按照以下步骤操作：

1. 确保已经配置好Supabase CLI
2. 在项目根目录下运行以下命令：
   ```bash
   supabase db push
   ```

3. 或者使用Supabase控制台手动执行SQL文件

## 注意事项

- 每次数据库结构变更都需要创建新的迁移文件
- 迁移文件命名格式为 `序号_描述.sql`
- 迁移文件应该是幂等的，可以安全地重复执行
- 在生产环境执行迁移前，请先在测试环境验证

# 数据库迁移指南

本指南说明如何将个人生活管家应用从本地存储迁移到Supabase数据库。

## 迁移概述

应用原先使用浏览器的LocalStorage来存储排班数据，现已迁移到Supabase数据库以提供更好的数据持久性和跨设备同步能力。

## 迁移的表结构

### 1. work_schedules (排班表)
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

### 2. shop_hourly_rates (店铺时薪表)
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