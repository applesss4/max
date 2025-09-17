-- 修改店铺时薪表，添加白班时薪和深夜时薪字段，删除原有的时薪字段
ALTER TABLE shop_hourly_rates 
DROP COLUMN IF EXISTS hourly_rate;

ALTER TABLE shop_hourly_rates 
ADD COLUMN day_shift_rate DECIMAL(10,2) NOT NULL DEFAULT 0.00,
ADD COLUMN night_shift_rate DECIMAL(10,2) NOT NULL DEFAULT 0.00;

-- 添加注释说明字段含义
COMMENT ON COLUMN shop_hourly_rates.day_shift_rate IS '白班时薪（8:00-22:00）';
COMMENT ON COLUMN shop_hourly_rates.night_shift_rate IS '深夜班时薪（22:00-8:00）';