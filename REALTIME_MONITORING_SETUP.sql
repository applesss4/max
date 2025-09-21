-- Supabase实时监控配置脚本
-- 为所有表启用实时订阅功能

-- 检查当前的发布配置
-- SELECT * FROM pg_publication;

-- 为所有核心表添加到实时发布中
-- 如果表已存在于发布中，添加时会自动跳过

-- 为待办事项表启用实时监控
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS todos;

-- 为用户个人资料表启用实时监控
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS user_profiles;

-- 为排班表启用实时监控
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS work_schedules;

-- 为店铺时薪表启用实时监控
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS shop_hourly_rates;

-- 为条形码表启用实时监控
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS barcodes;

-- 验证表是否已添加到发布中
-- SELECT pubname, schemaname, tablename 
-- FROM pg_publication_tables 
-- WHERE pubname = 'supabase_realtime';

-- 实时监控使用说明:
-- 1. 在前端应用中，使用Supabase JavaScript客户端订阅表变更:
--    const subscription = supabase
--      .from('todos')
--      .on('*', payload => {
--        console.log('数据变更:', payload)
--      })
--      .subscribe()

-- 2. 可以监听特定事件类型:
--    - INSERT: .on('INSERT', handler)
--    - UPDATE: .on('UPDATE', handler)
--    - DELETE: .on('DELETE', handler)
--    - ALL: .on('*', handler)

-- 3. 实时监控支持过滤条件:
--    const subscription = supabase
--      .from('todos')
--      .eq('user_id', userId)
--      .on('*', payload => {
--        console.log('我的待办事项变更:', payload)
--      })
--      .subscribe()

-- 4. 记得在组件卸载时取消订阅以避免内存泄漏:
--    supabase.removeSubscription(subscription)