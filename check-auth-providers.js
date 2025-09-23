// 检查 Supabase 认证提供商设置的脚本
import { createClient } from '@supabase/supabase-js';

// 使用项目配置
const supabaseUrl = 'https://bcahnkgczieiogyyxyml.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjYWhua2djemllaW9neXl4eW1sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODAzNzQxNywiZXhwIjoyMDczNjEzNDE3fQ.rtBp-QWWtw_VpI2vNGYi_lXpBIgwiM1nbumP_q96iTU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAuthProviders() {
  try {
    // 使用服务端密钥检查认证提供商
    console.log('Checking Supabase auth providers...');
    
    // 尝试获取一些用户信息来验证连接
    const { data, error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 10
    });
    
    if (error) {
      console.error('Error fetching users:', error);
    } else {
      console.log('Successfully connected to Supabase auth');
      console.log(`Found ${data?.users?.length || 0} users`);
      if (data?.users?.length > 0) {
        console.log('First user email:', data.users[0].email);
      }
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

checkAuthProviders();