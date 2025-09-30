'use client'

import React, { useState, useEffect } from 'react'
import { getWeatherByCity, getOneCallWeather } from '@/services/weatherService'
import { useRouter } from 'next/navigation'

export default function TodayWeatherPage() {
  const router = useRouter()
  const [weatherData, setWeatherData] = useState<any>(null)
  const [fullWeatherData, setFullWeatherData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [city, setCity] = useState('Chiba') // 默认城市
  const [newCity, setNewCity] = useState('')
  const [error, setError] = useState('')

  // 获取天气数据
  const fetchWeather = async (cityName: string) => {
    try {
      setLoading(true)
      setError('')
      
      // 获取指定城市的天气数据
      const weather = await getWeatherByCity(cityName)
      console.log(`${cityName}天气数据:`, weather)
      
      if (!weather) {
        setError(`无法获取${cityName}的天气数据，请检查城市名称是否正确`)
        setWeatherData(null)
        setFullWeatherData(null)
        return
      }
      
      setWeatherData(weather)

      // 使用城市坐标获取完整的天气预报数据
      const fullWeather = await getOneCallWeather(weather.latitude, weather.longitude)
      console.log(`${cityName}完整天气数据:`, fullWeather)
      setFullWeatherData(fullWeather)
    } catch (error: any) {
      console.error('获取天气数据失败:', error)
      setError(`获取天气数据失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // 根据天气条件生成穿衣建议
  const getClothingRecommendation = (temperature: number, condition: string) => {
    let recommendation = '';
    let outfitType = '';
    
    // 确保温度是有效数字
    if (typeof temperature !== 'number' || isNaN(temperature)) {
      return null;
    }
    
    if (temperature < 5) {
      recommendation = '极寒天气，建议穿羽绒服、厚毛衣、保暖内衣、围巾、手套和帽子。';
      outfitType = 'winter';
    } else if (temperature < 10) {
      recommendation = '寒冷天气，建议穿厚外套、毛衣、长裤和保暖鞋。';
      outfitType = 'cold';
    } else if (temperature < 15) {
      recommendation = '凉爽天气，建议穿夹克、薄毛衣、长裤和休闲鞋。';
      outfitType = 'cool';
    } else if (temperature < 20) {
      recommendation = '温和天气，建议穿薄外套、长袖衬衫、长裤或裙子。';
      outfitType = 'mild';
    } else if (temperature < 25) {
      recommendation = '温暖天气，建议穿短袖、薄长裤或裙子、凉鞋。';
      outfitType = 'warm';
    } else if (temperature < 30) {
      recommendation = '炎热天气，建议穿短袖、短裤、裙子、凉鞋或拖鞋。';
      outfitType = 'hot';
    } else {
      recommendation = '极热天气，建议穿轻薄透气的衣物，如短袖、背心、短裤，并做好防晒措施。';
      outfitType = 'very-hot';
    }
    
    // 根据天气状况调整建议
    if (condition && (condition.includes('雨') || condition.includes('雨'))) {
      recommendation += ' 天气有雨，请携带雨伞或雨衣。';
    } else if (condition && (condition.includes('雪') || condition.includes('雪'))) {
      recommendation += ' 天气有雪，请注意防滑，穿防水鞋。';
    } else if (condition && (condition.includes('风') || condition.includes('风'))) {
      recommendation += ' 天气有风，请注意保暖，可穿防风外套。';
    }
    
    return { recommendation, outfitType };
  };

  // 切换城市
  const handleSwitchCity = () => {
    if (newCity.trim()) {
      setCity(newCity.trim())
      fetchWeather(newCity.trim())
      setNewCity('')
    }
  }

  // 按回车键切换城市
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSwitchCity()
    }
  }

  useEffect(() => {
    fetchWeather(city)
  }, [])

  if (loading && !weatherData) {
    return (
      <div className="min-h-screen flex items-center justify-center weather-page-padding">
        <div className="max-w-4xl mx-auto w-full">
          <div className="text-center p-6 bg-cream-card rounded-lg border border-cream-border shadow-sm">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cream-accent mb-3"></div>
            <h2 className="text-lg font-medium text-cream-text-dark mb-1">正在加载天气数据</h2>
            <p className="text-cream-text-light text-sm">正在获取 {city} 的天气信息...</p>
          </div>
        </div>
      </div>
    )
  }

  // 获取穿衣建议
  const clothingAdvice = weatherData ? getClothingRecommendation(weatherData.temperature, weatherData.condition) : null;

  return (
    <div className="min-h-screen weather-page-padding">
      <div className="max-w-4xl mx-auto">
        {/* 顶部导航栏 */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-cream-text-dark">今日天气 - {city}</h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-cream-accent hover:bg-cream-accent-hover text-white px-4 py-2 rounded-lg transition duration-300 flex items-center text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            返回仪表盘
          </button>
        </div>
        
        {/* 城市切换输入框 */}
        <div className="mb-6 p-4 border rounded-lg shadow-sm bg-cream-card border-cream-border dashboard-card">
          <h3 className="text-lg font-medium text-cream-text-dark mb-3">切换城市</h3>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <input
                type="text"
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="请输入城市名称"
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-cream-accent border-cream-border bg-cream-input"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSwitchCity}
                className="px-3 py-2 bg-cream-accent hover:bg-cream-accent-hover text-white rounded-lg transition duration-300 text-sm whitespace-nowrap btn-primary"
              >
                切换城市
              </button>
              <button
                onClick={() => fetchWeather('Chiba')}
                className="px-3 py-2 bg-cream-bg hover:bg-cream-border text-cream-text rounded-lg transition duration-300 border border-cream-border text-sm whitespace-nowrap btn-secondary"
              >
                重置
              </button>
            </div>
          </div>
          {error && <div className="mt-2 text-red-500 text-sm">{error}</div>}
        </div>
        
        {weatherData && (
          <div className="mb-6 p-4 border rounded-lg shadow-sm bg-cream-card border-cream-border dashboard-card">
            <h2 className="text-lg font-semibold mb-3 text-cream-text-dark">当前天气 - {weatherData.city}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <div className="text-4xl font-bold text-cream-text-dark mr-3">{Math.round(weatherData.temperature)}°C</div>
                <div>
                  <div className="text-base text-cream-text">{weatherData.condition}</div>
                  <div className="text-cream-text-light text-xs">体感温度: {fullWeatherData?.current?.feels_like?.toFixed(1) || 'N/A'}°C</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
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
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-cream-text-light mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="text-cream-text text-sm">气压: {weatherData.pressure} hPa</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-cream-text-light mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="text-cream-text text-sm">能见度: {(weatherData.visibility / 1000).toFixed(1)} km</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 穿衣推荐 */}
        {weatherData && clothingAdvice && (
          <div className="mb-6 p-4 border rounded-lg shadow-sm bg-cream-card border-cream-border dashboard-card">
            <h2 className="text-lg font-semibold mb-3 text-cream-text-dark">今日穿搭推荐</h2>
            <div className="flex items-start">
              <div className="flex-1">
                <div className="text-cream-text-dark mb-2">
                  <span className="font-medium">推荐:</span> {clothingAdvice.recommendation}
                </div>
                <div className="text-cream-text-light text-sm">
                  根据当前温度 {Math.round(weatherData.temperature)}°C 和天气状况 "{weatherData.condition}" 为您推荐
                </div>
              </div>
            </div>
          </div>
        )}

        {fullWeatherData ? (
          <div className="p-4 border rounded-lg shadow-sm bg-cream-card border-cream-border dashboard-card">
            <h2 className="text-lg font-semibold mb-3 text-cream-text-dark">详细天气预报</h2>
            
            {fullWeatherData.current && (
              <div className="mb-5">
                <h3 className="text-base font-medium mb-2 text-cream-text-dark">当前天气详情</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 weather-detail-grid">
                  <div className="p-2 bg-cream-bg rounded border border-cream-border">
                    <div className="text-cream-text-light text-xs">体感温度</div>
                    <div className="text-sm font-medium text-cream-text-dark">{fullWeatherData.current.feels_like.toFixed(1)}°C</div>
                  </div>
                  <div className="p-2 bg-cream-bg rounded border border-cream-border">
                    <div className="text-cream-text-light text-xs">气压</div>
                    <div className="text-sm font-medium text-cream-text-dark">{fullWeatherData.current.pressure} hPa</div>
                  </div>
                  <div className="p-2 bg-cream-bg rounded border border-cream-border">
                    <div className="text-cream-text-light text-xs">风速</div>
                    <div className="text-sm font-medium text-cream-text-dark">{fullWeatherData.current.wind_speed} m/s</div>
                  </div>
                  <div className="p-2 bg-cream-bg rounded border border-cream-border">
                    <div className="text-cream-text-light text-xs">风向</div>
                    <div className="text-sm font-medium text-cream-text-dark">{fullWeatherData.current.wind_deg}°</div>
                  </div>
                  <div className="p-2 bg-cream-bg rounded border border-cream-border">
                    <div className="text-cream-text-light text-xs">能见度</div>
                    <div className="text-sm font-medium text-cream-text-dark">{(fullWeatherData.current.visibility / 1000).toFixed(1)} km</div>
                  </div>
                  <div className="p-2 bg-cream-bg rounded border border-cream-border">
                    <div className="text-cream-text-light text-xs">紫外线指数</div>
                    <div className="text-sm font-medium text-cream-text-dark">{fullWeatherData.current.uvi}</div>
                  </div>
                </div>
              </div>
            )}

            {fullWeatherData.daily && fullWeatherData.daily.length > 0 && (
              <div className="mb-6">
                <h3 className="text-base font-medium mb-3 text-cream-text-dark">一周天气预报</h3>
                <div className="space-y-2">
                  {fullWeatherData.daily.slice(0, 7).map((day: any, index: number) => {
                    const date = new Date(day.dt * 1000)
                    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
                    const dayName = index === 0 ? '今天' : weekdays[date.getDay()]
                    
                    return (
                      <div key={day.dt} className="flex items-center justify-between p-3 bg-cream-bg rounded-lg border border-cream-border hover:shadow-sm transition-shadow duration-200 dashboard-card">
                        <div className="flex items-center w-20">
                          <div className="font-medium text-cream-text-dark text-sm">{dayName}</div>
                          {index === 0 && (
                            <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">今天</span>
                          )}
                        </div>
                        <div className="flex items-center flex-1 justify-center">
                          {day.weather[0].icon && (
                            <img 
                              src={`https://openweathermap.org/img/wn/${day.weather[0].icon}.png`} 
                              alt={day.weather[0].description} 
                              className="w-6 h-6 mr-1.5 weather-icon"
                            />
                          )}
                          <span className="text-cream-text text-sm">{day.weather[0].description}</span>
                        </div>
                        <div className="flex items-center w-24 justify-end">
                          <div className="text-right">
                            <span className="font-medium text-cream-text-dark text-sm">{day.temp.max.toFixed(0)}°</span>
                            <span className="text-cream-text-light text-sm">/{day.temp.min.toFixed(0)}°</span>
                          </div>
                        </div>
                        <div className="flex items-center w-16 justify-end">
                          <svg className="w-3 h-3 text-cream-text-light mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4 4 0 003 15z" />
                          </svg>
                          <span className="text-cream-text text-sm">{(day.pop * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex items-center w-16 justify-end">
                          <svg className="w-3 h-3 text-cream-text-light mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span className="text-cream-text text-sm">{day.wind_speed.toFixed(1)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {fullWeatherData.hourly && fullWeatherData.hourly.length > 0 && (
              <div>
                <h3 className="text-base font-medium mb-3 text-cream-text-dark">24小时预报</h3>
                <div className="flex overflow-x-auto pb-3 space-x-2 weather-chart-container">
                  {fullWeatherData.hourly.slice(0, 24).map((hour: any, index: number) => {
                    const date = new Date(hour.dt * 1000)
                    const time = date.getHours()
                    
                    return (
                      <div key={hour.dt} className="flex flex-col items-center p-2 bg-cream-bg rounded-lg border border-cream-border flex-shrink-0 hover:shadow-sm transition-shadow duration-200 dashboard-card weather-hourly-item" style={{ minWidth: '60px' }}>
                        <div className="text-xs font-medium text-cream-text-dark mb-1">
                          {index === 0 ? '现在' : `${time}时`}
                        </div>
                        {hour.weather[0].icon && (
                          <img 
                            src={`https://openweathermap.org/img/wn/${hour.weather[0].icon}.png`} 
                            alt={hour.weather[0].description} 
                            className="w-8 h-8 my-1 weather-icon"
                          />
                        )}
                        <div className="text-base font-bold text-cream-text-dark my-1">
                          {hour.temp.toFixed(0)}°
                        </div>
                        <div className="text-xs text-cream-text-light flex items-center">
                          <svg className="w-2.5 h-2.5 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          {hour.wind_speed.toFixed(1)}
                        </div>
                        <div className="text-xs text-cream-text-light flex items-center mt-1">
                          <svg className="w-2.5 h-2.5 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4 4 0 003 15z" />
                          </svg>
                          {(hour.pop * 100).toFixed(0)}%
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        ) : !loading && (
          <div className="p-6 text-center bg-cream-card rounded-lg border border-cream-border shadow-sm">
            <svg className="w-12 h-12 mx-auto text-cream-text-light mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4 4 0 003 15z" />
            </svg>
            <h2 className="text-lg font-medium text-cream-text-dark mb-1">暂无天气数据</h2>
            <p className="text-cream-text-light text-sm mb-3">无法获取 {city} 的详细天气预报数据</p>
            <button
              onClick={() => fetchWeather(city)}
              className="px-3 py-1.5 bg-cream-accent hover:bg-cream-accent-hover text-white rounded-lg transition duration-300 text-sm"
            >
              重新加载
            </button>
          </div>
        )}
      </div>
    </div>
  )
}