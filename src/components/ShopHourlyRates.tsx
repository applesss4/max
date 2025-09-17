'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { getShopHourlyRates } from '@/services/workScheduleService'
import { ShopHourlyRate } from '@/services/workScheduleService'

interface ShopHourlyRatesProps {
  userId: string
}

export default function ShopHourlyRates({ userId }: ShopHourlyRatesProps) {
  const [shopRates, setShopRates] = useState<ShopHourlyRate[]>([])
  const [loading, setLoading] = useState(true)

  // 使用useMemo优化数据处理
  const processedShopRates = useMemo(() => {
    return shopRates.map(rate => ({
      ...rate,
      day_shift_rate: Math.round(rate.day_shift_rate),
      night_shift_rate: Math.round(rate.night_shift_rate)
    }))
  }, [shopRates])

  useEffect(() => {
    const loadShopRates = async () => {
      try {
        // 只有当userId存在时才加载数据
        if (userId) {
          const { data, error } = await getShopHourlyRates(userId)
          if (data) {
            setShopRates(data)
          }
        }
      } catch (error) {
        console.error('加载店铺时薪数据失败:', error)
      } finally {
        setLoading(false)
      }
    }

    loadShopRates()
  }, [userId])

  if (loading) {
    return (
      <div className="text-center py-4 optimize-animation">
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-cream-accent loading-spinner"></div>
        <p className="mt-2 text-cream-text-dark">加载中...</p>
      </div>
    )
  }

  return (
    <div className="bg-cream-card rounded-2xl shadow-sm p-6 border border-cream-border optimize-animation">
      <h2 className="text-lg font-medium text-cream-text-dark mb-4">店铺时薪设置</h2>
      
      {processedShopRates.length === 0 ? (
        <p className="text-cream-text-light text-center py-4">暂无店铺时薪设置</p>
      ) : (
        <div className="space-y-4">
          {processedShopRates.map(rate => (
            <div key={rate.id} className="p-4 bg-cream-bg rounded-xl border border-cream-border hover-effect">
              <div className="font-medium text-cream-text-dark">{rate.shop_name}</div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="text-sm">
                  <span className="text-cream-text-light">白班时薪: </span>
                  <span className="text-cream-text">{rate.day_shift_rate}日元/小时</span>
                </div>
                <div className="text-sm">
                  <span className="text-cream-text-light">夜班时薪: </span>
                  <span className="text-cream-text">{rate.night_shift_rate}日元/小时</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}