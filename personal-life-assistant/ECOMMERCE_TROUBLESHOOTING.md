# 电商功能故障排查指南

## 问题描述

在使用居家购物功能时，出现以下错误：
```
GET https://bcahnkgczieiogyyxyml.supabase.co/rest/v1/shopping_carts?select=*&user_id=eq.8ec8cc4c-b5cf-4794-bc22-3446a07a3fec 406 (Not Acceptable)
获取购物车数量失败: Error: 无法创建或获取购物车
```

或者添加商品时出现403 Forbidden错误：
```
POST https://bcahnkgczieiogyyxyml.supabase.co/rest/v1/products 403 (Forbidden)
new row violates row-level security policy for table "products"
```

## 可能原因分析

1. **RLS策略配置不正确** - 行级安全策略可能未正确设置或配置有误
2. **触发器函数缺失** - 更新时间戳的触发器函数可能不存在
3. **外键约束问题** - 表之间的外键关系可能未正确建立
4. **权限问题** - 当前用户可能没有访问表的权限
5. **缺少INSERT/UPDATE/DELETE策略** - products表可能缺少相应的RLS策略

## 解决方案

### 步骤1：执行修复脚本

1. 登录到 [Supabase控制台](https://app.supabase.com/)
2. 选择您的项目
3. 进入 `SQL Editor` 页面
4. 复制 [009_fix_ecommerce_tables.sql](file:///Users/ai/%E6%9C%80%E5%90%8E%E7%89%88%E6%9C%AC/personal-life-assistant/supabase/migrations/009_fix_ecommerce_tables.sql) 文件中的所有内容
5. 粘贴到SQL编辑器中
6. 点击 `RUN` 按钮执行

对于products表的RLS策略问题，还需要执行以下SQL：

```sql
-- 为products表添加完整的RLS策略
DROP POLICY IF EXISTS "用户可以添加自己店铺的商品" ON products;
DROP POLICY IF EXISTS "用户可以更新自己店铺的商品" ON products;
DROP POLICY IF EXISTS "用户可以删除自己店铺的商品" ON products;

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
```

### 步骤2：验证修复结果

执行以下SQL查询来验证修复结果：

```sql
-- 检查RLS是否启用
SELECT 
  table_name,
  CASE 
    WHEN relrowsecurity THEN 'Enabled'
    ELSE 'Disabled'
  END as rls_status
FROM pg_class c
JOIN information_schema.tables t ON c.relname = t.table_name
WHERE t.table_schema = 'public' 
AND t.table_name IN ('products', 'shopping_carts', 'cart_items', 'orders', 'order_items');

-- 检查RLS策略
SELECT 
  table_name,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policy p
JOIN pg_class c ON p.polrelid = c.oid
WHERE c.relname IN ('products', 'shopping_carts', 'cart_items', 'orders', 'order_items');

-- 检查触发器
SELECT 
  tgname as trigger_name,
  relname as table_name,
  proname as function_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname IN ('products', 'shopping_carts', 'cart_items', 'orders', 'order_items');
```

### 步骤3：测试功能

1. 重新启动开发服务器：
   ```bash
   cd /Users/ai/最后版本/personal-life-assistant
   npm run dev
   ```

2. 使用测试账号登录：
   - 邮箱：123@123.com
   - 密码：123

3. 访问购物页面测试功能

## 诊断查询

如果问题仍然存在，可以执行以下诊断查询来获取更多信息：

```sql
-- 检查当前用户权限
SELECT auth.uid();

-- 检查购物车表数据
SELECT * FROM shopping_carts LIMIT 5;

-- 检查产品表数据
SELECT * FROM products LIMIT 5;

-- 手动测试购物车查询
SELECT * FROM shopping_carts WHERE user_id = '8ec8cc4c-b5cf-4794-bc22-3446a07a3fec';
```

## 常见问题及解决方案

### 1. RLS策略问题

如果RLS策略配置不正确，可能会导致406或403错误。确保以下策略已正确创建：

```sql
-- 购物车表策略
CREATE POLICY "用户只能查看自己的购物车" ON shopping_carts
  FOR ALL USING (auth.uid() = user_id);
```

### 2. 触发器函数缺失

确保 `update_updated_at_column` 函数存在：

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';
```

### 3. 外键约束问题

确保所有外键约束已正确建立：

```sql
ALTER TABLE shopping_carts
ADD CONSTRAINT shopping_carts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
```

### 4. Products表RLS策略问题

确保products表有完整的RLS策略：

```sql
-- SELECT策略
CREATE POLICY "用户可以查看自己店铺的商品" ON products
  FOR SELECT USING (
    shop_id IS NULL OR 
    EXISTS (
      SELECT 1 FROM shops 
      WHERE shops.id = products.shop_id 
      AND shops.user_id = auth.uid()
    )
  );

-- INSERT策略
CREATE POLICY "用户可以添加自己店铺的商品" ON products
  FOR INSERT WITH CHECK (
    shop_id IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM shops 
      WHERE shops.id = products.shop_id 
      AND shops.user_id = auth.uid()
    )
  );
```

## 支持

如果按照以上步骤操作后问题仍然存在，请提供以下信息以便进一步协助：

1. 执行诊断查询的结果
2. 浏览器开发者工具中的完整错误信息
3. Supabase控制台中的任何相关日志