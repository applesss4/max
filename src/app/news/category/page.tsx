'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { Database } from '@/types/supabase';

type NewsItem = Database['public']['Tables']['news']['Row'];

export default function CategoryNewsPage() {
  const [newsBySource, setNewsBySource] = useState<Record<string, NewsItem[]>>({});
  const [activeCategory, setActiveCategory] = useState('社会');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        // 按来源分组新闻
        const grouped = data.reduce((acc, n) => {
          if (!acc[n.source]) {
            acc[n.source] = [];
          }
          acc[n.source].push(n);
          return acc;
        }, {} as Record<string, NewsItem[]>);

        setNewsBySource(grouped);
      } catch (err) {
        setError('获取新闻时发生错误');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchNews();
  }, []);

  const categories = ['社会', '政治', '経済'];

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">日本新闻（社会/政治/经济）</h1>
          <Link href="/news" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            返回
          </Link>
        </div>
        <div>加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">日本新闻（社会/政治/经济）</h1>
          <Link href="/news" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            返回
          </Link>
        </div>
        <div className="text-red-500">错误: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">日本新闻（社会/政治/经济）</h1>
        <Link href="/news" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          返回
        </Link>
      </div>

      {/* 类别切换 */}
      <div className="flex flex-wrap gap-4 mb-6">
        {categories.map(c => (
          <button
            key={c}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeCategory === c 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
            onClick={() => setActiveCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {/* 按来源展示新闻 */}
      {Object.entries(newsBySource).map(([source, items]) => {
        // 过滤当前类别的新闻
        const filteredItems = items.filter(n => n.category === activeCategory);
        
        // 如果该来源没有当前类别的新闻，则不显示该来源
        if (filteredItems.length === 0) return null;
        
        return (
          <div key={source} className="mb-8">
            <h2 className="text-xl font-semibold mb-4 pb-2 border-b">{source}</h2>
            <ul className="space-y-4">
              {filteredItems.map(n => (
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
                    {new Date(n.pub_date).toLocaleString('zh-CN')}
                  </div>
                  {n.summary && (
                    <p className="text-gray-700 mt-2">
                      {n.summary.length > 200 ? `${n.summary.substring(0, 200)}...` : n.summary}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}