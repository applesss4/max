-- 创建密码保险箱表
CREATE TABLE password_vault (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  username VARCHAR(255),
  password TEXT NOT NULL,
  url TEXT,
  notes TEXT,
  software_name VARCHAR(255), -- 新增软件名字段
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 为密码保险箱表创建索引
CREATE INDEX idx_password_vault_user_id ON password_vault(user_id);
CREATE INDEX idx_password_vault_title ON password_vault(title);
CREATE INDEX idx_password_vault_software_name ON password_vault(software_name); -- 为软件名创建索引

-- 启用行级安全策略 (RLS)
ALTER TABLE password_vault ENABLE ROW LEVEL SECURITY;

-- 创建行级安全策略
-- 用户只能查看自己的密码项
CREATE POLICY "用户只能查看自己的密码项" ON password_vault
  FOR ALL USING (auth.uid() = user_id);

-- 创建自动更新updated_at字段的触发器
CREATE TRIGGER update_password_vault_updated_at 
  BEFORE UPDATE ON password_vault 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();