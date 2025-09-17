# 居家购物功能使用说明

## 功能概述

居家购物功能是一个便捷的购物清单管理系统，帮助用户管理日常购物需求。用户可以添加、编辑、删除购物项，设置商品分类、优先级、数量、价格等信息，并跟踪购买状态。

## 主要特性

1. **购物项管理**
   - 添加新的购物项
   - 编辑现有购物项
   - 删除购物项
   - 标记购物项为已购买/未购买状态

2. **商品信息管理**
   - 商品名称
   - 商品分类（食品饮料、日用品、清洁用品等）
   - 数量和单位（个、瓶、盒、公斤等）
   - 单价（日元）
   - 优先级（高、中、低）
   - 备注信息

3. **统计功能**
   - 购物项总数统计
   - 已购买/未购买商品数量统计
   - 购物清单总金额计算
   - 已购买/未购买商品金额统计

4. **筛选和排序**
   - 按购买状态筛选（全部、已购买、未购买）
   - 按创建时间、优先级、类别排序

## 使用指南

### 添加购物项

1. 点击页面右上角的"添加购物项"按钮
2. 在弹出的表单中填写商品信息：
   - 商品名称（必填）
   - 商品分类（默认为"食品饮料"）
   - 数量（默认为1）
   - 单位（默认为"个"）
   - 单价（日元，默认为0）
   - 优先级（默认为"中"）
   - 备注（可选）
3. 点击"添加"按钮保存购物项

### 编辑购物项

1. 找到要编辑的购物项
2. 点击购物项右侧的编辑图标（铅笔图标）
3. 在弹出的表单中修改商品信息
4. 点击"更新"按钮保存修改

### 删除购物项

1. 找到要删除的购物项
2. 点击购物项右侧的删除图标（垃圾桶图标）
3. 在确认对话框中点击"确定"删除购物项

### 标记购买状态

1. 找到要标记的购物项
2. 点击购物项左侧的复选框
3. 购物项会自动标记为已购买状态（显示删除线和"已购买"标签）
4. 再次点击复选框可取消购买状态

### 筛选和排序

1. 在页面顶部的筛选区域选择过滤条件：
   - "全部"：显示所有购物项
   - "已购买"：只显示已购买的购物项
   - "未购买"：只显示未购买的购物项
2. 在排序下拉菜单中选择排序方式：
   - "创建时间"：按创建时间倒序排列
   - "优先级"：按优先级高低排列
   - "类别"：按商品类别排序

## 数据库结构

购物功能使用`shopping_items`表存储数据，表结构如下：

```sql
CREATE TABLE shopping_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit VARCHAR(50) DEFAULT '个',
  price DECIMAL(10,2) DEFAULT 0.00,
  purchased BOOLEAN DEFAULT FALSE,
  priority VARCHAR(10) DEFAULT 'medium', -- low, medium, high
  notes TEXT,
  purchased_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## API接口

购物功能通过`shoppingService.ts`提供以下API接口：

1. `getUserShoppingItems(userId)` - 获取用户购物清单
2. `createShoppingItem(item)` - 创建购物项
3. `updateShoppingItem(id, updates)` - 更新购物项
4. `deleteShoppingItem(id)` - 删除购物项

## 前端组件

购物功能的主要前端组件位于`src/app/shopping/page.tsx`文件中，包含以下组件：

1. `ShoppingPage` - 主页面组件
2. `ShoppingItemComponent` - 购物项展示组件
3. 添加/编辑表单模态框

## 注意事项

1. 购物项数据与用户绑定，每个用户只能看到自己的购物清单
2. 购物项的单价和数量用于计算总金额
3. 购物项的优先级有助于用户确定购买顺序
4. 购物项的分类便于用户整理和查找商品
5. 所有操作都会实时更新数据库中的数据