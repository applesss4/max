'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'

// 定义类型
interface WardrobeItem {
  id: string
  user_id: string
  name: string
  category: string
  color: string | null
  season: string | null
  image_url: string | null
  image_urls: string[] | null
  purchase_date: string | null
  brand: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

// 创建一个包装组件来处理 useSearchParams
function WardrobeDetailContent() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const itemId = searchParams.get('id')
  
  const [item, setItem] = useState<WardrobeItem | null>(null)
  const [loadingItem, setLoadingItem] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // 获取所有图片URL
  const getAllImageUrls = () => {
    if (!item) return []
    
    const urls = []
    if (item.image_url) urls.push(item.image_url)
    if (item.image_urls && Array.isArray(item.image_urls)) {
      urls.push(...item.image_urls)
    }
    
    return urls
  }

  // 获取衣物详情
  const fetchWardrobeItem = async () => {
    if (!user || !itemId) return

    setLoadingItem(true)
    try {
      const { data, error } = await supabase
        .from('wardrobe_items')
        .select('*')
        .eq('id', itemId)
        .eq('user_id', user.id)
        .single()

      if (error) throw error
      if (data) {
        setItem(data)
      } else {
        setError('未找到该衣物')
      }
    } catch (error) {
      console.error('获取衣物详情失败:', error)
      setError('获取衣物详情失败')
    } finally {
      setLoadingItem(false)
    }
  }

  // 处理返回
  const handleGoBack = () => {
    router.back()
  }

  // 处理编辑
  const handleEdit = () => {
    // 跳转到编辑页面，这里可以传递数据或者在编辑页面重新获取
    router.push(`/outfit-assistant?edit=${itemId}`)
  }

  // 处理删除
  const handleDelete = async () => {
    if (!itemId || !user) return

    if (window.confirm('确定要删除这件衣物吗？此操作无法撤销。')) {
      try {
        const { error } = await supabase
          .from('wardrobe_items')
          .delete()
          .eq('id', itemId)
          .eq('user_id', user.id)

        if (error) throw error
        
        // 删除成功后返回上一页
        alert('衣物删除成功')
        router.back()
      } catch (error) {
        console.error('删除衣物失败:', error)
        alert('删除衣物失败，请重试')
      }
    }
  }

  // 切换图片
  const handleImageChange = (index: number) => {
    setCurrentImageIndex(index)
  }

  // 滚动到指定图片
  const scrollToImage = (index: number) => {
    if (scrollContainerRef.current) {
      const scrollContainer = scrollContainerRef.current
      const scrollWidth = scrollContainer.scrollWidth
      const containerWidth = scrollContainer.clientWidth
      const scrollLeft = (scrollWidth / getAllImageUrls().length) * index
      
      // 平滑滚动到指定位置
      scrollContainer.scrollTo({
        left: scrollLeft,
        behavior: 'smooth'
      })
      
      // 更新当前图片索引
      setCurrentImageIndex(index)
    }
  }

  // 重定向逻辑处理
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // 获取数据
  useEffect(() => {
    if (user && itemId) {
      fetchWardrobeItem()
    } else if (!itemId) {
      setError('缺少衣物ID')
    }
  }, [user, itemId])

  // 图片URL变化时重置当前索引
  useEffect(() => {
    setCurrentImageIndex(0)
  }, [item])

  // 加载状态显示
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-bg">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cream-accent"></div>
          <p className="mt-2 text-cream-text-dark">读取中...</p>
        </div>
      </div>
    )
  }

  // 用户信息不存在时不渲染页面内容
  if (!user) {
    return null
  }

  const imageUrls = getAllImageUrls()
  const hasMultipleImages = imageUrls.length > 1

  return (
    <div className="min-h-screen bg-cream-bg">
      {/* 顶部导航 */}
      <header className="bg-cream-card shadow-sm border-b border-cream-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <button
                onClick={handleGoBack}
                className="text-cream-text-light hover:text-cream-text-dark transition duration-300 mr-4"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-semibold text-cream-text-dark">衣物详情</h1>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleEdit}
                className="text-cream-text-light hover:text-cream-accent transition duration-300 p-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={handleDelete}
                className="text-cream-text-light hover:text-red-500 transition duration-300 p-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-2-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loadingItem ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cream-accent mb-2"></div>
              <p className="text-cream-text-dark">正在读取衣物详情...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-cream-card rounded-2xl shadow-sm p-6 border border-cream-border">
            <div className="text-center py-12">
              <div className="text-red-500 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-cream-text-dark text-lg mb-4">{error}</p>
              <button
                onClick={handleGoBack}
                className="bg-cream-accent hover:bg-cream-accent-hover text-white px-4 py-2 rounded-lg transition duration-300"
              >
                返回上一页
              </button>
            </div>
          </div>
        ) : item ? (
          <div className="bg-cream-card rounded-2xl shadow-sm border border-cream-border overflow-hidden">
            {/* 图片展示区域 */}
            <div className="relative">
              {/* 主图片展示 */}
              <div className="relative h-80 md:h-96 bg-cream-bg">
                {imageUrls.length > 0 ? (
                  <img 
                    src={imageUrls[currentImageIndex]} 
                    alt={`${item.name} - 图片 ${currentImageIndex + 1}`} 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-cream-border">
                    <span className="text-cream-text-light">暂无图片</span>
                  </div>
                )}
                
                {/* 图片数量指示器 */}
                {hasMultipleImages && (
                  <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white text-sm px-2 py-1 rounded">
                    {currentImageIndex + 1} / {imageUrls.length}
                  </div>
                )}
              </div>

              {/* 缩略图横向滚动区域 */}
              {hasMultipleImages && (
                <div className="border-t border-cream-border bg-cream-bg py-4">
                  <div 
                    ref={scrollContainerRef}
                    className="flex overflow-x-auto px-4 pb-2 scrollbar-hide"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {imageUrls.map((url, index) => (
                      <div 
                        key={index}
                        className={`flex-shrink-0 mr-3 cursor-pointer rounded border-2 transition-all duration-200 ${
                          currentImageIndex === index 
                            ? 'border-cream-accent' 
                            : 'border-cream-border hover:border-cream-text-light'
                        }`}
                        onClick={() => scrollToImage(index)}
                      >
                        <img 
                          src={url} 
                          alt={`缩略图 ${index + 1}`} 
                          className="w-16 h-16 md:w-20 md:h-20 object-cover rounded"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 信息展示区域 */}
            <div className="p-6">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-cream-text-dark mb-2">{item.name}</h1>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-cream-accent text-white text-xs px-2 py-1 rounded">
                    {item.category}
                  </span>
                  {item.season && (
                    <span className="bg-cream-bg border border-cream-border text-cream-text text-xs px-2 py-1 rounded">
                      {item.season}
                    </span>
                  )}
                  {item.color && (
                    <span className="bg-cream-bg border border-cream-border text-cream-text text-xs px-2 py-1 rounded">
                      {item.color}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-lg font-semibold text-cream-text-dark mb-4">基本信息</h2>
                  <div className="space-y-3">
                    <div className="flex">
                      <span className="text-cream-text-light w-24">分类:</span>
                      <span className="text-cream-text-dark">{item.category}</span>
                    </div>
                    {item.brand && (
                      <div className="flex">
                        <span className="text-cream-text-light w-24">品牌:</span>
                        <span className="text-cream-text-dark">{item.brand}</span>
                      </div>
                    )}
                    {item.color && (
                      <div className="flex">
                        <span className="text-cream-text-light w-24">颜色:</span>
                        <span className="text-cream-text-dark">{item.color}</span>
                      </div>
                    )}
                    {item.season && (
                      <div className="flex">
                        <span className="text-cream-text-light w-24">季节:</span>
                        <span className="text-cream-text-dark">{item.season}</span>
                      </div>
                    )}
                    {item.purchase_date && (
                      <div className="flex">
                        <span className="text-cream-text-light w-24">购买日期:</span>
                        <span className="text-cream-text-dark">
                          {new Date(item.purchase_date).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-cream-text-dark mb-4">其他信息</h2>
                  <div className="space-y-3">
                    <div className="flex">
                      <span className="text-cream-text-light w-24">创建时间:</span>
                      <span className="text-cream-text-dark">
                        {new Date(item.created_at).toLocaleDateString('zh-CN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="flex">
                      <span className="text-cream-text-light w-24">更新时间:</span>
                      <span className="text-cream-text-dark">
                        {new Date(item.updated_at).toLocaleDateString('zh-CN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {item.notes && (
                <div className="mt-6">
                  <h2 className="text-lg font-semibold text-cream-text-dark mb-2">备注</h2>
                  <div className="bg-cream-bg rounded-lg p-4 border border-cream-border">
                    <p className="text-cream-text">{item.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-cream-card rounded-2xl shadow-sm p-6 border border-cream-border">
            <div className="text-center py-12">
              <p className="text-cream-text-dark">未找到衣物信息</p>
              <button
                onClick={handleGoBack}
                className="mt-4 bg-cream-accent hover:bg-cream-accent-hover text-white px-4 py-2 rounded-lg transition duration-300"
              >
                返回上一页
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default function WardrobeDetailPage() {
  return (
    <ProtectedRoute>
      <React.Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-cream-bg">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cream-accent"></div>
            <p className="mt-2 text-cream-text-dark">加载中...</p>
          </div>
        </div>
      }>
        <WardrobeDetailContent />
      </React.Suspense>
    </ProtectedRoute>
  )
}