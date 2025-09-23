import { createClient } from '@supabase/supabase-js';

// 使用匿名密钥创建客户端（模拟前端登录）
const supabaseUrl = 'https://bcahnkgczieiogyyxyml.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjYWhua2djemllaW9neXl4eW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMzc0MTcsImV4cCI6MjA3MzYxMzQxN30.bBRylsq9ihPZ9Kbor1kJcgNgOyqDY9e3euGBwxj1QAw';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLoginNewUser() {
  try {
    console.log('Testing login with new user...');
    
    // 使用新创建的用户凭据进行登录
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'password123',
    });
    
    if (error) {
      console.error('Login error:', error.message);
      console.error('Error status:', error.status);
      console.error('Error code:', error.code);
    } else {
      console.log('Login successful!');
      console.log('User ID:', data.user.id);
      console.log('Email:', data.user.email);
      console.log('Session expires at:', data.session.expires_at);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testLoginNewUser();