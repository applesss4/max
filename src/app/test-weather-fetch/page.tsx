'use client'

import React, { useEffect, useState } from 'react'
import { getWeatherByCity, getOneCallWeather } from '@/services/weatherService'

export default function TestWeatherFetch() {
  const [weatherData, setWeatherData] = useState<any>(null)
  const [fullWeatherData, setFullWeatherData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true)
        setError(null)
        
        console.log('开始获取千叶天气数据...')
        
        // 获取千叶天气数据
        const weather = await getWeatherByCity('Chiba')
        console.log('千叶天气数据:', weather)
        setWeatherData(weather)

        if (weather) {
          console.log('开始获取千叶完整天气数据...')
          // 获取完整的天气预报数据
          const fullWeather = await getOneCallWeather(35.6073, 140.1065)
          console.log('千叶完整天气数据:', fullWeather)
          setFullWeatherData(fullWeather)
        }
      } catch (err) {
        console.error('获取天气数据失败:', err)
        setError(`获取天气数据失败: ${err}`)
      } finally {
        setLoading(false)
      }
    }

    fetchWeather()
  }, [])

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <h1 className="text-3xl font-bold mb-6">天气数据获取测试</h1>
      
      {loading && (
        <div className="text-lg">正在加载天气数据...</div>
      )}
      
      {error && (
        <div className="text-red-500 mb-4">错误: {error}</div>
      )}
      
      {weatherData && (
        <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">当前天气</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-lg"><span className="font-medium">城市:</span> {weatherData.city}</p>
              <p className="text-lg"><span className="font-medium">温度:</span> {weatherData.temperature}°C</p>
              <p className="text-lg"><span className="font-medium">天气状况:</span> {weatherData.condition}</p>
            </div>
            <div>
              <p className="text-lg"><span className="font-medium">湿度:</span> {weatherData.humidity}%</p>
              <p className="text-lg"><span className="font-medium">风速:</span> {weatherData.windSpeed} m/s</p>
              <p className="text-lg"><span className="font-medium">描述:</span> {weatherData.description}</p>
            </div>
          </div>
        </div>
      )}

      {fullWeatherData ? (
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">详细天气预报</h2>
          
          {fullWeatherData.current && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-xl font-medium mb-3">当前天气详情</h3>
              <div className="grid grid-cols-2 gap-3">
                <p><span className="font-medium">体感温度:</span> {fullWeatherData.current.feels_like.toFixed(1)}°C</p>
                <p><span className="font-medium">气压:</span> {fullWeatherData.current.pressure} hPa</p>
                <p><span className="font-medium">风速:</span> {fullWeatherData.current.wind_speed} m/s</p>
                <p><span className="font-medium">风向:</span> {fullWeatherData.current.wind_deg}°</p>
                <p><span className="font-medium">能见度:</span> {(fullWeatherData.current.visibility / 1000).toFixed(1)} km</p>
                <p><span className="font-medium">紫外线指数:</span> {fullWeatherData.current.uvi}</p>
                <p><span className="font-medium">云量:</span> {fullWeatherData.current.clouds}%</p>
              </div>
            </div>
          )}

          {fullWeatherData.daily && fullWeatherData.daily.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xl font-medium mb-3">一周天气预报</h3>
              <div className="space-y-2">
                {fullWeatherData.daily.slice(0, 7).map((day: any, index: number) => {
                  const date = new Date(day.dt * 1000)
                  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
                  const dayName = index === 0 ? '今天' : weekdays[date.getDay()]
                  
                  return (
                    <div key={day.dt} className="flex items-center justify-between p-3 bg-gray-100 rounded">
                      <div className="w-16 font-medium">{dayName}</div>
                      <div className="flex items-center">
                        <span className="mr-2">{day.weather[0].description}</span>
                        {day.weather[0].icon && (
                          <img 
                            src={`https://openweathermap.org/img/wn/${day.weather[0].icon}.png`} 
                            alt={day.weather[0].description} 
                            className="w-8 h-8 mr-2"
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
              <h3 className="text-xl font-medium mb-3">24小时预报</h3>
              <div className="flex overflow-x-auto pb-2 space-x-2">
                {fullWeatherData.hourly.slice(0, 24).map((hour: any, index: number) => {
                  const date = new Date(hour.dt * 1000)
                  const time = date.getHours()
                  
                  return (
                    <div key={hour.dt} className="flex flex-col items-center p-2 bg-gray-100 rounded min-w-[70px]">
                      <div className="text-sm">
                        {index === 0 ? '现在' : `${time}时`}
                      </div>
                      {hour.weather[0].icon && (
                        <img 
                          src={`https://openweathermap.org/img/wn/${hour.weather[0].icon}.png`} 
                          alt={hour.weather[0].description} 
                          className="w-10 h-10 my-1"
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
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">详细天气预报</h2>
          <p className="text-gray-500">暂无详细天气预报数据</p>
        </div>
      )}
    </div>
  )
}