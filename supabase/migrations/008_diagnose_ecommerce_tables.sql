-- 诊断电商表结构和配置问题

-- 1. 检查表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('products', 'shopping_carts', 'cart_items', 'orders', 'order_items');

-- 2. 检查表结构
\d products
\d shopping_carts
\d cart_items
\d orders
\d order_items

-- 3. 检查RLS是否启用
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

-- 4. 检查RLS策略
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

-- 5. 检查触发器
SELECT 
  tgname as trigger_name,
  relname as table_name,
  proname as function_name
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname IN ('products', 'shopping_carts', 'cart_items', 'orders', 'order_items');

-- 6. 检查索引
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('products', 'shopping_carts', 'cart_items', 'orders', 'order_items')
ORDER BY tablename, indexname;

-- 7. 检查外键约束
SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.table_name IN ('products', 'shopping_carts', 'cart_items', 'orders', 'order_items')
AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;

-- 8. 检查示例数据
SELECT * FROM products LIMIT 5;
SELECT COUNT(*) FROM shopping_carts;
SELECT COUNT(*) FROM cart_items;