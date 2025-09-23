// 测试 Supabase 认证功能
import { createClient } from '@supabase/supabase-js';

// 使用项目配置
const supabaseUrl = 'https://bcahnkgczieiogyyxyml.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjYWhua2djemllaW9neXl4eW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMzc0MTcsImV4cCI6MjA3MzYxMzQxN30.bBRylsq9ihPZ9Kbor1kJcgNgOyqDY9e3euGBwxj1QAw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testUserLogin() {
  try {
    console.log('Testing user login...');
    
    // 使用已知存在的用户凭据进行测试
    const { data, error } = await supabase.auth.signInWithPassword({
      email: '123@123.com',
      password: '正确的密码', // 这里需要使用实际的密码
    });
    
    if (error) {
      console.error('Login error:', error.message);
      console.error('Error code:', error.status);
    } else {
      console.log('Login successful!');
      console.log('User:', data.user?.email);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testUserLogin();