'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { isValidBase64Image } from '../utils/imageOptimizer'
import { 
  getProductById, 
  updateProduct, 
  getProductPricesByProductName,
  getProductByIdWithShop,
  deleteProduct,
  getUserCategories, // 添加导入获取用户分类的函数
  type Product
} from '../services/ecommerceService'

// 确保 ProductWithShop 正确继承 Product 的所有属性
interface ProductWithShop extends Product {
  shop?: {
    id: string
    name: string
  }
}

interface ProductModalProps {
  productId: string | null
  isOpen: boolean
  onClose: () => void
  onAddToCart: (productId: string, quantity: number) => void
  user: any
  onProductUpdate?: () => void
}

export default function ProductModal({ 
  productId, 
  isOpen, 
  onClose, 
  onAddToCart, 
  user, 
  onProductUpdate 
}: ProductModalProps) {
  const [product, setProduct] = useState<ProductWithShop | null>(null)
  const [sameProducts, setSameProducts] = useState<ProductWithShop[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [notification, setNotification] = useState<{type: string, message: string} | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedPrices, setEditedPrices] = useState<{[key: string]: number}>({}) // 用于编辑不同超市的价格
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]) // 添加分类状态
  const [editedCategory, setEditedCategory] = useState('') // 添加编辑分类状态

  // 获取商品详情
  const fetchProduct = useCallback(async () => {
    if (!productId) return
    
    setIsLoading(true)
    try {
      // 获取当前商品详情（包含超市信息）
      const { data: productData, error: productError } = await getProductByIdWithShop(productId)
      if (productError) throw productError
      
      setProduct(productData || null)
      setEditedCategory(productData?.category || '') // 设置当前商品的分类
      
      // 如果有商品名，获取同名商品在不同超市的价格信息
      if (productData?.name) {
        const { data: sameProductsData, error: sameProductsError } = await getProductPricesByProductName(productData.name)
        if (sameProductsError) throw sameProductsError
        
        // 按价格排序，最低价在前
        const sortedProducts = sameProductsData?.sort((a, b) => (a.price || 0) - (b.price || 0)) || []
        setSameProducts(sortedProducts)
        
        // 初始化编辑价格状态
        const initialEditedPrices: {[key: string]: number} = {}
        sortedProducts.forEach(p => {
          initialEditedPrices[p.id] = p.price || 0
        })
        setEditedPrices(initialEditedPrices)
      }
    } catch (error) {
      console.error('获取商品详情失败:', error)
      setNotification({type: 'error', message: '获取商品详情失败'})
    } finally {
      setIsLoading(false)
    }
  }, [productId])

  // 获取用户分类
  const fetchUserCategories = useCallback(async () => {
    if (!user) return
    
    try {
      const { data, error } = await getUserCategories(user.id)
      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('获取分类失败:', error)
    }
  }, [user])

  // 设置默认分类的副作用
  useEffect(() => {
    if (categories.length > 0 && !editedCategory) {
      setEditedCategory(categories[0].name)
    }
  }, [categories, editedCategory])

  useEffect(() => {
    if (isOpen && productId) {
      fetchProduct()
      setQuantity(1)
      setIsEditing(false)
    } else {
      setProduct(null)
      setSameProducts([])
      setIsLoading(true)
      setIsEditing(false)
    }
  }, [isOpen, productId, fetchProduct])

  // 当用户和编辑模式变化时获取分类
  useEffect(() => {
    if (user && isEditing) {
      fetchUserCategories()
    }
  }, [user, isEditing, fetchUserCategories])

  // 添加到购物车
  const handleAddToCart = useCallback(async () => {
    if (!user || !product) return
    
    try {
      onAddToCart(product.id, quantity)
      setNotification({type: 'success', message: '商品已添加到购物车'})
      setTimeout(() => {
        setNotification(null)
        onClose()
      }, 1500)
    } catch (error) {
      console.error('添加到购物车失败:', error)
      setNotification({type: 'error', message: '添加到购物车失败'})
      setTimeout(() => setNotification(null), 3000)
    }
  }, [user, product, quantity, onAddToCart, onClose])

  // 数量增加
  const incrementQuantity = useCallback(() => {
    setQuantity(prev => prev + 1)
  }, [])

  // 数量减少
  const decrementQuantity = useCallback(() => {
    setQuantity(prev => (prev > 1 ? prev - 1 : 1))
  }, [])

  // 关闭弹窗时重置状态
  const handleClose = useCallback(() => {
    onClose()
    setNotification(null)
    setIsEditing(false)
  }, [onClose])

  // 删除商品
  const handleDeleteProduct = useCallback(async () => {
    if (!user || !product) return
    
    // 确认删除
    if (!confirm('确定要删除这个商品吗？删除后将无法恢复。')) {
      return
    }
    
    try {
      const { error } = await deleteProduct(product.id)
      
      if (error) throw error
      
      setNotification({type: 'success', message: '商品已删除'})
      
      // 如果有回调函数，通知父组件更新商品列表
      if (onProductUpdate) {
        onProductUpdate()
      }
      
      // 延迟关闭弹窗
      setTimeout(() => {
        setNotification(null)
        onClose()
      }, 1500)
    } catch (error) {
      console.error('删除商品失败:', error)
      setNotification({type: 'error', message: '删除商品失败'})
      setTimeout(() => setNotification(null), 3000)
    }
  }, [user, product, onProductUpdate, onClose])

  // 处理价格编辑变化
  const handlePriceChange = (productId: string, value: string) => {
    const newEditedPrices = { ...editedPrices }
    newEditedPrices[productId] = parseFloat(value) || 0
    setEditedPrices(newEditedPrices)
  }

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!product) return
    
    try {
      // 更新商品分类
      if (editedCategory !== product.category) {
        const { error } = await updateProduct(product.id, { category: editedCategory })
        if (error) throw error
      }
      
      // 更新每个商品的价格
      const updatePromises = sameProducts.map(async (p) => {
        if (editedPrices[p.id] !== (p.price || 0)) {
          return updateProduct(p.id, { price: editedPrices[p.id] })
        }
        return Promise.resolve()
      })
      
      await Promise.all(updatePromises)
      
      setIsEditing(false)
      setNotification({type: 'success', message: '商品信息已更新'})
      
      // 重新获取商品信息
      if (product?.name) {
        const { data: sameProductsData, error: sameProductsError } = await getProductPricesByProductName(product.name)
        if (!sameProductsError) {
          const sortedProducts = sameProductsData?.sort((a, b) => (a.price || 0) - (b.price || 0)) || []
          setSameProducts(sortedProducts)
          
          // 更新编辑价格状态
          const initialEditedPrices: {[key: string]: number} = {}
          sortedProducts.forEach(p => {
            initialEditedPrices[p.id] = p.price || 0
          })
          setEditedPrices(initialEditedPrices)
          
          // 更新当前商品为最低价商品
          if (sortedProducts.length > 0) {
            setProduct(sortedProducts[0])
          }
        }
      }
      
      if (onProductUpdate) {
        onProductUpdate()
      }
      
      setTimeout(() => setNotification(null), 3000)
    } catch (error) {
      console.error('更新商品失败:', error)
      setNotification({type: 'error', message: '更新商品失败'})
      setTimeout(() => setNotification(null), 3000)
    }
  }

  // 渲染通知消息
  const renderNotification = () => {
    if (!notification) return null
    
    return (
      <div className={`fixed top-2 right-2 px-3 py-2 rounded-lg shadow-lg z-50 text-sm ${
        notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
      }`}>
        {notification.message}
      </div>
    )
  }

  // 渲染加载状态
  const renderLoading = () => (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-cream-accent mx-auto"></div>
        <p className="mt-2 text-cream-text-dark text-sm">加载中...</p>
      </div>
    </div>
  )

  // 渲染空状态
  const renderEmptyState = () => (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="bg-cream-border p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cream-text-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-base font-medium text-cream-text-dark mb-1">商品未找到</h3>
        <p className="text-cream-text-light text-sm">抱歉，未找到该商品</p>
      </div>
    </div>
  )

  // 渲染商品图片
  const renderProductImage = () => {
    if (!product) return null
    
    // 检查图片URL是否有效
    const isValidImageUrl = (url: string | null): boolean => {
      if (!url) return false
      // 检查是否为Base64格式
      if (url.startsWith('data:image')) return isValidBase64Image(url)
      // 检查是否为有效的URL格式
      try {
        new URL(url)
        return true
      } catch {
        return false
      }
    }
    
    return (
      <div className="bg-cream-bg rounded-xl overflow-hidden flex items-center justify-center h-48 sm:h-64">
        {product.image_url && isValidImageUrl(product.image_url) ? (
          <img 
            src={product.image_url} 
            alt={product.name} 
            className="max-h-full max-w-full object-contain"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              console.log('图片加载失败，URL:', product.image_url)
              // 显示默认图片
              target.src = 'https://placehold.co/400x400?text=商品图片'
            }}
          />
        ) : (
          <div className="bg-cream-border border-2 border-dashed rounded-xl w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 sm:h-16 sm:w-16 text-cream-text-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>
    )
  }

  // 渲染编辑模式
  const renderEditMode = () => {
    return (
      <>
        <div className="flex justify-between items-start mb-3">
          <h1 className="text-xl font-bold text-cream-text-dark">{product?.name}</h1>
          <button
            onClick={() => setIsEditing(false)}
            className="text-cream-text-dark hover:text-cream-accent"
            aria-label="关闭编辑模式"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* 分类编辑 */}
        <div className="mb-4">
          <label className="block text-cream-text-dark text-xs font-medium mb-1">分类</label>
          <select
            value={editedCategory}
            onChange={(e) => setEditedCategory(e.target.value)}
            className="w-full p-2 border border-cream-border rounded-lg focus:ring-2 focus:ring-cream-accent focus:border-transparent text-sm"
          >
            {categories.map(cat => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>
        
        <div className="mb-6">
          <h2 className="text-base font-semibold text-cream-text-dark mb-2">价格编辑</h2>
          <div className="space-y-2">
            {sameProducts.map((sameProduct) => (
              <div 
                key={sameProduct.id} 
                className="flex justify-between items-center p-2 rounded-lg bg-cream-bg border border-cream-border"
              >
                <div className="flex items-center">
                  <span className="font-medium text-cream-text-dark text-sm">{sameProduct.shop?.name}</span>
                </div>
                <input
                  type="number"
                  value={editedPrices[sameProduct.id] || ''}
                  onChange={(e) => handlePriceChange(sameProduct.id, e.target.value)}
                  className="w-20 p-1 border border-cream-border rounded text-cream-text-dark text-right text-sm"
                  placeholder="价格"
                  aria-label={`编辑${sameProduct.shop?.name}的价格`}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-cream-border pt-4">
          <div className="flex space-x-2">
            <button
              onClick={handleSaveEdit}
              className="flex-1 py-2 px-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition duration-300 text-sm"
              aria-label="保存编辑"
            >
              保存
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="flex-1 py-2 px-3 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition duration-300 text-sm"
              aria-label="取消编辑"
            >
              取消
            </button>
          </div>
          
          {/* 删除商品按钮 */}
          <div className="mt-3">
            <button
              onClick={handleDeleteProduct}
              className="w-full py-2 px-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition duration-300 text-sm"
              aria-label="删除商品"
            >
              删除商品
            </button>
          </div>
        </div>
      </>
    )
  }

  // 渲染查看模式
  const renderViewMode = () => {
    if (!product) return null
    
    return (
      <>
        <div className="flex justify-between items-start mb-3">
          <h1 className="text-xl font-bold text-cream-text-dark">{product.name}</h1>
          <button
            onClick={() => setIsEditing(true)}
            className="text-cream-text-dark hover:text-cream-accent"
            aria-label="编辑商品"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>
        
        {/* 当前商品价格和超市信息 */}
        <div className="mb-5">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-cream-text-dark">{(product.price || 0).toFixed(2)}日元</span>
            {product.shop && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded">
                {product.shop.name}
              </span>
            )}
          </div>
        </div>

        {/* 同名商品在不同超市的价格对比 */}
        {sameProducts.length > 1 && (
          <div className="mb-6">
            <h2 className="text-base font-semibold text-cream-text-dark mb-2">价格对比</h2>
            <div className="space-y-2">
              {sameProducts.map((sameProduct, index) => (
                <div 
                  key={sameProduct.id} 
                  className={`flex justify-between items-center p-2 rounded-lg ${
                    index === 0 
                      ? 'bg-green-100 border border-green-300' 
                      : 'bg-cream-bg border border-cream-border'
                  }`}
                >
                  <div className="flex items-center">
                    <span className="font-medium text-cream-text-dark text-sm">{sameProduct.shop?.name}</span>
                    {index === 0 && (
                      <span className="ml-2 bg-green-500 text-white text-xs font-medium px-1.5 py-0.5 rounded">
                        最优惠
                      </span>
                    )}
                  </div>
                  <span className={`font-bold text-sm ${
                    index === 0 
                      ? 'text-green-700' 
                      : 'text-cream-text-dark'
                  }`}>
                    {(sameProduct.price || 0).toFixed(2)}日元
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 数量选择和购买按钮 */}
        <div className="border-t border-cream-border pt-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-cream-text-dark font-medium text-sm">数量:</span>
            <div className="flex items-center">
              <button 
                onClick={decrementQuantity}
                className="w-8 h-8 flex items-center justify-center bg-cream-bg border border-cream-border rounded-l-lg hover:bg-cream-border transition duration-300"
                aria-label="减少数量"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-cream-text-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <span className="w-10 h-8 flex items-center justify-center bg-cream-bg border-t border-b border-cream-border text-cream-text-dark text-sm">
                {quantity}
              </span>
              <button 
                onClick={incrementQuantity}
                className="w-8 h-8 flex items-center justify-center bg-cream-bg border border-cream-border rounded-r-lg hover:bg-cream-border transition duration-300"
                aria-label="增加数量"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-cream-text-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            className="w-full py-2 px-3 bg-cream-accent text-white rounded-lg font-medium hover:bg-cream-accent-hover transition duration-300 text-sm"
            aria-label="加入购物车"
          >
            加入购物车
          </button>
        </div>
      </>
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
      {/* 背景遮罩 */}
      <div 
        className="fixed inset-0 bg-cream-bg bg-opacity-70 transition-opacity"
        onClick={handleClose}
        aria-hidden="true"
      ></div>

      {/* 弹窗内容 */}
      <div className="flex items-center justify-center min-h-screen p-2 sm:p-4">
        <div 
          className="relative bg-cream-card rounded-2xl shadow-xl border border-cream-border w-full max-w-md max-h-[90vh] overflow-y-auto modal-compact modal-fullscreen-mobile"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 关闭按钮 */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 text-cream-text-dark hover:text-cream-accent z-10"
            aria-label="关闭弹窗"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* 通知消息 */}
          {renderNotification()}

          {isLoading ? (
            renderLoading()
          ) : !product ? (
            renderEmptyState()
          ) : (
            <div className="p-4">
              <div className="grid grid-cols-1 gap-4">
                {/* 商品图片 */}
                {renderProductImage()}

                {/* 商品信息 */}
                <div>
                  {isEditing ? renderEditMode() : renderViewMode()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}