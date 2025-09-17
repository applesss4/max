'use client'

import ProtectedRoute from '../../../components/ProtectedRoute'
import { useAuth } from '../../../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import React, { useState, useEffect, useCallback } from 'react'
import { 
  getUserOrders,
  getOrderDetails
} from '../../../services/ecommerceService'
import { Order, OrderItem } from '../../../services/ecommerceService'

export default function OrdersPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<{order: Order, items: OrderItem[]} | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDetailLoading, setIsDetailLoading] = useState(false)

  // 获取用户订单列表
  const fetchOrders = useCallback(async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const { data, error } = await getUserOrders(user.id)
      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('获取订单列表失败:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  // 设置获取订单列表的副作用
  useEffect(() => {
    if (user) {
      fetchOrders()
    }
  }, [user, fetchOrders])

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

  // 查看订单详情
  const handleViewOrderDetails = async (orderId: string) => {
    if (!user) return
    
    setIsDetailLoading(true)
    try {
      const { data, error } = await getOrderDetails(orderId)
      if (error) throw error
      setSelectedOrder(data || null)
    } catch (error) {
      console.error('获取订单详情失败:', error)
    } finally {
      setIsDetailLoading(false)
    }
  }

  // 关闭订单详情
  const handleCloseOrderDetails = () => {
    setSelectedOrder(null)
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
                <h1 className="text-xl font-semibold text-cream-text-dark">我的订单</h1>
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
          ) : orders.length === 0 ? (
            <div className="bg-cream-card rounded-2xl shadow-sm p-8 border border-cream-border text-center">
              <div className="bg-cream-border p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cream-text-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-cream-text-dark mb-2">暂无订单</h3>
              <p className="text-cream-text-light mb-4">您还没有创建任何订单</p>
              <button
                onClick={() => router.push('/shopping')}
                className="px-4 py-2 text-sm font-medium text-white bg-cream-accent hover:bg-cream-accent-hover rounded-lg transition duration-300"
              >
                去购物
              </button>
            </div>
          ) : (
            <div className="bg-cream-card rounded-2xl shadow-sm p-6 border border-cream-border">
              <h2 className="text-lg font-semibold text-cream-text-dark mb-6">订单历史</h2>
              
              <div className="space-y-4">
                {orders.map(order => (
                  <div key={order.id} className="border border-cream-border rounded-xl p-4 hover:shadow-md transition duration-300">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex items-center">
                          <span className="font-medium text-cream-text-dark">订单号: {order.id.substring(0, 8)}</span>
                        </div>
                        <p className="text-sm text-cream-text-light mt-1">
                          下单时间: {new Date(order.created_at).toLocaleString('zh-CN')}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between md:justify-end mt-3 md:mt-0">
                        <span className="font-medium text-cream-text-dark mr-4">总计: {order.total_amount.toFixed(2)}日元</span>
                        <button
                          onClick={() => handleViewOrderDetails(order.id)}
                          className="text-sm text-cream-accent hover:text-cream-accent-hover"
                        >
                          查看详情
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* 订单详情模态框 */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-50">
            <div className="bg-cream-card rounded-2xl shadow-lg p-4 w-full max-w-2xl border border-cream-border max-h-[90vh] overflow-y-auto modal-compact">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold text-cream-text-dark">订单详情</h2>
                <button
                  onClick={handleCloseOrderDetails}
                  className="text-cream-text-light hover:text-cream-text"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {isDetailLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cream-accent mx-auto"></div>
                  <p className="mt-2 text-cream-text-dark">加载中...</p>
                </div>
              ) : (
                <>
                  <div className="mb-4 p-3 bg-cream-bg rounded-lg border border-cream-border">
                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <p className="text-xs text-cream-text-light">订单号</p>
                        <p className="text-cream-text-dark text-sm">{selectedOrder.order.id}</p>
                      </div>
                      <div>
                        <p className="text-xs text-cream-text-light">下单时间</p>
                        <p className="text-cream-text-dark text-sm">
                          {new Date(selectedOrder.order.created_at).toLocaleString('zh-CN')}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-cream-text-light">总金额</p>
                        <p className="text-cream-text-dark font-medium text-sm">
                          {selectedOrder.order.total_amount.toFixed(2)}日元
                        </p>
                      </div>
                    </div>
                    
                    {selectedOrder.order.shipping_address && (
                      <div className="mt-4 pt-4 border-t border-cream-border">
                        <p className="text-sm text-cream-text-light">收货地址</p>
                        <p className="text-cream-text-dark">{selectedOrder.order.shipping_address}</p>
                      </div>
                    )}
                  </div>

                  <h3 className="text-base font-medium text-cream-text-dark mb-3">商品信息</h3>
                  {/* 按超市分组展示商品 */}
                  {(() => {
                    // 按超市名分组商品
                    const groupedItems: { [shopName: string]: typeof selectedOrder.items } = {}
                    
                    selectedOrder.items.forEach(item => {
                      // 获取超市名称，如果没有则使用"未知超市"
                      const shopName = (item.product as any)?.shop?.name || '未知超市'
                      
                      if (!groupedItems[shopName]) {
                        groupedItems[shopName] = []
                      }
                      
                      groupedItems[shopName].push(item)
                    })
                    
                    return Object.entries(groupedItems).map(([shopName, items]) => (
                      <div key={shopName} className="mb-6">
                        <div className="bg-cream-bg rounded-lg p-2 mb-3">
                          <h4 className="font-semibold text-cream-text-dark flex items-center text-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-cream-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            {shopName}
                          </h4>
                        </div>
                        
                        <div className="space-y-3">
                          {items.map(item => (
                            <div key={item.id} className="flex items-center border-b border-cream-border pb-3 last:border-0 last:pb-0">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-cream-text-dark truncate">{item.product?.name}</h3>
                              </div>
                              
                              <div className="flex items-center space-x-2 flex-shrink-0">
                                <span className="text-cream-text-dark text-sm">x {item.quantity}</span>
                                <span className="font-medium text-cream-text-dark w-16 text-right text-sm">
                                  {(item.price * item.quantity).toFixed(2)}日元
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* 显示该超市商品的小计 */}
                        <div className="mt-3 pt-3 border-t border-cream-border flex justify-end">
                          <div className="text-right">
                            <span className="text-cream-text-light mr-2">小计:</span>
                            <span className="font-semibold text-cream-text-dark">
                              {items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}日元
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  })()}
                  
                  <div className="mt-6 pt-4 border-t border-cream-border flex justify-end">
                    <div className="text-right">
                      <p className="text-cream-text-light">商品总价</p>
                      <p className="text-lg font-bold text-cream-text-dark">
                        {selectedOrder.order.total_amount.toFixed(2)}日元
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}