'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { compressBase64Image, getBase64ImageSize } from '@/utils/imageOptimizer'
import { createProduct, getUserShops, getUserCategories } from '@/services/ecommerceService'
import { Product, Category } from '@/services/ecommerceService'

interface AddProductModalProps {
  isOpen: boolean
  onClose: () => void
  onProductAdded: () => void
  userId: string
}

export default function AddProductModal({ isOpen, onClose, onProductAdded, userId }: AddProductModalProps) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('')
  const [shopId, setShopId] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [shops, setShops] = useState<{ id: string; name: string }[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 获取用户超市列表
  const fetchUserShops = useCallback(async () => {
    if (!userId) return
    
    try {
      const { data, error } = await getUserShops(userId)
      if (error) throw error
      setShops(data || [])
      
      // 设置默认选择第一个超市（仅当shopId为空时）
      if (!shopId && data && data.length > 0 && isOpen) {
        setShopId(data[0].id)
      }
    } catch (err) {
      console.error('获取超市列表失败:', err)
      setError('获取超市列表失败')
    }
  }, [userId, shopId, isOpen])

  // 获取用户分类列表
  const fetchUserCategories = useCallback(async () => {
    if (!userId) return
    
    try {
      const { data, error } = await getUserCategories(userId)
      if (error) throw error
      setCategories(data || [])
      
      // 设置默认选择第一个分类（仅当category为空时）
      if (!category && data && data.length > 0 && isOpen) {
        setCategory(data[0].name)
      }
    } catch (err) {
      console.error('获取分类列表失败:', err)
      setError('获取分类列表失败')
    }
  }, [userId, category, isOpen])

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserShops()
      fetchUserCategories()
    }
  }, [isOpen, userId, fetchUserShops, fetchUserCategories])

  // 处理图片选择
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        setError('请选择图片文件')
        return
      }
      
      // 检查文件大小 (最大5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('图片大小不能超过5MB')
        return
      }
      
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
      setError(null)
    }
  }

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name || !price || !shopId) {
      setError('请填写所有必填字段')
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      // 如果有图片，将其转换为Base64
      let imageUrl: string | null = null
      if (imageFile) {
        imageUrl = await convertImageToBase64(imageFile)
      }
      
      // 构建商品数据
      const newProduct: Omit<Product, 'id' | 'created_at' | 'updated_at'> = {
        name,
        description: null,
        price: parseFloat(price) || 0,
        category,
        image_url: imageUrl, // 使用转换后的Base64图片
        stock_quantity: 0,
        shop_id: shopId // 添加超市ID
      }
      
      // 创建商品
      const { data, error } = await createProduct(newProduct)
      if (error) throw error
      
      // 通知父组件商品已添加
      onProductAdded()
      
      // 关闭弹窗并重置表单
      handleClose()
    } catch (err) {
      console.error('添加商品失败:', err)
      setError('添加商品失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  // 将图片文件转换为Base64格式并压缩
  const convertImageToBase64 = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = async () => {
        // 确保返回的是字符串
        const result = reader.result
        if (typeof result === 'string') {
          // 检查原始图片大小
          const originalSize = getBase64ImageSize(result);
          console.log('原始图片大小:', originalSize, 'KB');
          
          // 如果图片大于100KB，则进行压缩
          if (originalSize > 100) {
            try {
              // 压缩图片
              const compressedImage = await compressBase64Image(result, 800, 600, 0.8);
              const compressedSize = getBase64ImageSize(compressedImage);
              console.log('压缩后图片大小:', compressedSize, 'KB');
              
              // 如果压缩后的图片更小，则使用压缩后的图片
              if (compressedSize < originalSize) {
                resolve(compressedImage);
              } else {
                // 如果压缩后没有变小，则使用原始图片
                resolve(result);
              }
            } catch (error) {
              console.error('图片压缩失败:', error);
              // 压缩失败时使用原始图片
              resolve(result);
            }
          } else {
            // 图片较小，无需压缩
            resolve(result);
          }
        } else {
          reject(new Error('图片转换失败'))
        }
      }
      reader.onerror = error => reject(error)
    })
  }

  // 关闭弹窗并重置表单
  const handleClose = () => {
    onClose()
    setName('')
    setPrice('')
    setCategory('')
    setShopId('')
    setImageFile(null)
    setImagePreview(null)
    setError(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="add-product-modal-title">
      {/* 背景遮罩 */}
      <div 
        className="fixed inset-0 bg-cream-bg bg-opacity-70 transition-opacity"
        onClick={handleClose}
        aria-hidden="true"
      ></div>

      {/* 弹窗内容 */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div 
          className="relative bg-cream-card rounded-2xl shadow-xl border border-cream-border w-full max-w-md max-h-[90vh] overflow-y-auto modal-compact modal-fullscreen-mobile"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 关闭按钮 */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-cream-text-dark hover:text-cream-accent"
            aria-label="关闭弹窗"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* 标题 */}
          <div className="p-6 pb-0">
            <h2 id="add-product-modal-title" className="text-2xl font-bold text-cream-text-dark mb-6">添加商品</h2>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="p-6 pt-0">
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm" role="alert">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              {/* 商品名称 */}
              <div>
                <label className="block text-cream-text-dark text-xs font-medium mb-1">商品名称 *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border border-cream-border rounded-lg focus:ring-2 focus:ring-cream-accent focus:border-transparent text-sm"
                  placeholder="请输入商品名称"
                  required
                  aria-required="true"
                />
              </div>
              
              {/* 价格 */}
              <div>
                <label className="block text-cream-text-dark text-xs font-medium mb-1">价格 (日元) *</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full p-2 border border-cream-border rounded-lg focus:ring-2 focus:ring-cream-accent focus:border-transparent text-sm"
                  placeholder="请输入价格"
                  min="0"
                  step="1"
                  required
                  aria-required="true"
                />
              </div>
              
              {/* 分类 */}
              <div>
                <label className="block text-cream-text-dark text-xs font-medium mb-1">分类</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2 border border-cream-border rounded-lg focus:ring-2 focus:ring-cream-accent focus:border-transparent text-sm"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
              
              {/* 超市 */}
              <div>
                <label className="block text-cream-text-dark text-xs font-medium mb-1">超市 *</label>
                <select
                  value={shopId}
                  onChange={(e) => setShopId(e.target.value)}
                  className="w-full p-2 border border-cream-border rounded-lg focus:ring-2 focus:ring-cream-accent focus:border-transparent text-sm"
                  required
                  aria-required="true"
                >
                  <option value="">请选择超市</option>
                  {shops.map(shop => (
                    <option key={shop.id} value={shop.id}>{shop.name}</option>
                  ))}
                </select>
              </div>
              
              {/* 图片上传 */}
              <div>
                <label className="block text-cream-text-dark text-xs font-medium mb-1">商品图片</label>
                <div className="flex items-center space-x-2">
                  {imagePreview && (
                    <div className="flex-shrink-0">
                      <img 
                        src={imagePreview} 
                        alt="预览" 
                        className="w-12 h-12 object-cover rounded-lg border border-cream-border"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-cream-border rounded-lg cursor-pointer bg-cream-bg hover:bg-cream-border transition-colors">
                      <div className="flex flex-col items-center justify-center pt-3 pb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-cream-text-light mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-xs text-cream-text-light text-center">
                          <span className="font-semibold">点击上传</span>
                          <span className="block">或拖拽图片</span>
                        </p>
                        <p className="text-xs text-cream-text-light mt-1">PNG, JPG (最大5MB)</p>
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleImageChange}
                        aria-label="上传商品图片"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 按钮 */}
            <div className="flex space-x-2 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-2 px-3 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition duration-300 text-sm"
                disabled={isLoading}
                aria-label="取消添加商品"
              >
                取消
              </button>
              <button
                type="submit"
                className="flex-1 py-2 px-3 bg-cream-accent text-white rounded-lg font-medium hover:bg-cream-accent-hover transition duration-300 disabled:opacity-50 text-sm"
                disabled={isLoading}
                aria-label="提交添加商品"
              >
                {isLoading ? '添加中...' : '添加'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}