'use client'

import React, { useState } from 'react'
import { generateOptimizedOutfitRecommendation } from '@/services/outfitService'

export default function TestOutfitPage() {
  const [temperature, setTemperature] = useState(25)
  const [condition, setCondition] = useState('晴')
  const [recommendation, setRecommendation] = useState<any>(null)

  // 模拟衣柜数据
  const mockWardrobeItems = [
    {
      id: '1',
      user_id: 'user1',
      name: '白色T恤',
      category: '上衣',
      color: '白色',
      season: '夏',
      tags: ['休闲'],
      image_url: null,
      purchase_date: null,
      brand: null,
      notes: null,
      created_at: '2023-01-01',
      updated_at: '2023-01-01'
    },
    {
      id: '2',
      user_id: 'user1',
      name: '蓝色牛仔裤',
      category: '裤子',
      color: '蓝色',
      season: '四季',
      tags: ['休闲'],
      image_url: null,
      purchase_date: null,
      brand: null,
      notes: null,
      created_at: '2023-01-01',
      updated_at: '2023-01-01'
    },
    {
      id: '3',
      user_id: 'user1',
      name: '黑色皮鞋',
      category: '鞋子',
      color: '黑色',
      season: '四季',
      tags: ['正式'],
      image_url: null,
      purchase_date: null,
      brand: null,
      notes: null,
      created_at: '2023-01-01',
      updated_at: '2023-01-01'
    },
    {
      id: '4',
      user_id: 'user1',
      name: '红色围巾',
      category: '配饰',
      color: '红色',
      season: '冬',
      tags: ['保暖'],
      image_url: null,
      purchase_date: null,
      brand: null,
      notes: null,
      created_at: '2023-01-01',
      updated_at: '2023-01-01'
    },
    {
      id: '5',
      user_id: 'user1',
      name: '灰色毛衣',
      category: '上衣',
      color: '灰色',
      season: '冬',
      tags: ['保暖'],
      image_url: null,
      purchase_date: null,
      brand: null,
      notes: null,
      created_at: '2023-01-01',
      updated_at: '2023-01-01'
    },
    {
      id: '6',
      user_id: 'user1',
      name: '黑色外套',
      category: '外套',
      color: '黑色',
      season: '冬',
      tags: ['保暖'],
      image_url: null,
      purchase_date: null,
      brand: null,
      notes: null,
      created_at: '2023-01-01',
      updated_at: '2023-01-01'
    }
  ]

  const handleGenerateRecommendation = () => {
    const result = generateOptimizedOutfitRecommendation(
      { temperature, condition },
      mockWardrobeItems
    )
    setRecommendation(result)
  }

  return (
    <div className="min-h-screen bg-cream-bg p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-cream-text-dark mb-8">穿搭推荐测试</h1>
        
        <div className="bg-cream-card rounded-2xl shadow-sm p-6 border border-cream-border mb-8">
          <h2 className="text-xl font-semibold text-cream-text-dark mb-4">设置天气条件</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-cream-text-dark mb-2">温度 (°C)</label>
              <input
                type="number"
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="w-full px-3 py-2 border border-cream-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cream-accent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-cream-text-dark mb-2">天气状况</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full px-3 py-2 border border-cream-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cream-accent"
              >
                <option value="晴">晴</option>
                <option value="多云">多云</option>
                <option value="阴">阴</option>
                <option value="雨">雨</option>
                <option value="雪">雪</option>
              </select>
            </div>
          </div>
          
          <button
            onClick={handleGenerateRecommendation}
            className="bg-cream-accent hover:bg-cream-accent-hover text-white px-6 py-3 rounded-lg transition duration-300"
          >
            生成穿搭推荐
          </button>
        </div>
        
        {recommendation && (
          <div className="bg-cream-card rounded-2xl shadow-sm p-6 border border-cream-border">
            <h2 className="text-xl font-semibold text-cream-text-dark mb-4">推荐结果</h2>
            
            <div className="mb-6 p-4 bg-cream-bg rounded-lg border border-cream-border">
              <h3 className="font-medium text-cream-text-dark mb-2">推荐说明</h3>
              <p className="text-cream-text">{recommendation.notes}</p>
            </div>
            
            <div>
              <h3 className="font-medium text-cream-text-dark mb-3">推荐搭配</h3>
              {recommendation.items.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recommendation.items.map((item: any) => (
                    <div key={item.id} className="bg-cream-bg rounded-lg p-4 border border-cream-border">
                      <h4 className="font-medium text-cream-text-dark mb-1">{item.name}</h4>
                      <div className="flex justify-between text-sm">
                        <span className="text-cream-text-light">{item.category}</span>
                        {item.color && <span className="text-cream-text-light">颜色: {item.color}</span>}
                      </div>
                      {item.season && (
                        <div className="mt-2">
                          <span className="inline-block px-2 py-1 text-xs bg-cream-accent text-white rounded">
                            {item.season}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-cream-bg rounded-lg border border-cream-border">
                  <p className="text-cream-text-light">暂无推荐物品</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}