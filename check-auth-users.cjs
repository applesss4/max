const { createClient } = require('@supabase/supabase-js');

// Supabase配置 - 使用服务角色密钥来访问认证用户
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

async function checkAuthUsers() {
  try {
    console.log('\n检查认证用户...');
    
    // 注意：在Supabase中，认证用户存储在auth.users表中，这需要特殊权限才能访问
    // 我们将尝试查询用户数量
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log('查询认证用户错误:', error);
    } else {
      console.log('认证用户数量:', count);
    }
  } catch (error) {
    console.error('检查认证用户时发生错误:', error);
  }
}

checkAuthUsers();