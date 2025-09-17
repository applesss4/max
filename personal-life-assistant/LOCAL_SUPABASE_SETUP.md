# 本地Supabase开发环境设置指南

本指南将帮助您在本地设置Supabase开发环境，用于个人生活管家应用的数据库开发。

## 1. 安装Docker Desktop

由于Supabase本地开发需要Docker支持，请先安装Docker Desktop：

1. 访问 [Docker官网](https://www.docker.com/products/docker-desktop/)
2. 下载适用于macOS的Docker Desktop
3. 安装并启动Docker Desktop

## 2. 安装Supabase CLI

在终端中运行以下命令安装Supabase CLI：

```bash
npm install -g supabase
```

或者使用Homebrew（推荐）：

```bash
brew install supabase/tap/supabase
```

## 3. 初始化Supabase项目

在项目根目录下运行：

```bash
cd /Users/ai/最后版本/personal-life-assistant
supabase init
```

## 4. 启动本地Supabase开发环境

```bash
supabase start
```

这将启动以下服务：
- Supabase Studio: http://localhost:54323
- Supabase API: http://localhost:54321
- Postgres数据库: localhost:54322
- Inbucket (邮件测试): http://localhost:54324

## 5. 应用数据库模式

将数据库表结构应用到本地Supabase数据库：

```bash
supabase db reset
```

或者手动应用SQL文件：

```bash
supabase db push
```

## 6. 获取本地开发凭证

启动后，您可以在终端输出中找到本地开发凭证，或者运行：

```bash
supabase status
```

通常本地凭证为：
```
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
```

## 7. 更新环境变量

将以下内容添加到您的 `.env.local` 文件：

```
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCIiOjE5ODM4MTI5OTZ9.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
```

## 8. 测试连接

启动开发服务器：

```bash
npm run dev
```

访问 http://localhost:3000 查看应用是否正常连接到本地Supabase数据库。

## 9. 切换到线上Supabase数据库

如果您想使用线上Supabase数据库而不是本地开发环境：

1. 在 [Supabase官网](https://supabase.com/) 创建项目
2. 获取项目凭证并更新 `.env.local` 文件中的以下变量：
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-online-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-online-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-online-supabase-service-role-key
   ```
3. 参考 [ONLINE_SUPABASE_SETUP.md](ONLINE_SUPABASE_SETUP.md) 文件在您的线上数据库中创建表结构
4. 重新启动开发服务器

## 10. 在本地和线上环境之间切换

您可以轻松在本地开发环境和线上环境之间切换：

- 使用本地环境：将 `.env.local` 中的凭证设置为本地Supabase凭证
- 使用线上环境：将 `.env.local` 中的凭证设置为线上Supabase凭证

只需重启开发服务器即可应用更改。