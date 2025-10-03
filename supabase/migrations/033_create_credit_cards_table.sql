-- 创建信用卡表
CREATE TABLE IF NOT EXISTS credit_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  card_name TEXT NOT NULL,
  card_number_last_4 TEXT NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  monthly_payment DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  payment_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建信用卡表的RLS策略
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的信用卡
CREATE POLICY "用户只能查看自己的信用卡"
ON credit_cards FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 用户只能插入自己的信用卡
CREATE POLICY "用户只能插入自己的信用卡"
ON credit_cards FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 用户只能更新自己的信用卡
CREATE POLICY "用户只能更新自己的信用卡"
ON credit_cards FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- 用户只能删除自己的信用卡
CREATE POLICY "用户只能删除自己的信用卡"
ON credit_cards FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- 创建索引
CREATE INDEX idx_credit_cards_user_id ON credit_cards(user_id);
CREATE INDEX idx_credit_cards_payment_date ON credit_cards(payment_date);