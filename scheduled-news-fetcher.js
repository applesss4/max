import { fetchAndStore } from './rss-fetcher.js';

// 每6小时执行一次 (6 * 60 * 60 * 1000 = 21600000毫秒)
const INTERVAL = 6 * 60 * 60 * 1000;

console.log('⏰ 定时新闻抓取任务已启动');
console.log(`🕒 执行间隔: 每${INTERVAL / (60 * 60 * 1000)}小时`);
console.log('🚀 首次执行...');

// 立即执行一次
fetchAndStore().catch(console.error);

// 设置定时器
setInterval(async () => {
  console.log('⏰ 定时任务触发');
  try {
    await fetchAndStore();
  } catch (error) {
    console.error('❌ 定时任务执行失败:', error);
  }
}, INTERVAL);