'use client'

import { useEffect, useRef } from 'react'

// 性能监控Hook
export const usePerformanceMonitor = (componentName: string) => {
  const renderCount = useRef(0)
  const mountTime = useRef<number | null>(null)

  // 记录组件挂载时间
  useEffect(() => {
    mountTime.current = performance.now()
    
    return () => {
      if (mountTime.current) {
        const unmountTime = performance.now()
        const mountDuration = unmountTime - mountTime.current
        console.log(`[性能监控] ${componentName} 组件卸载，挂载耗时: ${mountDuration.toFixed(2)}ms`)
      }
    }
  }, [componentName])

  // 记录渲染次数
  useEffect(() => {
    renderCount.current += 1
    console.log(`[性能监控] ${componentName} 组件第 ${renderCount.current} 次渲染`)
  })

  // 测量函数执行时间
  const measureFunction = <T extends (...args: any[]) => any>(
    fn: T,
    functionName: string
  ): T => {
    return function (...args: Parameters<T>): ReturnType<T> {
      const start = performance.now()
      const result = fn(...args)
      const end = performance.now()
      console.log(`[性能监控] ${functionName} 函数执行耗时: ${(end - start).toFixed(2)}ms`)
      return result
    } as T
  }

  return {
    measureFunction
  }
}