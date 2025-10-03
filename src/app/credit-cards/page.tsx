'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { CreditCard, getCreditCards, addCreditCard, updateCreditCard, deleteCreditCard } from '@/services/creditCardService'

export default function CreditCardsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [cards, setCards] = useState<CreditCard[]>([])
  const [loadingCards, setLoadingCards] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null)
  const [formData, setFormData] = useState({
    card_name: '',
    card_number_last_4: '',
    total_amount: '',
    monthly_payment: '',
    payment_date: '',
    paid_amount: '',
    periods: ''
  })
  const [error, setError] = useState('')

  // 获取信用卡列表
  const fetchCards = async () => {
    if (!user) return

    try {
      setLoadingCards(true)
      const data = await getCreditCards(user.id)
      setCards(data)
    } catch (err) {
      console.error('获取信用卡列表失败:', err)
      setError('获取信用卡列表失败')
    } finally {
      setLoadingCards(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchCards()
    }
  }, [user])

  // 处理重定向逻辑
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // 处理表单输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setError('请先登录')
      return
    }

    // 验证表单数据
    if (!formData.card_name.trim()) {
      setError('请输入信用卡名称')
      return
    }

    if (!formData.card_number_last_4.trim() || formData.card_number_last_4.length !== 4) {
      setError('请输入信用卡末4位数字')
      return
    }

    if (!formData.payment_date) {
      setError('请选择还款日期')
      return
    }

    if (formData.periods && (parseInt(formData.periods) <= 0)) {
      setError('期数必须大于0')
      return
    }

    try {
      setError('')
      
      if (editingCard) {
        // 更新信用卡
        await updateCreditCard(editingCard.id, {
          card_name: formData.card_name,
          card_number_last_4: formData.card_number_last_4,
          total_amount: parseFloat(formData.total_amount) || 0,
          monthly_payment: parseFloat(formData.monthly_payment) || 0,
          payment_date: formData.payment_date,
          paid_amount: parseFloat(formData.paid_amount) || 0,
          periods: parseInt(formData.periods) || 1
        })
      } else {
        // 添加新信用卡
        await addCreditCard({
          card_name: formData.card_name,
          card_number_last_4: formData.card_number_last_4,
          total_amount: parseFloat(formData.total_amount) || 0,
          monthly_payment: parseFloat(formData.monthly_payment) || 0,
          payment_date: formData.payment_date,
          paid_amount: parseFloat(formData.paid_amount) || 0,
          periods: parseInt(formData.periods) || 1
        }, user.id)
      }

      // 重置表单
      setFormData({
        card_name: '',
        card_number_last_4: '',
        total_amount: '',
        monthly_payment: '',
        payment_date: '',
        paid_amount: '',
        periods: ''
      })
      setEditingCard(null)
      setShowForm(false)
      
      // 重新获取数据
      await fetchCards()
    } catch (err) {
      console.error('保存信用卡信息失败:', err)
      setError('保存信用卡信息失败')
    }
  }

  // 处理编辑信用卡
  const handleEdit = (card: CreditCard) => {
    setEditingCard(card)
    setFormData({
      card_name: card.card_name,
      card_number_last_4: card.card_number_last_4,
      total_amount: card.total_amount.toString(),
      monthly_payment: card.monthly_payment.toString(),
      payment_date: card.payment_date,
      paid_amount: card.paid_amount.toString(),
      periods: card.periods.toString()
    })
    setShowForm(true)
  }

  // 处理删除信用卡
  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这张信用卡吗？')) return

    try {
      await deleteCreditCard(id)
      await fetchCards()
    } catch (err) {
      console.error('删除信用卡失败:', err)
      setError('删除信用卡失败')
    }
  }

  // 取消编辑
  const handleCancel = () => {
    setShowForm(false)
    setEditingCard(null)
    setFormData({
      card_name: '',
      card_number_last_4: '',
      total_amount: '',
      monthly_payment: '',
      payment_date: '',
      paid_amount: '',
      periods: ''
    })
    setError('')
  }

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

  if (!user) {
    return null
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-cream-bg">
        {/* 顶部导航栏 */}
        <header className="bg-cream-card shadow-sm border-b border-cream-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center">
                <button 
                  onClick={() => router.back()}
                  className="mr-4 text-cream-accent hover:text-cream-accent-hover"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
                <h1 className="text-xl font-semibold text-cream-text-dark">信用卡管理</h1>
              </div>
              <button
                onClick={() => {
                  setEditingCard(null)
                  setFormData({
                    card_name: '',
                    card_number_last_4: '',
                    total_amount: '',
                    monthly_payment: '',
                    payment_date: '',
                    paid_amount: '',
                    periods: ''
                  })
                  setShowForm(!showForm)
                }}
                className="bg-cream-accent hover:bg-cream-accent-hover text-white px-4 py-2 rounded-md text-sm font-medium transition duration-300"
              >
                {showForm ? '取消' : '添加信用卡'}
              </button>
            </div>
          </div>
        </header>

        {/* 主内容区域 */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {showForm && (
            <div className="bg-cream-card rounded-lg shadow-sm border border-cream-border p-6 mb-6">
              <h2 className="text-lg font-medium text-cream-text-dark mb-4">
                {editingCard ? '编辑信用卡' : '添加新信用卡'}
              </h2>
              
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="card_name" className="block text-sm font-medium text-cream-text-dark mb-1">
                      信用卡名称 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="card_name"
                      name="card_name"
                      value={formData.card_name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-cream-border rounded-md shadow-sm focus:outline-none focus:ring-cream-accent focus:border-cream-accent"
                      placeholder="如：招商银行信用卡"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="card_number_last_4" className="block text-sm font-medium text-cream-text-dark mb-1">
                      末4位数字 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="card_number_last_4"
                      name="card_number_last_4"
                      value={formData.card_number_last_4}
                      onChange={handleInputChange}
                      maxLength={4}
                      className="w-full px-3 py-2 border border-cream-border rounded-md shadow-sm focus:outline-none focus:ring-cream-accent focus:border-cream-accent"
                      placeholder="如：1234"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="total_amount" className="block text-sm font-medium text-cream-text-dark mb-1">
                      总还款金额 (¥)
                    </label>
                    <input
                      type="number"
                      id="total_amount"
                      name="total_amount"
                      value={formData.total_amount}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-cream-border rounded-md shadow-sm focus:outline-none focus:ring-cream-accent focus:border-cream-accent"
                      placeholder="如：5000.00"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="monthly_payment" className="block text-sm font-medium text-cream-text-dark mb-1">
                      月还款金额 (¥)
                    </label>
                    <input
                      type="number"
                      id="monthly_payment"
                      name="monthly_payment"
                      value={formData.monthly_payment}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-cream-border rounded-md shadow-sm focus:outline-none focus:ring-cream-accent focus:border-cream-accent"
                      placeholder="如：1000.00"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="paid_amount" className="block text-sm font-medium text-cream-text-dark mb-1">
                      已还款金额 (¥)
                    </label>
                    <input
                      type="number"
                      id="paid_amount"
                      name="paid_amount"
                      value={formData.paid_amount}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-cream-border rounded-md shadow-sm focus:outline-none focus:ring-cream-accent focus:border-cream-accent"
                      placeholder="如：2000.00"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="periods" className="block text-sm font-medium text-cream-text-dark mb-1">
                      期数
                    </label>
                    <input
                      type="number"
                      id="periods"
                      name="periods"
                      value={formData.periods}
                      onChange={handleInputChange}
                      min="1"
                      className="w-full px-3 py-2 border border-cream-border rounded-md shadow-sm focus:outline-none focus:ring-cream-accent focus:border-cream-accent"
                      placeholder="如：12"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label htmlFor="payment_date" className="block text-sm font-medium text-cream-text-dark mb-1">
                      还款日期 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      id="payment_date"
                      name="payment_date"
                      value={formData.payment_date}
                      onChange={handleInputChange}
                      className="w-full md:w-1/3 px-3 py-2 border border-cream-border rounded-md shadow-sm focus:outline-none focus:ring-cream-accent focus:border-cream-accent"
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="bg-white py-2 px-4 border border-cream-border rounded-md shadow-sm text-sm font-medium text-cream-text-dark hover:bg-cream-bg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cream-accent"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-cream-accent hover:bg-cream-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cream-accent"
                  >
                    {editingCard ? '更新' : '添加'}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {loadingCards ? (
            <div className="flex justify-center items-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cream-accent"></div>
              <span className="ml-2 text-cream-text-dark">正在加载信用卡信息...</span>
            </div>
          ) : cards.length === 0 ? (
            <div className="text-center py-12">
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-cream-text-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-cream-text-dark">暂无信用卡</h3>
              <p className="mt-1 text-sm text-cream-text-light">开始添加您的第一张信用卡吧</p>
              <div className="mt-6">
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-cream-accent hover:bg-cream-accent-hover focus:outline-none transition duration-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  添加信用卡
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-cream-card rounded-lg shadow-sm border border-cream-border overflow-hidden">
              <div className="px-6 py-4 border-b border-cream-border">
                <h2 className="text-lg font-medium text-cream-text-dark">我的信用卡</h2>
              </div>
              <div className="divide-y divide-cream-border">
                {cards.map((card) => (
                  <div key={card.id} className="px-6 py-4 hover:bg-cream-bg transition duration-150">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <h3 className="text-lg font-medium text-cream-text-dark">{card.card_name}</h3>
                          <span className="ml-2 text-sm text-cream-text-light">末四位: {card.card_number_last_4}</span>
                        </div>
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-5 gap-2">
                          <div>
                            <p className="text-sm text-cream-text-light">总还款金额</p>
                            <p className="text-lg font-medium text-cream-text-dark">¥{card.total_amount.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-cream-text-light">月还款金额</p>
                            <p className="text-lg font-medium text-cream-text-dark">¥{card.monthly_payment.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-cream-text-light">已还款金额</p>
                            <p className="text-lg font-medium text-cream-text-dark">¥{card.paid_amount.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-cream-text-light">期数</p>
                            <p className="text-lg font-medium text-cream-text-dark">{card.periods} 期</p>
                          </div>
                          <div>
                            <p className="text-sm text-cream-text-light">还款日期</p>
                            <p className="text-lg font-medium text-cream-text-dark">
                              {new Date(card.payment_date).toLocaleDateString('zh-CN', {
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(card)}
                          className="text-cream-accent hover:text-cream-accent-hover p-1"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(card.id)}
                          className="text-red-500 hover:text-red-700 p-1"
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
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}