import Parser from 'rss-parser';
import { createClient } from '@supabase/supabase-js';

const parser = new Parser();

// 替换成你的 Supabase 信息
const supabaseUrl = 'https://bcahnkgczieiogyyxyml.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjYWhua2djemllaW9neXl4eW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMzc0MTcsImV4cCI6MjA3MzYxMzQxN30.bBRylsq9ihPZ9Kbor1kJcgNgOyqDY9e3euGBwxj1QAw';
const supabase = createClient(supabaseUrl, supabaseKey);

// 新闻源和 RSS 链接（使用有效的 RSS 源）
const newsSources = [
  { name: 'Asahi', urls: [
      'https://www.asahi.com/rss/asahi/newsheadlines.rdf'
      // 朝日新闻 RSS 是综合的，需要关键词筛选
    ]
  },
  { name: 'NHK', urls: [
      'https://www.nhk.or.jp/rss/news/cat0.xml'  // 综合新闻
    ]
  }
  // 注释掉暂时无法访问的链接
  // { name: 'Yomiuri', urls: [
  //     'https://www.yomiuri.co.jp/rss/' 
  //   ]
  // }
];

// 筛选关键词（日语）
const keywords = ['政治', '経済', '社会'];

async function fetchAndStore() {
  console.log('开始抓取新闻...');
  
  // 首先测试数据库连接
  try {
    const { data, error } = await supabase
      .from('news')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('数据库连接失败:', error);
      console.log('请检查 Supabase 连接信息是否正确。');
      return;
    }
    console.log('数据库连接成功');
  } catch (error) {
    console.error('数据库连接测试出错:', error);
    console.log('请检查 Supabase 连接信息是否正确。');
    return;
  }
  
  for (let source of newsSources) {
    for (let url of source.urls) {
      try {
        console.log(`正在解析 RSS 源: ${url}`);
        const feed = await parser.parseURL(url);
        
        console.log(`RSS 源 "${source.name}" 包含 ${feed.items.length} 条新闻`);
        
        let storedCount = 0;
        let skippedCount = 0;
        
        for (let item of feed.items) {
          try {
            // 检查重复
            const { data: existing } = await supabase
              .from('news')
              .select('id')
              .eq('link', item.link)
              .limit(1);
            if (existing && existing.length > 0) {
              skippedCount++;
              continue;
            }

            // 筛选类别
            let category = null;
            if (source.name === 'NHK') {
              // NHK RSS 综合，需要用标题关键词判断
              for (let kw of keywords) {
                if ((item.title && item.title.includes(kw)) ||
                    (item.contentSnippet && item.contentSnippet.includes(kw))) {
                  category = kw;
                  break;
                }
              }
            } else if (source.name === 'Asahi') {
              // 朝日新闻 RSS 综合，需要用标题关键词判断
              for (let kw of keywords) {
                if ((item.title && item.title.includes(kw)) ||
                    (item.contentSnippet && item.contentSnippet.includes(kw))) {
                  category = kw;
                  break;
                }
              }
            }

            if (!category) {
              skippedCount++;
              continue; // 不符合社会/政治/经济，跳过
            }

            // 存入数据库
            const { data, error: insertError } = await supabase.from('news').insert([
              {
                title: item.title,
                link: item.link,
                pub_date: new Date(item.pubDate),
                summary: item.contentSnippet || '',
                source: source.name,
                category
              }
            ]).select();

            if (insertError) {
              console.error(`插入数据库时出错 (${item.title}):`, insertError);
              continue;
            }

            console.log(`[${source.name}] ${category} 新闻已存储：`, item.title);
            storedCount++;
          } catch (itemError) {
            console.error(`处理新闻项时出错 (${item.title}):`, itemError.message);
          }
        }
        
        console.log(`RSS 源 "${source.name}" 处理完成: 新增 ${storedCount} 条, 跳过 ${skippedCount} 条`);
      } catch (err) {
        console.error(`抓取 ${source.name} RSS 出错：`, err);
      }
    }
  }
  console.log('抓取完成！');
}

// 如果直接运行此脚本，则执行抓取功能
if (import.meta.url === `file://${process.argv[1]}`) {
  fetchAndStore().catch(console.error);
}

export { fetchAndStore };