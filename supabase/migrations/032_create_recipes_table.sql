-- 创建菜谱表
CREATE TABLE IF NOT EXISTS recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- 创建菜谱表的RLS策略
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的菜谱
CREATE POLICY "用户只能查看自己的菜谱"
ON recipes FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 用户只能插入自己的菜谱
CREATE POLICY "用户只能插入自己的菜谱"
ON recipes FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 用户只能更新自己的菜谱
CREATE POLICY "用户只能更新自己的菜谱"
ON recipes FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- 用户只能删除自己的菜谱
CREATE POLICY "用户只能删除自己的菜谱"
ON recipes FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- 创建索引
CREATE INDEX idx_recipes_user_id ON recipes(user_id);
CREATE INDEX idx_recipes_created_at ON recipes(created_at DESC);