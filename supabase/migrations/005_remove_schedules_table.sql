-- 删除日程安排表及相关资源
-- 个人生活管家应用

-- 删除触发器
DROP TRIGGER IF EXISTS update_schedules_updated_at ON schedules;

-- 删除行级安全策略
DROP POLICY IF EXISTS "用户只能查看自己的日程安排" ON schedules;

-- 删除索引
DROP INDEX IF EXISTS idx_schedules_user_id;
DROP INDEX IF EXISTS idx_schedules_start_time;

-- 删除表
DROP TABLE IF EXISTS schedules;