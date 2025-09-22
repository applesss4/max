'use client';

import { useRouter } from 'next/navigation';
import React from 'react';

// 功能卡片组件
const FeatureCard = ({ 
  title, 
  description, 
  icon, 
  onClick 
}: { 
  title: string; 
  description: string; 
  icon: React.ReactNode; 
  onClick: () => void 
}) => (
  <div 
    onClick={onClick}
    className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition duration-300 cursor-pointer"
  >
    <div className="flex items-center mb-4">
      <div className="bg-gray-100 p-2 rounded-lg mr-3">
        {icon}
      </div>
      <h3 className="text-lg font-medium text-gray-800">{title}</h3>
    </div>
    <p className="text-gray-600 text-sm mb-4">{description}</p>
    <button className="text-sm font-medium text-blue-600 hover:text-blue-800 transition duration-300">
      点击进入 →
    </button>
  </div>
);

export default function TestNewsDashboard() {
  const router = useRouter();
  
  // 功能卡片列表
  const featureCards = [
    {
      title: '排班表',
      description: '管理您的工作排班和工资计算',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      onClick: () => router.push('/work-schedule')
    },
    {
      title: '居家购物',
      description: '管理您的购物清单和预算',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      onClick: () => router.push('/shopping')
    },
    {
      title: '日本新闻',
      description: '查看最新的日本新闻',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      ),
      onClick: () => router.push('/news')
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-800">个人生活管家</h1>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区域 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">欢迎回来，测试用户</h2>
          <p className="text-gray-600 mb-8">您的个人生活管家主页</p>
          
          {/* 功能卡片网格 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {featureCards.map((card, index) => (
              <FeatureCard
                key={index}
                title={card.title}
                description={card.description}
                icon={card.icon}
                onClick={card.onClick}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}