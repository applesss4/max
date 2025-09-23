import { createClient } from '@supabase/supabase-js';

// 检查环境变量
console.log('Environment variables:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

// 使用环境变量中的配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bcahnkgczieiogyyxyml.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Using Supabase URL:', supabaseUrl);
console.log('Using Supabase Anon Key exists:', !!supabaseAnonKey);

if (!supabaseAnonKey) {
  console.error('ERROR: Supabase Anon Key is missing!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugAuth() {
  try {
    console.log('Testing Supabase connection...');
    
    // 尝试获取当前会话
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    console.log('Current session:', sessionData?.session ? 'Exists' : 'None');
    if (sessionError) {
      console.error('Session error:', sessionError);
    }

    // 尝试登录
    console.log('Attempting login...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'password123',
    });

    if (error) {
      console.error('Login error:', error);
      console.error('Error code:', error.code);
      console.error('Error status:', error.status);
      console.error('Error message:', error.message);
    } else {
      console.log('Login successful!');
      console.log('User ID:', data.user.id);
      console.log('Email:', data.user.email);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

debugAuth();