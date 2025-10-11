'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { getWeatherByCity, getOneCallWeather } from '@/services/weatherService'
import { getCreditCards, updateCreditCard as updateCreditCardService } from '@/services/creditCardService'
import { getLoans, updateLoan as updateLoanService } from '@/services/loanService'

// 优化功能卡片组件
const FeatureCard = React.memo(({ 
  title, 
  description, 
  icon, 
  onClick 
}: { 
  title: string; 
  description: string; 
  icon: React.ReactNode; 
  onClick: () => void 
}) => (
  <div 
    onClick={onClick}
    className="bg-cream-card rounded-xl shadow-sm p-5 border border-cream-border hover:shadow-md transition duration-300 cursor-pointer flex flex-col h-full feature-card"
  >
    <div className="flex items-center mb-4">
      <div className="bg-cream-border p-2 rounded-md mr-3">
        {icon}
      </div>
      <h3 className="text-lg font-medium text-cream-text">{title}</h3>
    </div>
    <p className="text-cream-text-light text-sm mb-4 flex-grow">{description}</p>
    <button className="text-sm font-medium text-cream-accent hover:text-cream-accent-hover transition duration-300 mt-auto">
      点击进入 →
    </button>
  </div>
))

FeatureCard.displayName = 'FeatureCard'

// 新增的本月还款概览组件
const MonthlyRepaymentOverview = React.memo(({ creditCards, loans }: { creditCards: any[]; loans: any[] }) => {
  const { user } = useAuth();
  const [paidPayments, setPaidPayments] = useState<Set<string>>(new Set());
  const [localCreditCards, setLocalCreditCards] = useState(creditCards);
  const [localLoans, setLocalLoans] = useState(loans);
  
  // 计算本月待还款总额
  const calculateMonthlyPayment = useCallback(() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0-11 (January is 0)
    
    // 计算信用卡本月待还款总额
    const creditMonthly = localCreditCards.reduce((sum, card) => {
      // 获取还款日（几号）
      const paymentDay = new Date(card.payment_date).getDate();
      
      // 构造本月的还款日期
      const repaymentDate = new Date(currentYear, currentMonth, paymentDay);
      
      // 检查构造的日期是否有效（比如处理2月30日这种无效日期）
      if (repaymentDate.getMonth() === currentMonth) {
        // 根据信用卡类型计算待还款金额
        // 分期信用卡使用月还款金额，不分期信用卡使用总金额
        const amount = card.card_type === 'installment' ? card.monthly_payment : card.total_amount;
        // 减去已还金额，确保只计算未还部分
        const remainingAmount = Math.max(0, amount - card.paid_amount);
        return sum + remainingAmount;
      }
      return sum;
    }, 0);
    
    // 计算贷款本月待还款总额
    const loanMonthly = localLoans.reduce((sum, loan) => {
      // 获取还款日（几号）
      const paymentDay = new Date(loan.payment_date).getDate();
      
      // 构造本月的还款日期
      const repaymentDate = new Date(currentYear, currentMonth, paymentDay);
      
      // 检查构造的日期是否有效（比如处理2月30日这种无效日期）
      if (repaymentDate.getMonth() === currentMonth) {
        // 减去已还金额，确保只计算未还部分
        const remainingAmount = Math.max(0, loan.monthly_payment - loan.paid_amount);
        return sum + remainingAmount;
      }
      return sum;
    }, 0);
    
    // 返回本月信用卡和贷款待还款总额
    return creditMonthly + loanMonthly;
  }, [localCreditCards, localLoans]);

  // 获取最近的还款项目（未来7天内以及过去7天内未标记为已还的）
  const getUpcomingPayments = useCallback(() => {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7);
    
    // 获取信用卡还款项目
    const creditPayments = localCreditCards
      .filter(card => {
        const paymentDate = new Date(card.payment_date);
        // 显示未来7天内的还款，以及过去7天内未还的还款
        // 过滤掉已还的项目（已还金额大于等于应还金额）
        const isPaid = card.paid_amount >= (card.card_type === 'installment' ? card.monthly_payment : card.total_amount);
        return (paymentDate >= lastWeek && paymentDate <= nextWeek) && !isPaid;
      })
      .map(card => ({
        id: card.id,
        name: card.card_name,
        type: '信用卡',
        amount: card.card_type === 'installment' ? card.monthly_payment : card.total_amount,
        date: new Date(card.payment_date)
      }));
    
    // 获取贷款还款项目
    const loanPayments = localLoans
      .filter(loan => {
        const paymentDate = new Date(loan.payment_date);
        // 显示未来7天内的还款，以及过去7天内未还的还款
        // 过滤掉已还的项目（已还金额大于等于应还金额）
        const isPaid = loan.paid_amount >= loan.monthly_payment;
        return (paymentDate >= lastWeek && paymentDate <= nextWeek) && !isPaid;
      })
      .map(loan => ({
        id: loan.id,
        name: loan.loan_name,
        type: loan.loan_type,
        amount: loan.monthly_payment,
        date: new Date(loan.payment_date)
      }));
    
    // 合并并按日期排序
    const allPayments = [...creditPayments, ...loanPayments];
    allPayments.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    return allPayments;
  }, [localCreditCards, localLoans]);

  // 标记为已还
  const markAsPaid = async (payment: { id: string; type: string; amount: number }) => {
    if (!user) return;
    
    try {
      // 更新本地状态和远程数据
      if (payment.type === '信用卡') {
        // 找到对应的信用卡
        const card = localCreditCards.find(c => c.id === payment.id);
        if (card) {
          // 更新已还金额
          const updatedCard = {
            ...card,
            paid_amount: card.paid_amount + payment.amount
          };
          
          // 更新本地状态
          const updatedCards = localCreditCards.map(c => 
            c.id === payment.id ? updatedCard : c
          );
          setLocalCreditCards(updatedCards);
          
          // 更新远程数据
          await updateCreditCardService(payment.id, {
            paid_amount: updatedCard.paid_amount
          });
        }
      } else {
        // 找到对应的贷款
        const loan = localLoans.find(l => l.id === payment.id);
        if (loan) {
          // 更新已还金额
          const updatedLoan = {
            ...loan,
            paid_amount: loan.paid_amount + payment.amount
          };
          
          // 更新本地状态
          const updatedLoans = localLoans.map(l => 
            l.id === payment.id ? updatedLoan : l
          );
          setLocalLoans(updatedLoans);
          
          // 更新远程数据
          await updateLoanService(payment.id, {
            paid_amount: updatedLoan.paid_amount
          });
        }
      }
      
      // 触发父组件重新获取数据
      window.dispatchEvent(new CustomEvent('paymentUpdated'));
    } catch (error) {
      console.error('标记为已还失败:', error);
    }
  };

  // 过滤掉已还的项目
  const filterPaidPayments = useCallback((payments: any[]) => {
    return payments.filter(payment => !paidPayments.has(`${payment.type}-${payment.id}`));
  }, [paidPayments]);

  const monthlyPayment = calculateMonthlyPayment();
  const upcomingPayments = getUpcomingPayments();

  return (
    <div className="bg-cream-card rounded-xl shadow-sm p-5 border border-cream-border mb-6">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-bold text-cream-text-dark">本月还款概览</h2>
        <span className="text-sm text-cream-text-light">最近7天内及逾期未还</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
          <p className="text-sm text-orange-700">本月待还款总额</p>
          <p className="text-2xl font-bold text-orange-800">¥{monthlyPayment.toFixed(2)}</p>
        </div>
      </div>
      
      {upcomingPayments.length > 0 ? (
        <div>
          <h3 className="text-sm font-medium text-cream-text-dark mb-2">近期还款项目</h3>
          <div className="space-y-2">
            {upcomingPayments.map((payment) => {
              const paymentDate = payment.date;
              const today = new Date();
              const timeDiff = paymentDate.getTime() - today.getTime();
              const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
              
              // 检查是否已过期（超过还款日且未标记为已还）
              const isOverdue = daysLeft < 0 && !paidPayments.has(`${payment.type}-${payment.id}`);
              
              return (
                <div key={`${payment.type}-${payment.id}`} className={`flex justify-between items-center p-3 rounded-md ${isOverdue ? 'bg-red-50 border border-red-200' : 'bg-cream-bg'}`}>
                  <div>
                    <p className={`font-medium ${isOverdue ? 'text-red-700' : 'text-cream-text-dark'}`}>{payment.name}</p>
                    <p className="text-sm text-cream-text-light">{payment.type} • 每月{paymentDate.getDate()}号</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <p className="font-medium text-cream-text-dark">¥{payment.amount.toFixed(2)}</p>
                      <p className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : daysLeft <= 1 ? 'text-red-600 font-medium' : 'text-cream-text-light'}`}>
                        {daysLeft > 0 ? `${daysLeft}天后` : daysLeft === 0 ? '今天' : `${Math.abs(daysLeft)}天前`}
                      </p>
                    </div>
                    <button 
                      className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded-md transition duration-300 whitespace-nowrap"
                      onClick={() => markAsPaid({ 
                        id: payment.id, 
                        type: payment.type,
                        amount: payment.amount
                      })}
                    >
                      已还
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-4 text-cream-text-light">
          <p>最近7天内没有待还款项目</p>
        </div>
      )}
    </div>
  );
});

MonthlyRepaymentOverview.displayName = 'MonthlyRepaymentOverview';

export default function DashboardPage() {
  const { user, logout, loading } = useAuth()
  const router = useRouter()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [weatherData, setWeatherData] = useState<any>(null)
  const [fullWeatherData, setFullWeatherData] = useState<any>(null)
  const [loadingWeather, setLoadingWeather] = useState(true)
  const [showCityInput, setShowCityInput] = useState(false)
  const [newCity, setNewCity] = useState('')
  const [currentCity, setCurrentCity] = useState('Chiba')
  const [weatherError, setWeatherError] = useState('')
  const [allCreditCards, setAllCreditCards] = useState<any[]>([])
  const [allLoans, setAllLoans] = useState<any[]>([])
  const [loadingPayments, setLoadingPayments] = useState(true)
  
  // 根据天气条件生成穿衣建议
  const getClothingRecommendation = (temperature: number, condition: string) => {
    let recommendation = '';
    
    // 确保温度是有效数字
    if (typeof temperature !== 'number' || isNaN(temperature)) {
      return null;
    }
    
    if (temperature < 5) {
      recommendation = '极寒天气，建议穿羽绒服、厚毛衣、保暖内衣、围巾、手套和帽子。';
    } else if (temperature < 10) {
      recommendation = '寒冷天气，建议穿厚外套、毛衣、长裤和保暖鞋。';
    } else if (temperature < 15) {
      recommendation = '凉爽天气，建议穿夹克、薄毛衣、长裤和休闲鞋。';
    } else if (temperature < 20) {
      recommendation = '温和天气，建议穿薄外套、长袖衬衫、长裤或裙子。';
    } else if (temperature < 25) {
      recommendation = '温暖天气，建议穿短袖、薄长裤或裙子、凉鞋。';
    } else if (temperature < 30) {
      recommendation = '炎热天气，建议穿短袖、短裤、裙子、凉鞋或拖鞋。';
    } else {
      recommendation = '极热天气，建议穿轻薄透气的衣物，如短袖、背心、短裤，并做好防晒措施。';
    }
    
    // 根据天气状况调整建议
    if (condition && (condition.includes('雨') || condition.includes('雨'))) {
      recommendation += ' 天气有雨，请携带雨伞或雨衣。';
    } else if (condition && (condition.includes('雪') || condition.includes('雪'))) {
      recommendation += ' 天气有雪，请注意防滑，穿防水鞋。';
    } else if (condition && (condition.includes('风') || condition.includes('风'))) {
      recommendation += ' 天气有风，请注意保暖，可穿防风外套。';
    }
    
    return recommendation;
  };

  // 优化功能卡片列表 - 提前定义，确保Hook顺序一致
  const featureCards = useMemo(() => {
    const cards = [
      {
        title: '排班表',
        description: '管理您的工作排班和工资计算',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cream-text-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        ),
        onClick: () => router.push('/work-schedule')
      },
      {
        title: '居家购物',
        description: '管理您的购物清单和预算',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cream-text-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        ),
        onClick: () => router.push('/shopping')
      },
      {
        title: '密码保险箱',
        description: '安全存储和管理您的密码',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cream-text-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        ),
        onClick: () => router.push('/password-vault')
      },
      {
        title: '我的菜谱',
        description: '管理您的菜谱和制作视频',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cream-text-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        onClick: () => router.push('/recipes')
      },
      {
        title: '财务管理',
        description: '管理您的信用卡和贷款',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cream-text-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        onClick: () => router.push('/finance')
      }
    ];
    
    return cards;
  }, [router])

  // 获取天气数据
  const fetchWeatherData = useCallback(async (city: string = currentCity) => {
    try {
      setLoadingWeather(true)
      setWeatherError('')
      
      // 获取指定城市的天气数据
      const weather = await getWeatherByCity(city)
      
      if (weather) {
        setWeatherData(weather)
        setCurrentCity(city)
        
        // 获取完整的天气预报数据
        const fullWeather = await getOneCallWeather(weather.latitude, weather.longitude)
        if (fullWeather) {
          setFullWeatherData(fullWeather)
        }
      } else {
        // 如果获取失败，显示错误信息
        setWeatherData(null)
        setWeatherError(`无法获取"${city}"的天气数据，请检查城市名称是否正确`)
      }
    } catch (error) {
      console.error('获取天气数据失败:', error)
      setWeatherData(null)
      setWeatherError('获取天气数据时发生错误，请稍后重试')
    } finally {
      setLoadingWeather(false)
    }
  }, [currentCity])

  // 获取即将到期的信用卡还款
  const fetchUpcomingPayments = useCallback(async () => {
    if (!user) return

    try {
      setLoadingPayments(true)
      const [allCards, allLoanData] = await Promise.all([
        getCreditCards(user.id),
        getLoans(user.id)
      ])
      setAllCreditCards(allCards)
      setAllLoans(allLoanData)
    } catch (error) {
      console.error('获取财务信息失败:', error)
    } finally {
      setLoadingPayments(false)
    }
  }, [user])

  // 处理重定向逻辑
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // 获取天气数据和财务信息
  useEffect(() => {
    if (user) {
      fetchWeatherData()
      fetchUpcomingPayments()
      
      // 添加事件监听器，当还款状态更新时重新获取数据
      const handlePaymentUpdate = () => {
        fetchUpcomingPayments()
      }
      
      window.addEventListener('paymentUpdated', handlePaymentUpdate)
      
      // 清理事件监听器
      return () => {
        window.removeEventListener('paymentUpdated', handlePaymentUpdate)
      }
    }
  }, [user, fetchWeatherData, fetchUpcomingPayments])

  const handleLogout = useCallback(async () => {
    await logout()
    router.push('/login')
  }, [logout, router])

  // 获取用户首字母用于头像显示
  const getUserInitials = useCallback(() => {
    if (!user?.email) return 'U'
    const name = user.email.split('@')[0]
    return name.charAt(0).toUpperCase()
  }, [user])

  // 显示加载状态
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-bg">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cream-accent"></div>
          <p className="mt-2 text-cream-text-dark">加载中...</p>
          <p className="mt-2 text-cream-text-light text-sm">正在检查用户认证状态</p>
        </div>
      </div>
    )
  }

  // 如果没有用户信息，不渲染仪表板内容
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-bg">
        <div className="text-center">
          <p className="text-cream-text-dark">未检测到用户信息，正在重定向到登录页面...</p>
        </div>
      </div>
    )
  }

  // 获取下雨时间信息
  const getRainTimeInfo = () => {
    if (!fullWeatherData || !fullWeatherData.hourly) return null;
    
    // 获取未来24小时的数据
    const next24Hours = fullWeatherData.hourly.slice(0, 24);
    
    // 转换数据格式
    const rainyHours = next24Hours.map((hour: any) => {
      const date = new Date(hour.dt * 1000);
      return {
        time: date.getHours(),
        pop: Math.round(hour.pop * 100)
      };
    });
    
    return rainyHours;
  };

  const rainInfo = getRainTimeInfo();

  // 处理城市切换
  const handleSwitchCity = () => {
    if (newCity.trim() && newCity !== currentCity) {
      fetchWeatherData(newCity.trim());
      setNewCity('');
      setShowCityInput(false);
    }
  };

  // 处理回车键切换城市
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSwitchCity();
    }
  };

  // 降雨概率图表组件
  const RainChart = ({ rainData }: { rainData: { time: number; pop: number }[] }) => {
    // 找到最高的降雨概率用于计算图表高度
    const maxPop = Math.max(...rainData.map(data => data.pop), 100);
    
    return (
      <div className="mt-3 w-full">
        <h3 className="font-medium text-blue-800 text-sm mb-2">未来24小时降雨概率</h3>
        <div className="weather-chart-container w-full overflow-x-auto force-scrollbar" style={{ 
          WebkitOverflowScrolling: 'touch',
          padding: '0 0 10px 0'
        }}>
          <div className="flex items-end h-24 gap-1" style={{ 
            minWidth: 'max-content',
            padding: '0 2px'
          }}>
            {rainData.map((data, index) => (
              <div key={index} className="flex flex-col items-center flex-shrink-0" style={{
                width: '40px'
              }}>
                {/* 用柱状图表示概率，不显示具体数字 */}
                <div className="flex items-end justify-center w-full h-16 mb-1">
                  <div 
                    className={`w-full rounded-t transition-all duration-300 hover:bg-blue-500 ${
                      data.pop > 30 ? 'bg-blue-400' : 'bg-blue-100'
                    }`}
                    style={{ height: `${Math.max((data.pop / maxPop) * 100, 5)}%` }}
                  ></div>
                </div>
                <div className="text-blue-800 text-xs mt-1 whitespace-nowrap">{data.time}点</div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-2 text-xs text-blue-600">
          * 柱状图高度表示降雨概率，颜色深浅表示概率高低
        </div>
      </div>
    );
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-cream-bg dashboard-page-padding">
        {/* 顶部导航栏 */}
        <header className="bg-cream-card shadow-sm border-b border-cream-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-cream-text-dark">个人生活管家</h1>
              </div>
              <div className="flex items-center">
                {/* 用户头像和菜单 */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 focus:outline-none"
                  >
                    <div className="w-8 h-8 rounded-full bg-cream-accent flex items-center justify-center text-white font-medium">
                      {getUserInitials()}
                    </div>
                    <span className="text-cream-text-dark text-sm hidden md:inline">
                      {user?.email?.split('@')[0]}
                    </span>
                  </button>

                  {/* 用户菜单下拉 */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-cream-card rounded-md shadow-lg py-1 border border-cream-border z-10">
                      <button
                        onClick={() => {
                          router.push('/profile')
                          setShowUserMenu(false)
                        }}
                        className="block px-4 py-2 text-sm text-cream-text-dark hover:bg-cream-bg w-full text-left"
                      >
                        个人资料
                      </button>
                      <button
                        onClick={() => {
                          router.push('/settings')
                          setShowUserMenu(false)
                        }}
                        className="block px-4 py-2 text-sm text-cream-text-dark hover:bg-cream-bg w-full text-left"
                      >
                        设置
                      </button>
                      <button
                        onClick={handleLogout}
                        className="block px-4 py-2 text-sm text-cream-text-dark hover:bg-cream-bg w-full text-left"
                      >
                        退出登录
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* 主内容区域 */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* 财务概览区域 */}
          {loadingPayments ? (
            <div className="bg-cream-card rounded-xl shadow-sm p-5 border border-cream-border mb-6">
              <div className="flex justify-center items-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-cream-accent"></div>
                <span className="ml-2 text-cream-text-dark">正在加载财务信息...</span>
              </div>
            </div>
          ) : (
            <MonthlyRepaymentOverview creditCards={allCreditCards} loans={allLoans} />
          )}
          
          {/* 天气信息展示区域 */}
          <div className="bg-cream-card rounded-xl shadow-sm p-5 border border-cream-border mb-6 dashboard-weather-card-padding">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-bold text-cream-text-dark">今日天气</h2>
              <button 
                onClick={() => setShowCityInput(!showCityInput)}
                className="text-sm text-cream-accent hover:text-cream-accent-hover flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                更换城市
              </button>
            </div>
            
            {/* 城市切换输入框 */}
            {showCityInput && (
              <div className="mb-4 p-3 bg-cream-bg rounded-lg border border-cream-border">
                <div className="flex">
                  <input
                    type="text"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="请输入城市名称"
                    className="flex-1 px-3 py-1.5 text-sm border border-cream-border rounded-l focus:outline-none focus:ring-1 focus:ring-cream-accent"
                  />
                  <button
                    onClick={handleSwitchCity}
                    className="px-3 py-1.5 bg-cream-accent hover:bg-cream-accent-hover text-white text-sm rounded-r transition duration-300"
                  >
                    切换
                  </button>
                </div>
              </div>
            )}
            
            {loadingWeather ? (
              <div className="flex justify-center items-center py-6">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-cream-accent"></div>
                <span className="ml-2 text-cream-text-dark">正在加载天气数据...</span>
              </div>
            ) : weatherError ? (
              <div className="text-center py-4">
                <div className="text-red-500 mb-2">{weatherError}</div>
                <button
                  onClick={() => fetchWeatherData()}
                  className="text-sm text-cream-accent hover:text-cream-accent-hover"
                >
                  重新加载天气数据
                </button>
              </div>
            ) : weatherData ? (
              <div>
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div className="flex items-center">
                    <div className="text-4xl font-bold text-cream-text-dark">{Math.round(weatherData.temperature)}°C</div>
                    <div className="ml-3">
                      <div className="text-lg text-cream-text-dark">{weatherData.condition}</div>
                      <div className="text-cream-text-light text-sm">
                        {weatherData.city}
                        {fullWeatherData?.current?.feels_like && (
                          <span className="ml-2">体感 {fullWeatherData.current.feels_like.toFixed(1)}°C</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 md:mt-0 grid grid-cols-2 gap-3">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-cream-text-light mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4 4 0 003 15z" />
                      </svg>
                      <span className="text-cream-text text-sm">湿度: {weatherData.humidity}%</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-cream-text-light mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span className="text-cream-text text-sm">风速: {weatherData.windSpeed} m/s</span>
                    </div>
                  </div>
                </div>
                
                {/* 穿衣推荐 */}
                <div className="mt-4 p-4 bg-amber-50 rounded-md border border-amber-200">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-amber-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4 4 0 003 15z" />
                    </svg>
                    <div className="w-full">
                      <h3 className="font-medium text-amber-800 text-sm mb-1">今日穿搭推荐</h3>
                      <p className="text-amber-700 text-sm">
                        {getClothingRecommendation(weatherData.temperature, weatherData.condition)}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* 下雨时间图表展示 */}
                {rainInfo && rainInfo.length > 0 && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-md border border-blue-200">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4 4 0 003 15z" />
                      </svg>
                      <div className="w-full overflow-hidden">
                        <h3 className="font-medium text-blue-800 text-sm">降雨提醒</h3>
                        <RainChart rainData={rainInfo} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-3 text-cream-text-dark text-sm">
                无法获取天气数据
              </div>
            )}
          </div>
          
          {/* 功能卡片区域 */}
          <div className="text-center py-6">
            <h2 className="text-xl font-bold text-cream-text-dark mb-5">功能模块</h2>
            
            {/* 功能卡片网格 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {featureCards.map((card, index) => (
                <FeatureCard
                  key={index}
                  title={card.title}
                  description={card.description}
                  icon={card.icon}
                  onClick={card.onClick}
                />
              ))}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}