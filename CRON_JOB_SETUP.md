# 定时任务设置指南

## 概述

本文档说明如何设置定时任务，每天早上 8 点自动执行新闻抓取脚本。

## 文件说明

- [fetch_nhk_news.js](file:///Users/ai/%E6%9C%80%E5%90%8E%E7%89%88%E6%9C%AC/fetch_nhk_news.js) - 用于 cron 定时任务的入口脚本
- [rss-fetcher.js](file:///Users/ai/%E6%9C%80%E5%90%8E%E7%89%88%E6%9C%AC/rss-fetcher.js) - 主要的 RSS 抓取脚本
- [supabase/migrations/018_create_news_table.sql](file:///Users/ai/%E6%9C%80%E5%90%8E%E7%89%88%E6%9C%AC/supabase/migrations/018_create_news_table.sql) - 创建新闻表的数据库迁移脚本

## 设置步骤

### 1. 确保脚本具有执行权限

```bash
chmod +x /Users/ai/最后版本/fetch_nhk_news.js
```

### 2. 测试脚本是否能正常运行

```bash
cd /Users/ai/最后版本 && node fetch_nhk_news.js
```

### 3. 设置 cron 定时任务

#### 方法一：使用 crontab 命令

1. 打开终端并运行以下命令编辑 cron 任务：
   ```bash
   crontab -e
   ```

2. 添加以下行到文件中：
   ```bash
   # 每天早上 8 点执行新闻抓取
   0 8 * * * cd /Users/ai/最后版本 && /usr/bin/node fetch_nhk_news.js
   ```

3. 保存并退出编辑器

#### 方法二：创建 cron 任务文件

1. 创建一个 cron 任务文件：
   ```bash
   sudo nano /etc/cron.d/news-fetch
   ```

2. 添加以下内容：
   ```bash
   # 每天早上 8 点执行新闻抓取
   0 8 * * * ai cd /Users/ai/最后版本 && /usr/bin/node fetch_nhk_news.js
   ```

   注意：将 `ai` 替换为实际的用户名

3. 保存并退出编辑器

### 4. 验证 cron 任务

列出当前用户的 cron 任务：
```bash
crontab -l
```

### 5. 查看执行日志

执行日志将被记录在 [rss_fetch.log](file:///Users/ai/%E6%9C%80%E5%90%8E%E7%89%88%E6%9C%AC/rss_fetch.log) 文件中，可以使用以下命令查看：
```bash
tail -f /Users/ai/最后版本/rss_fetch.log
```

## cron 表达式说明

cron 表达式的格式为：`分钟 小时 日 月 星期 命令`

我们使用的表达式 `0 8 * * *` 的含义：
- `0` - 分钟（0 表示整点）
- `8` - 小时（24 小时制，8 表示早上 8 点）
- `*` - 日（每天）
- `*` - 月（每月）
- `*` - 星期（每周）

## 修改执行时间

如果需要修改执行时间，可以修改 cron 表达式：

- 每天早上 9 点：`0 9 * * *`
- 每天下午 2 点：`0 14 * * *`
- 每周一早上 8 点：`0 8 * * 1`
- 每小时执行一次：`0 * * * *`

## 故障排除

### cron 任务不执行

1. 检查 cron 服务是否运行：
   ```bash
   sudo systemctl status cron  # Linux
   sudo launchctl list | grep cron  # macOS
   ```

2. 检查 cron 任务是否正确设置：
   ```bash
   crontab -l
   ```

3. 检查执行日志：
   ```bash
   tail -f /Users/ai/最后版本/rss_fetch.log
   ```

### 路径问题

如果遇到路径问题，请使用绝对路径：

```bash
0 8 * * * cd /Users/ai/最后版本 && /usr/bin/node /Users/ai/最后版本/fetch_nhk_news.js
```

### 权限问题

确保脚本具有执行权限：
```bash
chmod +x /Users/ai/最后版本/fetch_nhk_news.js
```

## 手动执行测试

在设置定时任务之前，建议手动执行一次以确保一切正常工作：

```bash
cd /Users/ai/最后版本 && node fetch_nhk_news.js
```