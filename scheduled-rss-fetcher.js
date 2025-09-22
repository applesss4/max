import { fetchAndStore } from './rss-fetcher.js';

// 定时任务：每30分钟执行一次 RSS 抓取
setInterval(async () => {
  console.log(`\n[${new Date().toISOString()}] 开始执行定时 RSS 抓取任务...`);
  try {
    await fetchAndStore();
    console.log(`[${new Date().toISOString()}] 定时 RSS 抓取任务完成`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] 定时 RSS 抓取任务出错:`, error);
  }
}, 30 * 60 * 1000); // 30分钟 = 30 * 60 * 1000 毫秒

console.log('RSS 定时抓取服务已启动，每30分钟执行一次抓取任务');