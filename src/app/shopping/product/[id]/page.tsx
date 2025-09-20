'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useParams } from 'next/navigation'
import React, { useState, useEffect, useCallback } from 'react'
import { getProductByIdWithShop, getProductPricesByProductName, Product } from '@/services/ecommerceService'

// 扩展Product类型以包含shop信息
interface ProductWithShop extends Product {
  shop?: {
    id: string;
    name: string;
  };
}

export default function ProductDetailPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string
  
  const [product, setProduct] = useState<ProductWithShop | null>(null)
  const [productPrices, setProductPrices] = useState<ProductWithShop[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [notification, setNotification] = useState<{type: string, message: string} | null>(null)

  // 获取商品详情
  const fetchProduct = useCallback(async () => {
    if (!productId) return
    
    setIsLoading(true)
    try {
      // 获取当前商品详情
      const { data: productData, error: productError } = await getProductByIdWithShop(productId)
      console.log('获取到的商品数据:', productData);
      if (productError) throw productError
      
      setProduct(productData)
      
      // 如果获取到商品数据，同时获取同一商品名在不同超市的价格信息
      if (productData) {
        const { data: pricesData, error: pricesError } = await getProductPricesByProductName(productData.name)
        console.log('获取到的价格数据:', pricesData);
        if (pricesError) throw pricesError
        setProductPrices(pricesData || [])
      }
    } catch (error) {
      console.error('获取商品详情失败:', error)
      setNotification({type: 'error', message: '获取商品详情失败'})
    } finally {
      setIsLoading(false)
    }
  }, [productId])

  // 设置获取商品详情的副作用
  useEffect(() => {
    if (productId) {
      fetchProduct()
    } else {
      // 如果没有productId，设置为非加载状态
      setIsLoading(false)
    }
  }, [productId, fetchProduct])

  // 添加到购物车
  const handleAddToCart = useCallback(async () => {
    if (!user || !product) return
    
    try {
      // 这里需要实现添加到购物车的逻辑
      // 暂时显示一个通知
      setNotification({type: 'success', message: '商品已添加到购物车'})
      setTimeout(() => setNotification(null), 3000)
    } catch (error) {
      console.error('添加到购物车失败:', error)
      setNotification({type: 'error', message: '添加到购物车失败'})
      setTimeout(() => setNotification(null), 3000)
    }
  }, [user, product])

  // 数量增加
  const incrementQuantity = useCallback(() => {
    setQuantity(prev => prev + 1)
  }, [])

  // 数量减少
  const decrementQuantity = useCallback(() => {
    setQuantity(prev => (prev > 1 ? prev - 1 : 1))
  }, [])

  // 显示加载状态
  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-bg">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cream-accent"></div>
          <p className="mt-2 text-cream-text-dark">加载中...</p>
        </div>
      </div>
    )
  }

  // 商品ID不存在
  if (!productId) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-cream-bg flex items-center justify-center">
          <div className="text-center">
            <div className="bg-cream-border p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cream-text-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-cream-text-dark mb-2">无效的商品ID</h3>
            <p className="text-cream-text-light mb-4">抱歉，商品ID无效</p>
            <button
              onClick={() => router.push('/shopping')}
              className="px-4 py-2 bg-cream-accent text-white rounded-lg hover:bg-cream-accent-hover transition duration-300"
            >
              返回购物页面
            </button>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  // 商品未找到
  if (!product) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-cream-bg flex items-center justify-center">
          <div className="text-center">
            <div className="bg-cream-border p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cream-text-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-cream-text-dark mb-2">商品未找到</h3>
            <p className="text-cream-text-light mb-4">抱歉，未找到该商品</p>
            <button
              onClick={() => router.push('/shopping')}
              className="px-4 py-2 bg-cream-accent text-white rounded-lg hover:bg-cream-accent-hover transition duration-300"
            >
              返回购物页面
            </button>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  // 获取最低价格
  const lowestPrice = productPrices.length > 0 ? (productPrices[0] as Product).price : (product ? (product as Product).price : 0)

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
                <h1 className="text-xl font-semibold text-cream-text-dark">商品详情</h1>
              </div>
            </div>
          </div>
        </header>

        {/* 通知消息 */}
        {notification && (
          <div className={`fixed top-20 right-4 px-4 py-2 rounded-lg shadow-lg z-50 ${
            notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {notification.message}
          </div>
        )}

        {/* 主内容区域 */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-cream-card rounded-2xl shadow-sm p-6 border border-cream-border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* 商品图片 */}
              <div className="bg-cream-bg rounded-xl overflow-hidden flex items-center justify-center h-96">
                {product && (product as Product).image_url ? (
                  <img 
                    src={(product as Product).image_url || ''} 
                    alt={(product as Product).name || ''} 
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://placehold.co/400x400?text=商品图片';
                    }}
                  />
                ) : (
                  <div className="bg-cream-border border-2 border-dashed rounded-xl w-32 h-32" />
                )}
              </div>

              {/* 商品信息 */}
              <div>
                <h1 className="text-2xl font-bold text-cream-text-dark mb-4">{product ? (product as Product).name : ''}</h1>
                <p className="text-cream-text-light mb-6">{product && (product as Product).description ? (product as Product).description : '暂无商品描述'}</p>
                
                {/* 当前商品超市信息 */}
                <div className="mb-4">
                  <div className="bg-cream-bg p-3 rounded-lg mb-4">
                    <p className="text-cream-text-light text-sm">超市</p>
                    <p className="text-cream-text-dark font-medium">{product && (product as ProductWithShop).shop?.name || '未知超市'}</p>
                  </div>
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold text-cream-text-dark">
                      {product ? Math.floor((product as Product).price) : '0'}日元
                    </span>
                    {productPrices.length > 1 && product && (product as Product).price === lowestPrice && (
                      <span className="ml-2 text-sm text-cream-accent bg-green-100 px-2 py-1 rounded">最优惠</span>
                    )}
                  </div>
                </div>

                {/* 不同超市的价格信息 */}
                {productPrices.length > 1 && (
                  <div className="mb-8">
                    <h2 className="text-lg font-semibold text-cream-text-dark mb-3">不同超市价格</h2>
                    <div className="space-y-3">
                      {productPrices.map((item, index) => (
                        <div 
                          key={(item as Product).id} 
                          className={`p-3 rounded-lg border flex justify-between items-center ${
                            index === 0 
                              ? 'border-green-500 bg-green-50' 
                              : 'border-cream-border bg-cream-bg'
                          }`}
                        >
                          <div>
                            <div className="font-medium text-cream-text-dark">{(item as ProductWithShop).shop?.name || '未知超市'}</div>
                            {index === 0 && (
                              <span className="inline-block mt-1 px-2 py-1 text-xs bg-green-500 text-white rounded">
                                最优惠
                              </span>
                            )}
                          </div>
                          <div className="text-cream-text-dark font-medium">{Math.floor((item as Product).price)}日元</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 数量选择和购买按钮 */}
                <div className="border-t border-cream-border pt-6">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-cream-text-dark font-medium">数量:</span>
                    <div className="flex items-center">
                      <button 
                        onClick={decrementQuantity}
                        className="w-10 h-10 flex items-center justify-center bg-cream-bg border border-cream-border rounded-l-lg hover:bg-cream-border transition duration-300"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cream-text-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <span className="w-12 h-10 flex items-center justify-center bg-cream-bg border-t border-b border-cream-border text-cream-text-dark">
                        {quantity}
                      </span>
                      <button 
                        onClick={incrementQuantity}
                        className="w-10 h-10 flex items-center justify-center bg-cream-bg border border-cream-border rounded-r-lg hover:bg-cream-border transition duration-300"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cream-text-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    disabled={!product || (product as Product).stock_quantity <= 0}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition duration-300 ${
                      !product || (product as Product).stock_quantity <= 0
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : 'bg-cream-accent text-white hover:bg-cream-accent-hover'
                    }`}
                  >
                    {!product || (product as Product).stock_quantity <= 0 ? '缺货' : '加入购物车'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}