'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import React from 'react'

export default function SchedulePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // 显示加载状态
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-bg">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cream-accent"></div>
          <p className="mt-2 text-cream-text-dark">加载中...</p>
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
                <button 
                  onClick={() => router.push('/dashboard')}
                  className="text-cream-text-dark hover:text-cream-accent mr-4"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
                <h1 className="text-xl font-semibold text-cream-text-dark">排班表</h1>
              </div>
            </div>
          </div>
        </header>

        {/* 主内容区域 */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-cream-text-dark mb-4">排班表功能</h2>
            <p className="text-cream-text-light mb-8">这里将显示您的排班信息</p>
            <button
              onClick={() => router.push('/work-schedule')}
              className="px-4 py-2 text-sm font-medium text-white bg-cream-accent hover:bg-cream-accent-hover rounded-lg transition duration-300"
            >
              前往完整排班表功能
            </button>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}