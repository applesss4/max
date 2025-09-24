import { createClient } from '@supabase/supabase-js';

// Supabase配置 - 使用服务端密钥绕过RLS
const supabaseUrl = 'https://bcahnkgczieiogyyxyml.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjYWhua2djemllaW9neXl4eW1sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODAzNzQxNywiZXhwIjoyMDczNjEzNDE3fQ.rtBp-QWWtw_VpI2vNGYi_lXpBIgwiM1nbumP_q96iTU';

// 创建Supabase客户端（服务端模式）
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

async function insertTestData() {
  try {
    console.log('开始插入测试数据...');
    
    // 获取一个真实的用户ID（从auth.users表）
    const { data: users, error: usersError } = await supabase
      .rpc('get_users_for_testing'); // 使用RPC函数获取用户
    
    if (usersError) {
      console.log('无法通过RPC获取用户，尝试直接查询auth.users...');
      
      // 如果RPC不可用，我们直接尝试插入数据而不指定用户ID
      // 然后在应用中使用当前登录的用户ID
      const testItems = [
        {
          name: '白色T恤',
          category: '上衣',
          color: '白色',
          season: '夏',
          tags: ['休闲', '日常'],
          image_url: null,
          purchase_date: null,
          brand: null,
          notes: null
        },
        {
          name: '蓝色牛仔裤',
          category: '裤子',
          color: '蓝色',
          season: '四季',
          tags: ['休闲', '日常'],
          image_url: null,
          purchase_date: null,
          brand: null,
          notes: null
        },
        {
          name: '运动鞋',
          category: '鞋子',
          color: '白色',
          season: '四季',
          tags: ['运动', '日常'],
          image_url: null,
          purchase_date: null,
          brand: null,
          notes: null
        },
        {
          name: '太阳镜',
          category: '配饰',
          color: '黑色',
          season: '夏',
          tags: ['时尚', '防晒'],
          image_url: null,
          purchase_date: null,
          brand: null,
          notes: null
        },
        {
          name: '轻薄外套',
          category: '外套',
          color: '米色',
          season: '春',
          tags: ['休闲', '春季'],
          image_url: null,
          purchase_date: null,
          brand: null,
          notes: null
        }
      ];
      
      console.log('准备插入的测试物品（不指定用户ID）:', testItems);
      
      // 插入测试数据（在应用中会自动关联当前用户）
      console.log('请在应用中手动添加这些测试物品');
      console.log('1. 登录应用');
      console.log('2. 进入"智能穿搭助理"页面');
      console.log('3. 切换到"我的衣柜"标签页');
      console.log('4. 点击"添加衣物"按钮');
      console.log('5. 添加以上列出的测试物品');
      
      return;
    }
    
    if (!users || users.length === 0) {
      console.log('没有找到用户，请先注册一个用户');
      return;
    }
    
    const userId = users[0].id;
    console.log('使用用户ID:', userId);
    
    // 创建一些测试衣柜物品
    const testItems = [
      {
        user_id: userId,
        name: '白色T恤',
        category: '上衣',
        color: '白色',
        season: '夏',
        tags: ['休闲', '日常'],
        image_url: null,
        purchase_date: null,
        brand: null,
        notes: null
      },
      {
        user_id: userId,
        name: '蓝色牛仔裤',
        category: '裤子',
        color: '蓝色',
        season: '四季',
        tags: ['休闲', '日常'],
        image_url: null,
        purchase_date: null,
        brand: null,
        notes: null
      },
      {
        user_id: userId,
        name: '运动鞋',
        category: '鞋子',
        color: '白色',
        season: '四季',
        tags: ['运动', '日常'],
        image_url: null,
        purchase_date: null,
        brand: null,
        notes: null
      },
      {
        user_id: userId,
        name: '太阳镜',
        category: '配饰',
        color: '黑色',
        season: '夏',
        tags: ['时尚', '防晒'],
        image_url: null,
        purchase_date: null,
        brand: null,
        notes: null
      },
      {
        user_id: userId,
        name: '轻薄外套',
        category: '外套',
        color: '米色',
        season: '春',
        tags: ['休闲', '春季'],
        image_url: null,
        purchase_date: null,
        brand: null,
        notes: null
      }
    ];
    
    console.log('准备插入的测试物品:', testItems);
    
    // 插入测试数据
    const { data, error } = await supabase
      .from('wardrobe_items')
      .insert(testItems)
      .select();
    
    if (error) {
      console.error('插入测试数据失败:', error);
      return;
    }
    
    console.log('成功插入测试数据:', data);
    
    // 验证数据是否插入成功
    const { data: verifyData, error: verifyError } = await supabase
      .from('wardrobe_items')
      .select('*')
      .eq('user_id', userId);
    
    if (verifyError) {
      console.error('验证数据失败:', verifyError);
      return;
    }
    
    console.log('验证结果 - 衣柜物品数量:', verifyData.length);
    console.log('验证结果 - 衣柜物品列表:', verifyData);
    
  } catch (error) {
    console.error('插入测试数据时发生错误:', error);
  }
}

insertTestData();