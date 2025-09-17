# 电商功能数据库更新指南

## 问题描述

在使用居家购物功能时，出现以下错误：
```
Failed to load resource: the server responded with a status of 406 ()
获取购物车失败: Error: 无法创建或获取购物车
```

这个错误的原因是线上Supabase数据库缺少电商功能所需的表结构。

## 解决方案

我们创建了一个SQL脚本 [007_add_ecommerce_tables.sql](file:///Users/ai/%E6%9C%80%E5%90%8E%E7%89%88%E6%9C%AC/personal-life-assistant/supabase/migrations/007_add_ecommerce_tables.sql) 来添加缺失的电商表结构。

## 数据库表结构

脚本将创建以下5个表：

1. **products** - 商品表
2. **shopping_carts** - 购物车表
3. **cart_items** - 购物车项表
4. **orders** - 订单表
5. **order_items** - 订单项表

## 应用更新步骤

### 方法一：通过Supabase控制台手动执行（推荐）

1. 登录到 [Supabase控制台](https://app.supabase.com/)
2. 选择您的项目
3. 进入 `SQL Editor` 页面
4. 复制 [007_add_ecommerce_tables.sql](file:///Users/ai/%E6%9C%80%E5%90%8E%E7%89%88%E6%9C%AC/personal-life-assistant/supabase/migrations/007_add_ecommerce_tables.sql) 文件中的所有内容
5. 粘贴到SQL编辑器中
6. 点击 `RUN` 按钮执行

### 方法二：使用Supabase CLI（如果您已安装并配置）

1. 确保您已安装Supabase CLI
2. 在项目根目录下运行以下命令：
   ```bash
   supabase link --project-ref your-project-ref
   supabase db push
   ```

## 验证更新

更新完成后，您可以执行以下查询来验证表是否创建成功：

```sql
-- 检查表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('products', 'shopping_carts', 'cart_items', 'orders', 'order_items');

-- 检查示例数据是否插入
SELECT * FROM products LIMIT 5;
```

## 注意事项

1. 脚本使用了 `IF NOT EXISTS` 语句，因此可以安全地多次执行
2. 示例商品数据只会插入一次，避免重复数据
3. 行级安全策略(RLS)已正确配置，确保数据安全
4. 所有表都启用了自动更新时间戳的触发器

## 常见问题

### 如果执行时出现权限错误怎么办？

确保您使用的数据库用户具有创建表和策略的权限。

### 如果表已存在但结构不正确怎么办？

您可能需要手动调整现有表结构以匹配脚本中的定义。

## 支持

如果您在执行过程中遇到任何问题，请提供具体的错误信息以便进一步协助。