import { createClient } from '@supabase/supabase-js';

// Supabase配置
const supabaseUrl = 'https://bcahnkgczieiogyyxyml.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjYWhua2djemllaW9neXl4eW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMzc0MTcsImV4cCI6MjA3MzYxMzQxN30.bBRylsq9ihPZ9Kbor1kJcgNgOyqDY9e3euGBwxj1QAw';

// 创建Supabase客户端
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTableStructure() {
  try {
    console.log('Checking wardrobe_items table structure...');
    
    // 查询wardrobe_items表结构
    const { data: wardrobeData, error: wardrobeError } = await supabase
      .from('wardrobe_items')
      .select('*')
      .limit(1);
    
    if (wardrobeError) {
      console.error('Error querying wardrobe_items:', wardrobeError);
    } else {
      console.log('wardrobe_items table exists and is accessible');
      console.log('Sample data:', wardrobeData);
    }
    
    console.log('\nChecking outfit_previews table structure...');
    
    // 查询outfit_previews表结构
    const { data: previewData, error: previewError } = await supabase
      .from('outfit_previews')
      .select('*')
      .limit(1);
    
    if (previewError) {
      console.error('Error querying outfit_previews:', previewError);
    } else {
      console.log('outfit_previews table exists and is accessible');
      console.log('Sample data:', previewData);
    }
    
    console.log('\nChecking outfit_history table structure...');
    
    // 查询outfit_history表结构
    const { data: historyData, error: historyError } = await supabase
      .from('outfit_history')
      .select('*')
      .limit(1);
    
    if (historyError) {
      console.error('Error querying outfit_history:', historyError);
    } else {
      console.log('outfit_history table exists and is accessible');
      console.log('Sample data:', historyData);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkTableStructure();