# Supabase 设置指南

本指南将帮助您设置Supabase以与个人生活管家应用一起使用。

## 1. 创建Supabase账户和项目

1. 访问 [Supabase官网](https://supabase.com/)
2. 点击"Start your project"或"新建项目"
3. 选择一个组织（或创建一个新组织）
4. 为您的项目输入一个名称（例如：personal-life-assistant）
5. 选择一个区域
6. 设置数据库密码
7. 点击"Create Project"

## 2. 获取API凭证

1. 项目创建完成后，进入项目控制台
2. 在左侧菜单中点击"Project Settings"（项目设置）
3. 在"API"选项卡下，您将找到：
   - Project URL（项目URL）
   - anon key（匿名密钥）
   - service_role key（服务角色密钥）

## 3. 配置环境变量

1. 复制 `.env.local.example` 文件并重命名为 `.env.local`：
   ```bash
   cp .env.local.example .env.local
   ```

2. 在 `.env.local` 文件中，将以下值替换为您的实际Supabase凭证：
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_actual_project_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key_here
   ```

## 4. 设置数据库表结构

有两种方式在您的Supabase项目中创建数据库表：

### 方式一：使用SQL脚本（推荐）

1. 在Supabase控制台中，进入"Table Editor" > "SQL Editor"
2. 打开 [ONLINE_SUPABASE_SCHEMA.sql](ONLINE_SUPABASE_SCHEMA.sql) 文件
3. 将文件内容复制并粘贴到SQL编辑器中
4. 点击"RUN"按钮执行脚本

### 方式二：手动在控制台中创建

参考 [SUPABASE_CONSOLE_SETUP.md](SUPABASE_CONSOLE_SETUP.md) 文件中的详细步骤，在Supabase控制台中手动创建每个表和策略。

## 5. 启用认证提供商

1. 在Supabase控制台中，点击左侧菜单的"Authentication"（认证）
2. 点击"Providers"（提供商）选项卡
3. 启用"Email"提供商以支持邮箱/密码登录

## 6. 测试应用

1. 确保您已安装所有依赖：
   ```bash
   npm install
   ```

2. 启动开发服务器：
   ```bash
   npm run dev
   ```

3. 打开浏览器访问 [http://localhost:3000](http://localhost:3000)

## 7. 注册和登录测试

1. 访问注册页面创建一个新账户
2. 检查您的邮箱以确认账户
3. 使用确认的账户登录
4. 您应该能够访问仪表板页面

## 8. 注册用户

现在您可以注册新用户并登录使用应用：

1. 启动开发服务器：
   ```bash
   npm run dev
   ```

2. 打开浏览器访问：http://localhost:3000/register

3. 注册新账户并登录使用

## 故障排除

如果遇到问题，请检查：

1. 环境变量是否正确设置
2. Supabase项目是否正确配置
3. 数据库表是否已正确创建
4. 网络连接是否正常
5. 控制台是否有错误信息