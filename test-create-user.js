import { createClient } from '@supabase/supabase-js';

// 使用服务端密钥创建客户端
const supabaseUrl = 'https://bcahnkgczieiogyyxyml.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjYWhua2djemllaW9neXl4eW1sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODAzNzQxNywiZXhwIjoyMDczNjEzNDE3fQ.rtBp-QWWtw_VpI2vNGYi_lXpBIgwiM1nbumP_q96iTU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestUser() {
  try {
    console.log('Creating test user...');
    
    // 创建新用户
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'test@example.com',
      password: 'password123',
      email_confirm: true, // 直接确认邮箱
    });
    
    if (error) {
      console.error('Error creating user:', error.message);
    } else {
      console.log('User created successfully!');
      console.log('User ID:', data.user.id);
      console.log('Email:', data.user.email);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

createTestUser();