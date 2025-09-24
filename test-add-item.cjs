const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://bcahnkgczieiogyyxyml.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjYWhua2djemllaW9neXl4eW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMzc0MTcsImV4cCI6MjA3MzYxMzQxN30.bBRylsq9ihPZ9Kbor1kJcgNgOyqDY9e3euGBwxj1QAw';

console.log('Supabase URL:', supabaseUrl);

// 创建Supabase客户端
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAddItem() {
  try {
    // 测试添加一个衣柜物品
    console.log('\n测试添加衣柜物品...');
    
    // 首先检查是否已登录用户
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('认证错误:', authError);
      return;
    }
    
    if (!user) {
      console.log('未登录用户，请先登录');
      return;
    }
    
    console.log('当前用户ID:', user.id);
    
    const testItem = {
      user_id: user.id,
      name: '测试T恤',
      category: '上衣',
      color: '白色',
      season: '夏',
      image_url: null,
      purchase_date: null,
      brand: null,
      notes: '测试物品'
    };
    
    console.log('要添加的物品:', testItem);
    
    const { data, error } = await supabase
      .from('wardrobe_items')
      .insert(testItem)
      .select()
      .single();

    if (error) {
      console.log('添加物品错误:', error);
    } else {
      console.log('添加物品成功:', data);
    }
  } catch (error) {
    console.error('测试时发生错误:', error);
  }
}

testAddItem();