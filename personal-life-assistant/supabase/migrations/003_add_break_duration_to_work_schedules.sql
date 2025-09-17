-- 为work_schedules表添加break_duration字段

-- 1. 添加新的字段
ALTER TABLE work_schedules 
ADD COLUMN IF NOT EXISTS break_duration DECIMAL(3,1) DEFAULT 0.0;

-- 2. 添加注释说明字段含义
COMMENT ON COLUMN work_schedules.break_duration IS '休息时长（小时）';

-- 3. 更新现有数据，将break_duration设置为默认值0.0
UPDATE work_schedules 
SET break_duration = 0.0
WHERE break_duration IS NULL;