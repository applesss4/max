import Parser from 'rss-parser';

const parser = new Parser();

// 新闻源和 RSS 链接
const newsSources = [
  { name: 'NHK', urls: [
      'https://www3.nhk.or.jp/rss/news/society.xml',
      'https://www3.nhk.or.jp/rss/news/politics.xml',
      'https://www3.nhk.or.jp/rss/news/economy.xml'
    ]
  },
  { name: 'Asahi', urls: [
      'https://www.asahi.com/rss/asahi/newsheadlines.rdf'
    ]
  },
  { name: 'Yomiuri', urls: [
      'https://www.yomiuri.co.jp/rss/' 
    ]
  }
];

// 朝日新闻/读卖新闻筛选关键词（日语）
const keywords = ['政治', '経済', '社会'];

async function testRssParsing() {
  console.log('开始测试 RSS 解析...');
  
  for (let source of newsSources) {
    for (let url of source.urls) {
      try {
        console.log(`\n正在解析 ${source.name} RSS 源: ${url}`);
        const feed = await parser.parseURL(url);
        
        console.log(`RSS 源 "${feed.title}" 解析成功`);
        console.log(`包含 ${feed.items.length} 条新闻`);
        
        if (feed.items.length > 0) {
          console.log(`第一条新闻标题: ${feed.items[0].title}`);
          console.log(`第一条新闻链接: ${feed.items[0].link}`);
          console.log(`第一条新闻发布时间: ${feed.items[0].pubDate}`);
          
          // 测试分类逻辑
          let category = null;
          if (source.name === 'NHK') {
            // NHK RSS 已分类，直接判断 URL
            if (url.includes('society')) category = '社会';
            else if (url.includes('politics')) category = '政治';
            else if (url.includes('economy')) category = '経済';
          } else {
            // 朝日/读卖 RSS 综合，需要用标题关键词判断
            for (let kw of keywords) {
              if (feed.items[0].title && feed.items[0].title.includes(kw)) {
                category = kw;
                break;
              }
            }
          }
          
          console.log(`分类结果: ${category || '未分类'}`);
        }
      } catch (err) {
        console.error(`解析 ${source.name} RSS 源 ${url} 出错：`, err.message);
      }
    }
  }
  console.log('\nRSS 解析测试完成！');
}

testRssParsing().catch(console.error);