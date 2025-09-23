import { createClient } from '@supabase/supabase-js';

// 使用环境变量中的配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bcahnkgczieiogyyxyml.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjYWhua2djemllaW9neXl4eW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMzc0MTcsImV4cCI6MjA3MzYxMzQxN30.bBRylsq9ihPZ9Kbor1kJcgNgOyqDY9e3euGBwxj1QAw';

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Key exists' : 'Key missing');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuth() {
  try {
    // 尝试获取当前会话
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    console.log('Session data:', sessionData);
    if (sessionError) {
      console.error('Session error:', sessionError);
    }

    // 尝试登录（请替换为实际的测试账户）
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'password123',
    });

    if (error) {
      console.error('Login error:', error);
    } else {
      console.log('Login success:', data);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testAuth();