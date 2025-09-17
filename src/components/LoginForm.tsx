'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { success, error } = await login(email, password)
      
      if (success) {
        // 登录成功，跳转到主页
        router.push('/dashboard')
      } else {
        setError(error || '登录失败')
      }
    } catch (err) {
      setError('登录过程中发生错误')
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-bg p-4">
      <div className="bg-cream-card rounded-2xl shadow-lg p-8 w-full max-w-md border border-cream-border">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-cream-text-dark mb-2">个人生活管家</h1>
          <p className="text-cream-text-light">请登录您的账户</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
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
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-cream-text-dark mb-2">
              密码
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-cream-border focus:outline-none focus:ring-2 focus:ring-cream-accent focus:border-transparent bg-cream-input text-cream-text"
              placeholder="请输入密码"
              required
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                className="h-4 w-4 text-cream-accent focus:ring-cream-accent border-cream-border rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-cream-text-dark">
                记住我
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-cream-accent hover:text-cream-accent-hover">
                忘记密码？
              </a>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-cream-accent hover:bg-cream-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cream-accent transition duration-300 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                登录中...
              </span>
            ) : (
              '登录'
            )}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-cream-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-cream-card text-cream-text-light">
                还没有账户？
              </span>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={() => router.push('/register')}
              className="w-full flex justify-center py-3 px-4 border border-cream-border rounded-xl shadow-sm text-sm font-medium text-cream-text-dark bg-cream-card hover:bg-cream-bg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cream-accent transition duration-300"
            >
              注册账户
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}