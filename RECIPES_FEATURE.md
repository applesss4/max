# 菜谱功能说明文档

## 功能概述
本功能在仪表盘中添加了菜谱管理模块，用户可以：
1. 查看菜谱列表
2. 添加新的菜谱（包含图片和视频链接）
3. 查看菜谱详情（包含视频播放）

## 文件结构
```
src/app/recipes/
├── page.tsx                  # 菜谱列表页面
├── [id]/
│   ├── page.tsx             # 菜谱详情页面（服务器组件）
│   └── client-page.tsx      # 菜谱详情客户端组件
└── create/
    └── page.tsx             # 添加菜谱页面
```

## 数据库设置

### 1. 创建菜谱表
已在以下迁移文件中定义了菜谱表结构：
`supabase/migrations/032_create_recipes_table.sql`

表结构包含：
- id: UUID主键
- name: 菜谱名称
- description: 菜谱描述
- video_url: 视频链接
- image_url: 图片链接
- created_at: 创建时间
- updated_at: 更新时间
- user_id: 用户ID（外键关联auth.users）

### 2. 应用数据库迁移
需要运行以下命令来应用数据库迁移：

```bash
# 启动Supabase本地开发环境
npx supabase start

# 应用数据库迁移
npx supabase migration up
```

## 功能说明

### 1. 仪表盘入口
已在仪表盘页面添加了"我的菜谱"功能入口，用户可以从仪表盘直接进入菜谱管理。

### 2. 菜谱列表页面
- 显示当前用户的所有菜谱
- 每个菜谱以卡片形式展示，包含图片、名称和创建时间
- 支持点击进入菜谱详情
- 提供"添加菜谱"按钮

### 3. 添加菜谱页面
- 表单包含菜谱名称、描述、图片上传和视频链接输入
- 支持图片预览
- 文件验证（图片最大5MB）
- 使用现有的文件上传服务
- **视频链接支持常见的视频平台**（如YouTube、Bilibili等）

### 4. 菜谱详情页面
- 显示菜谱的完整信息
- 支持视频播放（自动识别并适配YouTube、Bilibili等平台视频）
- 显示菜谱图片
- **采用服务器组件+客户端组件的混合架构**
- **完全解决Next.js 13+ App Router中params为Promise的问题**

## 技术实现

### 文件上传
复用了现有的[fileUploadService.ts](file:///Users/ai/最后版本/src/services/fileUploadService.ts)服务，将文件上传到`wardrobe-images`存储桶的`recipes`文件夹中。

### 数据访问
使用Supabase客户端直接访问数据库：
- 查询用户菜谱列表
- 获取菜谱详情
- 插入新的菜谱记录

### 权限控制
通过RLS（行级安全）策略确保用户只能访问自己的菜谱数据。

### 视频链接处理
菜谱详情页面能够智能识别不同平台的视频链接并进行适配：
- YouTube视频：自动转换为嵌入式播放器
- Bilibili视频：自动转换为嵌入式播放器
- 普通视频链接：使用HTML5视频标签播放

### Next.js App Router架构优化
为了解决Next.js 13+中params为Promise的问题，采用了以下架构：
1. 服务器组件(`page.tsx`)负责数据获取，通过`await params`正确处理Promise
2. 客户端组件(`client-page.tsx`)负责用户认证和交互逻辑
3. 通过props将服务器获取的数据传递给客户端组件

这种架构充分利用了Next.js App Router的优势：
- 服务器组件提高性能和SEO
- 客户端组件处理用户交互
- 完全避免了params Promise解包问题
- 正确处理了错误情况（如菜谱不存在）

## 注意事项
1. 需要确保Docker已安装并运行，以便启动Supabase本地开发环境
2. 需要应用数据库迁移才能使用菜谱功能
3. 视频链接需要是可公开访问的URL
4. 确保Supabase存储桶`wardrobe-images`已正确配置