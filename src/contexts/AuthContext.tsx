'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { User } from '@supabase/supabase-js'

// 创建认证上下文
interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// 认证提供者组件
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // 检查用户登录状态（优化版本）
  const checkUser = useCallback(async () => {
    try {
      // 首先检查内存中的状态
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
    } catch (error) {
      console.error('Error checking user session:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // 监听认证状态变化（优化版本）
  const setupAuthListener = useCallback(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
      // 只在初始加载时设置loading为false
      if (loading) {
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [loading])

  // 设置认证监听器的副作用
  useEffect(() => {
    checkUser()
    const unsubscribe = setupAuthListener()
    return () => unsubscribe()
  }, [checkUser, setupAuthListener])

  // 登录函数（优化版本）
  const login = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { success: false, error: error.message }
      }

      setUser(data.user)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message || '登录失败' }
    }
  }, [])

  // 登出函数（优化版本）
  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }, [])

  const value = {
    user,
    login,
    logout,
    loading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// 自定义Hook用于访问认证上下文
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}