'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // 如果用户未登录且不在加载状态，重定向到登录页面
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // 显示加载状态或渲染子组件
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

  // 如果用户已登录，渲染子组件
  if (user) {
    return <>{children}</>
  }

  // 如果用户未登录，不渲染任何内容（将重定向）
  return null
}