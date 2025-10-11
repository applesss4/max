# 个人生活管家

一个使用Next.js和Supabase构建的个人生活管理应用。

## 功能特性

- 待办事项管理
- 工作排班管理
- 工资计算
- 居家购物清单管理
- 电商商品管理
- 日本新闻浏览
- 智能穿搭助理（支持根据天气从网络获取穿搭推荐）

## 快速开始

### 本地开发环境设置

1. 安装Docker Desktop
2. 安装Supabase CLI:
   ```bash
   npm install -g supabase
   ```
3. 启动本地Supabase环境:
   ```bash
   supabase start
   ```
4. 应用数据库结构:
   ```bash
   supabase db reset
   ```
5. 安装依赖:
   ```bash
   npm install
   ```
6. 启动开发服务器:
   ```bash
   npm run dev
   ```

数据库结构定义在 [supabase/migrations/](supabase/migrations/) 目录中。

主要数据表包括：
- `todos` - 待办事项
- `user_profiles` - 用户个人资料
- `work_schedules` - 工作排班
- `shop_hourly_rates` - 店铺时薪
- `shopping_items` - 购物清单
- `products` - 商品
- `shops` - 超市
- `shopping_carts` - 购物车
- `cart_items` - 购物车项
- `orders` - 订单
- `order_items` - 订单项

- `wardrobe_items` - 衣柜物品
- `outfit_history` - 穿搭历史

## 部署到线上环境

当您准备好部署到线上Supabase环境时：

1. 在Supabase官网创建项目
2. 获取项目凭证并更新 `.env.local` 文件
3. 运行 `npm run build` 构建应用
4. 部署到您选择的托管平台（Vercel推荐）

## 项目结构

```
src/
├── app/           # Next.js App Router页面
├── components/    # React组件
├── contexts/      # React上下文
├── hooks/         # 自定义Hooks
├── lib/           # 工具库和客户端
├── services/      # 业务逻辑服务
└── types/         # TypeScript类型定义
```

## 核心功能说明

### 工作排班管理
- 添加、编辑、删除工作排班
- 设置不同店铺的时薪
- 自动计算工作时长和工资
- 日历视图查看排班安排
- 支持设置休息时长（0.5小时、1小时、1.5小时、2小时）

### 工资计算
- 根据工作时长和时薪自动计算工资
- 支持不同店铺设置不同的时薪（白班时薪和夜班时薪）
- 工资统计和汇总
- 休息时长会从工作时长中扣除后再计算工资

### 居家购物清单管理
- 添加、编辑、删除购物项
- 支持商品分类（食品饮料、日用品、清洁用品等）
- 设置商品优先级（高、中、低）
- 记录商品数量、单位和价格
- 标记商品为已购买/未购买状态
- 统计购物清单总金额和购买状态
- 支持按类别、优先级和创建时间排序
- 支持过滤已购买和未购买的商品

### 电商商品管理
- 添加、编辑、删除商品
- 商品分类管理
- 超市管理
- 商品与超市关联
- 行级安全策略确保数据安全

### 智能穿搭助理
- 查看今日天气
- 读取个人衣柜（Supabase数据库）
- 根据天气生成今日穿搭推荐
- 上传衣服图片并管理衣柜
- 保存每日穿搭历史
- 在主页导航栏增加入口，跳转到新页面
- **网络穿搭推荐**：根据当前天气条件，自动从网络获取相关的穿搭推荐图片

#### 网络穿搭推荐配置
智能穿搭助理支持从Pexels获取高质量的穿搭推荐图片。要启用此功能，您需要：

1. 在 [Pexels](https://www.pexels.com/api/) 注册并获取API Key
2. 更新 `.env.local` 文件中的相应配置：
   ```
   # Pexels API Key (用于获取高质量穿搭图片)
   PEXELS_API_KEY=your_pexels_api_key_here
   ```

网络穿搭推荐功能会使用Pexels API获取高质量的穿搭图片，并在穿搭推荐页面展示。

## 文档

- [LOCAL_SUPABASE_SETUP.md](LOCAL_SUPABASE_SETUP.md) - 本地Supabase开发环境设置
- [ONLINE_SUPABASE_SETUP.md](ONLINE_SUPABASE_SETUP.md) - 线上Supabase数据库设置
- [DATABASE_MIGRATION.md](DATABASE_MIGRATION.md) - 数据库迁移指南
- [DATABASE_SETUP_SUMMARY.md](DATABASE_SETUP_SUMMARY.md) - 数据库设置总结
- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - 实现总结报告
- [ECOMMERCE_TROUBLESHOOTING.md](ECOMMERCE_TROUBLESHOOTING.md) - 电商功能故障排查指南
## 开发指南

### 添加新功能
1. 在数据库中创建相应的表结构
2. 更新 [src/types/supabase.ts](src/types/supabase.ts) 类型定义
3. 创建相应的服务层函数
4. 实现前端页面和组件

### 数据库迁移
1. 在 [supabase/migrations/](supabase/migrations/) 目录中添加新的迁移文件
2. 运行 `supabase db reset` 应用迁移

## 故障排除

如果遇到问题，请检查：

1. 环境变量是否正确设置
2. Supabase项目是否正确配置
3. 网络连接是否正常
4. 控制台是否有错误信息

### 常见电商功能错误

如果在添加商品时遇到403 Forbidden错误，可能是由于products表缺少INSERT策略。请参考[ECOMMERCE_TROUBLESHOOTING.md](ECOMMERCE_TROUBLESHOOTING.md)中的解决方案。

## 许可证

本项目仅供学习和参考使用。