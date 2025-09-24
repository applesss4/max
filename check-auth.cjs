const { createClient } = require('@supabase/supabase-js');

// Supabase配置
const supabaseUrl = 'https://bcahnkgczieiogyyxyml.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjYWhua2djemllaW9neXl4eW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMzc0MTcsImV4cCI6MjA3MzYxMzQxN30.bBRylsq9ihPZ9Kbor1kJcgNgOyqDY9e3euGBwxj1QAw';

console.log('Supabase URL:', supabaseUrl);

// 创建Supabase客户端
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAuth() {
  try {
    console.log('\n检查认证状态...');
    
    // 检查当前会话
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('会话错误:', sessionError);
    } else {
      console.log('会话数据:', sessionData);
    }
    
    // 检查用户
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.log('用户错误:', userError);
    } else {
      console.log('用户数据:', userData);
    }
    
    // 尝试注册一个测试用户
    console.log('\n尝试注册测试用户...');
    const { data, error } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'testpassword123'
    });
    
    if (error) {
      console.log('注册错误:', error);
    } else {
      console.log('注册成功:', data);
    }
  } catch (error) {
    console.error('检查认证时发生错误:', error);
  }
}

checkAuth();