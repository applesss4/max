# 新闻功能说明

## 概述

新闻功能允许用户查看从 NHK RSS 源抓取的日本新闻。该功能包括：

1. 定时从 NHK RSS 源抓取新闻
2. 将新闻存储在 Supabase 数据库中
3. 在 Web 界面中显示新闻

## 文件结构

```
src/app/news/page.tsx        # 新闻页面组件
supabase/migrations/018_create_news_table.sql  # 创建新闻表的数据库迁移文件
rss-fetcher.js              # RSS 抓取脚本
fetch_nhk_news.js           # 用于定时任务的脚本
scheduled-rss-fetcher.js    # 定时任务脚本
test-rss-fetcher.js         # 测试脚本
query-news.js              # 查询新闻数据的脚本
```

## 设置步骤

### 1. 创建数据库表

确保在 Supabase 数据库中创建了 [news](file:///Users/ai/%E6%9C%80%E5%90%8E%E7%89%88%E6%9C%AC/src/types/supabase.ts#L73-L80) 表。可以通过以下方式之一完成：

#### 方法一：使用 Supabase 控制台

1. 登录到 Supabase 控制台
2. 进入 SQL Editor
3. 执行 [supabase/migrations/018_create_news_table.sql](file:///Users/ai/%E6%9C%80%E5%90%8E%E7%89%88%E6%9C%AC/supabase/migrations/018_create_news_table.sql) 中的 SQL 脚本

#### 方法二：使用 Supabase CLI（如果已安装）

```bash
supabase db push
```

### 2. 抓取新闻数据

#### 手动执行一次抓取：

```bash
node rss-fetcher.js
```

#### 设置定时任务：

参考 [CRON_JOB_SETUP.md](file:///Users/ai/%E6%9C%80%E5%90%8E%E7%89%88%E6%9C%AC/CRON_JOB_SETUP.md) 文件设置定时任务。

### 3. 访问新闻页面

启动开发服务器后，访问 http://localhost:3000/news 查看新闻页面。

## 功能特点

1. **新闻列表显示**：按发布时间倒序显示最新的 50 条新闻
2. **新闻详情链接**：点击新闻标题可跳转到原始新闻页面
3. **刷新功能**：页面提供刷新按钮，可手动更新新闻列表
4. **错误处理**：友好的错误提示和重新加载功能
5. **响应式设计**：适配不同屏幕尺寸

## 自定义配置

### 修改 RSS 源

在 [rss-fetcher.js](file:///Users/ai/%E6%9C%80%E5%90%8E%E7%89%88%E6%9C%AC/rss-fetcher.js) 文件中修改 RSS 源列表：

```javascript
const nhkRssUrls = [
  'https://www.nhk.or.jp/rss/news/cat0.xml',  // 综合新闻
  // 添加更多 RSS 源
];
```

### 修改定时任务频率

在 [scheduled-rss-fetcher.js](file:///Users/ai/%E6%9C%80%E5%90%8E%E7%89%88%E6%9C%AC/scheduled-rss-fetcher.js) 文件中修改定时任务间隔：

```javascript
const INTERVAL = 30 * 60 * 1000; // 30分钟
```

## 故障排除

### 页面无法访问

1. 确保开发服务器正在运行
2. 检查终端是否有错误信息
3. 确认 [src/app/news/page.tsx](file:///Users/ai/%E6%9C%80%E5%90%8E%E7%89%88%E6%9C%AC/src/app/news/page.tsx) 文件是否存在且没有语法错误

### 新闻无法显示

1. 确保数据库表已创建
2. 确保已执行过 RSS 抓取脚本
3. 检查 Supabase 连接配置是否正确

### RSS 抓取失败

1. 检查网络连接
2. 验证 RSS 源 URL 是否有效
3. 查看执行日志获取详细错误信息