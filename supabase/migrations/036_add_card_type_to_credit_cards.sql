-- 为信用卡表添加类型字段
ALTER TABLE credit_cards 
ADD COLUMN IF NOT EXISTS card_type TEXT NOT NULL DEFAULT 'installment';

-- 添加注释说明
COMMENT ON COLUMN credit_cards.card_type IS '信用卡类型: installment(分期), non_installment(不分期)';