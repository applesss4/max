'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  // 初始化用户信息
  useEffect(() => {
    if (user) {
      setName(user.user_metadata?.name || '')
      setEmail(user.email || '')
    }
  }, [user])

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

  // 如果没有用户信息，重定向到登录页面
  if (!user) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      // 这里应该调用Supabase API来更新用户信息
      // 由于我们还没有实现完整的用户资料功能，这里只是模拟
      await new Promise(resolve => setTimeout(resolve, 1000))
      setMessage('资料更新成功！')
      
      // 3秒后清除消息
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('更新失败，请重试')
      console.error('Update error:', error)
    } finally {
      setSaving(false)
    }
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
                  onClick={() => router.back()}
                  className="text-cream-text-dark hover:text-cream-accent mr-4"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
                <h1 className="text-xl font-semibold text-cream-text-dark">个人资料</h1>
              </div>
            </div>
          </div>
        </header>

        {/* 主内容区域 */}
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-cream-card rounded-2xl shadow-sm p-6 border border-cream-border">
            <div className="flex items-center mb-6">
              <div className="w-16 h-16 rounded-full bg-cream-accent flex items-center justify-center text-white font-medium text-xl mr-4">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h2 className="text-lg font-medium text-cream-text-dark">{user?.email?.split('@')[0] || '用户'}</h2>
                <p className="text-cream-text-light text-sm">{user?.email}</p>
              </div>
            </div>

            {message && (
              <div className={`mb-4 p-3 rounded-lg text-sm ${
                message.includes('成功') 
                  ? 'bg-green-50 text-green-700' 
                  : 'bg-red-50 text-red-700'
              }`}>
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-cream-text-dark mb-2">
                  姓名
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-cream-border focus:outline-none focus:ring-2 focus:ring-cream-accent focus:border-transparent bg-cream-input text-cream-text"
                  placeholder="请输入您的姓名"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-cream-text-dark mb-2">
                  邮箱地址
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-cream-border focus:outline-none focus:ring-2 focus:ring-cream-accent focus:border-transparent bg-cream-input text-cream-text"
                  placeholder="请输入邮箱"
                  disabled
                />
                <p className="mt-1 text-sm text-cream-text-light">邮箱地址不可更改</p>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-cream-accent hover:bg-cream-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cream-accent transition duration-300 disabled:opacity-50"
                >
                  {saving ? '保存中...' : '保存更改'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}