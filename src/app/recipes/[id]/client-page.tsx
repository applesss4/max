'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface Recipe {
  id: string
  name: string
  description: string
  image_url: string | null
  video_url: string | null
  created_at: string
}

export default function ClientRecipeDetail({ initialRecipe }: { initialRecipe: Recipe | null }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [recipe, setRecipe] = useState<Recipe | null>(initialRecipe)

  // 处理重定向逻辑
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-bg">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cream-accent"></div>
          <p className="mt-2 text-cream-text-dark">加载中...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // 如果没有菜谱数据，显示错误页面
  if (!recipe) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-cream-bg">
          {/* 顶部导航栏 */}
          <header className="bg-cream-card shadow-sm border-b border-cream-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16 items-center">
                <div className="flex items-center">
                  <button 
                    onClick={() => router.back()}
                    className="mr-4 text-cream-accent hover:text-cream-accent-hover"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                  </button>
                  <h1 className="text-xl font-semibold text-cream-text-dark">菜谱详情</h1>
                </div>
              </div>
            </div>
          </header>

          {/* 主内容区域 */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="text-center py-12">
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-cream-text-dark">菜谱不存在</h3>
              <p className="mt-1 text-sm text-cream-text-light">找不到该菜谱或您无权查看</p>
              <div className="mt-6">
                <button
                  onClick={() => router.push('/recipes')}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-cream-accent hover:bg-cream-accent-hover focus:outline-none transition duration-300"
                >
                  返回菜谱列表
                </button>
              </div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    )
  }

  // 处理视频链接的函数
  const renderVideo = () => {
    if (!recipe.video_url) {
      return (
        <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="mt-2 text-gray-500">暂无视频</p>
          </div>
        </div>
      )
    }

    // 检查是否为YouTube链接
    if (recipe.video_url.includes('youtube.com') || recipe.video_url.includes('youtu.be')) {
      let youtubeEmbedUrl = '';
      
      if (recipe.video_url.includes('youtube.com/watch?v=')) {
        // 处理标准YouTube链接
        const videoId = recipe.video_url.split('v=')[1]?.split('&')[0];
        youtubeEmbedUrl = `https://www.youtube.com/embed/${videoId}`;
      } else if (recipe.video_url.includes('youtu.be/')) {
        // 处理短链接
        const videoId = recipe.video_url.split('youtu.be/')[1]?.split('?')[0];
        youtubeEmbedUrl = `https://www.youtube.com/embed/${videoId}`;
      }
      
      return (
        <iframe
          src={youtubeEmbedUrl}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        ></iframe>
      )
    }
    
    // 检查是否为Bilibili链接
    if (recipe.video_url.includes('bilibili.com')) {
      let bilibiliEmbedUrl = '';
      
      if (recipe.video_url.includes('/video/BV')) {
        // 处理Bilibili BV号链接
        const bvId = recipe.video_url.split('/video/')[1]?.split('?')[0];
        bilibiliEmbedUrl = `https://player.bilibili.com/player.html?bvid=${bvId}&page=1`;
      } else if (recipe.video_url.includes('b23.tv')) {
        // 处理Bilibili短链接
        const shortUrl = recipe.video_url.split('b23.tv/')[1]?.split('?')[0];
        bilibiliEmbedUrl = `https://player.bilibili.com/player.html?bvid=${shortUrl}&page=1`;
      }
        
      return (
        <iframe
          src={bilibiliEmbedUrl}
          title="Bilibili video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        ></iframe>
      )
    }
    
    // 处理普通视频链接
    // 检查是否为有效的视频文件链接
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.wmv'];
    const isVideoFile = videoExtensions.some(ext => recipe.video_url?.toLowerCase().includes(ext));
    
    if (isVideoFile) {
      return (
        <video 
          src={recipe.video_url} 
          controls 
          className="w-full h-full object-contain"
        >
          您的浏览器不支持视频播放。
        </video>
      );
    }
    
    // 对于其他链接，尝试在新窗口中打开
    return (
      <div className="aspect-video bg-gray-100 rounded-lg flex flex-col items-center justify-center p-4 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="mt-2 text-gray-500">此视频链接需要在新窗口中打开</p>
        <a 
          href={recipe.video_url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-cream-accent hover:bg-cream-accent-hover"
        >
          打开视频链接
        </a>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-cream-bg">
        {/* 顶部导航栏 */}
        <header className="bg-cream-card shadow-sm border-b border-cream-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center">
                <button 
                  onClick={() => router.back()}
                  className="mr-4 text-cream-accent hover:text-cream-accent-hover"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
                <h1 className="text-xl font-semibold text-cream-text-dark">菜谱详情</h1>
              </div>
            </div>
          </div>
        </header>

        {/* 主内容区域 */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-cream-card rounded-lg shadow-sm border border-cream-border overflow-hidden">
            {/* 菜谱标题 */}
            <div className="p-6 border-b border-cream-border">
              <h1 className="text-2xl font-bold text-cream-text-dark">{recipe.name}</h1>
              <div className="mt-2 flex items-center text-sm text-cream-text-light">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {new Date(recipe.created_at).toLocaleDateString('zh-CN')}
              </div>
            </div>

            {/* 菜谱内容 */}
            <div className="p-6">
              {/* 菜谱描述 */}
              <div className="mb-8">
                <h2 className="text-lg font-medium text-cream-text-dark mb-3">菜谱描述</h2>
                <p className="text-cream-text-light">
                  {recipe.description || '暂无描述'}
                </p>
              </div>

              {/* 视频展示区域 */}
              <div className="mb-8">
                <h2 className="text-lg font-medium text-cream-text-dark mb-3">制作视频</h2>
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  {renderVideo()}
                </div>
              </div>

              {/* 菜谱图片 */}
              {recipe.image_url && (
                <div>
                  <h2 className="text-lg font-medium text-cream-text-dark mb-3">菜谱图片</h2>
                  <div className="bg-gray-100 rounded-lg overflow-hidden">
                    <img 
                      src={recipe.image_url} 
                      alt={recipe.name} 
                      className="w-full h-auto object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}