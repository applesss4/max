-- 创建贷款表
CREATE TABLE IF NOT EXISTS loans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  loan_name TEXT NOT NULL,
  loan_type TEXT NOT NULL, -- 贷款类型：房贷、车贷、个人贷款等
  total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  monthly_payment DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  payment_date DATE NOT NULL,
  paid_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  periods INTEGER NOT NULL DEFAULT 1,
  interest_rate DECIMAL(5, 2) NOT NULL DEFAULT 0.00, -- 年利率
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建贷款表的RLS策略
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的贷款
CREATE POLICY "用户只能查看自己的贷款"
ON loans FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 用户只能插入自己的贷款
CREATE POLICY "用户只能插入自己的贷款"
ON loans FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 用户只能更新自己的贷款
CREATE POLICY "用户只能更新自己的贷款"
ON loans FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- 用户只能删除自己的贷款
CREATE POLICY "用户只能删除自己的贷款"
ON loans FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- 创建索引
CREATE INDEX idx_loans_user_id ON loans(user_id);
CREATE INDEX idx_loans_payment_date ON loans(payment_date);