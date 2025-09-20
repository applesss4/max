'use client'

import ProtectedRoute from '../../../components/ProtectedRoute'
import { useAuth } from '../../../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import React, { useState, useEffect, useCallback } from 'react'
import { 
  getUserCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart
} from '../../../services/ecommerceService'
import { CartDetails } from '../../../services/ecommerceService'

export default function ShoppingCartPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [cartDetails, setCartDetails] = useState<CartDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // 获取购物车数据
  const fetchCart = useCallback(async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const { data, error } = await getUserCart(user.id)
      if (error) throw error
      setCartDetails(data || null)
    } catch (error) {
      console.error('获取购物车失败:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  // 设置获取购物车数据的副作用
  useEffect(() => {
    if (user) {
      fetchCart()
    }
  }, [user, fetchCart])

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

  // 更新商品数量
  const handleQuantityChange = async (cartItemId: string, quantity: number) => {
    if (!user || quantity < 0) return
    
    try {
      // 如果数量为0，删除商品
      if (quantity === 0) {
        await handleRemoveItem(cartItemId)
        return
      }
      
      const { data, error } = await updateCartItemQuantity(cartItemId, quantity)
      if (error) throw error
      
      // 更新本地状态
      if (cartDetails) {
        const updatedItems = cartDetails.items.map(item => 
          item.id === cartItemId ? { ...item, quantity } : item
        )
        
        // 重新计算总金额
        const totalAmount = updatedItems.reduce((sum, item) => 
          sum + (item.product?.price || 0) * item.quantity, 0
        )
        
        setCartDetails({
          ...cartDetails,
          items: updatedItems,
          total_amount: parseFloat(totalAmount.toFixed(2))
        })
      }
    } catch (error) {
      console.error('更新商品数量失败:', error)
      alert('更新商品数量失败')
    }
  }

  // 删除商品
  const handleRemoveItem = async (cartItemId: string) => {
    if (!user) return
    
    try {
      const { error } = await removeCartItem(cartItemId)
      if (error) throw error
      
      // 更新本地状态
      if (cartDetails) {
        const updatedItems = cartDetails.items.filter(item => item.id !== cartItemId)
        
        // 重新计算总金额
        const totalAmount = updatedItems.reduce((sum, item) => 
          sum + (item.product?.price || 0) * item.quantity, 0
        )
        
        setCartDetails({
          ...cartDetails,
          items: updatedItems,
          total_amount: parseFloat(totalAmount.toFixed(2))
        })
      }
    } catch (error) {
      console.error('删除商品失败:', error)
      alert('删除商品失败')
    }
  }

  // 清空购物车
  const handleClearCart = async () => {
    if (!user || !cartDetails) return
    
    if (confirm('确定要清空购物车吗？')) {
      try {
        const { error } = await clearCart(cartDetails.cart.id)
        if (error) throw error
        
        // 更新本地状态
        setCartDetails({
          ...cartDetails,
          items: [],
          total_amount: 0
        })
      } catch (error) {
        console.error('清空购物车失败:', error)
        alert('清空购物车失败')
      }
    }
  }

  // 去结算
  const handleCheckout = () => {
    if (!cartDetails || cartDetails.items.length === 0) {
      alert('购物车为空')
      return
    }
    
    router.push('/shopping/checkout')
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
                <h1 className="text-xl font-semibold text-cream-text-dark">购物车</h1>
              </div>
            </div>
          </div>
        </header>

        {/* 主内容区域 */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cream-accent mx-auto"></div>
              <p className="mt-2 text-cream-text-dark">加载中...</p>
            </div>
          ) : !cartDetails || cartDetails.items.length === 0 ? (
            <div className="bg-cream-card rounded-2xl shadow-sm p-8 border border-cream-border text-center">
              <div className="bg-cream-border p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cream-text-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-cream-text-dark mb-2">购物车为空</h3>
              <p className="text-cream-text-light mb-4">您还没有添加任何商品到购物车</p>
              <button
                onClick={() => router.push('/shopping')}
                className="px-4 py-2 text-sm font-medium text-white bg-cream-accent hover:bg-cream-accent-hover rounded-lg transition duration-300"
              >
                去购物
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* 购物车商品列表 */}
              <div className="lg:col-span-2">
                <div className="bg-cream-card rounded-2xl shadow-sm p-4 border border-cream-border mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-base font-semibold text-cream-text-dark">购物车 ({cartDetails.items.length} 件商品)</h2>
                    <button
                      onClick={handleClearCart}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      清空购物车
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {cartDetails.items.map(item => (
                      <div key={item.id} className="flex items-center border-b border-cream-border pb-4 last:border-0 last:pb-0">
                        <div className="bg-cream-bg border border-cream-border rounded-lg w-12 h-12 flex items-center justify-center mr-2">
                          {item.product?.image_url ? (
                            <img 
                              src={item.product.image_url} 
                              alt={item.product.name} 
                              className="max-h-full max-w-full object-contain"
                              loading="lazy"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'https://placehold.co/50x50?text=商品';
                              }}
                            />
                          ) : (
                            <div className="bg-cream-border border-2 border-dashed rounded-lg w-6 h-6" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-cream-text-dark text-sm truncate">{item.product?.name}</h3>
                          <p className="text-cream-text-light text-xs truncate">{item.product?.category}</p>
                          <p className="text-cream-accent font-medium text-sm">{Math.floor(item.product?.price || 0)}日元</p>
                        </div>
                        
                        <div className="flex flex-col items-end space-y-1">
                          <div className="flex items-center border border-cream-border rounded-lg">
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              className="px-2 py-1 text-cream-text hover:bg-cream-border text-xs"
                            >
                              -
                            </button>
                            <span className="px-2 py-1 text-cream-text-dark text-xs">{item.quantity}</span>
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              className="px-2 py-1 text-cream-text hover:bg-cream-border text-xs"
                            >
                              +
                            </button>
                          </div>
                          
                          <div className="w-16 text-right">
                            <p className="font-medium text-cream-text-dark text-sm">
                              {Math.floor(item.product?.price * item.quantity)}日元
                            </p>
                          </div>
                          
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-cream-text-light hover:text-red-500"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* 结算信息 */}
              <div>
                <div className="bg-cream-card rounded-2xl shadow-sm p-4 border border-cream-border sticky top-24">
                  <h2 className="text-base font-semibold text-cream-text-dark mb-3">订单摘要</h2>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-cream-text-light text-sm">商品总价</span>
                      <span className="text-cream-text-dark text-sm">{Math.floor(cartDetails.total_amount)}日元</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cream-text-light text-sm">运费</span>
                      <span className="text-cream-text-dark text-sm">0.00日元</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cream-text-light text-sm">税费</span>
                      <span className="text-cream-text-dark text-sm">0.00日元</span>
                    </div>
                    <div className="border-t border-cream-border pt-2 flex justify-between font-semibold">
                      <span className="text-cream-text-dark text-sm">总计</span>
                      <span className="text-cream-text-dark text-sm">{Math.floor(cartDetails.total_amount)}日元</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleCheckout}
                    className="w-full px-3 py-2 text-sm font-medium text-white bg-cream-accent hover:bg-cream-accent-hover rounded-lg transition duration-300"
                  >
                    去结算
                  </button>
                  
                  <button
                    onClick={() => router.push('/shopping')}
                    className="w-full mt-2 px-3 py-2 text-sm font-medium text-cream-text-dark bg-cream-bg hover:bg-cream-border rounded-lg transition duration-300"
                  >
                    继续购物
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}