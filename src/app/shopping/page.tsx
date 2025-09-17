'use client'

import ProtectedRoute from '../../components/ProtectedRoute'
import { useAuth } from '../../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import React, { useState, useEffect, useCallback } from 'react'
import { 
  getAllProductsWithPrices,
  getProductsByCategoryWithPrices,
  getUserCategories,
  addToCart,
  getUserCart
} from '../../services/ecommerceService'
import { Product } from '../../services/ecommerceService'

// 懒加载弹窗组件
const ProductModal = React.lazy(() => import('../../components/ProductModal'))
const AddProductModal = React.lazy(() => import('../../components/AddProductModal'))

interface MergedProduct extends Product {
  lowest_price: number
  shop_count: number
  shop_name: string
}

export default function ShoppingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [products, setProducts] = useState<MergedProduct[]>([])
  const [categories, setCategories] = useState<string[]>(['全部']) // 动态分类状态
  const [selectedCategory, setSelectedCategory] = useState('全部')
  const [isLoading, setIsLoading] = useState(false)
  const [cartItemCount, setCartItemCount] = useState(0)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false) // 添加商品弹窗状态

  // 获取商品数据
  const fetchProducts = useCallback(async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      let data, error
      if (selectedCategory === '全部') {
        const result = await getAllProductsWithPrices()
        data = result.data
        error = result.error
      } else {
        const result = await getProductsByCategoryWithPrices(selectedCategory)
        data = result.data
        error = result.error
      }
      
      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('获取商品失败:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user, selectedCategory])

  // 获取购物车商品数量
  const fetchCartItemCount = useCallback(async () => {
    if (!user) return
    
    try {
      const { data, error } = await getUserCart(user.id)
      if (error) throw error
      if (data) {
        const count = data.items.reduce((sum, item) => sum + item.quantity, 0)
        setCartItemCount(count)
      }
    } catch (error) {
      console.error('获取购物车数量失败:', error)
    }
  }, [user])

  // 获取用户分类
  const fetchCategories = useCallback(async () => {
    if (!user) return
    
    try {
      const { data, error } = await getUserCategories(user.id)
      if (error) throw error
      
      // 提取分类名称并添加"全部"选项
      if (data) {
        const categoryNames = data.map(category => category.name)
        setCategories(['全部', ...categoryNames])
      }
    } catch (error) {
      console.error('获取分类失败:', error)
      // 如果获取分类失败，使用默认分类
      setCategories(['全部', '食品饮料', '日用品', '清洁用品', '个人护理', '家居用品', '宠物用品', '其他'])
    }
  }, [user])

  // 设置默认分类的副作用
  useEffect(() => {
    if (user) {
      fetchProducts()
      fetchCartItemCount()
      fetchCategories() // 获取用户自定义分类
    }
  }, [user, fetchProducts, fetchCartItemCount, fetchCategories])

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

  // 打开商品详情弹窗
  const openProductModal = (productId: string) => {
    setSelectedProductId(productId)
    setIsModalOpen(true)
  }

  // 关闭商品详情弹窗
  const closeProductModal = () => {
    setIsModalOpen(false)
    setSelectedProductId(null)
  }

  // 添加到购物车
  const handleAddToCart = useCallback(async (productId: string, quantity: number = 1) => {
    if (!user) return
    
    try {
      const { data, error } = await addToCart(user.id, productId, quantity)
      if (error) throw error
      
      // 更新购物车数量
      setCartItemCount(prev => prev + quantity)
      
      // 显示成功提示
      alert('商品已添加到购物车')
    } catch (error) {
      console.error('添加到购物车失败:', error)
      alert('添加到购物车失败')
    }
  }, [user])

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-cream-bg">
        {/* 顶部导航栏 */}
        <header className="bg-cream-card shadow-sm border-b border-cream-border sticky top-0 z-10">
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
                <h1 className="text-xl font-semibold text-cream-text-dark">居家购物</h1>
              </div>
              <div className="flex items-center">
                <button
                  onClick={() => router.push('/shopping/shops')}
                  className="p-2 text-cream-text-dark hover:text-cream-accent mr-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </button>
                <button
                  onClick={() => router.push('/shopping/orders')}
                  className="p-2 text-cream-text-dark hover:text-cream-accent mr-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </button>
                <button
                  onClick={() => router.push('/shopping/cart')}
                  className="relative p-2 text-cream-text-dark hover:text-cream-accent"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {cartItemCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
                      {cartItemCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* 主内容区域 */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 分类导航 */}
          <div className="mb-6 overflow-x-auto">
            <div className="flex space-x-2 pb-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${
                    selectedCategory === category
                      ? 'bg-cream-accent text-white'
                      : 'bg-cream-card text-cream-text hover:bg-cream-border'
                  }`}
                >
                  {category}
                </button>
              ))}
              {/* 添加商品按钮 */}
              <button
                onClick={() => setIsAddProductModalOpen(true)}
                className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap bg-green-500 text-white hover:bg-green-600"
              >
                + 添加商品
              </button>
            </div>
          </div>

          {/* 商品列表 */}
          <div className="bg-cream-card rounded-2xl shadow-sm p-6 border border-cream-border">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cream-accent mx-auto"></div>
                <p className="mt-2 text-cream-text-dark">加载中...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-cream-border p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cream-text-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-cream-text-dark mb-2">暂无商品</h3>
                <p className="text-cream-text-light">请稍后再试</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 grid-gap-compact">
                {products.map(product => (
                  <div 
                    key={`${product.name}-${product.category}`} 
                    className="border border-cream-border rounded-lg overflow-hidden hover:shadow-md transition duration-300 cursor-pointer"
                    onClick={() => openProductModal(product.id)}
                  >
                    <div className="bg-cream-bg h-compact-image flex items-center justify-center">
                      {product.image_url ? (
                        // 检查图片URL是否有效
                        (() => {
                          // 检查是否为Base64格式或有效的URL
                          const isValidImageUrl = (url: string): boolean => {
                            if (!url) return false
                            // 检查是否为Base64格式
                            if (url.startsWith('data:image')) return true
                            // 检查是否为有效的URL格式
                            try {
                              new URL(url)
                              return true
                            } catch {
                              return false
                            }
                          }
                          
                          if (isValidImageUrl(product.image_url)) {
                            return (
                              <img 
                                src={product.image_url} 
                                alt={product.name} 
                                className="max-h-full max-w-full object-contain"
                                loading="lazy"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  console.log('商品列表图片加载失败，URL:', product.image_url)
                                  // 显示默认图片
                                  target.src = 'https://placehold.co/200x200?text=商品图片'
                                }}
                              />
                            )
                          } else {
                            // URL无效，显示默认图片容器
                            return (
                              <div className="bg-cream-border border-2 border-dashed rounded-xl w-16 h-16 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cream-text-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )
                          }
                        })()
                      ) : (
                        <div className="bg-cream-border border-2 border-dashed rounded-xl w-16 h-16 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cream-text-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="p-compact">
                      <h3 className="font-medium text-cream-text-dark text-compact mb-1 line-clamp-2">{product.name}</h3>
                      <p className="text-compact text-cream-text-light mb-1 line-clamp-2">{product.description}</p>
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-compact font-bold text-cream-text-dark">{product.lowest_price.toFixed(2)}日元</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(product.id);
                          }}
                          className="px-1.5 py-0.5 text-xs font-medium text-white bg-cream-accent hover:bg-cream-accent-hover rounded transition duration-300"
                        >
                          加入
                        </button>
                      </div>
                      {product.shop_name && (
                        <p className="text-xs text-cream-text-light truncate">{product.shop_name}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* 商品详情弹窗 */}
        <React.Suspense fallback={null}>
          <ProductModal 
            productId={selectedProductId}
            isOpen={isModalOpen}
            onClose={closeProductModal}
            onAddToCart={handleAddToCart}
            user={user}
            onProductUpdate={fetchProducts} // 添加商品更新回调
          />
        </React.Suspense>

        {/* 添加商品弹窗 */}
        <React.Suspense fallback={null}>
          <AddProductModal
            isOpen={isAddProductModalOpen}
            onClose={() => setIsAddProductModalOpen(false)}
            onProductAdded={fetchProducts}
            userId={user?.id || ''}
          />
        </React.Suspense>
      </div>
    </ProtectedRoute>
  )
}