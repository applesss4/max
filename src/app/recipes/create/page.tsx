'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { uploadFile } from '@/services/fileUploadService'

export default function CreateRecipePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState('') // 改为视频链接
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // 处理图片文件选择
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        setError('请选择图片文件')
        return
      }
      
      // 检查文件大小 (最大5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('图片文件大小不能超过5MB')
        return
      }
      
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
      setError('')
    }
  }

  // 验证视频链接
  const validateVideoUrl = (url: string) => {
    if (!url) return true // 空链接是允许的
    
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setError('请先登录')
      return
    }
    
    if (!name.trim()) {
      setError('请输入菜谱名称')
      return
    }
    
    if (videoUrl && !validateVideoUrl(videoUrl)) {
      setError('请输入有效的视频链接')
      return
    }
    
    setIsSubmitting(true)
    setError('')
    
    try {
      let imageUrl = null
      
      // 上传图片
      if (imageFile) {
        const { publicUrl, error: imageError } = await uploadFile(
          imageFile, 
          'wardrobe-images', 
          'recipes'
        )
        
        if (imageError) {
          throw new Error('图片上传失败: ' + imageError.message)
        }
        
        imageUrl = publicUrl
      }
      
      // 保存菜谱信息到数据库（使用视频链接而不是上传的视频）
      const { data, error: dbError } = await supabase
        .from('recipes')
        .insert({
          name: name.trim(),
          description: description.trim(),
          image_url: imageUrl,
          video_url: videoUrl.trim() || null, // 使用视频链接
          user_id: user.id
        })
        .select()
        .single()
      
      if (dbError) {
        throw new Error('保存菜谱信息失败: ' + dbError.message)
      }
      
      // 成功后跳转到菜谱详情页
      router.push(`/recipes/${data.id}`)
    } catch (err) {
      console.error('创建菜谱时发生错误:', err)
      setError(err instanceof Error ? err.message : '创建菜谱时发生未知错误')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 处理重定向逻辑
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
                <h1 className="text-xl font-semibold text-cream-text-dark">添加菜谱</h1>
              </div>
            </div>
          </div>
        </header>

        {/* 主内容区域 */}
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-cream-card rounded-lg shadow-sm border border-cream-border p-6">
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">错误</h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>{error}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                {/* 菜谱名称 */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-cream-text-dark">
                    菜谱名称 <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="block w-full px-3 py-2 border border-cream-border rounded-md shadow-sm focus:outline-none focus:ring-cream-accent focus:border-cream-accent sm:text-sm"
                      placeholder="请输入菜谱名称"
                    />
                  </div>
                </div>

                {/* 菜谱描述 */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-cream-text-dark">
                    菜谱描述
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="description"
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="block w-full px-3 py-2 border border-cream-border rounded-md shadow-sm focus:outline-none focus:ring-cream-accent focus:border-cream-accent sm:text-sm"
                      placeholder="请输入菜谱描述"
                    />
                  </div>
                </div>

                {/* 菜谱图片 */}
                <div>
                  <label className="block text-sm font-medium text-cream-text-dark">
                    菜谱图片
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-cream-border border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      {imagePreview ? (
                        <div className="relative">
                          <img 
                            src={imagePreview} 
                            alt="预览" 
                            className="mx-auto h-32 w-auto object-contain"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setImageFile(null)
                              setImagePreview(null)
                            }}
                            className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <>
                          <svg className="mx-auto h-12 w-12 text-cream-text-light" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <div className="flex text-sm text-cream-text-light">
                            <label htmlFor="image-upload" className="relative cursor-pointer bg-cream-card rounded-md font-medium text-cream-accent hover:text-cream-accent-hover focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-cream-accent">
                              <span>上传图片</span>
                              <input 
                                id="image-upload" 
                                name="image-upload" 
                                type="file" 
                                className="sr-only" 
                                accept="image/*"
                                onChange={handleImageChange}
                              />
                            </label>
                            <p className="pl-1">或拖拽图片到此处</p>
                          </div>
                          <p className="text-xs text-cream-text-light">
                            PNG, JPG, GIF 最大5MB
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* 视频链接 */} {/* 修改视频上传为视频链接输入 */}
                <div>
                  <label htmlFor="video-url" className="block text-sm font-medium text-cream-text-dark">
                    视频链接
                  </label>
                  <div className="mt-1">
                    <input
                      type="url"
                      id="video-url"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      className="block w-full px-3 py-2 border border-cream-border rounded-md shadow-sm focus:outline-none focus:ring-cream-accent focus:border-cream-accent sm:text-sm"
                      placeholder="请输入视频链接，如：https://example.com/video.mp4"
                    />
                    <p className="mt-1 text-sm text-cream-text-light">
                      支持常见的视频链接格式，如YouTube、Bilibili等平台的视频链接
                    </p>
                  </div>
                </div>

                {/* 提交按钮 */}
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="bg-white py-2 px-4 border border-cream-border rounded-md shadow-sm text-sm font-medium text-cream-text-dark hover:bg-cream-bg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cream-accent"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-cream-accent hover:bg-cream-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cream-accent disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        提交中...
                      </>
                    ) : '添加菜谱'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}