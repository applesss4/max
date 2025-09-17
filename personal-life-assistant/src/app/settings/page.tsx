'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import ShopHourlyRates from '@/components/ShopHourlyRates'

export default function SettingsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

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

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    // 验证密码
    if (newPassword !== confirmPassword) {
      setMessage('新密码和确认密码不匹配')
      setSaving(false)
      return
    }

    if (newPassword.length < 6) {
      setMessage('密码长度至少为6位')
      setSaving(false)
      return
    }

    try {
      // 这里应该调用Supabase API来更改密码
      // 由于我们还没有实现完整功能，这里只是模拟
      await new Promise(resolve => setTimeout(resolve, 1000))
      setMessage('密码更改成功！')
      
      // 清空表单
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      
      // 3秒后清除消息
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('密码更改失败，请重试')
      console.error('Password change error:', error)
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
                <h1 className="text-xl font-semibold text-cream-text-dark">设置</h1>
              </div>
            </div>
          </div>
        </header>

        {/* 主内容区域 */}
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-cream-card rounded-2xl shadow-sm p-6 border border-cream-border mb-6">
            <h2 className="text-lg font-medium text-cream-text-dark mb-4">更改密码</h2>
            
            {message && (
              <div className={`mb-4 p-3 rounded-lg text-sm ${
                message.includes('成功') 
                  ? 'bg-green-50 text-green-700' 
                  : 'bg-red-50 text-red-700'
              }`}>
                {message}
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-cream-text-dark mb-2">
                  当前密码
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-cream-border focus:outline-none focus:ring-2 focus:ring-cream-accent focus:border-transparent bg-cream-input text-cream-text"
                  placeholder="请输入当前密码"
                  required
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-cream-text-dark mb-2">
                  新密码
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-cream-border focus:outline-none focus:ring-2 focus:ring-cream-accent focus:border-transparent bg-cream-input text-cream-text"
                  placeholder="请输入新密码"
                  required
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-cream-text-dark mb-2">
                  确认新密码
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-cream-border focus:outline-none focus:ring-2 focus:ring-cream-accent focus:border-transparent bg-cream-input text-cream-text"
                  placeholder="请再次输入新密码"
                  required
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-cream-accent hover:bg-cream-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cream-accent transition duration-300 disabled:opacity-50"
                >
                  {saving ? '保存中...' : '更改密码'}
                </button>
              </div>
            </form>
          </div>

          {/* 店铺时薪设置展示 */}
          <ShopHourlyRates userId={user.id} />

          <div className="bg-cream-card rounded-2xl shadow-sm p-6 border border-cream-border mt-6">
            <h2 className="text-lg font-medium text-cream-text-dark mb-4">账户管理</h2>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-cream-text-dark">删除账户</p>
                <p className="text-cream-text-light text-sm">此操作不可撤销，请谨慎操作</p>
              </div>
              <button
                onClick={() => {
                  if (confirm('确定要删除您的账户吗？此操作不可撤销。')) {
                    // 这里应该调用删除账户的API
                    alert('账户删除功能将在后续版本中实现')
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800 border border-red-600 rounded-lg hover:bg-red-50 transition duration-300"
              >
                删除账户
              </button>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}