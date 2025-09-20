'use client'

import ProtectedRoute from '../../../components/ProtectedRoute'
import { useAuth } from '../../../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import React, { useState, useEffect, useCallback } from 'react'
import { 
  getUserCart,
  createOrder,
  updateProduct
} from '../../../services/ecommerceService'
import { CartDetails } from '../../../services/ecommerceService'

export default function CheckoutPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [cartDetails, setCartDetails] = useState<CartDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingPrices, setEditingPrices] = useState<{[key: string]: number}>({}) // 用于编辑商品价格
  const TAX_RATE = 0.08 // 8% 税率

  // 获取购物车数据
  const fetchCart = useCallback(async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const { data, error } = await getUserCart(user.id)
      if (error) throw error
      
      setCartDetails(data || null)
      
      // 初始化编辑价格状态
      if (data) {
        const initialPrices: {[key: string]: number} = {}
        data.items.forEach(item => {
          initialPrices[item.id] = item.product?.price || 0
        })
        setEditingPrices(initialPrices)
      }
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

  // 处理价格编辑变化
  const handlePriceChange = (cartItemId: string, value: string) => {
    const newEditingPrices = { ...editingPrices }
    newEditingPrices[cartItemId] = parseFloat(value) || 0
    setEditingPrices(newEditingPrices)
  }

  // 计算商品总价（不含税）
  const calculateSubtotal = () => {
    if (!cartDetails) return 0
    return cartDetails.items.reduce((sum, item) => sum + (editingPrices[item.id] || 0) * item.quantity, 0)
  }

  // 计算税费
  const calculateTax = () => {
    const subtotal = calculateSubtotal()
    return subtotal * TAX_RATE
  }

  // 计算总价（含税）
  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    const tax = calculateTax()
    return subtotal + tax
  }

  // 提交订单
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user || !cartDetails) {
      alert('购物车为空')
      return
    }
    
    if (cartDetails.items.length === 0) {
      alert('购物车为空')
      return
    }
    
    setIsSubmitting(true)
    try {
      // 先更新商品价格
      const updatePromises = cartDetails.items.map(async (item) => {
        // 只有当价格发生变化时才更新
        if (editingPrices[item.id] !== item.product?.price) {
          return updateProduct(item.product_id, { price: editingPrices[item.id] })
        }
        return Promise.resolve()
      })
      
      await Promise.all(updatePromises)
      
      // 不需要收货地址，直接创建订单
      const { data, error } = await createOrder(user.id, '')
      if (error) throw error
      
      alert('订单创建成功！商品价格已同步更新。')
      // 跳转到订单详情或订单历史页面
      router.push('/shopping/orders')
    } catch (error) {
      console.error('创建订单失败:', error)
      alert('创建订单失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 按超市名分组商品
  const groupItemsByShop = () => {
    if (!cartDetails) return {}
    
    const grouped: { [shopName: string]: typeof cartDetails.items } = {}
    
    cartDetails.items.forEach(item => {
      // 获取超市名称，如果没有则使用"未知超市"
      const shopName = item.product?.shop?.name || '未知超市'
      
      if (!grouped[shopName]) {
        grouped[shopName] = []
      }
      
      grouped[shopName].push(item)
    })
    
    return grouped
  }

  const groupedItems = groupItemsByShop()
  const subtotal = calculateSubtotal()
  const tax = calculateTax()
  const total = calculateTotal()

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-cream-bg">
        {/* 顶部导航栏 */}
        <header className="bg-cream-card shadow-sm border-b border-cream-border sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <button 
                  onClick={() => router.push('/shopping/cart')}
                  className="text-cream-text-dark hover:text-cream-accent mr-4"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
                <h1 className="text-xl font-semibold text-cream-text-dark">结算</h1>
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
            <div className="bg-cream-card rounded-2xl shadow-sm p-4 border border-cream-border">
              <h2 className="text-base font-semibold text-cream-text-dark mb-4">商品信息</h2>
              
              <form onSubmit={handleSubmitOrder}>
                {/* 按超市分组展示商品 */}
                {Object.entries(groupedItems).map(([shopName, items]) => (
                  <div key={shopName} className="mb-6">
                    <div className="bg-cream-bg rounded-lg p-1.5 mb-2">
                      <h3 className="font-semibold text-cream-text-dark text-xs flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-cream-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        {shopName}
                      </h3>
                    </div>
                    
                    <div className="space-y-2">
                      {items.map(item => (
                        <div key={item.id} className="flex items-center border-b border-cream-border pb-2 last:border-0 last:pb-0">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-cream-text-dark text-sm truncate">{item.product?.name}</h3>
                          </div>
                          
                          <div className="flex items-center space-x-1 ml-1 flex-shrink-0">
                            <span className="text-cream-text-dark text-xs">x {item.quantity}</span>
                            <div className="flex items-center">
                              <input
                                type="number"
                                value={editingPrices[item.id] || ''}
                                onChange={(e) => handlePriceChange(item.id, e.target.value)}
                                className="w-12 p-0.5 text-xs border border-cream-border rounded text-cream-text-dark text-right"
                                placeholder="价格"
                                min="0"
                                step="1"
                              />
                              <span className="ml-0.5 text-cream-text-dark text-xs">日元</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* 显示该超市商品的小计 */}
                    <div className="mt-2 pt-2 border-t border-cream-border flex justify-end">
                      <div className="text-right">
                        <span className="text-cream-text-light text-xs mr-1">小计:</span>
                        <span className="font-semibold text-cream-text-dark text-sm">
                          {Math.floor(items.reduce((sum, item) => sum + (editingPrices[item.id] || 0) * item.quantity, 0))}日元
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* 费用明细 */}
                <div className="mt-6 pt-4 border-t border-cream-border space-y-2">
                  <div className="flex justify-between">
                    <span className="text-cream-text-dark text-sm">商品总价:</span>
                    <span className="text-cream-text-dark text-sm">{Math.floor(subtotal)}日元</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cream-text-dark text-sm">税费 (8%):</span>
                    <span className="text-cream-text-dark text-sm">{Math.floor(tax)}日元</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-cream-border">
                    <span className="text-cream-text-dark font-medium">总计:</span>
                    <span className="text-cream-text-dark font-bold text-lg">
                      {Math.floor(total)}日元
                    </span>
                  </div>
                </div>
                
                <div className="mt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full px-3 py-2 text-sm font-medium text-white rounded-lg transition duration-300 ${
                      isSubmitting 
                        ? 'bg-cream-text-light cursor-not-allowed' 
                        : 'bg-cream-accent hover:bg-cream-accent-hover'
                    }`}
                  >
                    {isSubmitting ? '提交中...' : '提交订单'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}