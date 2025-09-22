import { createClient } from '@supabase/supabase-js';

// 替换成你的 Supabase 信息
const supabaseUrl = 'https://bcahnkgczieiogyyxyml.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjYWhua2djemllaW9neXl4eW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMzc0MTcsImV4cCI6MjA3MzYxMzQxN30.bBRylsq9ihPZ9Kbor1kJcgNgOyqDY9e3euGBwxj1QAw';
const supabase = createClient(supabaseUrl, supabaseKey);

function formatDate(dateString) {
  // 支持多种日期格式
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error(`无效的日期格式: ${dateString}`);
  }
  return date.toISOString();
}

async function queryNewsByDateRange(startDate, endDate) {
  console.log(`查询从 ${startDate} 到 ${endDate} 的新闻数据...`);
  
  try {
    // 格式化日期
    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);
    
    console.log(`格式化后的日期范围: ${formattedStartDate} 到 ${formattedEndDate}`);
    
    // 查询指定日期范围的新闻
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .gte('pub_date', formattedStartDate)
      .lte('pub_date', formattedEndDate)
      .order('pub_date', { ascending: false })
      .limit(50);
    
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
    
    if (data.length === 0) {
      console.log('指定日期范围内没有新闻。');
    }
  } catch (error) {
    console.error('查询新闻出错:', error.message);
  }
}

// 如果直接运行此脚本，则执行查询
if (import.meta.url === `file://${process.argv[1]}`) {
  // 获取命令行参数
  const args = process.argv.slice(2);
  
  if (args.length >= 2) {
    const startDate = args[0];
    const endDate = args[1];
    queryNewsByDateRange(startDate, endDate).catch(console.error);
  } else {
    console.log('用法: node query-news-by-date.js <开始日期> <结束日期>');
    console.log('例如: node query-news-by-date.js 2025-09-20 2025-09-22');
    console.log('支持的日期格式: YYYY-MM-DD, YYYY/MM/DD, 或任何 JavaScript Date 对象支持的格式');
  }
}

export { queryNewsByDateRange };