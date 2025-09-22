#!/usr/bin/env node

/**
 * NHK 新闻抓取脚本
 * 用于定时任务执行 RSS 抓取功能
 */

import { fetchAndStore } from './rss-fetcher.js';
import fs from 'fs';
import path from 'path';

const logFile = path.join(path.dirname(process.argv[1]), 'rss_fetch.log');

// 重定向 console.log 和 console.error 到日志文件
const originalLog = console.log;
const originalError = console.error;

console.log = function(...args) {
  originalLog.apply(console, args);
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logFile, `[${timestamp}] LOG: ${args.join(' ')}\n`);
};

console.error = function(...args) {
  originalError.apply(console, args);
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logFile, `[${timestamp}] ERROR: ${args.join(' ')}\n`);
};

console.log(`[${new Date().toISOString()}] 开始执行新闻抓取任务...`);

fetchAndStore()
  .then(() => {
    console.log(`[${new Date().toISOString()}] 新闻抓取任务完成`);
  })
  .catch((error) => {
    console.error(`[${new Date().toISOString()}] 新闻抓取任务失败:`, error);
    process.exit(1);
  });