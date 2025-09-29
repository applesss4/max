'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { getWeatherByCity, getOneCallWeather } from '@/services/weatherService'

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
    className="bg-cream-card rounded-xl shadow-sm p-4 border border-cream-border hover:shadow-md transition duration-300 cursor-pointer flex flex-col h-full feature-card"
  >
    <div className="flex items-center mb-3">
      <div className="bg-cream-border p-1.5 rounded-md mr-2">
        {icon}
      </div>
      <h3 className="text-md font-medium text-cream-text">{title}</h3>
    </div>
    <p className="text-cream-text-light text-xs mb-3 flex-grow">{description}</p>
    <button className="text-xs font-medium text-cream-accent hover:text-cream-accent-hover transition duration-300 mt-auto">
      点击进入 →
    </button>
  </div>
))

FeatureCard.displayName = 'FeatureCard'

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
  
  // 优化功能卡片列表 - 提前定义，确保Hook顺序一致
  const featureCards = useMemo(() => {
    const cards = [
      {
        title: '排班表',
        description: '管理您的工作排班和工资计算',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cream-text-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
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

  // 处理重定向逻辑
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // 获取天气数据
  useEffect(() => {
    if (user) {
      fetchWeatherData()
    }
  }, [user, fetchWeatherData])

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
    if (!fullWeatherData || !fullWeatherData.hourly) return null
    
    // 查找未来24小时内有降水概率的时间段
    const rainyHours = fullWeatherData.hourly
      .slice(0, 24)
      .filter((hour: any) => hour.pop > 0.3) // 降水概率大于30%
      .map((hour: any) => {
        const date = new Date(hour.dt * 1000)
        return {
          time: date.getHours(),
          pop: Math.round(hour.pop * 100)
        }
      })
    
    if (rainyHours.length > 0) {
      return rainyHours
    }
    
    return null
  }

  const rainInfo = getRainTimeInfo()

  // 处理城市切换
  const handleSwitchCity = () => {
    if (newCity.trim() && newCity !== currentCity) {
      fetchWeatherData(newCity.trim())
      setNewCity('')
      setShowCityInput(false)
    }
  }

  // 处理回车键切换城市
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSwitchCity()
    }
  }

  // 降雨概率图表组件
  const RainChart = ({ rainData }: { rainData: { time: number; pop: number }[] }) => {
    // 找到最高的降雨概率用于计算图表高度
    const maxPop = Math.max(...rainData.map(data => data.pop), 100);
    
    return (
      <div className="mt-3">
        <h3 className="font-medium text-blue-800 text-sm mb-2">未来24小时降雨概率</h3>
        <div className="rain-chart-container" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div className="flex items-end h-20 gap-1 pb-2" style={{ minWidth: 'max-content', width: 'max-content' }}>
            {rainData.map((data, index) => (
              <div key={index} className="flex flex-col items-center flex-shrink-0 rain-chart-item">
                <div className="text-blue-700 text-xs mb-1 whitespace-nowrap">{data.pop}%</div>
                <div 
                  className="w-full bg-blue-400 rounded-t transition-all duration-300 hover:bg-blue-500"
                  style={{ height: `${(data.pop / maxPop) * 100}%` }}
                ></div>
                <div className="text-blue-800 text-xs mt-1 whitespace-nowrap">{data.time}点</div>
              </div>
            ))}
          </div>
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
                      <div className="text-cream-text-light text-sm">{weatherData.city}</div>
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
                
                {/* 下雨时间图表展示 */}
                {rainInfo && rainInfo.length > 0 && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-md border border-blue-200">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4 4 0 003 15z" />
                      </svg>
                      <div className="flex-1">
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