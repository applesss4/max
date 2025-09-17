# 线上Supabase数据库设置指南

本指南将帮助您在Supabase云端设置个人生活管家应用所需的数据库表和策略。

## 1. 创建Supabase项目

1. 访问 [Supabase官网](https://supabase.com/) 并登录或注册账号
2. 点击 "New Project" 创建新项目
3. 输入项目名称，选择区域，设置数据库密码
4. 点击 "Create Project" 并等待项目创建完成

## 2. 获取项目凭证

项目创建完成后，您将需要以下信息来配置应用：

1. 项目URL: 在项目控制台的 "Project Settings" > "API" 页面找到
2. anon key: 在项目控制台的 "Project Settings" > "API" 页面找到
3. service_role key: 在项目控制台的 "Project Settings" > "API" 页面找到

## 3. 配置环境变量

将获取到的凭证填入项目根目录下的 `.env.local` 文件：

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

## 4. 创建数据库表

### 4.1 使用SQL编辑器

1. 在Supabase控制台中，进入 "Table Editor" > "SQL Editor"
2. 将 [ONLINE_SUPABASE_SCHEMA.sql](./ONLINE_SUPABASE_SCHEMA.sql) 文件中的所有内容复制并粘贴到SQL编辑器中
3. 点击 "RUN" 按钮执行SQL脚本

### 4.2 验证表创建

执行成功后，您应该能在 "Table Editor" 中看到以下6个表：
- todos
- schedules
- health_tracks
- user_profiles
- work_schedules
- shop_hourly_rates

## 5. 验证行级安全策略(RLS)

确保所有表都已启用RLS并正确配置了策略：

1. 在 "Table Editor" 中选择每个表
2. 点击 "Policies" 标签页
3. 验证每个表都有相应的行级安全策略

## 6. 测试数据库连接

确保您的环境变量已正确配置，然后启动开发服务器来测试数据库连接：

```bash
npm run dev
```

## 7. 注册用户

1. 启动开发服务器：
   ```bash
   npm run dev
   ```

2. 打开浏览器访问：http://localhost:3000/register

3. 注册新账户并登录使用

## 8. 部署应用

当您完成本地测试后，可以将应用部署到Vercel、Netlify或其他支持Next.js的平台：

1. 将代码推送到GitHub仓库
2. 在部署平台上连接您的GitHub仓库
3. 配置环境变量（使用与 `.env.local` 相同的值）
4. 触发部署

## 9. 故障排除

### 9.1 连接问题

如果应用无法连接到数据库：
1. 检查环境变量是否正确配置
2. 确认Supabase项目凭证无误
3. 检查网络连接

### 9.2 权限问题

如果数据无法正确读写：
1. 验证RLS策略是否正确配置
2. 检查用户认证状态
3. 确认用户ID是否正确关联

### 9.3 数据不一致

如果数据显示不正确：
1. 检查表结构是否与SQL脚本一致
2. 验证索引是否正确创建
3. 确认触发器是否正常工作