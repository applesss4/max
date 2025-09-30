'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { encryptPassword, decryptPassword } from '@/services/encryptionService'

// 密码项类型定义
interface PasswordItem {
  id: string
  user_id: string
  title: string
  username: string
  password: string
  url: string
  notes: string
  software_name: string // 新增软件名字段
  created_at: string
  updated_at: string
}

export default function PasswordVaultPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [passwordItems, setPasswordItems] = useState<PasswordItem[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingItem, setEditingItem] = useState<PasswordItem | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({})

  // 表单状态
  const [formData, setFormData] = useState({
    title: '',
    username: '',
    password: '',
    url: '',
    notes: '',
    software_name: '' // 新增软件名字段
  })

  // 错误状态
  const [error, setError] = useState<string | null>(null)

  // 获取密码项列表
  const fetchPasswordItems = useCallback(async () => {
    if (!user) return

    try {
      setLoadingData(true)
      const { data, error } = await supabase
        .from('password_vault')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setPasswordItems(data || [])
    } catch (err) {
      console.error('获取密码项失败:', err)
      setError('获取密码项失败')
    } finally {
      setLoadingData(false)
    }
  }, [user])

  // 解密密码
  const getDecryptedPassword = (encryptedPassword: string): string => {
    try {
      return decryptPassword(encryptedPassword)
    } catch (error) {
      console.error('解密密码失败:', error)
      return '解密失败'
    }
  }

  // 切换密码显示/隐藏
  const togglePasswordVisibility = (id: string) => {
    setShowPassword(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  // 初始化数据
  useEffect(() => {
    if (user) {
      fetchPasswordItems()
    }
  }, [user, fetchPasswordItems])

  // 处理表单输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // 添加新密码项
  const handleAddPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) return

    try {
      // 加密密码
      const encryptedPassword = encryptPassword(formData.password)
      
      const newItem = {
        ...formData,
        password: encryptedPassword,
        user_id: user.id
      }

      const { error } = await supabase
        .from('password_vault')
        .insert([newItem])

      if (error) throw error

      // 重置表单并关闭模态框
      setFormData({
        title: '',
        username: '',
        password: '',
        url: '',
        notes: '',
        software_name: ''
      })
      setShowAddModal(false)
      fetchPasswordItems()
    } catch (err) {
      console.error('添加密码项失败:', err)
      setError('添加密码项失败')
    }
  }

  // 更新密码项
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || !editingItem) return

    try {
      // 加密密码
      const encryptedPassword = encryptPassword(formData.password)
      
      const { error } = await supabase
        .from('password_vault')
        .update({
          ...formData,
          password: encryptedPassword
        })
        .eq('id', editingItem.id)
        .eq('user_id', user.id)

      if (error) throw error

      // 重置状态并关闭模态框
      setEditingItem(null)
      setShowEditModal(false)
      fetchPasswordItems()
    } catch (err) {
      console.error('更新密码项失败:', err)
      setError('更新密码项失败')
    }
  }

  // 删除密码项
  const handleDeletePassword = async (id: string) => {
    if (!user) return

    if (window.confirm('确定要删除这个密码项吗？')) {
      try {
        const { error } = await supabase
          .from('password_vault')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id)

        if (error) throw error

        fetchPasswordItems()
      } catch (err) {
        console.error('删除密码项失败:', err)
        setError('删除密码项失败')
      }
    }
  }

  // 打开编辑模态框
  const openEditModal = (item: PasswordItem) => {
    setEditingItem(item)
    setFormData({
      title: item.title,
      username: item.username,
      password: decryptPassword(item.password), // 解密密码用于编辑
      url: item.url,
      notes: item.notes,
      software_name: item.software_name || ''
    })
    setShowEditModal(true)
  }

  // 过滤密码项
  const filteredItems = passwordItems.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.software_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.url.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // 处理返回仪表盘
  const handleBackToDashboard = () => {
    router.push('/dashboard')
  }

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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-cream-bg">
        {/* 顶部导航栏 */}
        <header className="bg-cream-card shadow-sm border-b border-cream-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center">
                <button
                  onClick={handleBackToDashboard}
                  className="flex items-center text-cream-accent hover:text-cream-accent-hover mr-4"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  返回仪表盘
                </button>
                <h1 className="text-xl font-semibold text-cream-text-dark">密码保险箱</h1>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-cream-accent hover:bg-cream-accent-hover text-white px-4 py-2 rounded-md text-sm font-medium transition duration-300"
              >
                添加密码
              </button>
            </div>
          </div>
        </header>

        {/* 主内容区域 */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* 搜索框 */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="搜索密码项..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-cream-border rounded-md focus:outline-none focus:ring-1 focus:ring-cream-accent"
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute right-3 top-2.5 text-cream-text-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-700">{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="ml-auto text-red-500 hover:text-red-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* 密码项列表 */}
          {loadingData ? (
            <div className="flex justify-center items-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cream-accent"></div>
              <span className="ml-2 text-cream-text-dark">加载密码项...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-cream-text-light mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h3 className="text-lg font-medium text-cream-text-dark mb-2">暂无密码项</h3>
              <p className="text-cream-text-light mb-4">点击"添加密码"按钮来添加您的第一个密码项</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-cream-accent hover:bg-cream-accent-hover text-white px-4 py-2 rounded-md text-sm font-medium transition duration-300"
              >
                添加密码
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => (
                <div key={item.id} className="bg-cream-card rounded-lg shadow-sm border border-cream-border p-4">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-medium text-cream-text-dark truncate">{item.title}</h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(item)}
                        className="text-cream-accent hover:text-cream-accent-hover"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeletePassword(item.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {item.software_name && (
                    <div className="mb-2">
                      <p className="text-sm text-cream-text-light">软件名</p>
                      <p className="text-cream-text-dark truncate">{item.software_name}</p>
                    </div>
                  )}
                  
                  {item.username && (
                    <div className="mb-2">
                      <p className="text-sm text-cream-text-light">用户名</p>
                      <p className="text-cream-text-dark truncate">{item.username}</p>
                    </div>
                  )}
                  
                  {item.password && (
                    <div className="mb-2">
                      <p className="text-sm text-cream-text-light">密码</p>
                      <div className="flex items-center">
                        <p className="text-cream-text-dark truncate">
                          {showPassword[item.id] ? getDecryptedPassword(item.password) : '••••••••'}
                        </p>
                        <button
                          onClick={() => togglePasswordVisibility(item.id)}
                          className="ml-2 text-cream-accent hover:text-cream-accent-hover text-sm"
                        >
                          {showPassword[item.id] ? '隐藏' : '显示'}
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {item.url && (
                    <div className="mb-2">
                      <p className="text-sm text-cream-text-light">网址</p>
                      <p className="text-cream-text-dark truncate text-sm">{item.url}</p>
                    </div>
                  )}
                  
                  <div className="text-xs text-cream-text-light mt-3">
                    创建于: {new Date(item.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* 添加密码模态框 */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-cream-card rounded-lg shadow-xl border border-cream-border w-full max-w-md">
              <div className="px-6 py-4 border-b border-cream-border flex justify-between items-center">
                <h3 className="text-lg font-medium text-cream-text-dark">添加密码项</h3>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    setFormData({
                      title: '',
                      username: '',
                      password: '',
                      url: '',
                      notes: '',
                      software_name: ''
                    })
                  }}
                  className="text-cream-text-light hover:text-cream-text-dark"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleAddPassword}>
                <div className="px-6 py-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-cream-text-dark mb-1">标题 *</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-cream-border rounded-md focus:outline-none focus:ring-1 focus:ring-cream-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-cream-text-dark mb-1">软件名</label>
                    <input
                      type="text"
                      name="software_name"
                      value={formData.software_name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-cream-border rounded-md focus:outline-none focus:ring-1 focus:ring-cream-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-cream-text-dark mb-1">用户名</label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-cream-border rounded-md focus:outline-none focus:ring-1 focus:ring-cream-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-cream-text-dark mb-1">密码 *</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-cream-border rounded-md focus:outline-none focus:ring-1 focus:ring-cream-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-cream-text-dark mb-1">网址</label>
                    <input
                      type="text"
                      name="url"
                      value={formData.url}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-cream-border rounded-md focus:outline-none focus:ring-1 focus:ring-cream-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-cream-text-dark mb-1">备注</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-cream-border rounded-md focus:outline-none focus:ring-1 focus:ring-cream-accent"
                    />
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-cream-border flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false)
                      setFormData({
                        title: '',
                        username: '',
                        password: '',
                        url: '',
                        notes: '',
                        software_name: ''
                      })
                    }}
                    className="px-4 py-2 border border-cream-border rounded-md text-cream-text-dark hover:bg-cream-bg transition duration-300"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-cream-accent hover:bg-cream-accent-hover text-white rounded-md transition duration-300"
                  >
                    添加
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 编辑密码模态框 */}
        {showEditModal && editingItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-cream-card rounded-lg shadow-xl border border-cream-border w-full max-w-md">
              <div className="px-6 py-4 border-b border-cream-border flex justify-between items-center">
                <h3 className="text-lg font-medium text-cream-text-dark">编辑密码项</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingItem(null)
                  }}
                  className="text-cream-text-light hover:text-cream-text-dark"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleUpdatePassword}>
                <div className="px-6 py-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-cream-text-dark mb-1">标题 *</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-cream-border rounded-md focus:outline-none focus:ring-1 focus:ring-cream-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-cream-text-dark mb-1">软件名</label>
                    <input
                      type="text"
                      name="software_name"
                      value={formData.software_name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-cream-border rounded-md focus:outline-none focus:ring-1 focus:ring-cream-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-cream-text-dark mb-1">用户名</label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-cream-border rounded-md focus:outline-none focus:ring-1 focus:ring-cream-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-cream-text-dark mb-1">密码 *</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-cream-border rounded-md focus:outline-none focus:ring-1 focus:ring-cream-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-cream-text-dark mb-1">网址</label>
                    <input
                      type="text"
                      name="url"
                      value={formData.url}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-cream-border rounded-md focus:outline-none focus:ring-1 focus:ring-cream-accent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-cream-text-dark mb-1">备注</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-cream-border rounded-md focus:outline-none focus:ring-1 focus:ring-cream-accent"
                    />
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-cream-border flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false)
                      setEditingItem(null)
                    }}
                    className="px-4 py-2 border border-cream-border rounded-md text-cream-text-dark hover:bg-cream-bg transition duration-300"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-cream-accent hover:bg-cream-accent-hover text-white rounded-md transition duration-300"
                  >
                    保存
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}