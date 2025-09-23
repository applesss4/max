-- 创建衣柜表
CREATE TABLE wardrobe_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL, -- 上衣、裤子、鞋子、配饰等
  color VARCHAR(50), -- 颜色
  season VARCHAR(50), -- 春、夏、秋、冬、四季
  image_url TEXT, -- 衣服图片URL
  purchase_date DATE, -- 购买日期
  brand VARCHAR(100), -- 品牌
  notes TEXT, -- 备注
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 为衣柜表创建索引
CREATE INDEX idx_wardrobe_items_user_id ON wardrobe_items(user_id);
CREATE INDEX idx_wardrobe_items_category ON wardrobe_items(category);
CREATE INDEX idx_wardrobe_items_season ON wardrobe_items(season);

-- 衣柜表策略
CREATE POLICY "用户只能查看自己的衣柜物品" ON wardrobe_items
  FOR ALL USING (auth.uid() = user_id);

-- 启用衣柜表的行级安全策略
ALTER TABLE wardrobe_items ENABLE ROW LEVEL SECURITY;

-- 创建每日穿搭历史表
CREATE TABLE outfit_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  outfit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  items JSONB, -- 穿搭物品列表 [{id, name, category, image_url}]
  weather JSONB, -- 天气信息 {temperature, condition, humidity, etc.}
  notes TEXT, -- 穿搭备注
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 为穿搭历史表创建索引
CREATE INDEX idx_outfit_history_user_id ON outfit_history(user_id);
CREATE INDEX idx_outfit_history_outfit_date ON outfit_history(outfit_date);

-- 穿搭历史表策略
CREATE POLICY "用户只能查看自己的穿搭历史" ON outfit_history
  FOR ALL USING (auth.uid() = user_id);

-- 启用穿搭历史表的行级安全策略
ALTER TABLE outfit_history ENABLE ROW LEVEL SECURITY;

-- 创建自动更新updated_at字段的触发器
CREATE TRIGGER update_wardrobe_items_updated_at 
  BEFORE UPDATE ON wardrobe_items 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_outfit_history_updated_at 
  BEFORE UPDATE ON outfit_history 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();