# 智能穿搭助理开发文档

## 项目目标

在现有网页上增加一个"智能穿搭助理"功能，用户可：

1. 读取个人衣柜（Supabase 数据库）
2. 生成今日穿搭推荐
3. 上传衣服图片并管理衣柜
4. 保存每日穿搭历史
5. 在主页导航栏增加入口，跳转到新页面

## 技术架构

### 前端技术栈
- Next.js 15.5.3 (App Router)
- React 19.1.0
- TypeScript
- Tailwind CSS

### 后端技术栈
- Supabase (数据库和认证)
- Supabase Realtime (实时功能)

### 数据库表结构

#### wardrobe_items (衣柜物品表)
```sql
CREATE TABLE wardrobe_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL, -- 上衣、裤子、鞋子、配饰等
  color VARCHAR(50), -- 颜色
  season VARCHAR(50), -- 春、夏、秋、冬、四季
  image_url TEXT, -- 衣服图片URL
  purchase_date DATE, -- 购买日期
  brand VARCHAR(100), -- 品牌
  notes TEXT, -- 备注
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### outfit_history (穿搭历史表)
```sql
CREATE TABLE outfit_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  outfit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  items JSONB, -- 穿搭物品列表 [{id, name, category, image_url}]
  notes TEXT, -- 穿搭备注
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 功能实现

### 1. 数据库迁移
创建文件: `supabase/migrations/020_create_wardrobe_and_outfit_tables.sql`

### 2. 类型定义
更新文件: `src/types/supabase.ts`

### 3. 服务层
创建文件: `src/services/outfitService.ts`

### 4. 导航入口
更新文件: `src/app/dashboard/page.tsx`

## API接口

### 获取衣柜物品
```typescript
getWardrobeItems(userId: string)
```

### 添加衣柜物品
```typescript
addWardrobeItem(item: WardrobeItemInsert)
```

### 更新衣柜物品
```typescript
updateWardrobeItem(id: string, updates: WardrobeItemUpdate)
```

### 删除衣柜物品
```typescript
deleteWardrobeItem(id: string)
```

### 获取穿搭历史
```typescript
getOutfitHistory(userId: string)
```

### 保存穿搭历史
```typescript
saveOutfitHistory(outfit: OutfitHistoryInsert)
```

### 生成穿搭推荐
```typescript
generateOutfitRecommendation(wardrobeItems: WardrobeItem[], preferences: { season?: string, style?: string })
```

## 前端组件

### 页面结构
- 顶部导航栏
- 标签页导航 (今日推荐 / 我的衣柜 / 穿搭历史)
- 今日推荐面板
- 我的衣柜面板
- 穿搭历史面板

### 样式
使用项目现有的奶油色调设计系统:
- 背景色: `bg-cream-bg`
- 卡片色: `bg-cream-card`
- 文字色: `text-cream-text-dark`, `text-cream-text`, `text-cream-text-light`
- 主色调: `text-cream-accent`, `bg-cream-accent`

## 安全性

### 行级安全策略 (RLS)
为两个新表启用RLS并设置策略:
```sql
-- 衣柜表策略
CREATE POLICY "用户只能查看自己的衣柜物品" ON wardrobe_items
  FOR ALL USING (auth.uid() = user_id);

-- 穿搭历史表策略
CREATE POLICY "用户只能查看自己的穿搭历史" ON outfit_history
  FOR ALL USING (auth.uid() = user_id);
```

## 部署步骤

1. 应用数据库迁移:
   ```bash
   supabase db reset
   ```

2. 验证类型定义更新:
   检查 `src/types/supabase.ts` 文件是否包含新表的类型定义

3. 部署前端页面:
   确保相关页面文件存在并正确实现

4. 更新导航入口:
   确保仪表板页面已添加智能穿搭助理的入口

## 测试计划

### 功能测试
1. 验证用户可以访问智能穿搭助理页面
2. 验证衣柜物品可以添加、编辑、删除
3. 验证穿搭推荐功能正常工作
4. 验证穿搭历史可以保存和查看

### 安全测试
1. 验证用户只能访问自己的数据
2. 验证未登录用户无法访问页面
3. 验证RLS策略正确应用

### 性能测试
1. 验证页面加载速度
2. 验证大量衣柜物品时的性能表现
3. 验证图片上传和显示性能

## 后续优化建议

1. 添加更复杂的穿搭推荐算法
2. 支持穿搭评分和反馈
3. 添加穿搭搭配预览功能
4. 支持社交分享功能
5. 添加季节性衣柜整理建议