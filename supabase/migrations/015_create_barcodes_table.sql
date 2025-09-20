-- 创建条形码信息表
CREATE TABLE IF NOT EXISTS barcodes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  barcode_value VARCHAR(255) NOT NULL, -- 条形码值
  barcode_type VARCHAR(50) NOT NULL, -- 条形码类型 (如: EAN-13, QR Code等)
  product_name VARCHAR(255), -- 产品名称
  product_description TEXT, -- 产品描述
  product_price DECIMAL(10,2), -- 产品价格
  product_category VARCHAR(100), -- 产品分类
  product_image_url TEXT, -- 产品图片URL
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- 扫描时间
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 为条形码表创建索引
CREATE INDEX IF NOT EXISTS idx_barcodes_user_id ON barcodes(user_id);
CREATE INDEX IF NOT EXISTS idx_barcodes_barcode_value ON barcodes(barcode_value);
CREATE INDEX IF NOT EXISTS idx_barcodes_scanned_at ON barcodes(scanned_at);

-- 启用行级安全策略 (RLS)
ALTER TABLE barcodes ENABLE ROW LEVEL SECURITY;

-- 创建行级安全策略
-- 用户可以查看自己的条形码
CREATE POLICY "用户可以查看自己的条形码" ON barcodes
  FOR SELECT USING (auth.uid() = user_id);

-- 用户可以插入自己的条形码
CREATE POLICY "用户可以插入自己的条形码" ON barcodes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 用户可以更新自己的条形码
CREATE POLICY "用户可以更新自己的条形码" ON barcodes
  FOR UPDATE USING (auth.uid() = user_id);

-- 用户可以删除自己的条形码
CREATE POLICY "用户可以删除自己的条形码" ON barcodes
  FOR DELETE USING (auth.uid() = user_id);

-- 创建自动更新updated_at字段的触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_barcodes_updated_at ON barcodes;
CREATE TRIGGER update_barcodes_updated_at 
  BEFORE UPDATE ON barcodes 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 启用实时功能
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS barcodes;