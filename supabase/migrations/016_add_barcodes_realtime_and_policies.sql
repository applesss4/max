-- 为条形码表启用实时功能和RLS策略

-- 确保表已启用行级安全策略
ALTER TABLE barcodes ENABLE ROW LEVEL SECURITY;

-- 删除现有的策略（如果存在）
DROP POLICY IF EXISTS "用户可以查看自己的条形码" ON barcodes;
DROP POLICY IF EXISTS "用户可以插入自己的条形码" ON barcodes;
DROP POLICY IF EXISTS "用户可以更新自己的条形码" ON barcodes;
DROP POLICY IF EXISTS "用户可以删除自己的条形码" ON barcodes;

-- 创建完整的行级安全策略
-- 1. 用户可以查看自己的条形码
CREATE POLICY "用户可以查看自己的条形码" ON barcodes
  FOR SELECT USING (auth.uid() = user_id);

-- 2. 用户可以插入自己的条形码
CREATE POLICY "用户可以插入自己的条形码" ON barcodes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. 用户可以更新自己的条形码
CREATE POLICY "用户可以更新自己的条形码" ON barcodes
  FOR UPDATE USING (auth.uid() = user_id);

-- 4. 用户可以删除自己的条形码
CREATE POLICY "用户可以删除自己的条形码" ON barcodes
  FOR DELETE USING (auth.uid() = user_id);

-- 为实时功能创建发布
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS barcodes;

-- 确保更新时间戳的函数存在
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- 创建或更新触发器
DROP TRIGGER IF EXISTS update_barcodes_updated_at ON barcodes;
CREATE TRIGGER update_barcodes_updated_at 
  BEFORE UPDATE ON barcodes 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 为条形码表创建索引
CREATE INDEX IF NOT EXISTS idx_barcodes_user_id ON barcodes(user_id);
CREATE INDEX IF NOT EXISTS idx_barcodes_barcode_value ON barcodes(barcode_value);
CREATE INDEX IF NOT EXISTS idx_barcodes_scanned_at ON barcodes(scanned_at);