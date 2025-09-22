-- Add category column to news table
ALTER TABLE news 
ADD COLUMN IF NOT EXISTS category VARCHAR(100);

-- Create index for better query performance on category
CREATE INDEX IF NOT EXISTS idx_news_category ON news(category);