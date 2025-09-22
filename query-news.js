import { createClient } from '@supabase/supabase-js';

// 替换成你的 Supabase 信息
const supabaseUrl = 'https://bcahnkgczieiogyyxyml.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjYWhua2djemllaW9neXl4eW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMzc0MTcsImV4cCI6MjA3MzYxMzQxN30.bBRylsq9ihPZ9Kbor1kJcgNgOyqDY9e3euGBwxj1QAw';
const supabase = createClient(supabaseUrl, supabaseKey);

async function queryNews() {
  console.log('查询新闻数据...');
  
  try {
    // 查询最新的10条新闻
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .order('pub_date', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('查询新闻出错:', error);
      return;
    }
    
    console.log(`找到 ${data.length} 条新闻:`);
    data.forEach((item, index) => {
      console.log(`${index + 1}. [${item.source}] [${item.category || '未分类'}] ${item.title}`);
      console.log(`   发布时间: ${item.pub_date || '未知'}`);
      console.log(`   链接: ${item.link}`);
      console.log(`   摘要: ${item.summary ? item.summary.substring(0, 100) : '无'}${item.summary && item.summary.length > 100 ? '...' : ''}`);
      console.log('');
    });
  } catch (error) {
    console.error('查询新闻出错:', error);
  }
}

async function queryYesterdayNews() {
  console.log('查询昨天的新闻数据...');
  
  // 计算昨天的日期范围
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const startOfDay = new Date(yesterday);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(yesterday);
  endOfDay.setHours(23, 59, 59, 999);
  
  try {
    // 查询昨天的新闻
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .gte('pub_date', startOfDay.toISOString())
      .lte('pub_date', endOfDay.toISOString())
      .order('pub_date', { ascending: false })
      .limit(20);
    
    if (error) {
      console.error('查询昨天新闻出错:', error);
      return;
    }
    
    console.log(`找到 ${data.length} 条昨天的新闻:`);
    data.forEach((item, index) => {
      console.log(`${index + 1}. [${item.source}] [${item.category || '未分类'}] ${item.title}`);
      console.log(`   发布时间: ${item.pub_date || '未知'}`);
      console.log(`   链接: ${item.link}`);
      console.log(`   摘要: ${item.summary ? item.summary.substring(0, 100) : '无'}${item.summary && item.summary.length > 100 ? '...' : ''}`);
      console.log('');
    });
    
    if (data.length === 0) {
      console.log('昨天没有符合条件的新闻。');
    }
  } catch (error) {
    console.error('查询昨天新闻出错:', error);
  }
}

// 如果直接运行此脚本，则执行查询
if (import.meta.url === `file://${process.argv[1]}`) {
  // 检查是否有参数
  if (process.argv.includes('--yesterday')) {
    queryYesterdayNews().catch(console.error);
  } else {
    queryNews().catch(console.error);
  }
}

export { queryNews, queryYesterdayNews };