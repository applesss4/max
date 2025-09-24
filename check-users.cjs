const { createClient } = require('@supabase/supabase-js');

// Supabase配置 - 使用服务角色密钥来访问用户表
const supabaseUrl = 'https://bcahnkgczieiogyyxyml.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjYWhua2djemllaW9neXl4eW1sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODAzNzQxNywiZXhwIjoyMDczNjEzNDE3fQ.rtBp-QWWtw_VpI2vNGYi_lXpBIgwiM1nbumP_q96iTU';

console.log('Supabase URL:', supabaseUrl);

// 创建Supabase客户端（使用服务角色密钥）
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

async function checkUsers() {
  try {
    console.log('\n检查用户表...');
    
    const { data, error } = await supabase
      .from('users')
      .select('*');

    if (error) {
      console.log('查询用户表错误:', error);
    } else {
      console.log('用户表数据:', data);
    }
  } catch (error) {
    console.error('检查用户时发生错误:', error);
  }
}

checkUsers();