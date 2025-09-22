-- Create news table for storing RSS feed items
CREATE TABLE news (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  link TEXT UNIQUE NOT NULL,
  pub_date TIMESTAMP WITH TIME ZONE NOT NULL,
  summary TEXT,
  source VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_news_pub_date ON news(pub_date);
CREATE INDEX idx_news_source ON news(source);

-- Enable RLS for news table
ALTER TABLE news ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access for all users (news is public)
CREATE POLICY "新闻对所有人可读" ON news
  FOR SELECT USING (true);

-- Create policy to allow insert access for authenticated users
CREATE POLICY "认证用户可以插入新闻" ON news
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create policy to allow update access for authenticated users
CREATE POLICY "认证用户可以更新新闻" ON news
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Create policy to allow delete access for authenticated users
CREATE POLICY "认证用户可以删除新闻" ON news
  FOR DELETE USING (auth.role() = 'authenticated');