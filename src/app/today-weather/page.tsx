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
      <div className="min-h-screen flex items-center justify-center">
        <div>正在加载{city}的天气数据...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      {/* 顶部导航栏 */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">今日天气 - {city}</h1>
        <button
          onClick={() => router.push('/outfit-assistant')}
          className="bg-cream-accent hover:bg-cream-accent-hover text-white px-4 py-2 rounded-lg transition duration-300 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          返回穿搭助理
        </button>
      </div>
      
      {/* 城市切换输入框 */}
      <div className="mb-6 p-4 border rounded">
        <div className="flex">
          <input
            type="text"
            value={newCity}
            onChange={(e) => setNewCity(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="请输入城市名称"
            className="flex-1 px-4 py-2 border rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSwitchCity}
            className="px-4 py-2 bg-blue-600 text-white rounded-r hover:bg-blue-700 transition duration-300"
          >
            切换城市
          </button>
        </div>
        {error && <div className="mt-2 text-red-500">{error}</div>}
      </div>
      
      {weatherData && (
        <div className="mb-8 p-4 border rounded">
          <h2 className="text-xl font-semibold mb-3">当前天气 - {weatherData.city}</h2>
          <p>温度: {weatherData.temperature}°C</p>
          <p>天气状况: {weatherData.condition}</p>
          <p>湿度: {weatherData.humidity}%</p>
          <p>风速: {weatherData.windSpeed} m/s</p>
        </div>
      )}

      {fullWeatherData ? (
        <div className="p-4 border rounded">
          <h2 className="text-xl font-semibold mb-3">详细天气预报</h2>
          
          {fullWeatherData.current && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">当前天气详情</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>体感温度: {fullWeatherData.current.feels_like.toFixed(1)}°C</div>
                <div>气压: {fullWeatherData.current.pressure} hPa</div>
                <div>风速: {fullWeatherData.current.wind_speed} m/s</div>
                <div>风向: {fullWeatherData.current.wind_deg}°</div>
                <div>能见度: {(fullWeatherData.current.visibility / 1000).toFixed(1)} km</div>
                <div>紫外线指数: {fullWeatherData.current.uvi}</div>
              </div>
            </div>
          )}

          {fullWeatherData.daily && fullWeatherData.daily.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">一周天气预报</h3>
              <div className="space-y-2">
                {fullWeatherData.daily.slice(0, 7).map((day: any, index: number) => {
                  const date = new Date(day.dt * 1000)
                  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
                  const dayName = index === 0 ? '今天' : weekdays[date.getDay()]
                  
                  return (
                    <div key={day.dt} className="flex items-center justify-between p-2 bg-gray-100 rounded">
                      <div className="w-16 font-medium">{dayName}</div>
                      <div className="flex items-center">
                        <span className="mr-2">{day.weather[0].description}</span>
                        {day.weather[0].icon && (
                          <img 
                            src={`https://openweathermap.org/img/wn/${day.weather[0].icon}.png`} 
                            alt={day.weather[0].description} 
                            className="w-6 h-6 mr-2"
                          />
                        )}
                      </div>
                      <div className="w-24 text-right">
                        <span className="font-medium">{day.temp.max.toFixed(0)}°</span>
                        <span>/{day.temp.min.toFixed(0)}°</span>
                      </div>
                      <div className="w-20 text-right">
                        风力: {day.wind_speed.toFixed(1)} m/s
                      </div>
                      <div className="w-16 text-right">
                        降水: {(day.pop * 100).toFixed(0)}%
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {fullWeatherData.hourly && fullWeatherData.hourly.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-2">24小时预报</h3>
              <div className="flex overflow-x-auto pb-2 space-x-2">
                {fullWeatherData.hourly.slice(0, 24).map((hour: any, index: number) => {
                  const date = new Date(hour.dt * 1000)
                  const time = date.getHours()
                  
                  return (
                    <div key={hour.dt} className="flex flex-col items-center p-2 bg-gray-100 rounded min-w-[60px]">
                      <div className="text-xs">
                        {index === 0 ? '现在' : `${time}时`}
                      </div>
                      {hour.weather[0].icon && (
                        <img 
                          src={`https://openweathermap.org/img/wn/${hour.weather[0].icon}.png`} 
                          alt={hour.weather[0].description} 
                          className="w-8 h-8 my-1"
                        />
                      )}
                      <div className="font-medium">
                        {hour.temp.toFixed(0)}°
                      </div>
                      <div className="text-xs">
                        风: {hour.wind_speed.toFixed(1)} m/s
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      ) : !loading && (
        <div className="p-4 border rounded">
          <h2 className="text-xl font-semibold mb-3">详细天气预报</h2>
          <p>暂无详细天气预报数据</p>
        </div>
      )}
    </div>
  )
}