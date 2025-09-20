'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import React, { useState, useEffect, useCallback } from 'react'
import BarcodeScanner from '@/components/BarcodeScanner'
import { 
  getUserBarcodes, 
  createBarcode, 
  updateBarcode, 
  deleteBarcode,
  Barcode
} from '@/services/barcodeService'

export default function BarcodePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [barcodes, setBarcodes] = useState<Barcode[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingBarcode, setEditingBarcode] = useState<Barcode | null>(null)
  const [formData, setFormData] = useState({
    barcode_value: '',
    barcode_type: 'EAN-13',
    product_name: '',
    product_description: '',
    product_price: '',
    product_category: '',
    product_image_url: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [scanMode, setScanMode] = useState(false)

  // 获取用户条形码数据
  const fetchBarcodes = useCallback(async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const { data, error } = await getUserBarcodes(user.id)
      if (error) throw error
      setBarcodes(data || [])
    } catch (error) {
      console.error('获取条形码数据失败:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchBarcodes()
    }
  }, [user, fetchBarcodes])

  // 处理条形码扫描结果
  const handleScan = useCallback(async (barcodeValue: string) => {
    try {
      // 检查条形码是否已存在
      if (user) {
        const { data: existingBarcode } = await getUserBarcodes(user.id)
        const found = existingBarcode?.find(b => b.barcode_value === barcodeValue)
        
        if (found) {
          // 如果条形码已存在，直接编辑
          setEditingBarcode(found)
          setFormData({
            barcode_value: found.barcode_value,
            barcode_type: found.barcode_type,
            product_name: found.product_name || '',
            product_description: found.product_description || '',
            product_price: found.product_price?.toString() || '',
            product_category: found.product_category || '',
            product_image_url: found.product_image_url || ''
          })
          setShowForm(true)
          setScanMode(false)
          return
        }
      }
      
      // 设置表单数据并显示编辑表单
      setFormData(prev => ({
        ...prev,
        barcode_value: barcodeValue,
        barcode_type: barcodeValue.length === 13 ? 'EAN-13' : 'CODE-128'
      }))
      setShowForm(true)
      setScanMode(false)
    } catch (error) {
      console.error('处理扫描结果失败:', error)
    }
  }, [user])

  // 处理扫描错误
  const handleScanError = useCallback((error: string) => {
    console.error('扫描错误:', error)
  }, [])

  // 处理表单输入变化
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }, [])

  // 提交表单
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) return
    
    try {
      if (editingBarcode) {
        // 更新现有条形码数据
        const { data, error } = await updateBarcode(editingBarcode.id, {
          ...formData,
          product_price: formData.product_price ? parseFloat(formData.product_price) : undefined
        })
        
        if (error) throw error
        
        setBarcodes(barcodes.map(b => 
          b.id === editingBarcode.id ? data! : b
        ))
        setEditingBarcode(null)
      } else {
        // 添加新条形码数据
        const { data, error } = await createBarcode(user.id, {
          barcode_value: formData.barcode_value,
          barcode_type: formData.barcode_type,
          product_name: formData.product_name || undefined,
          product_description: formData.product_description || undefined,
          product_price: formData.product_price ? parseFloat(formData.product_price) : undefined,
          product_category: formData.product_category || undefined,
          product_image_url: formData.product_image_url || undefined
        })
        
        if (error) throw error
        
        setBarcodes([data!, ...barcodes])
      }
      
      // 重置表单
      setFormData({
        barcode_value: '',
        barcode_type: 'EAN-13',
        product_name: '',
        product_description: '',
        product_price: '',
        product_category: '',
        product_image_url: ''
      })
      setShowForm(false)
    } catch (error) {
      console.error('保存条形码数据失败:', error)
    }
  }, [user, formData, editingBarcode, barcodes])

  // 编辑条形码数据
  const handleEdit = useCallback((barcode: Barcode) => {
    setEditingBarcode(barcode)
    setFormData({
      barcode_value: barcode.barcode_value,
      barcode_type: barcode.barcode_type,
      product_name: barcode.product_name || '',
      product_description: barcode.product_description || '',
      product_price: barcode.product_price?.toString() || '',
      product_category: barcode.product_category || '',
      product_image_url: barcode.product_image_url || ''
    })
    setShowForm(true)
    setScanMode(false)
  }, [])

  // 删除条形码数据
  const handleDelete = useCallback(async (id: string) => {
    if (!user) return
    
    if (confirm('确定要删除这条条形码记录吗？')) {
      try {
        const { error } = await deleteBarcode(id)
        if (error) throw error
        
        setBarcodes(barcodes.filter(b => b.id !== id))
      } catch (error) {
        console.error('删除条形码记录失败:', error)
      }
    }
  }, [user, barcodes])

  // 格式化日期显示
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }, [])

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
        <header className="bg-cream-card shadow-sm border-b border-cream-border">
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
                <h1 className="text-xl font-semibold text-cream-text-dark">条形码管理</h1>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setScanMode(!scanMode)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition duration-300 ${
                    scanMode 
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : 'bg-cream-accent hover:bg-cream-accent-hover text-white'
                  }`}
                >
                  {scanMode ? '取消扫描' : '扫描条形码'}
                </button>
                <button
                  onClick={() => {
                    setEditingBarcode(null)
                    setFormData({
                      barcode_value: '',
                      barcode_type: 'EAN-13',
                      product_name: '',
                      product_description: '',
                      product_price: '',
                      product_category: '',
                      product_image_url: ''
                    })
                    setShowForm(true)
                    setScanMode(false)
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-cream-accent hover:bg-cream-accent-hover rounded-lg transition duration-300"
                >
                  手动添加
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* 主内容区域 */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {scanMode ? (
            // 扫描模式
            <div className="bg-cream-card rounded-2xl shadow-sm p-6 border border-cream-border">
              <h2 className="text-lg font-medium text-cream-text-dark mb-4">条形码扫描</h2>
              <BarcodeScanner onScan={handleScan} onError={handleScanError} />
            </div>
          ) : showForm ? (
            // 添加/编辑表单模式
            <div className="bg-cream-card rounded-2xl shadow-sm p-6 border border-cream-border">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-cream-text-dark">
                  {editingBarcode ? '编辑条形码信息' : '添加条形码信息'}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false)
                    setEditingBarcode(null)
                    setFormData({
                      barcode_value: '',
                      barcode_type: 'EAN-13',
                      product_name: '',
                      product_description: '',
                      product_price: '',
                      product_category: '',
                      product_image_url: ''
                    })
                  }}
                  className="text-cream-text-light hover:text-cream-text"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="barcode_value" className="block text-sm font-medium text-cream-text-dark mb-2">
                      条形码值 *
                    </label>
                    <input
                      id="barcode_value"
                      name="barcode_value"
                      type="text"
                      value={formData.barcode_value}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-cream-border focus:outline-none focus:ring-2 focus:ring-cream-accent focus:border-transparent bg-cream-input text-cream-text"
                      required
                      readOnly={!!editingBarcode}
                    />
                  </div>

                  <div>
                    <label htmlFor="barcode_type" className="block text-sm font-medium text-cream-text-dark mb-2">
                      条形码类型
                    </label>
                    <select
                      id="barcode_type"
                      name="barcode_type"
                      value={formData.barcode_type}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-cream-border focus:outline-none focus:ring-2 focus:ring-cream-accent focus:border-transparent bg-cream-input text-cream-text"
                    >
                      <option value="EAN-13">EAN-13</option>
                      <option value="EAN-8">EAN-8</option>
                      <option value="UPC-A">UPC-A</option>
                      <option value="UPC-E">UPC-E</option>
                      <option value="CODE-128">CODE-128</option>
                      <option value="CODE-39">CODE-39</option>
                      <option value="QR_CODE">二维码</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="product_name" className="block text-sm font-medium text-cream-text-dark mb-2">
                      产品名称
                    </label>
                    <input
                      id="product_name"
                      name="product_name"
                      type="text"
                      value={formData.product_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-cream-border focus:outline-none focus:ring-2 focus:ring-cream-accent focus:border-transparent bg-cream-input text-cream-text"
                      placeholder="请输入产品名称"
                    />
                  </div>

                  <div>
                    <label htmlFor="product_price" className="block text-sm font-medium text-cream-text-dark mb-2">
                      产品价格 (元)
                    </label>
                    <input
                      id="product_price"
                      name="product_price"
                      type="number"
                      step="0.01"
                      value={formData.product_price}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-cream-border focus:outline-none focus:ring-2 focus:ring-cream-accent focus:border-transparent bg-cream-input text-cream-text"
                      placeholder="请输入产品价格"
                    />
                  </div>

                  <div>
                    <label htmlFor="product_category" className="block text-sm font-medium text-cream-text-dark mb-2">
                      产品分类
                    </label>
                    <input
                      id="product_category"
                      name="product_category"
                      type="text"
                      value={formData.product_category}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-cream-border focus:outline-none focus:ring-2 focus:ring-cream-accent focus:border-transparent bg-cream-input text-cream-text"
                      placeholder="请输入产品分类"
                    />
                  </div>

                  <div>
                    <label htmlFor="product_image_url" className="block text-sm font-medium text-cream-text-dark mb-2">
                      产品图片URL
                    </label>
                    <input
                      id="product_image_url"
                      name="product_image_url"
                      type="text"
                      value={formData.product_image_url}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-cream-border focus:outline-none focus:ring-2 focus:ring-cream-accent focus:border-transparent bg-cream-input text-cream-text"
                      placeholder="请输入产品图片URL"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="product_description" className="block text-sm font-medium text-cream-text-dark mb-2">
                    产品描述
                  </label>
                  <textarea
                    id="product_description"
                    name="product_description"
                    value={formData.product_description}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-cream-border focus:outline-none focus:ring-2 focus:ring-cream-accent focus:border-transparent bg-cream-input text-cream-text"
                    placeholder="请输入产品描述"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      setEditingBarcode(null)
                      setFormData({
                        barcode_value: '',
                        barcode_type: 'EAN-13',
                        product_name: '',
                        product_description: '',
                        product_price: '',
                        product_category: '',
                        product_image_url: ''
                      })
                    }}
                    className="px-4 py-2 text-sm font-medium text-cream-text-dark bg-cream-border hover:bg-cream-bg rounded-lg transition duration-300"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-cream-accent hover:bg-cream-accent-hover rounded-lg transition duration-300"
                  >
                    {editingBarcode ? '更新' : '添加'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            // 条形码列表模式
            <div className="bg-cream-card rounded-2xl shadow-sm p-6 border border-cream-border">
              <h2 className="text-lg font-medium text-cream-text-dark mb-4">条形码记录</h2>
              
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cream-accent mx-auto"></div>
                  <p className="mt-2 text-cream-text-dark">加载中...</p>
                </div>
              ) : barcodes.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-cream-border p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cream-text-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-cream-text-dark mb-2">暂无条形码记录</h3>
                  <p className="text-cream-text-light mb-4">点击"扫描条形码"或"手动添加"按钮创建您的第一条记录</p>
                  <div className="flex justify-center space-x-3">
                    <button
                      onClick={() => setScanMode(true)}
                      className="px-4 py-2 text-sm font-medium text-white bg-cream-accent hover:bg-cream-accent-hover rounded-lg transition duration-300"
                    >
                      扫描条形码
                    </button>
                    <button
                      onClick={() => {
                        setEditingBarcode(null)
                        setFormData({
                          barcode_value: '',
                          barcode_type: 'EAN-13',
                          product_name: '',
                          product_description: '',
                          product_price: '',
                          product_category: '',
                          product_image_url: ''
                        })
                        setShowForm(true)
                      }}
                      className="px-4 py-2 text-sm font-medium text-cream-text-dark bg-cream-border hover:bg-cream-bg rounded-lg transition duration-300"
                    >
                      手动添加
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {barcodes.map(barcode => (
                    <div key={barcode.id} className="border border-cream-border rounded-xl p-4 hover:shadow-md transition duration-300">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-medium text-cream-text-dark">{barcode.product_name || '未命名产品'}</h3>
                          <p className="text-cream-text-light text-sm mt-1">
                            {barcode.barcode_value} ({barcode.barcode_type})
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(barcode)}
                            className="text-cream-accent hover:text-cream-accent-hover"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(barcode.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {barcode.product_price && (
                          <div className="bg-cream-bg rounded-lg p-2">
                            <p className="text-cream-text-light text-xs">价格</p>
                            <p className="font-medium text-cream-text-dark">¥{barcode.product_price.toFixed(2)}</p>
                          </div>
                        )}
                        {barcode.product_category && (
                          <div className="bg-cream-bg rounded-lg p-2">
                            <p className="text-cream-text-light text-xs">分类</p>
                            <p className="font-medium text-cream-text-dark">{barcode.product_category}</p>
                          </div>
                        )}
                        <div className="bg-cream-bg rounded-lg p-2">
                          <p className="text-cream-text-light text-xs">扫描时间</p>
                          <p className="font-medium text-cream-text-dark">{formatDate(barcode.scanned_at)}</p>
                        </div>
                      </div>

                      {barcode.product_description && (
                        <div className="mt-3 pt-3 border-t border-cream-border">
                          <p className="text-cream-text-light text-xs">描述</p>
                          <p className="text-cream-text-dark text-sm">{barcode.product_description}</p>
                        </div>
                      )}

                      {barcode.product_image_url && (
                        <div className="mt-3">
                          <p className="text-cream-text-light text-xs mb-1">产品图片</p>
                          <img 
                            src={barcode.product_image_url} 
                            alt={barcode.product_name || '产品图片'} 
                            className="w-16 h-16 object-cover rounded-lg border border-cream-border"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                            }}
                          />
                        </div>
                      )}
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