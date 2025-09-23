'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState, useCallback, useMemo } from 'react'

// 优化功能卡片组件
const FeatureCard = React.memo(({ 
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
    className="bg-cream-card rounded-2xl shadow-sm p-6 border border-cream-border hover:shadow-md transition duration-300 cursor-pointer"
  >
    <div className="flex items-center mb-4">
      <div className="bg-cream-border p-2 rounded-lg mr-3">
        {icon}
      </div>
      <h3 className="text-lg font-medium text-cream-text">{title}</h3>
    </div>
    <p className="text-cream-text-light text-sm mb-4">{description}</p>
    <button className="text-sm font-medium text-cream-accent hover:text-cream-accent-hover transition duration-300">
      点击进入 →
    </button>
  </div>
))

FeatureCard.displayName = 'FeatureCard'

export default function DashboardPage() {
  const { user, logout, loading } = useAuth()
  const router = useRouter()
  const [showUserMenu, setShowUserMenu] = useState(false)
  
  // 优化功能卡片列表 - 提前定义，确保Hook顺序一致
  const featureCards = useMemo(() => {
    const cards = [
      {
        title: '排班表',
        description: '管理您的工作排班和工资计算',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cream-text-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        ),
        onClick: () => router.push('/work-schedule')
      },
      {
        title: '居家购物',
        description: '管理您的购物清单和预算',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cream-text-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        ),
        onClick: () => router.push('/shopping')
      },
      {
        title: '智能穿搭助理',
        description: '根据天气和衣柜生成每日穿搭推荐',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cream-text-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L4 16 2 18" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M22 18L20 16 18 18" />
          </svg>
        ),
        onClick: () => router.push('/outfit-assistant')
      }
    ];
    
    return cards;
  }, [router])

  // 处理重定向逻辑
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  const handleLogout = useCallback(async () => {
    await logout()
    router.push('/login')
  }, [logout, router])

  // 获取用户首字母用于头像显示
  const getUserInitials = useCallback(() => {
    if (!user?.email) return 'U'
    const name = user.email.split('@')[0]
    return name.charAt(0).toUpperCase()
  }, [user])

  // 显示加载状态
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-bg">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cream-accent"></div>
          <p className="mt-2 text-cream-text-dark">加载中...</p>
          <p className="mt-2 text-cream-text-light text-sm">正在检查用户认证状态</p>
        </div>
      </div>
    )
  }

  // 如果没有用户信息，不渲染仪表板内容
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-bg">
        <div className="text-center">
          <p className="text-cream-text-dark">未检测到用户信息，正在重定向到登录页面...</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-cream-bg">
        {/* 顶部导航栏 */}
        <header className="bg-cream-card shadow-sm border-b border-cream-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-cream-text-dark">个人生活管家</h1>
              </div>
              <div className="flex items-center">
                {/* 用户头像和菜单 */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 focus:outline-none"
                  >
                    <div className="w-8 h-8 rounded-full bg-cream-accent flex items-center justify-center text-white font-medium">
                      {getUserInitials()}
                    </div>
                    <span className="text-cream-text-dark text-sm hidden md:inline">
                      {user?.email?.split('@')[0]}
                    </span>
                  </button>

                  {/* 用户菜单下拉 */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-cream-card rounded-md shadow-lg py-1 border border-cream-border z-10">
                      <button
                        onClick={() => {
                          router.push('/profile')
                          setShowUserMenu(false)
                        }}
                        className="block px-4 py-2 text-sm text-cream-text-dark hover:bg-cream-bg w-full text-left"
                      >
                        个人资料
                      </button>
                      <button
                        onClick={() => {
                          router.push('/settings')
                          setShowUserMenu(false)
                        }}
                        className="block px-4 py-2 text-sm text-cream-text-dark hover:bg-cream-bg w-full text-left"
                      >
                        设置
                      </button>
                      <button
                        onClick={handleLogout}
                        className="block px-4 py-2 text-sm text-cream-text-dark hover:bg-cream-bg w-full text-left"
                      >
                        退出登录
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* 主内容区域 */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-cream-text-dark mb-4">欢迎回来，{user?.email?.split('@')[0]}</h2>
            <p className="text-cream-text-light mb-8">您的个人生活管家主页</p>
            
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
    </ProtectedRoute>
  )
}