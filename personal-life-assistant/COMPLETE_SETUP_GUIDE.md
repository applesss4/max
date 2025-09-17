# 完整设置指南

本指南将帮助您完整设置个人生活管家应用的开发环境。

## 1. 安装前提条件

### 1.1 安装Docker Desktop

1. 访问 [Docker官网](https://docs.docker.com/desktop/)
2. 下载适用于您操作系统的Docker Desktop
3. 安装并启动Docker Desktop

验证安装：
```bash
docker --version
```

### 1.2 安装Node.js

确保您已安装Node.js 18或更高版本：
```bash
node --version
npm --version
```

如果没有安装，请从 [Node.js官网](https://nodejs.org/) 下载并安装。

## 2. 安装开发工具

### 2.1 安装Supabase CLI

```bash
npm install -g supabase
```

验证安装：
```bash
supabase --version
```

## 3. 克隆项目

如果您还没有克隆项目，请执行以下命令：
```bash
git clone <项目仓库地址>
cd personal-life-assistant
```

## 4. 安装项目依赖

```bash
npm install
```

## 5. 启动Supabase本地环境

### 5.1 启动服务

```bash
supabase start
```

首次启动可能需要一些时间来下载和配置容器。

### 5.2 验证服务状态

```bash
supabase status
```

您应该看到类似以下的输出：
```
API URL: http://localhost:54321
DB URL: postgresql://postgres:postgres@localhost:54322/postgres
Studio URL: http://localhost:54323
Inbucket URL: http://localhost:54324
anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCIiOjE5ODM4MTI5OTZ9.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
```

## 6. 应用数据库结构

```bash
supabase db reset
```

这将应用所有数据库迁移脚本并初始化数据库结构。

## 7. 注册和登录

1. 启动开发服务器：
   ```bash
   npm run dev
   ```

2. 打开浏览器访问：http://localhost:3000/register

3. 注册新账户并登录使用

## 10. 开发工作流

### 10.1 启动开发服务器

```bash
npm run dev
```

### 10.2 构建生产版本

```bash
npm run build
```

### 10.3 分析包大小

```bash
npm run analyze
```

## 11. 数据库管理

### 11.1 重置数据库

```bash
supabase db reset
```

### 11.2 查看数据库状态

```bash
supabase db status
```

### 11.3 生成新的迁移文件

创建新的SQL迁移文件在 `supabase/migrations/` 目录中，然后运行：
```bash
supabase db push
```

## 12. 故障排除

### 12.1 Docker相关问题

**问题**：Docker daemon not running
**解决方案**：启动Docker Desktop应用程序

**问题**：端口被占用
**解决方案**：停止占用端口的应用程序或修改Supabase配置

### 12.2 Supabase相关问题

**问题**：无法连接到Supabase
**解决方案**：
1. 检查Docker是否运行
2. 运行 `supabase stop` 然后 `supabase start`
3. 检查防火墙设置

**问题**：数据库表不存在
**解决方案**：运行 `supabase db reset`

### 12.3 认证相关问题

**问题**：登录失败
**解决方案**：
1. 检查邮箱和密码是否正确
2. 确认用户已创建
3. 检查Supabase认证配置

## 13. 项目结构说明

```
personal-life-assistant/
├── src/
│   ├── app/              # Next.js页面和路由
│   ├── components/       # React组件
│   ├── contexts/         # React上下文
│   ├── hooks/            # 自定义Hooks
│   ├── lib/              # 工具库
│   ├── services/         # 业务逻辑服务
│   └── types/            # TypeScript类型定义
├── supabase/
│   ├── migrations/       # 数据库迁移文件
│   └── config.toml       # Supabase配置文件
├── scripts/              # 辅助脚本
├── public/               # 静态资源
└── ...
```

## 14. 连接到线上Supabase

当您准备好部署到线上环境时：

1. 在 [Supabase官网](https://supabase.com/) 创建项目
2. 获取项目凭证
3. 更新 `.env.local` 文件中的凭证
4. 运行数据库迁移
5. 部署应用

## 16. 常用命令参考

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `supabase start` | 启动Supabase本地环境 |
| `supabase stop` | 停止Supabase本地环境 |
| `supabase db reset` | 重置数据库 |
| `supabase status` | 查看Supabase状态 |

## 17. 进一步学习

- [Supabase官方文档](https://supabase.com/docs)
- [Next.js官方文档](https://nextjs.org/docs)
- [React官方文档](https://reactjs.org/docs/getting-started.html)