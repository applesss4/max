'use client'

import ProtectedRoute from '../../../components/ProtectedRoute'
import { useAuth } from '../../../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import React, { useState, useEffect, useCallback } from 'react'
import { getUserShops, createShop, getUserCategories, createCategory, updateCategory, deleteCategory, deleteShop } from '../../../services/ecommerceService'
import { Shop, Category } from '../../../services/ecommerceService'

export default function ShopsManagementPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [shops, setShops] = useState<Shop[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAddingShop, setIsAddingShop] = useState(false)
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [isEditingCategory, setIsEditingCategory] = useState<Category | null>(null)
  const [activeTab, setActiveTab] = useState<'shops' | 'categories'>('shops')
  const [newShopName, setNewShopName] = useState('')
  const [newShopDescription, setNewShopDescription] = useState('')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryDescription, setNewCategoryDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  // 获取用户超市列表
  const fetchShops = useCallback(async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const { data, error } = await getUserShops(user.id)
      if (error) throw error
      setShops(data || [])
    } catch (err) {
      console.error('获取超市列表失败:', err)
      setError('获取超市列表失败')
    } finally {
      setIsLoading(false)
    }
  }, [user])

  // 获取用户分类列表
  const fetchCategories = useCallback(async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const { data, error } = await getUserCategories(user.id)
      if (error) throw error
      setCategories(data || [])
    } catch (err) {
      console.error('获取分类列表失败:', err)
      setError('获取分类列表失败')
    } finally {
      setIsLoading(false)
    }
  }, [user])

  // 设置获取数据的副作用
  useEffect(() => {
    if (user) {
      if (activeTab === 'shops') {
        fetchShops()
      } else {
        fetchCategories()
      }
    }
  }, [user, activeTab, fetchShops, fetchCategories])

  // 添加新超市
  const handleAddShop = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || !newShopName.trim()) {
      setError('请填写超市名称')
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      const { data, error } = await createShop(
        user.id, 
        newShopName.trim(), 
        newShopDescription.trim() || undefined
      )
      
      if (error) throw error
      
      // 更新超市列表
      await fetchShops()
      
      // 重置表单
      setNewShopName('')
      setNewShopDescription('')
      setIsAddingShop(false)
    } catch (err) {
      console.error('添加超市失败:', err)
      setError('添加超市失败')
    } finally {
      setIsLoading(false)
    }
  }, [user, newShopName, newShopDescription, fetchShops])

  // 删除超市
  const handleDeleteShop = useCallback(async (shopId: string, shopName: string) => {
    if (!user) return
    
    if (!confirm(`确定要删除超市"${shopName}"吗？此操作不可恢复。`)) {
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      const { error } = await deleteShop(shopId)
      
      if (error) throw error
      
      // 更新超市列表
      await fetchShops()
    } catch (err) {
      console.error('删除超市失败:', err)
      setError('删除超市失败')
    } finally {
      setIsLoading(false)
    }
  }, [user, fetchShops])

  // 添加新分类
  const handleAddCategory = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || !newCategoryName.trim()) {
      setError('请填写分类名称')
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      const { data, error } = await createCategory(
        user.id, 
        newCategoryName.trim(), 
        newCategoryDescription.trim() || undefined
      )
      
      if (error) throw error
      
      // 更新分类列表
      await fetchCategories()
      
      // 重置表单
      setNewCategoryName('')
      setNewCategoryDescription('')
      setIsAddingCategory(false)
    } catch (err) {
      console.error('添加分类失败:', err)
      setError('添加分类失败')
    } finally {
      setIsLoading(false)
    }
  }, [user, newCategoryName, newCategoryDescription, fetchCategories])

  // 更新分类
  const handleUpdateCategory = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || !isEditingCategory || !isEditingCategory.name.trim()) {
      setError('请填写分类名称')
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      const { data, error } = await updateCategory(
        isEditingCategory.id, 
        { 
          name: isEditingCategory.name.trim(), 
          description: isEditingCategory.description?.trim() || undefined
        }
      )
      
      if (error) throw error
      
      // 更新分类列表
      await fetchCategories()
      
      // 重置表单
      setIsEditingCategory(null)
    } catch (err) {
      console.error('更新分类失败:', err)
      setError('更新分类失败')
    } finally {
      setIsLoading(false)
    }
  }, [user, isEditingCategory, fetchCategories])

  // 删除分类
  const handleDeleteCategory = useCallback(async (categoryId: string) => {
    if (!user) return
    
    if (!confirm('确定要删除这个分类吗？')) {
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      const { error } = await deleteCategory(categoryId)
      
      if (error) throw error
      
      // 更新分类列表
      await fetchCategories()
    } catch (err) {
      console.error('删除分类失败:', err)
      setError('删除分类失败')
    } finally {
      setIsLoading(false)
    }
  }, [user, fetchCategories])

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
        <header className="bg-cream-card shadow-sm border-b border-cream-border sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <button 
                  onClick={() => router.push('/shopping')}
                  className="text-cream-text-dark hover:text-cream-accent mr-4"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
                <h1 className="text-xl font-semibold text-cream-text-dark">超市与分类管理</h1>
              </div>
            </div>
          </div>
        </header>

        {/* 主内容区域 */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 标签页导航 */}
          <div className="flex border-b border-cream-border mb-6">
            <button
              className={`py-2 px-4 font-medium text-sm ${activeTab === 'shops' ? 'border-b-2 border-cream-accent text-cream-accent' : 'text-cream-text hover:text-cream-accent'}`}
              onClick={() => setActiveTab('shops')}
            >
              超市管理
            </button>
            <button
              className={`py-2 px-4 font-medium text-sm ${activeTab === 'categories' ? 'border-b-2 border-cream-accent text-cream-accent' : 'text-cream-text hover:text-cream-accent'}`}
              onClick={() => setActiveTab('categories')}
            >
              分类管理
            </button>
          </div>

          {/* 超市管理 */}
          {activeTab === 'shops' && (
            <div className="bg-cream-card rounded-2xl shadow-sm p-6 border border-cream-border">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-cream-text-dark">我的超市</h2>
                <button
                  onClick={() => setIsAddingShop(!isAddingShop)}
                  className="px-4 py-2 bg-cream-accent text-white rounded-lg hover:bg-cream-accent-hover transition duration-300"
                >
                  {isAddingShop ? '取消' : '+ 添加超市'}
                </button>
              </div>

              {error && activeTab === 'shops' && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* 添加超市表单 */}
              {isAddingShop && (
                <form onSubmit={handleAddShop} className="mb-8 p-4 bg-cream-bg rounded-lg border border-cream-border">
                  <h3 className="text-md font-medium text-cream-text-dark mb-4">添加新超市</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-cream-text-dark text-sm font-medium mb-1">超市名称 *</label>
                      <input
                        type="text"
                        value={newShopName}
                        onChange={(e) => setNewShopName(e.target.value)}
                        className="w-full p-3 border border-cream-border rounded-lg focus:ring-2 focus:ring-cream-accent focus:border-transparent"
                        placeholder="请输入超市名称"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-cream-text-dark text-sm font-medium mb-1">描述</label>
                      <textarea
                        value={newShopDescription}
                        onChange={(e) => setNewShopDescription(e.target.value)}
                        className="w-full p-3 border border-cream-border rounded-lg focus:ring-2 focus:ring-cream-accent focus:border-transparent"
                        placeholder="请输入超市描述（可选）"
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingShop(false)
                          setNewShopName('')
                          setNewShopDescription('')
                        }}
                        className="flex-1 py-2 px-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-300"
                        disabled={isLoading}
                      >
                        取消
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2 px-4 bg-cream-accent text-white rounded-lg hover:bg-cream-accent-hover transition duration-300 disabled:opacity-50"
                        disabled={isLoading}
                      >
                        {isLoading ? '添加中...' : '添加超市'}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* 超市列表 */}
              {isLoading && shops.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cream-accent mx-auto"></div>
                  <p className="mt-2 text-cream-text-dark">加载中...</p>
                </div>
              ) : shops.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-cream-border p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cream-text-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-cream-text-dark mb-2">暂无超市</h3>
                  <p className="text-cream-text-light mb-4">点击"添加超市"按钮创建您的第一个超市</p>
                  <button
                    onClick={() => setIsAddingShop(true)}
                    className="px-4 py-2 bg-cream-accent text-white rounded-lg hover:bg-cream-accent-hover transition duration-300"
                  >
                    + 添加超市
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {shops.map(shop => (
                    <div key={shop.id} className="p-4 bg-cream-bg rounded-lg border border-cream-border">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-cream-text-dark mb-2">{shop.name}</h3>
                          {shop.description && (
                            <p className="text-cream-text-light text-sm mb-3">{shop.description}</p>
                          )}
                          <div className="text-xs text-cream-text-light">
                            创建时间: {new Date(shop.created_at).toLocaleDateString('zh-CN')}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteShop(shop.id, shop.name)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 分类管理 */}
          {activeTab === 'categories' && (
            <div className="bg-cream-card rounded-2xl shadow-sm p-6 border border-cream-border">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-cream-text-dark">商品分类</h2>
                <button
                  onClick={() => setIsAddingCategory(!isAddingCategory)}
                  className="px-4 py-2 bg-cream-accent text-white rounded-lg hover:bg-cream-accent-hover transition duration-300"
                >
                  {isAddingCategory ? '取消' : '+ 添加分类'}
                </button>
              </div>

              {error && activeTab === 'categories' && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* 添加分类表单 */}
              {isAddingCategory && (
                <form onSubmit={handleAddCategory} className="mb-8 p-4 bg-cream-bg rounded-lg border border-cream-border">
                  <h3 className="text-md font-medium text-cream-text-dark mb-4">添加新分类</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-cream-text-dark text-sm font-medium mb-1">分类名称 *</label>
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="w-full p-3 border border-cream-border rounded-lg focus:ring-2 focus:ring-cream-accent focus:border-transparent"
                        placeholder="请输入分类名称"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-cream-text-dark text-sm font-medium mb-1">描述</label>
                      <textarea
                        value={newCategoryDescription}
                        onChange={(e) => setNewCategoryDescription(e.target.value)}
                        className="w-full p-3 border border-cream-border rounded-lg focus:ring-2 focus:ring-cream-accent focus:border-transparent"
                        placeholder="请输入分类描述（可选）"
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingCategory(false)
                          setNewCategoryName('')
                          setNewCategoryDescription('')
                        }}
                        className="flex-1 py-2 px-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-300"
                        disabled={isLoading}
                      >
                        取消
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2 px-4 bg-cream-accent text-white rounded-lg hover:bg-cream-accent-hover transition duration-300 disabled:opacity-50"
                        disabled={isLoading}
                      >
                        {isLoading ? '添加中...' : '添加分类'}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* 编辑分类表单 */}
              {isEditingCategory && (
                <form onSubmit={handleUpdateCategory} className="mb-8 p-4 bg-cream-bg rounded-lg border border-cream-border">
                  <h3 className="text-md font-medium text-cream-text-dark mb-4">编辑分类</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-cream-text-dark text-sm font-medium mb-1">分类名称 *</label>
                      <input
                        type="text"
                        value={isEditingCategory.name}
                        onChange={(e) => setIsEditingCategory({...isEditingCategory, name: e.target.value})}
                        className="w-full p-3 border border-cream-border rounded-lg focus:ring-2 focus:ring-cream-accent focus:border-transparent"
                        placeholder="请输入分类名称"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-cream-text-dark text-sm font-medium mb-1">描述</label>
                      <textarea
                        value={isEditingCategory.description || ''}
                        onChange={(e) => setIsEditingCategory({...isEditingCategory, description: e.target.value})}
                        className="w-full p-3 border border-cream-border rounded-lg focus:ring-2 focus:ring-cream-accent focus:border-transparent"
                        placeholder="请输入分类描述（可选）"
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={() => setIsEditingCategory(null)}
                        className="flex-1 py-2 px-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-300"
                        disabled={isLoading}
                      >
                        取消
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2 px-4 bg-cream-accent text-white rounded-lg hover:bg-cream-accent-hover transition duration-300 disabled:opacity-50"
                        disabled={isLoading}
                      >
                        {isLoading ? '保存中...' : '保存'}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* 分类列表 */}
              {isLoading && categories.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cream-accent mx-auto"></div>
                  <p className="mt-2 text-cream-text-dark">加载中...</p>
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-cream-border p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cream-text-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-cream-text-dark mb-2">暂无分类</h3>
                  <p className="text-cream-text-light mb-4">点击"添加分类"按钮创建您的第一个分类</p>
                  <button
                    onClick={() => setIsAddingCategory(true)}
                    className="px-4 py-2 bg-cream-accent text-white rounded-lg hover:bg-cream-accent-hover transition duration-300"
                  >
                    + 添加分类
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map(category => (
                    <div key={category.id} className="p-4 bg-cream-bg rounded-lg border border-cream-border">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-cream-text-dark mb-1">{category.name}</h3>
                          {category.description && (
                            <p className="text-cream-text-light text-sm mb-2">{category.description}</p>
                          )}
                          <div className="text-xs text-cream-text-light">
                            创建时间: {new Date(category.created_at).toLocaleDateString('zh-CN')}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setIsEditingCategory(category)}
                            className="text-cream-text hover:text-cream-accent"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}