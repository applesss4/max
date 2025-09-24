'use client'

import React, { useState, useEffect } from 'react'
import { getWeatherByCity, getWeatherByCoordinates, getOneCallWeather } from '@/services/weatherService'

export default function DebugWeatherPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
    console.log(message)
  }

  const runDebug = async () => {
    if (isRunning) return
    setIsRunning(true)
    setLogs([])
    
    try {
      addLog('开始调试天气服务...')
      
      // 测试1: 城市名获取天气
      addLog('测试1: 通过城市名获取天气 (Chiba)')
      const cityWeather = await getWeatherByCity('Chiba')
      addLog(`城市天气结果: ${cityWeather ? '成功' : '失败'}`)
      if (cityWeather) {
        addLog(`城市天气数据: ${JSON.stringify(cityWeather, null, 2)}`)
      }
      
      // 测试2: 经纬度获取天气
      addLog('测试2: 通过经纬度获取天气 (35.6073, 140.1065)')
      const coordWeather = await getWeatherByCoordinates(35.6073, 140.1065)
      addLog(`经纬度天气结果: ${coordWeather ? '成功' : '失败'}`)
      if (coordWeather) {
        addLog(`经纬度天气数据: ${JSON.stringify(coordWeather, null, 2)}`)
      }
      
      // 测试3: OneCall API
      if (cityWeather || coordWeather) {
        addLog('测试3: 获取完整天气数据 (OneCall API)')
        const fullWeather = await getOneCallWeather(35.6073, 140.1065)
        addLog(`完整天气数据结果: ${fullWeather ? '成功' : '失败'}`)
        if (fullWeather) {
          addLog(`完整天气数据结构检查:`)
          addLog(`  - current: ${fullWeather.current ? '存在' : '缺失'}`)
          addLog(`  - daily: ${fullWeather.daily ? `存在 (${fullWeather.daily.length} 天)` : '缺失'}`)
          addLog(`  - hourly: ${fullWeather.hourly ? `存在 (${fullWeather.hourly.length} 小时)` : '缺失'}`)
          
          if (fullWeather.daily) {
            addLog(`一周预报数据预览:`)
            fullWeather.daily.slice(0, 3).forEach((day: any, index: number) => {
              const date = new Date(day.dt * 1000)
              addLog(`  ${index === 0 ? '今天' : date.toDateString()}: ${day.temp.min.toFixed(0)}°-${day.temp.max.toFixed(0)}°, ${day.weather[0].description}`)
            })
          }
        }
      }
      
      addLog('调试完成')
    } catch (error) {
      addLog(`调试过程中发生错误: ${error}`)
      console.error(error)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">天气服务调试工具</h1>
        
        <div className="mb-6">
          <button
            onClick={runDebug}
            disabled={isRunning}
            className={`px-6 py-3 rounded-lg font-medium ${
              isRunning 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isRunning ? '调试进行中...' : '开始调试'}
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">调试日志</h2>
          <div className="border rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm bg-black text-green-400">
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            ) : (
              <div className="text-gray-500">点击"开始调试"按钮查看日志</div>
            )}
          </div>
        </div>
        
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">调试说明</h3>
          <ul className="list-disc pl-5 text-yellow-700 space-y-1">
            <li>此工具将测试天气服务的三个主要功能：城市名查询、经纬度查询和完整天气预报</li>
            <li>所有API调用都会在控制台输出详细日志</li>
            <li>如果遇到问题，请检查浏览器控制台的详细错误信息</li>
          </ul>
        </div>
      </div>
    </div>
  )
}