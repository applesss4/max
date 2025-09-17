-- 更新shop_hourly_rates表结构，将hourly_rate替换为白班时薪和深夜时薪
-- 注意：此脚本会删除原有的hourly_rate字段，请确保已备份数据

-- 1. 添加新的字段
ALTER TABLE shop_hourly_rates 
ADD COLUMN IF NOT EXISTS day_shift_rate DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS night_shift_rate DECIMAL(10,2) DEFAULT 0.00;

-- 2. 将原有的hourly_rate数据迁移到新的字段中
-- 假设原有的时薪适用于白班时间（8:00-22:00）
UPDATE shop_hourly_rates 
SET day_shift_rate = hourly_rate,
    night_shift_rate = hourly_rate * 1.5  -- 夜班时薪通常为白班的1.5倍
WHERE hourly_rate IS NOT NULL;

-- 3. 删除原有的hourly_rate字段
ALTER TABLE shop_hourly_rates 
DROP COLUMN IF EXISTS hourly_rate;

-- 4. 添加注释说明字段含义
COMMENT ON COLUMN shop_hourly_rates.day_shift_rate IS '白班时薪（8:00-22:00）';
COMMENT ON COLUMN shop_hourly_rates.night_shift_rate IS '夜班时薪（22:00-8:00）';