'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { CreditCard, getCreditCards, addCreditCard, updateCreditCard, deleteCreditCard } from '@/services/creditCardService'
import { Loan, getLoans, addLoan, updateLoan, deleteLoan } from '@/services/loanService'

export default function FinancePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'credit' | 'loan'>('credit')
  const [creditCards, setCreditCards] = useState<CreditCard[]>([])
  const [loans, setLoans] = useState<Loan[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<CreditCard | Loan | null>(null)
  const [formData, setFormData] = useState({
    // 信用卡字段
    card_name: '',
    card_number_last_4: '',
    total_amount: '',
    monthly_payment: '',
    payment_date: '',
    paid_amount: '',
    periods: '',
    card_type: 'installment', // 添加信用卡类型字段
    // 贷款字段
    loan_name: '',
    loan_type: '房贷',
    interest_rate: '',
    start_date: '',
    end_date: ''
  })
  const [error, setError] = useState('')

  // 获取数据
  const fetchData = async () => {
    if (!user) return

    try {
      setLoadingData(true)
      const [cards, loanData] = await Promise.all([
        getCreditCards(user.id),
        getLoans(user.id)
      ])
      setCreditCards(cards)
      setLoans(loanData)
    } catch (err) {
      console.error('获取数据失败:', err)
      setError('获取数据失败')
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  // 处理重定向逻辑
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // 处理表单输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

    try {
      setError('')
      
      if (activeTab === 'credit') {
        // 验证信用卡数据
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

        // 分期信用卡需要验证期数
        if (formData.card_type === 'installment' && formData.periods && (parseInt(formData.periods) <= 0)) {
          setError('期数必须大于0')
          return
        }

        if (editingItem && 'card_number_last_4' in editingItem) {
          // 更新信用卡
          await updateCreditCard(editingItem.id, {
            card_name: formData.card_name,
            card_number_last_4: formData.card_number_last_4,
            total_amount: parseFloat(formData.total_amount) || 0,
            monthly_payment: parseFloat(formData.monthly_payment) || 0,
            payment_date: formData.payment_date,
            paid_amount: parseFloat(formData.paid_amount) || 0,
            periods: parseInt(formData.periods) || (formData.card_type === 'installment' ? 1 : 0),
            card_type: formData.card_type
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
            periods: parseInt(formData.periods) || (formData.card_type === 'installment' ? 1 : 0),
            card_type: formData.card_type
          }, user.id)
        }
      } else {
        // 验证贷款数据
        if (!formData.loan_name.trim()) {
          setError('请输入贷款名称')
          return
        }

        if (!formData.payment_date) {
          setError('请选择还款日期')
          return
        }

        if (!formData.start_date) {
          setError('请选择贷款开始日期')
          return
        }

        if (!formData.end_date) {
          setError('请选择贷款结束日期')
          return
        }

        if (formData.periods && (parseInt(formData.periods) <= 0)) {
          setError('期数必须大于0')
          return
        }

        if (editingItem && 'loan_type' in editingItem) {
          // 更新贷款
          await updateLoan(editingItem.id, {
            loan_name: formData.loan_name,
            loan_type: formData.loan_type,
            total_amount: parseFloat(formData.total_amount) || 0,
            monthly_payment: parseFloat(formData.monthly_payment) || 0,
            payment_date: formData.payment_date,
            paid_amount: parseFloat(formData.paid_amount) || 0,
            periods: parseInt(formData.periods) || 1,
            interest_rate: parseFloat(formData.interest_rate) || 0,
            start_date: formData.start_date,
            end_date: formData.end_date
          })
        } else {
          // 添加新贷款
          await addLoan({
            loan_name: formData.loan_name,
            loan_type: formData.loan_type,
            total_amount: parseFloat(formData.total_amount) || 0,
            monthly_payment: parseFloat(formData.monthly_payment) || 0,
            payment_date: formData.payment_date,
            paid_amount: parseFloat(formData.paid_amount) || 0,
            periods: parseInt(formData.periods) || 1,
            interest_rate: parseFloat(formData.interest_rate) || 0,
            start_date: formData.start_date,
            end_date: formData.end_date
          }, user.id)
        }
      }

      // 重置表单
      setFormData({
        card_name: '',
        card_number_last_4: '',
        total_amount: '',
        monthly_payment: '',
        payment_date: '',
        paid_amount: '',
        periods: '',
        card_type: 'installment',
        loan_name: '',
        loan_type: '房贷',
        interest_rate: '',
        start_date: '',
        end_date: ''
      })
      setEditingItem(null)
      setShowForm(false)
      
      // 重新获取数据
      await fetchData()
    } catch (err) {
      console.error('保存信息失败:', err)
      setError('保存信息失败')
    }
  }

  // 处理编辑项目
  const handleEdit = (item: CreditCard | Loan) => {
    setEditingItem(item)
    
    if ('card_number_last_4' in item) {
      // 信用卡
      setFormData({
        ...formData,
        card_name: item.card_name,
        card_number_last_4: item.card_number_last_4,
        total_amount: item.total_amount.toString(),
        monthly_payment: item.monthly_payment.toString(),
        payment_date: item.payment_date,
        paid_amount: item.paid_amount.toString(),
        periods: item.periods.toString(),
        card_type: item.card_type,
        loan_name: '',
        loan_type: '房贷',
        interest_rate: '',
        start_date: '',
        end_date: ''
      })
    } else {
      // 贷款
      setFormData({
        ...formData,
        loan_name: item.loan_name,
        loan_type: item.loan_type,
        total_amount: item.total_amount.toString(),
        monthly_payment: item.monthly_payment.toString(),
        payment_date: item.payment_date,
        paid_amount: item.paid_amount.toString(),
        periods: item.periods.toString(),
        interest_rate: item.interest_rate.toString(),
        start_date: item.start_date,
        end_date: item.end_date,
        card_name: '',
        card_number_last_4: '',
        card_type: 'installment'
      })
    }
    
    setShowForm(true)
  }

  // 处理删除项目
  const handleDelete = async (item: CreditCard | Loan) => {
    const itemType = 'card_number_last_4' in item ? '信用卡' : '贷款'
    if (!confirm(`确定要删除这张${itemType}吗？`)) return

    try {
      if ('card_number_last_4' in item) {
        await deleteCreditCard(item.id)
      } else {
        await deleteLoan(item.id)
      }
      await fetchData()
    } catch (err) {
      console.error(`删除${itemType}失败:`, err)
      setError(`删除${itemType}失败`)
    }
  }

  // 取消编辑
  const handleCancel = () => {
    setShowForm(false)
    setEditingItem(null)
    setFormData({
      card_name: '',
      card_number_last_4: '',
      total_amount: '',
      monthly_payment: '',
      payment_date: '',
      paid_amount: '',
      periods: '',
      card_type: 'installment',
      loan_name: '',
      loan_type: '房贷',
      interest_rate: '',
      start_date: '',
      end_date: ''
    })
    setError('')
  }

  // 计算总欠款
  const calculateTotalDebt = () => {
    const totalCreditDebt = creditCards.reduce((sum, card) => sum + (card.total_amount - card.paid_amount), 0)
    const totalLoanDebt = loans.reduce((sum, loan) => sum + (loan.total_amount - loan.paid_amount), 0)
    return totalCreditDebt + totalLoanDebt
  }

  // 计算本月待还款
  const calculateMonthlyPayment = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0-11 (January is 0)
    
    // 计算信用卡本月待还款总额
    const creditMonthly = creditCards.reduce((sum, card) => {
      // 获取还款日（几号）
      const paymentDay = new Date(card.payment_date).getDate();
      
      // 构造本月的还款日期
      const repaymentDate = new Date(currentYear, currentMonth, paymentDay);
      
      // 检查构造的日期是否有效（比如处理2月30日这种无效日期）
      if (repaymentDate.getMonth() === currentMonth) {
        // 根据信用卡类型计算待还款金额
        // 分期信用卡使用月还款金额，不分期信用卡使用总金额
        const amount = card.card_type === 'installment' ? card.monthly_payment : card.total_amount;
        return sum + amount;
      }
      return sum;
    }, 0);
    
    // 计算贷款本月待还款总额
    const loanMonthly = loans.reduce((sum, loan) => {
      // 获取还款日（几号）
      const paymentDay = new Date(loan.payment_date).getDate();
      
      // 构造本月的还款日期
      const repaymentDate = new Date(currentYear, currentMonth, paymentDay);
      
      // 检查构造的日期是否有效（比如处理2月30日这种无效日期）
      if (repaymentDate.getMonth() === currentMonth) {
        return sum + loan.monthly_payment;
      }
      return sum;
    }, 0);
    
    // 返回本月信用卡和贷款待还款总额
    return creditMonthly + loanMonthly;
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
                <h1 className="text-xl font-semibold text-cream-text-dark">财务管理</h1>
              </div>
              <button
                onClick={() => {
                  setEditingItem(null)
                  setFormData({
                    card_name: '',
                    card_number_last_4: '',
                    total_amount: '',
                    monthly_payment: '',
                    payment_date: '',
                    paid_amount: '',
                    periods: '',
                    card_type: 'installment',
                    loan_name: '',
                    loan_type: '房贷',
                    interest_rate: '',
                    start_date: '',
                    end_date: ''
                  })
                  setShowForm(!showForm)
                }}
                className="bg-cream-accent hover:bg-cream-accent-hover text-white px-4 py-2 rounded-md text-sm font-medium transition duration-300"
              >
                {showForm ? '取消' : `添加${activeTab === 'credit' ? '信用卡' : '贷款'}`}
              </button>
            </div>
          </div>
        </header>

        {/* 主内容区域 */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* 概览卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-cream-card rounded-lg shadow-sm border border-cream-border p-6">
              <h3 className="text-lg font-medium text-cream-text-dark mb-2">总欠款</h3>
              <p className="text-3xl font-bold text-red-600">¥{calculateTotalDebt().toFixed(2)}</p>
            </div>
            <div className="bg-cream-card rounded-lg shadow-sm border border-cream-border p-6">
              <h3 className="text-lg font-medium text-cream-text-dark mb-2">本月待还款</h3>
              <p className="text-3xl font-bold text-orange-600">¥{calculateMonthlyPayment().toFixed(2)}</p>
            </div>
            <div className="bg-cream-card rounded-lg shadow-sm border border-cream-border p-6">
              <h3 className="text-lg font-medium text-cream-text-dark mb-2">账户数量</h3>
              <p className="text-3xl font-bold text-blue-600">{creditCards.length + loans.length} 个</p>
            </div>
          </div>

          {/* 标签页 */}
          <div className="bg-cream-card rounded-lg shadow-sm border border-cream-border mb-6">
            <div className="border-b border-cream-border">
              <nav className="flex">
                <button
                  onClick={() => setActiveTab('credit')}
                  className={`px-6 py-4 font-medium text-sm ${activeTab === 'credit' ? 'text-cream-accent border-b-2 border-cream-accent' : 'text-cream-text-light hover:text-cream-text-dark'}`}
                >
                  信用卡管理
                </button>
                <button
                  onClick={() => setActiveTab('loan')}
                  className={`px-6 py-4 font-medium text-sm ${activeTab === 'loan' ? 'text-cream-accent border-b-2 border-cream-accent' : 'text-cream-text-light hover:text-cream-text-dark'}`}
                >
                  贷款管理
                </button>
              </nav>
            </div>

            {/* 表单区域 */}
            {showForm && (
              <div className="p-6 border-b border-cream-border">
                <h2 className="text-lg font-medium text-cream-text-dark mb-4">
                  {editingItem ? `编辑${activeTab === 'credit' ? '信用卡' : '贷款'}` : `添加新${activeTab === 'credit' ? '信用卡' : '贷款'}`}
                </h2>
                
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}
                
                <form onSubmit={handleSubmit}>
                  {activeTab === 'credit' ? (
                    // 信用卡表单
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
                        <label htmlFor="card_type" className="block text-sm font-medium text-cream-text-dark mb-1">
                          信用卡类型
                        </label>
                        <select
                          id="card_type"
                          name="card_type"
                          value={formData.card_type}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-cream-border rounded-md shadow-sm focus:outline-none focus:ring-cream-accent focus:border-cream-accent"
                        >
                          <option value="installment">分期还款</option>
                          <option value="non_installment">一次性还款</option>
                        </select>
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
                      
                      {/* 分期信用卡显示期数和月还款金额 */}
                      {formData.card_type === 'installment' && (
                        <>
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
                        </>
                      )}
                      
                      {/* 不分期信用卡只显示还款日期和总金额 */}
                      {formData.card_type === 'non_installment' && (
                        <div>
                          <label htmlFor="monthly_payment_non" className="block text-sm font-medium text-cream-text-dark mb-1">
                            还款金额 (¥)
                          </label>
                          <input
                            type="number"
                            id="monthly_payment_non"
                            name="monthly_payment"
                            value={formData.total_amount}
                            onChange={(e) => setFormData({...formData, total_amount: e.target.value})}
                            step="0.01"
                            min="0"
                            className="w-full px-3 py-2 border border-cream-border rounded-md shadow-sm focus:outline-none focus:ring-cream-accent focus:border-cream-accent"
                            placeholder="如：5000.00"
                          />
                        </div>
                      )}
                      
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
                  ) : (
                    // 贷款表单
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="loan_name" className="block text-sm font-medium text-cream-text-dark mb-1">
                          贷款名称 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="loan_name"
                          name="loan_name"
                          value={formData.loan_name}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-cream-border rounded-md shadow-sm focus:outline-none focus:ring-cream-accent focus:border-cream-accent"
                          placeholder="如：房贷"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="loan_type" className="block text-sm font-medium text-cream-text-dark mb-1">
                          贷款类型
                        </label>
                        <select
                          id="loan_type"
                          name="loan_type"
                          value={formData.loan_type}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-cream-border rounded-md shadow-sm focus:outline-none focus:ring-cream-accent focus:border-cream-accent"
                        >
                          <option value="房贷">房贷</option>
                          <option value="车贷">车贷</option>
                          <option value="个人贷款">个人贷款</option>
                          <option value="公积金贷款">公积金贷款</option>
                          <option value="其他">其他</option>
                        </select>
                      </div>
                      
                      <div>
                        <label htmlFor="total_amount" className="block text-sm font-medium text-cream-text-dark mb-1">
                          贷款总额 (¥)
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
                          placeholder="如：500000.00"
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
                          placeholder="如：3000.00"
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
                          placeholder="如：100000.00"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="periods" className="block text-sm font-medium text-cream-text-dark mb-1">
                          还款期数
                        </label>
                        <input
                          type="number"
                          id="periods"
                          name="periods"
                          value={formData.periods}
                          onChange={handleInputChange}
                          min="1"
                          className="w-full px-3 py-2 border border-cream-border rounded-md shadow-sm focus:outline-none focus:ring-cream-accent focus:border-cream-accent"
                          placeholder="如：360"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="interest_rate" className="block text-sm font-medium text-cream-text-dark mb-1">
                          年利率 (%)
                        </label>
                        <input
                          type="number"
                          id="interest_rate"
                          name="interest_rate"
                          value={formData.interest_rate}
                          onChange={handleInputChange}
                          step="0.01"
                          min="0"
                          className="w-full px-3 py-2 border border-cream-border rounded-md shadow-sm focus:outline-none focus:ring-cream-accent focus:border-cream-accent"
                          placeholder="如：4.5"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="start_date" className="block text-sm font-medium text-cream-text-dark mb-1">
                          贷款开始日期 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          id="start_date"
                          name="start_date"
                          value={formData.start_date}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-cream-border rounded-md shadow-sm focus:outline-none focus:ring-cream-accent focus:border-cream-accent"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="end_date" className="block text-sm font-medium text-cream-text-dark mb-1">
                          贷款结束日期 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          id="end_date"
                          name="end_date"
                          value={formData.end_date}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-cream-border rounded-md shadow-sm focus:outline-none focus:ring-cream-accent focus:border-cream-accent"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label htmlFor="payment_date" className="block text-sm font-medium text-cream-text-dark mb-1">
                          每月还款日期 <span className="text-red-500">*</span>
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
                  )}
                  
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
                      {editingItem ? '更新' : '添加'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 数据列表区域 */}
            <div className="p-6">
              {loadingData ? (
                <div className="flex justify-center items-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cream-accent"></div>
                  <span className="ml-2 text-cream-text-dark">正在加载数据...</span>
                </div>
              ) : activeTab === 'credit' ? (
                // 信用卡列表
                creditCards.length === 0 ? (
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
                  <div className="divide-y divide-cream-border">
                    <h3 className="text-lg font-medium text-cream-text-dark mb-4">我的信用卡</h3>
                    {creditCards.map((card) => (
                      <div key={card.id} className="py-4 hover:bg-cream-bg transition duration-150">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center">
                              <h4 className="text-lg font-medium text-cream-text-dark">{card.card_name}</h4>
                              <span className="ml-2 text-sm text-cream-text-light">
                                末四位: {card.card_number_last_4} 
                                ({card.card_type === 'installment' ? '分期' : '一次性'})
                              </span>
                            </div>
                            <div className="mt-2 grid grid-cols-1 md:grid-cols-5 gap-2">
                              <div>
                                <p className="text-sm text-cream-text-light">总还款金额</p>
                                <p className="text-lg font-medium text-cream-text-dark">¥{card.total_amount.toFixed(2)}</p>
                              </div>
                              {card.card_type === 'installment' ? (
                                <>
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
                                </>
                              ) : (
                                <>
                                  <div>
                                    <p className="text-sm text-cream-text-light">还款金额</p>
                                    <p className="text-lg font-medium text-cream-text-dark">¥{card.total_amount.toFixed(2)}</p>
                                  </div>
                                  <div className="md:col-span-2"></div>
                                </>
                              )}
                              <div>
                                <p className="text-sm text-cream-text-light">还款日期</p>
                                <p className="text-lg font-medium text-cream-text-dark">
                                  每月{new Date(card.payment_date).getDate()}号
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
                              onClick={() => handleDelete(card)}
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
                )
              ) : (
                // 贷款列表
                loans.length === 0 ? (
                  <div className="text-center py-12">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-cream-text-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-cream-text-dark">暂无贷款</h3>
                    <p className="mt-1 text-sm text-cream-text-light">开始添加您的第一笔贷款吧</p>
                    <div className="mt-6">
                      <button
                        onClick={() => setShowForm(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-cream-accent hover:bg-cream-accent-hover focus:outline-none transition duration-300"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        添加贷款
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-cream-border">
                    <h3 className="text-lg font-medium text-cream-text-dark mb-4">我的贷款</h3>
                    {loans.map((loan) => (
                      <div key={loan.id} className="py-4 hover:bg-cream-bg transition duration-150">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center">
                              <h4 className="text-lg font-medium text-cream-text-dark">{loan.loan_name}</h4>
                              <span className="ml-2 text-sm text-cream-text-light">类型: {loan.loan_type}</span>
                            </div>
                            <div className="mt-2 grid grid-cols-1 md:grid-cols-5 gap-2">
                              <div>
                                <p className="text-sm text-cream-text-light">贷款总额</p>
                                <p className="text-lg font-medium text-cream-text-dark">¥{loan.total_amount.toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-sm text-cream-text-light">月还款金额</p>
                                <p className="text-lg font-medium text-cream-text-dark">¥{loan.monthly_payment.toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-sm text-cream-text-light">已还款金额</p>
                                <p className="text-lg font-medium text-cream-text-dark">¥{loan.paid_amount.toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-sm text-cream-text-light">年利率</p>
                                <p className="text-lg font-medium text-cream-text-dark">{loan.interest_rate.toFixed(2)}%</p>
                              </div>
                              <div>
                                <p className="text-sm text-cream-text-light">还款日期</p>
                                <p className="text-lg font-medium text-cream-text-dark">
                                  每月{new Date(loan.payment_date).getDate()}号
                                </p>
                              </div>
                            </div>
                            <div className="mt-2 grid grid-cols-1 md:grid-cols-4 gap-2">
                              <div>
                                <p className="text-sm text-cream-text-light">总期数</p>
                                <p className="text-lg font-medium text-cream-text-dark">{loan.periods} 期</p>
                              </div>
                              <div>
                                <p className="text-sm text-cream-text-light">剩余期数</p>
                                <p className="text-lg font-medium text-cream-text-dark">
                                  {Math.max(0, loan.periods - Math.floor(loan.paid_amount / (loan.monthly_payment || 1)))} 期
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-cream-text-light">开始日期</p>
                                <p className="text-lg font-medium text-cream-text-dark">
                                  {new Date(loan.start_date).toLocaleDateString('zh-CN')}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-cream-text-light">结束日期</p>
                                <p className="text-lg font-medium text-cream-text-dark">
                                  {new Date(loan.end_date).toLocaleDateString('zh-CN')}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(loan)}
                              className="text-cream-accent hover:text-cream-accent-hover p-1"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(loan)}
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
                )
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}