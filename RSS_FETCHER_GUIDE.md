# RSS 新闻抓取系统使用指南

## 系统概述

RSS 新闻抓取系统可以从多个新闻源自动抓取新闻，并将其存储在 Supabase 数据库中。系统支持定时任务和手动执行两种方式。

## 文件说明

- [rss-fetcher.js](file:///Users/ai/%E6%9C%80%E5%90%8E%E7%89%88%E6%9C%AC/rss-fetcher.js) - 核心 RSS 抓取和存储逻辑
- [scheduled-rss-fetcher.js](file:///Users/ai/%E6%9C%80%E5%90%8E%E7%89%88%E6%9C%AC/scheduled-rss-fetcher.js) - 定时任务执行脚本
- [query-news.js](file:///Users/ai/%E6%9C%80%E5%90%8E%E7%89%88%E6%9C%AC/query-news.js) - 查询数据库中新闻的脚本
- [test-rss-parsing.js](file:///Users/ai/%E6%9C%80%E5%90%8E%E7%89%88%E6%9C%AC/test-rss-parsing.js) - 测试 RSS 解析功能的脚本

## 使用方法

### 1. 手动执行一次抓取

```bash
node rss-fetcher.js
```

### 2. 启动定时任务（每30分钟抓取一次）

```bash
node scheduled-rss-fetcher.js
```

### 3. 查询数据库中的新闻

```bash
node query-news.js
```

### 4. 测试 RSS 解析功能

```bash
node test-rss-parsing.js
```

## 配置说明

### 新闻源配置

在 [rss-fetcher.js](file:///Users/ai/%E6%9C%80%E5%90%8E%E7%89%88%E6%9C%AC/rss-fetcher.js) 文件中，可以通过修改 `newsSources` 数组来添加或删除新闻源：

```javascript
const newsSources = [
  { name: 'Asahi', urls: [
      'https://www.asahi.com/rss/asahi/newsheadlines.rdf'
    ]
  },
  { name: 'NHK', urls: [
      'https://www.nhk.or.jp/rss/news/cat0.xml'
    ]
  }
];
```

### 关键词筛选

系统会根据关键词对新闻进行分类筛选，只存储包含以下关键词的新闻：

```javascript
const keywords = ['政治', '経済', '社会'];
```

### Supabase 配置

在 [rss-fetcher.js](file:///Users/ai/%E6%9C%80%E5%90%8E%E7%89%88%E6%9C%AC/rss-fetcher.js) 和 [query-news.js](file:///Users/ai/%E6%9C%80%E5%90%8E%E7%89%88%E6%9C%AC/query-news.js) 文件中，需要配置正确的 Supabase 连接信息：

```javascript
const supabaseUrl = 'your-supabase-url';
const supabaseKey = 'your-supabase-key';
```

## 数据库表结构

新闻数据存储在 `news` 表中，包含以下字段：

- `id` - UUID 主键
- `title` - 新闻标题
- `link` - 新闻链接（唯一）
- `pub_date` - 发布时间
- `summary` - 新闻摘要
- `source` - 新闻来源
- `category` - 新闻分类（政治/経済/社会）
- `created_at` - 创建时间

## 常见问题

### 1. RSS 源链接失效

如果某些 RSS 源链接失效，可以在 `newsSources` 数组中注释掉或替换为新的有效链接。

### 2. 数据库连接失败

请检查 Supabase 连接信息是否正确，包括 URL 和密钥。

### 3. 定时任务执行失败

查看控制台输出的日志信息，根据错误提示进行排查。

## 扩展功能

### 添加新的新闻源

1. 在 `newsSources` 数组中添加新的新闻源信息
2. 如果需要特殊的分类逻辑，可以在分类代码部分添加相应的处理

### 修改抓取频率

在 [scheduled-rss-fetcher.js](file:///Users/ai/%E6%9C%80%E5%90%8E%E7%89%88%E6%9C%AC/scheduled-rss-fetcher.js) 文件中修改 `setInterval` 的时间间隔：

```javascript
setInterval(async () => {
  // 抓取逻辑
}, 30 * 60 * 1000); // 30分钟
```

### 修改关键词筛选

在 [rss-fetcher.js](file:///Users/ai/%E6%9C%80%E5%90%8E%E7%89%88%E6%9C%AC/rss-fetcher.js) 文件中修改 `keywords` 数组：

```javascript
const keywords = ['政治', '経済', '社会', '其他关键词'];
```