'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

interface NewsItem {
  id: string;
  title: string;
  link: string;
  pub_date: string;
  summary: string;
  source: string;
  category: string | null;
  created_at: string;
}

export default function NewsPage() {
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [filteredNews, setFilteredNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeSource, setActiveSource] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNews() {
      try {
        setLoading(true);
        setError(null);
        const { data, error } = await supabase
          .from('news')
          .select('*')
          .order('pub_date', { ascending: false })
          .limit(100);
        
        if (error) {
          setError(error.message);
          return;
        }
        
        setNewsList(data || []);
        setFilteredNews(data || []);
      } catch (err) {
        setError('获取新闻时发生错误');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchNews();
  }, []);

  // 根据分类和来源筛选新闻
  useEffect(() => {
    let result = [...newsList];
    
    if (activeCategory) {
      result = result.filter(item => item.category === activeCategory);
    }
    
    if (activeSource) {
      result = result.filter(item => item.source === activeSource);
    }
    
    setFilteredNews(result);
  }, [activeCategory, activeSource, newsList]);

  // 添加刷新功能
  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('pub_date', { ascending: false })
        .limit(100);
      
      if (error) {
        setError(error.message);
        return;
      }
      
      setNewsList(data || []);
      setFilteredNews(data || []);
    } catch (err) {
      setError('刷新新闻时发生错误');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 获取所有分类
  const categories = Array.from(new Set(newsList.map(item => item.category).filter(Boolean))) as string[];
  
  // 获取所有来源
  const sources = Array.from(new Set(newsList.map(item => item.source))) as string[];

  if (loading && newsList.length === 0) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">日本新闻</h1>
        <div>加载中...</div>
      </div>
    );
  }

  if (error && newsList.length === 0) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">日本新闻</h1>
        <div className="text-red-500">错误: {error}</div>
        <button 
          onClick={handleRefresh}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          重新加载
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <h1 className="text-2xl font-bold">日本新闻</h1>
        <div className="flex flex-wrap gap-2">
          <Link 
            href="/news/category"
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            分类浏览
          </Link>
          <button 
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? '刷新中...' : '刷新'}
          </button>
        </div>
      </div>
      
      {/* 分类筛选 */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="font-medium">分类:</span>
          <button
            className={`px-3 py-1 rounded-full text-sm ${
              activeCategory === null 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => setActiveCategory(null)}
          >
            全部
          </button>
          {categories.map(category => (
            <button
              key={category}
              className={`px-3 py-1 rounded-full text-sm ${
                activeCategory === category 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => setActiveCategory(category === activeCategory ? null : category)}
            >
              {category}
            </button>
          ))}
        </div>
        
        <div className="flex flex-wrap gap-2">
          <span className="font-medium">来源:</span>
          <button
            className={`px-3 py-1 rounded-full text-sm ${
              activeSource === null 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => setActiveSource(null)}
          >
            全部
          </button>
          {sources.map(source => (
            <button
              key={source}
              className={`px-3 py-1 rounded-full text-sm ${
                activeSource === source 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => setActiveSource(source === activeSource ? null : source)}
            >
              {source}
            </button>
          ))}
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          错误: {error}
        </div>
      )}
      
      {filteredNews.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">暂无新闻数据</p>
          <button 
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            获取新闻
          </button>
        </div>
      ) : (
        <ul className="space-y-4">
          {filteredNews.map((n) => (
            <li key={n.id} className="border-b pb-4">
              <a 
                href={n.link} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-600 hover:text-blue-800 text-lg font-medium hover:underline"
              >
                {n.title}
              </a>
              <div className="text-gray-500 text-sm mt-1">
                {new Date(n.pub_date).toLocaleString('zh-CN')} | 来源: {n.source} {n.category && `| 分类: ${n.category}`}
              </div>
              {n.summary && (
                <p className="text-gray-700 mt-2">
                  {n.summary.length > 200 ? `${n.summary.substring(0, 200)}...` : n.summary}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}