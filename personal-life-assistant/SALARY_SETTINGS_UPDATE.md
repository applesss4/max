# 工资设置功能更新说明

## 更新内容

本次更新将原有的单一[hourly_rate](file:///Users/ai/%E6%9C%80%E5%90%8E%E7%89%88%E6%9C%AC/personal-life-assistant/src/types/supabase.ts#L202-L203)字段替换为白班时薪和夜班时薪两个字段，以支持更灵活的工资计算。

## 数据库结构变更

### 原有结构
```sql
CREATE TABLE shop_hourly_rates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shop_name VARCHAR(255) NOT NULL,
  hourly_rate DECIMAL(10,2) NOT NULL, -- 时薪
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 新结构
```sql
CREATE TABLE shop_hourly_rates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shop_name VARCHAR(255) NOT NULL,
  day_shift_rate DECIMAL(10,2) DEFAULT 0.00, -- 白班时薪（8:00-22:00）
  night_shift_rate DECIMAL(10,2) DEFAULT 0.00, -- 夜班时薪（22:00-8:00）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 数据迁移

为了保持数据的连续性，我们提供了数据迁移脚本，将原有的[hourly_rate](file:///Users/ai/%E6%9C%80%E5%90%8E%E7%89%88%E6%9C%AC/personal-life-assistant/src/types/supabase.ts#L202-L203)数据迁移到新的字段中：

1. 添加新的字段：[day_shift_rate](file:///Users/ai/%E6%9C%80%E5%90%8E%E7%89%88%E6%9C%AC/personal-life-assistant/src/types/supabase.ts#L201-L202)和[night_shift_rate](file:///Users/ai/%E6%9C%80%E5%90%8E%E7%89%88%E6%9C%AC/personal-life-assistant/src/types/supabase.ts#L202-L203)
2. 将原有的[hourly_rate](file:///Users/ai/%E6%9C%80%E5%90%8E%E7%89%88%E6%9C%AC/personal-life-assistant/src/types/supabase.ts#L202-L203)数据迁移到新的字段中
3. 删除原有的[hourly_rate](file:///Users/ai/%E6%9C%80%E5%90%8E%E7%89%88%E6%9C%AC/personal-life-assistant/src/types/supabase.ts#L202-L203)字段

## 应用更改的步骤

1. 在Supabase控制台中运行迁移脚本：
   ```
   supabase/migrations/002_update_shop_hourly_rates_with_data_migration.sql
   ```

2. 重新生成TypeScript类型定义：
   ```bash
   supabase gen types typescript --project-id your-project-id > src/types/supabase.ts
   ```

3. 部署更新后的前端代码

## 前端功能更新

1. 工资设置页面现在支持分别设置白班时薪和夜班时薪
2. 设置页面新增了已设置店铺时薪的展示区域
3. 排班页面的工资计算逻辑已更新，能够根据班次时间自动匹配对应的时薪标准

## 注意事项

1. 在应用数据库更改之前，请务必备份现有数据
2. 如果有自定义的数据库查询逻辑，需要相应更新以适应新的字段结构
3. 建议在测试环境中先验证更改，再部署到生产环境