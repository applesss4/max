-- 删除健康追踪表及相关资源
-- 个人生活管家应用

-- 删除触发器
DROP TRIGGER IF EXISTS update_health_tracks_updated_at ON health_tracks;

-- 删除行级安全策略
DROP POLICY IF EXISTS "用户只能查看自己的健康数据" ON health_tracks;

-- 禁用行级安全策略
ALTER TABLE health_tracks DISABLE ROW LEVEL SECURITY;

-- 删除索引
DROP INDEX IF EXISTS idx_health_tracks_user_id;
DROP INDEX IF EXISTS idx_health_tracks_tracked_date;

-- 删除健康追踪表
DROP TABLE IF EXISTS health_tracks;