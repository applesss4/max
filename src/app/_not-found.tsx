'use client'

import { useRouter } from 'next/navigation'
import React from 'react'

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-cream-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-cream-card rounded-2xl shadow-lg p-8 border border-cream-border">
          <div className="bg-cream-border p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cream-text-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-cream-text-dark mb-2">页面未找到</h1>
          <p className="text-cream-text-light mb-8">抱歉，您访问的页面不存在或已被移除。</p>
          
          <div className="space-y-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-cream-accent hover:bg-cream-accent-hover text-white font-medium py-3 px-4 rounded-xl transition duration-300"
            >
              返回主页
            </button>
            
            <button
              onClick={() => router.back()}
              className="w-full border border-cream-border text-cream-text-dark font-medium py-3 px-4 rounded-xl hover:bg-cream-bg transition duration-300"
            >
              返回上一页
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}