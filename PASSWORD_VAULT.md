# 密码保险箱功能说明

## 功能概述
密码保险箱是一个安全的密码管理功能，允许用户存储和管理各种账户的密码。所有密码在存储前都会进行加密处理，确保数据安全。

## 技术实现

### 数据库设计
- 表名: `password_vault`
- 字段:
  - `id`: UUID主键
  - `user_id`: 关联用户ID
  - `title`: 密码项标题（如网站名称）
  - `username`: 用户名
  - `password`: 加密后的密码
  - `url`: 网站URL
  - `notes`: 备注信息
  - `created_at`: 创建时间
  - `updated_at`: 更新时间

### 安全特性
1. **密码加密**: 使用AES加密算法对密码进行加密存储
2. **环境密钥**: 使用环境变量中的密钥进行加密
3. **行级安全**: Supabase RLS确保用户只能访问自己的数据

### 前端功能
1. **密码项管理**: 添加、编辑、删除密码项
2. **密码显示控制**: 可控制密码的显示与隐藏
3. **搜索功能**: 支持按标题、用户名、URL搜索
4. **响应式设计**: 适配各种屏幕尺寸

## 使用说明

### 访问密码保险箱
1. 登录系统后进入仪表盘
2. 点击"密码保险箱"功能卡片
3. 进入密码保险箱页面

### 添加密码项
1. 点击"添加密码"按钮
2. 填写表单信息（标题和密码为必填项）
3. 点击"添加"保存

### 查看密码
1. 在密码项列表中找到对应项
2. 点击"显示"按钮查看明文密码
3. 点击"隐藏"按钮隐藏密码

### 编辑密码项
1. 点击密码项右上角的编辑图标
2. 修改表单信息
3. 点击"保存"更新

### 删除密码项
1. 点击密码项右上角的删除图标
2. 确认删除操作

## 安全建议
1. 定期更换环境变量中的加密密钥
2. 不要在客户端代码中硬编码密钥
3. 建议使用强密码作为加密密钥
4. 定期备份数据库

## 环境配置
在 `.env.local` 文件中添加以下配置：
```
NEXT_PUBLIC_ENCRYPTION_KEY=your-32-character-encryption-key
```

## 数据库迁移
运行以下SQL创建表结构：
```sql
CREATE TABLE password_vault (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  username VARCHAR(255),
  password TEXT NOT NULL,
  url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_password_vault_user_id ON password_vault(user_id);
CREATE INDEX idx_password_vault_title ON password_vault(title);

ALTER TABLE password_vault ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户只能查看自己的密码项" ON password_vault
  FOR ALL USING (auth.uid() = user_id);

CREATE TRIGGER update_password_vault_updated_at 
  BEFORE UPDATE ON password_vault 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
```