'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { 
  getUserHealthTracks, 
  createHealthTrack, 
  updateHealthTrack, 
  deleteHealthTrack,
  HealthTrack
} from '@/services/supabaseService'

// 优化健康数据项组件
const HealthDataItem = React.memo(({ 
  data, 
  onEdit, 
  onDelete,
  formatDate
}: { 
  data: HealthTrack; 
  onEdit: (data: HealthTrack) => void; 
  onDelete: (id: string) => void;
  formatDate: (dateString: string) => string;
}) => (
  <div className="border border-cream-border rounded-xl p-4 hover:shadow-md transition duration-300">
    <div className="flex justify-between items-start mb-4">
      <h3 className="font-medium text-cream-text-dark">{formatDate(data.tracked_date)}</h3>
      <div className="flex space-x-2">
        <button
          onClick={() => onEdit(data)}
          className="text-cream-accent hover:text-cream-accent-hover"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={() => onDelete(data.id)}
          className="text-red-500 hover:text-red-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-cream-bg rounded-lg p-3">
        <p className="text-cream-text-light text-sm">体重</p>
        <p className="font-medium text-cream-text-dark">{data.weight} kg</p>
      </div>
      <div className="bg-cream-bg rounded-lg p-3">
        <p className="text-cream-text-light text-sm">身高</p>
        <p className="font-medium text-cream-text-dark">{data.height} cm</p>
      </div>
      <div className="bg-cream-bg rounded-lg p-3">
        <p className="text-cream-text-light text-sm">血压</p>
        <p className="font-medium text-cream-text-dark">{data.blood_pressure_sys}/{data.blood_pressure_dia} mmHg</p>
      </div>
      <div className="bg-cream-bg rounded-lg p-3">
        <p className="text-cream-text-light text-sm">心率</p>
        <p className="font-medium text-cream-text-dark">{data.heart_rate} bpm</p>
      </div>
      <div className="bg-cream-bg rounded-lg p-3">
        <p className="text-cream-text-light text-sm">步数</p>
        <p className="font-medium text-cream-text-dark">{data.steps}</p>
      </div>
      <div className="bg-cream-bg rounded-lg p-3">
        <p className="text-cream-text-light text-sm">睡眠</p>
        <p className="font-medium text-cream-text-dark">{data.sleep_hours} 小时</p>
      </div>
      <div className="bg-cream-bg rounded-lg p-3">
        <p className="text-cream-text-light text-sm">饮水</p>
        <p className="font-medium text-cream-text-dark">{data.water_intake} L</p>
      </div>
    </div>

    {data.notes && (
      <div className="mt-4 pt-4 border-t border-cream-border">
        <p className="text-cream-text-light text-sm">备注</p>
        <p className="text-cream-text-dark">{data.notes}</p>
      </div>
    )}
  </div>
))

export default function HealthPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [healthData, setHealthData] = useState<HealthTrack[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingData, setEditingData] = useState<HealthTrack | null>(null)
  const [formData, setFormData] = useState({
    weight: '',
    height: '',
    blood_pressure_sys: '',
    blood_pressure_dia: '',
    heart_rate: '',
    steps: '',
    sleep_hours: '',
    water_intake: '',
    notes: '',
    tracked_date: new Date().toISOString().split('T')[0]
  })
  const [isLoading, setIsLoading] = useState(false)

  // 获取用户健康数据
  const fetchHealthTracks = useCallback(async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const { data, error } = await getUserHealthTracks(user.id)
      if (error) throw error
      setHealthData(data || [])
    } catch (error) {
      console.error('获取健康数据失败:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchHealthTracks()
    } else {
      // 添加模拟数据用于预览效果
      setHealthData([
        {
          id: '1',
          user_id: 'mock-user-id',
          weight: 70.5,
          height: 175.0,
          blood_pressure_sys: 120,
          blood_pressure_dia: 80,
          heart_rate: 72,
          steps: 8500,
          sleep_hours: 7.5,
          water_intake: 2.0,
          notes: '今天感觉很好，完成了日常锻炼',
          tracked_date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          user_id: 'mock-user-id',
          weight: 70.2,
          height: 175.0,
          blood_pressure_sys: 118,
          blood_pressure_dia: 78,
          heart_rate: 68,
          steps: 10200,
          sleep_hours: 8.0,
          water_intake: 2.5,
          notes: '昨天睡眠质量很好',
          tracked_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 昨天
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
    }
  }, [user, fetchHealthTracks])

  // 显示加载状态
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

  // 格式化日期显示
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }, [])

  // 处理表单输入变化
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }, [])

  // 提交表单
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      // 模拟添加健康数据（用于预览）
      const newHealthData: HealthTrack = {
        id: Date.now().toString(),
        user_id: 'mock-user-id',
        weight: parseFloat(formData.weight) || 0,
        height: parseFloat(formData.height) || 0,
        blood_pressure_sys: parseInt(formData.blood_pressure_sys) || 0,
        blood_pressure_dia: parseInt(formData.blood_pressure_dia) || 0,
        heart_rate: parseInt(formData.heart_rate) || 0,
        steps: parseInt(formData.steps) || 0,
        sleep_hours: parseFloat(formData.sleep_hours) || 0,
        water_intake: parseFloat(formData.water_intake) || 0,
        notes: formData.notes,
        tracked_date: formData.tracked_date,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      if (editingData) {
        // 更新现有健康数据
        setHealthData(healthData.map(data => 
          data.id === editingData.id ? newHealthData : data
        ))
        setEditingData(null)
      } else {
        // 添加新健康数据
        setHealthData([newHealthData, ...healthData])
      }
      
      // 重置表单
      setFormData({
        weight: '',
        height: '',
        blood_pressure_sys: '',
        blood_pressure_dia: '',
        heart_rate: '',
        steps: '',
        sleep_hours: '',
        water_intake: '',
        notes: '',
        tracked_date: new Date().toISOString().split('T')[0]
      })
      setShowForm(false)
      return
    }
    
    try {
      if (editingData) {
        // 更新现有健康数据
        const { data, error } = await updateHealthTrack(editingData.id, {
          ...formData,
          user_id: user.id,
          weight: parseFloat(formData.weight) || 0,
          height: parseFloat(formData.height) || 0,
          blood_pressure_sys: parseInt(formData.blood_pressure_sys) || 0,
          blood_pressure_dia: parseInt(formData.blood_pressure_dia) || 0,
          heart_rate: parseInt(formData.heart_rate) || 0,
          steps: parseInt(formData.steps) || 0,
          sleep_hours: parseFloat(formData.sleep_hours) || 0,
          water_intake: parseFloat(formData.water_intake) || 0,
        })
        
        if (error) throw error
        
        setHealthData(healthData.map(data => 
          data.id === editingData.id ? data! : data
        ))
        setEditingData(null)
      } else {
        // 添加新健康数据
        const { data, error } = await createHealthTrack({
          user_id: user.id,
          ...formData,
          weight: parseFloat(formData.weight) || 0,
          height: parseFloat(formData.height) || 0,
          blood_pressure_sys: parseInt(formData.blood_pressure_sys) || 0,
          blood_pressure_dia: parseInt(formData.blood_pressure_dia) || 0,
          heart_rate: parseInt(formData.heart_rate) || 0,
          steps: parseInt(formData.steps) || 0,
          sleep_hours: parseFloat(formData.sleep_hours) || 0,
          water_intake: parseFloat(formData.water_intake) || 0,
          tracked_date: formData.tracked_date
        })
        
        if (error) throw error
        
        setHealthData([data!, ...healthData])
      }
      
      // 重置表单
      setFormData({
        weight: '',
        height: '',
        blood_pressure_sys: '',
        blood_pressure_dia: '',
        heart_rate: '',
        steps: '',
        sleep_hours: '',
        water_intake: '',
        notes: '',
        tracked_date: new Date().toISOString().split('T')[0]
      })
      setShowForm(false)
    } catch (error) {
      console.error('保存健康数据失败:', error)
    }
  }, [user, formData, editingData, healthData])

  // 编辑健康数据
  const handleEdit = useCallback((data: HealthTrack) => {
    setEditingData(data)
    setFormData({
      weight: data.weight.toString(),
      height: data.height.toString(),
      blood_pressure_sys: data.blood_pressure_sys.toString(),
      blood_pressure_dia: data.blood_pressure_dia.toString(),
      heart_rate: data.heart_rate.toString(),
      steps: data.steps.toString(),
      sleep_hours: data.sleep_hours.toString(),
      water_intake: data.water_intake.toString(),
      notes: data.notes,
      tracked_date: data.tracked_date
    })
    setShowForm(true)
  }, [])

  // 删除健康数据
  const handleDelete = useCallback(async (id: string) => {
    if (!user) {
      // 模拟删除健康数据（用于预览）
      if (confirm('确定要删除这条健康记录吗？')) {
        setHealthData(healthData.filter(data => data.id !== id))
      }
      return
    }
    
    if (confirm('确定要删除这条健康记录吗？')) {
      try {
        const { error } = await deleteHealthTrack(id)
        if (error) throw error
        
        setHealthData(healthData.filter(data => data.id !== id))
      } catch (error) {
        console.error('删除健康记录失败:', error)
      }
    }
  }, [user, healthData])

  // 优化健康数据列表渲染
  const healthDataList = useMemo(() => (
    <div className="space-y-6">
      {healthData.map(data => (
        <HealthDataItem 
          key={data.id} 
          data={data} 
          onEdit={handleEdit} 
          onDelete={handleDelete}
          formatDate={formatDate}
        />
      ))}
    </div>
  ), [healthData, handleEdit, handleDelete, formatDate])

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-cream-bg">
        {/* 顶部导航栏 */}
        <header className="bg-cream-card shadow-sm border-b border-cream-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <button 
                  onClick={() => router.push('/dashboard')}
                  className="text-cream-text-dark hover:text-cream-accent mr-4"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
                <h1 className="text-xl font-semibold text-cream-text-dark">健康追踪</h1>
              </div>
              <div className="flex items-center">
                <button
                  onClick={() => setShowForm(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-cream-accent hover:bg-cream-accent-hover rounded-lg transition duration-300"
                >
                  添加记录
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* 主内容区域 */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 健康数据列表 */}
          <div className="bg-cream-card rounded-2xl shadow-sm p-6 border border-cream-border">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cream-accent mx-auto"></div>
                <p className="mt-2 text-cream-text-dark">加载中...</p>
              </div>
            ) : healthData.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-cream-border p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cream-text-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-cream-text-dark mb-2">暂无健康记录</h3>
                <p className="text-cream-text-light mb-4">点击"添加记录"按钮创建您的第一条健康记录</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-cream-accent hover:bg-cream-accent-hover rounded-lg transition duration-300"
                >
                  添加记录
                </button>
              </div>
            ) : (
              healthDataList
            )}
          </div>
        </main>

        {/* 添加/编辑健康数据表单模态框 */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-cream-card rounded-2xl shadow-lg p-6 w-full max-w-2xl border border-cream-border max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-cream-text-dark">
                  {editingData ? '编辑健康记录' : '添加健康记录'}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false)
                    setEditingData(null)
                    setFormData({
                      weight: '',
                      height: '',
                      blood_pressure_sys: '',
                      blood_pressure_dia: '',
                      heart_rate: '',
                      steps: '',
                      sleep_hours: '',
                      water_intake: '',
                      notes: '',
                      tracked_date: new Date().toISOString().split('T')[0]
                    })
                  }}
                  className="text-cream-text-light hover:text-cream-text"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="tracked_date" className="block text-sm font-medium text-cream-text-dark mb-2">
                      记录日期 *
                    </label>
                    <input
                      id="tracked_date"
                      name="tracked_date"
                      type="date"
                      value={formData.tracked_date}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-cream-border focus:outline-none focus:ring-2 focus:ring-cream-accent focus:border-transparent bg-cream-input text-cream-text"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="weight" className="block text-sm font-medium text-cream-text-dark mb-2">
                      体重 (kg)
                    </label>
                    <input
                      id="weight"
                      name="weight"
                      type="number"
                      step="0.1"
                      value={formData.weight}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-cream-border focus:outline-none focus:ring-2 focus:ring-cream-accent focus:border-transparent bg-cream-input text-cream-text"
                      placeholder="请输入体重"
                    />
                  </div>

                  <div>
                    <label htmlFor="height" className="block text-sm font-medium text-cream-text-dark mb-2">
                      身高 (cm)
                    </label>
                    <input
                      id="height"
                      name="height"
                      type="number"
                      step="0.1"
                      value={formData.height}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-cream-border focus:outline-none focus:ring-2 focus:ring-cream-accent focus:border-transparent bg-cream-input text-cream-text"
                      placeholder="请输入身高"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-cream-text-dark mb-2">
                      血压 (mmHg)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        id="blood_pressure_sys"
                        name="blood_pressure_sys"
                        type="number"
                        value={formData.blood_pressure_sys}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-cream-border focus:outline-none focus:ring-2 focus:ring-cream-accent focus:border-transparent bg-cream-input text-cream-text"
                        placeholder="收缩压"
                      />
                      <input
                        id="blood_pressure_dia"
                        name="blood_pressure_dia"
                        type="number"
                        value={formData.blood_pressure_dia}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-cream-border focus:outline-none focus:ring-2 focus:ring-cream-accent focus:border-transparent bg-cream-input text-cream-text"
                        placeholder="舒张压"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="heart_rate" className="block text-sm font-medium text-cream-text-dark mb-2">
                      心率 (bpm)
                    </label>
                    <input
                      id="heart_rate"
                      name="heart_rate"
                      type="number"
                      value={formData.heart_rate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-cream-border focus:outline-none focus:ring-2 focus:ring-cream-accent focus:border-transparent bg-cream-input text-cream-text"
                      placeholder="请输入心率"
                    />
                  </div>

                  <div>
                    <label htmlFor="steps" className="block text-sm font-medium text-cream-text-dark mb-2">
                      步数
                    </label>
                    <input
                      id="steps"
                      name="steps"
                      type="number"
                      value={formData.steps}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-cream-border focus:outline-none focus:ring-2 focus:ring-cream-accent focus:border-transparent bg-cream-input text-cream-text"
                      placeholder="请输入步数"
                    />
                  </div>

                  <div>
                    <label htmlFor="sleep_hours" className="block text-sm font-medium text-cream-text-dark mb-2">
                      睡眠时间 (小时)
                    </label>
                    <input
                      id="sleep_hours"
                      name="sleep_hours"
                      type="number"
                      step="0.1"
                      value={formData.sleep_hours}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-cream-border focus:outline-none focus:ring-2 focus:ring-cream-accent focus:border-transparent bg-cream-input text-cream-text"
                      placeholder="请输入睡眠时间"
                    />
                  </div>

                  <div>
                    <label htmlFor="water_intake" className="block text-sm font-medium text-cream-text-dark mb-2">
                      饮水量 (升)
                    </label>
                    <input
                      id="water_intake"
                      name="water_intake"
                      type="number"
                      step="0.1"
                      value={formData.water_intake}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-cream-border focus:outline-none focus:ring-2 focus:ring-cream-accent focus:border-transparent bg-cream-input text-cream-text"
                      placeholder="请输入饮水量"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-cream-text-dark mb-2">
                    备注
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-cream-border focus:outline-none focus:ring-2 focus:ring-cream-accent focus:border-transparent bg-cream-input text-cream-text"
                    placeholder="请输入备注信息"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      setEditingData(null)
                      setFormData({
                        weight: '',
                        height: '',
                        blood_pressure_sys: '',
                        blood_pressure_dia: '',
                        heart_rate: '',
                        steps: '',
                        sleep_hours: '',
                        water_intake: '',
                        notes: '',
                        tracked_date: new Date().toISOString().split('T')[0]
                      })
                    }}
                    className="px-4 py-2 text-sm font-medium text-cream-text-dark bg-cream-border hover:bg-cream-bg rounded-lg transition duration-300"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-cream-accent hover:bg-cream-accent-hover rounded-lg transition duration-300"
                  >
                    {editingData ? '更新' : '添加'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}