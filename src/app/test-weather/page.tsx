'use client'

import React, { useState } from 'react';
import { getWeatherByCity } from '@/services/weatherService';

export default function TestWeatherPage() {
  const [city, setCity] = useState('北京');
  const [weatherData, setWeatherData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetchWeather = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getWeatherByCity(city);
      setWeatherData(data);
    } catch (err) {
      setError('获取天气数据失败');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">天气服务测试</h1>
        
        <div className="mb-6">
          <div className="flex gap-4">
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="输入城市名"
            />
            <button
              onClick={handleFetchWeather}
              disabled={loading}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? '获取中...' : '获取天气'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {weatherData && (
          <div className="bg-blue-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {weatherData.city}, {weatherData.country}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <div className="text-4xl font-bold text-gray-800">
                  {weatherData.temperature}°C
                </div>
                <div className="ml-4">
                  <div className="text-gray-600">{weatherData.condition}</div>
                  <div className="text-sm text-gray-500">{weatherData.description}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">湿度</div>
                  <div className="font-medium">{weatherData.humidity}%</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">风速</div>
                  <div className="font-medium">{weatherData.windSpeed} m/s</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">气压</div>
                  <div className="font-medium">{weatherData.pressure} hPa</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">能见度</div>
                  <div className="font-medium">{weatherData.visibility} 米</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}