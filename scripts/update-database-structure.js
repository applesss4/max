#!/usr/bin/env node

// 更新数据库结构的脚本
// 此脚本将添加break_duration字段到work_schedules表
// 并更新shop_hourly_rates表结构

const { createClient } = require('@supabase/supabase-js');

// 从环境变量获取Supabase配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('请设置环境变量 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function updateDatabaseStructure() {
  console.log('开始更新数据库结构...');
  
  try {
    // 1. 为work_schedules表添加break_duration字段
    console.log('1. 添加break_duration字段到work_schedules表...');
    
    // 注意：在生产环境中，我们使用ALTER TABLE语句添加字段
    // 但在Supabase中，我们通常通过仪表板或SQL编辑器执行此操作
    console.log('请在Supabase SQL编辑器中执行以下SQL语句：');
    console.log(`
-- 为work_schedules表添加break_duration字段
ALTER TABLE work_schedules 
ADD COLUMN IF NOT EXISTS break_duration DECIMAL(3,1) DEFAULT 0.0;

-- 添加注释说明字段含义
COMMENT ON COLUMN work_schedules.break_duration IS '休息时长（小时）';

-- 更新现有数据，将break_duration设置为默认值0.0
UPDATE work_schedules 
SET break_duration = 0.0
WHERE break_duration IS NULL;
    `);
    
    // 2. 更新shop_hourly_rates表结构
    console.log('2. 更新shop_hourly_rates表结构...');
    console.log('请在Supabase SQL编辑器中执行以下SQL语句：');
    console.log(`
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
-- 注意：在生产环境中，请谨慎执行此操作
-- ALTER TABLE shop_hourly_rates 
-- DROP COLUMN IF EXISTS hourly_rate;

-- 4. 添加注释说明字段含义
COMMENT ON COLUMN shop_hourly_rates.day_shift_rate IS '白班时薪（8:00-22:00）';
COMMENT ON COLUMN shop_hourly_rates.night_shift_rate IS '夜班时薪（22:00-8:00）';
    `);
    
    console.log('数据库结构更新完成！');
    console.log('请确保在Supabase仪表板中执行上述SQL语句以完成数据库更新。');
    
  } catch (error) {
    console.error('更新数据库结构时出错:', error);
    process.exit(1);
  }
}

// 执行更新
updateDatabaseStructure();