-- 创建排班表共享表
CREATE TABLE schedule_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id UUID REFERENCES work_schedules(id) ON DELETE CASCADE NOT NULL,
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shared_with_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 为排班表共享表创建索引
CREATE INDEX idx_schedule_shares_schedule_id ON schedule_shares(schedule_id);
CREATE INDEX idx_schedule_shares_owner_user_id ON schedule_shares(owner_user_id);
CREATE INDEX idx_schedule_shares_shared_with_user_id ON schedule_shares(shared_with_user_id);

-- 排班表共享表策略
CREATE POLICY "用户只能查看自己共享的排班表" ON schedule_shares
  FOR ALL USING (auth.uid() = owner_user_id OR auth.uid() = shared_with_user_id);

-- 启用排班表共享表的行级安全策略
ALTER TABLE schedule_shares ENABLE ROW LEVEL SECURITY;

-- 创建自动更新updated_at字段的触发器
CREATE TRIGGER update_schedule_shares_updated_at 
  BEFORE UPDATE ON schedule_shares 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();