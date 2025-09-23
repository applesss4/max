'use client'

import React from 'react'
import Link from 'next/link'

export default function OutfitPreviewPage() {
  return (
    <div className="min-h-screen bg-cream-bg p-4">
      <div className="max-w-4xl mx-auto">
        <header className="bg-cream-card shadow-sm border-b border-cream-border rounded-t-2xl p-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-cream-text-dark">穿搭助理预览</h1>
            <Link href="/outfit-assistant" className="bg-cream-accent hover:bg-cream-accent-hover text-white px-4 py-2 rounded-lg transition duration-300">
              访问完整功能
            </Link>
          </div>
        </header>

        <main className="mt-8">
          {/* 功能介绍 */}
          <section className="bg-cream-card rounded-2xl shadow-sm p-6 border border-cream-border mb-8">
            <h2 className="text-xl font-semibold text-cream-text-dark mb-4">功能概览</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-cream-bg rounded-lg p-4 border border-cream-border">
                <div className="text-cream-accent text-2xl mb-2">👕</div>
                <h3 className="font-medium text-cream-text-dark mb-2">智能推荐</h3>
                <p className="text-cream-text text-sm">根据天气和季节为您推荐合适的穿搭组合</p>
              </div>
              <div className="bg-cream-bg rounded-lg p-4 border border-cream-border">
                <div className="text-cream-accent text-2xl mb-2">📚</div>
                <h3 className="font-medium text-cream-text-dark mb-2">衣柜管理</h3>
                <p className="text-cream-text text-sm">管理您的所有衣物，按类别、颜色、季节分类</p>
              </div>
              <div className="bg-cream-bg rounded-lg p-4 border border-cream-border">
                <div className="text-cream-accent text-2xl mb-2">📅</div>
                <h3 className="font-medium text-cream-text-dark mb-2">历史记录</h3>
                <p className="text-cream-text text-sm">查看和重复使用您之前的穿搭组合</p>
              </div>
            </div>
          </section>

          {/* 界面预览 */}
          <section className="bg-cream-card rounded-2xl shadow-sm p-6 border border-cream-border mb-8">
            <h2 className="text-xl font-semibold text-cream-text-dark mb-4">界面预览</h2>
            
            {/* 今日推荐预览 */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-cream-text-dark mb-3">今日推荐</h3>
              <div className="bg-cream-bg rounded-lg p-4 mb-4">
                <div className="flex items-center mb-3">
                  <div className="text-3xl font-bold text-cream-text-dark mr-4">22°C</div>
                  <div>
                    <p className="text-cream-text">天气: 晴</p>
                    <p className="text-cream-text-light text-sm">湿度: 65%</p>
                  </div>
                </div>
                <p className="text-cream-text mb-4">根据当前天气，为您推荐这套舒适的春日穿搭。</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((item) => (
                    <div key={item} className="bg-cream-card rounded-lg p-3 border border-cream-border">
                      <div className="bg-cream-border w-full h-24 rounded mb-2 flex items-center justify-center">
                        <span className="text-cream-text-light">衣物图片</span>
                      </div>
                      <h4 className="font-medium text-cream-text-dark text-sm">春季衬衫</h4>
                      <p className="text-cream-text-light text-xs">上衣</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* 衣柜管理预览 */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-cream-text-dark mb-3">我的衣柜</h3>
              <div className="bg-cream-bg rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium text-cream-text-dark">衣物列表</h4>
                  <button className="bg-cream-accent text-white px-3 py-1 rounded text-sm">
                    添加衣物
                  </button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((item) => (
                    <div key={item} className="bg-cream-card rounded-lg p-3 border border-cream-border relative">
                      <div className="absolute top-2 right-2 flex space-x-1">
                        <button className="text-cream-text-light hover:text-cream-accent p-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button className="text-cream-text-light hover:text-red-500 p-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                      
                      <div className="bg-cream-border w-full h-24 rounded mb-2 flex items-center justify-center">
                        <span className="text-cream-text-light">衣物图片</span>
                      </div>
                      <h4 className="font-medium text-cream-text-dark text-sm">休闲T恤</h4>
                      <p className="text-cream-text-light text-xs">上衣</p>
                      <p className="text-cream-text-light text-xs">颜色: 白色</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <span className="bg-cream-accent text-white text-xs px-2 py-1 rounded">#休闲</span>
                        <span className="bg-cream-accent text-white text-xs px-2 py-1 rounded">#夏季</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* 穿搭历史预览 */}
            <div>
              <h3 className="text-lg font-medium text-cream-text-dark mb-3">穿搭历史</h3>
              <div className="bg-cream-bg rounded-lg p-4">
                <div className="space-y-4">
                  {[1, 2].map((item) => (
                    <div key={item} className="border border-cream-border rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium text-cream-text-dark">2023年5月{item}日</h4>
                        <span className="text-cream-text-light text-sm">10:30</span>
                      </div>
                      
                      <div className="bg-cream-card rounded p-2 mb-3 text-sm">
                        <span className="text-cream-text">天气: 24°C 晴</span>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        {[1, 2, 3, 4].map((subItem) => (
                          <div key={subItem} className="bg-cream-card rounded p-2">
                            <div className="bg-cream-border w-full h-12 rounded mb-1 flex items-center justify-center">
                              <span className="text-cream-text-light text-xs">图</span>
                            </div>
                            <p className="text-cream-text-dark text-xs truncate">衬衫</p>
                            <p className="text-cream-text-light text-xs">上衣</p>
                          </div>
                        ))}
                      </div>
                      
                      <p className="text-cream-text text-sm mb-3">春季休闲搭配，适合日常出行</p>
                      
                      <div className="flex justify-end">
                        <button className="text-cream-text-light hover:text-cream-accent text-sm flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          创建预览
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* 使用说明 */}
          <section className="bg-cream-card rounded-2xl shadow-sm p-6 border border-cream-border">
            <h2 className="text-xl font-semibold text-cream-text-dark mb-4">如何使用</h2>
            <ol className="list-decimal list-inside space-y-2 text-cream-text">
              <li>在"我的衣柜"中添加您的衣物信息</li>
              <li>系统会根据当前天气自动生成穿搭推荐</li>
              <li>您可以保存喜欢的搭配到历史记录中</li>
              <li>随时查看历史穿搭并重新使用</li>
            </ol>
          </section>
        </main>

        <footer className="mt-8 text-center text-cream-text-light text-sm">
          <p>© 2023 穿搭助理. 让您的每日穿搭更轻松.</p>
        </footer>
      </div>
    </div>
  )
}