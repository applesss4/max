const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://bcahnkgczieiogyyxyml.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjYWhua2djemllaW9neXl4eW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMzc0MTcsImV4cCI6MjA3MzYxMzQxN30.bBRylsq9ihPZ9Kbor1kJcgNgOyqDY9e3euGBwxj1QAw';

console.log('Supabase URL:', supabaseUrl);

// 创建Supabase客户端
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTables() {
  try {
    // 检查wardrobe_items表
    console.log('\n检查 wardrobe_items 表...');
    const { data: wardrobeData, error: wardrobeError } = await supabase
      .from('wardrobe_items')
      .select('*')
      .limit(1);

    if (wardrobeError) {
      console.log('wardrobe_items 表错误:', wardrobeError);
    } else {
      console.log('wardrobe_items 表存在，可以访问');
      console.log('表结构示例:', wardrobeData);
    }

    // 检查outfit_history表
    console.log('\n检查 outfit_history 表...');
    const { data: historyData, error: historyError } = await supabase
      .from('outfit_history')
      .select('*')
      .limit(1);

    if (historyError) {
      console.log('outfit_history 表错误:', historyError);
    } else {
      console.log('outfit_history 表存在，可以访问');
      console.log('表结构示例:', historyData);
    }
  } catch (error) {
    console.error('检查表时发生错误:', error);
  }
}

checkTables();