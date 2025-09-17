'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { 
  getUserTodos, 
  createTodo, 
  updateTodo, 
  deleteTodo,
  Todo
} from '@/services/supabaseService'

// 优化待办事项组件
const TodoItem = React.memo(({ 
  todo, 
  onToggle, 
  onEdit, 
  onDelete,
  getPriorityLabel
}: { 
  todo: Todo; 
  onToggle: (id: string, completed: boolean) => void; 
  onEdit: (todo: Todo) => void; 
  onDelete: (id: string) => void;
  getPriorityLabel: (priority: number) => { label: string; color: string };
}) => {
  const priorityInfo = getPriorityLabel(todo.priority)
  return (
    <div className={`border border-cream-border rounded-xl p-4 hover:shadow-md transition duration-300 ${todo.completed ? 'opacity-70' : ''}`}>
      <div className="flex items-start">
        <button
          onClick={() => onToggle(todo.id, todo.completed)}
          className={`mt-1 flex-shrink-0 h-5 w-5 rounded-full border flex items-center justify-center mr-3 ${todo.completed ? 'bg-cream-accent border-cream-accent' : 'border-cream-text'}`}
        >
          {todo.completed && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
        <div className="flex-1">
          <div className="flex justify-between">
            <h3 className={`font-medium ${todo.completed ? 'line-through text-cream-text-light' : 'text-cream-text-dark'}`}>
              {todo.title}
            </h3>
            <span className={`text-xs px-2 py-1 rounded-full ${priorityInfo.color}`}>
              {priorityInfo.label}
            </span>
          </div>
          {todo.description && (
            <p className={`text-cream-text-light text-sm mt-1 ${todo.completed ? 'line-through' : ''}`}>
              {todo.description}
            </p>
          )}
          {todo.due_date && (
            <div className="flex items-center mt-2 text-sm text-cream-text">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {new Date(todo.due_date).toLocaleDateString('zh-CN', {
                month: 'short',
                day: 'numeric'
              })}
            </div>
          )}
        </div>
        <div className="flex space-x-2 ml-2">
          <button
            onClick={() => onEdit(todo)}
            className="text-cream-accent hover:text-cream-accent-hover"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(todo.id)}
            className="text-red-500 hover:text-red-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
})

export default function TodosPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [todos, setTodos] = useState<Todo[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 1,
    due_date: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  // 获取用户待办事项
  const fetchTodos = useCallback(async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const { data, error } = await getUserTodos(user.id)
      if (error) throw error
      setTodos(data || [])
    } catch (error) {
      console.error('获取待办事项失败:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchTodos()
    } else {
      // 添加模拟数据用于预览效果
      setTodos([
        {
          id: '1',
          user_id: 'mock-user-id',
          title: '完成项目报告',
          description: '准备季度项目进度报告并发送给团队成员',
          completed: false,
          priority: 3,
          due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 明天
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          user_id: 'mock-user-id',
          title: '购买生活用品',
          description: '去超市购买食品和日用品',
          completed: false,
          priority: 2,
          due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3天后
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '3',
          user_id: 'mock-user-id',
          title: '阅读新书',
          description: '阅读《高效能人士的七个习惯》第3章',
          completed: true,
          priority: 1,
          due_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 昨天
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
    }
  }, [user, fetchTodos])

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

  // 获取优先级标签
  const getPriorityLabel = useCallback((priority: number) => {
    switch (priority) {
      case 3: return { label: '高', color: 'bg-red-100 text-red-800' }
      case 2: return { label: '中', color: 'bg-yellow-100 text-yellow-800' }
      case 1: return { label: '低', color: 'bg-green-100 text-green-800' }
      default: return { label: '低', color: 'bg-green-100 text-green-800' }
    }
  }, [])

  // 处理表单输入变化
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'priority' ? parseInt(value) : value
    }))
  }, [])

  // 提交表单
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      // 模拟添加待办事项（用于预览）
      const newTodo: Todo = {
        id: Date.now().toString(),
        user_id: 'mock-user-id',
        title: formData.title,
        description: formData.description,
        completed: false,
        priority: formData.priority,
        due_date: formData.due_date,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      if (editingTodo) {
        // 更新现有待办事项
        setTodos(todos.map(todo => 
          todo.id === editingTodo.id ? newTodo : todo
        ))
        setEditingTodo(null)
      } else {
        // 添加新待办事项
        setTodos([newTodo, ...todos])
      }
      
      // 重置表单
      setFormData({
        title: '',
        description: '',
        priority: 1,
        due_date: ''
      })
      setShowForm(false)
      return
    }
    
    try {
      if (editingTodo) {
        // 更新现有待办事项
        const { data, error } = await updateTodo(editingTodo.id, {
          ...formData,
          user_id: user.id
        })
        
        if (error) throw error
        
        setTodos(todos.map(todo => 
          todo.id === editingTodo.id ? data! : todo
        ))
        setEditingTodo(null)
      } else {
        // 添加新待办事项
        const { data, error } = await createTodo({
          user_id: user.id,
          ...formData,
          completed: false
        })
        
        if (error) throw error
        
        setTodos([data!, ...todos])
      }
      
      // 重置表单
      setFormData({
        title: '',
        description: '',
        priority: 1,
        due_date: ''
      })
      setShowForm(false)
    } catch (error) {
      console.error('保存待办事项失败:', error)
    }
  }, [user, formData, editingTodo, todos])

  // 切换完成状态
  const toggleComplete = useCallback(async (id: string, completed: boolean) => {
    if (!user) {
      // 模拟切换完成状态（用于预览）
      setTodos(todos.map(todo => 
        todo.id === id ? { ...todo, completed: !completed } : todo
      ))
      return
    }
    
    try {
      const { data, error } = await updateTodo(id, { completed: !completed })
      if (error) throw error
      
      setTodos(todos.map(todo => 
        todo.id === id ? { ...data! } : todo
      ))
    } catch (error) {
      console.error('更新待办事项状态失败:', error)
    }
  }, [user, todos])

  // 编辑待办事项
  const handleEdit = useCallback((todo: Todo) => {
    setEditingTodo(todo)
    setFormData({
      title: todo.title,
      description: todo.description,
      priority: todo.priority,
      due_date: todo.due_date
    })
    setShowForm(true)
  }, [])

  // 删除待办事项
  const handleDelete = useCallback(async (id: string) => {
    if (!user) {
      // 模拟删除待办事项（用于预览）
      if (confirm('确定要删除这个待办事项吗？')) {
        setTodos(todos.filter(todo => todo.id !== id))
      }
      return
    }
    
    if (confirm('确定要删除这个待办事项吗？')) {
      try {
        const { error } = await deleteTodo(id)
        if (error) throw error
        
        setTodos(todos.filter(todo => todo.id !== id))
      } catch (error) {
        console.error('删除待办事项失败:', error)
      }
    }
  }, [user, todos])

  // 优化待办事项列表渲染
  const todoList = useMemo(() => (
    <div className="space-y-4">
      {todos.map(todo => (
        <TodoItem 
          key={todo.id} 
          todo={todo} 
          onToggle={toggleComplete} 
          onEdit={handleEdit} 
          onDelete={handleDelete}
          getPriorityLabel={getPriorityLabel}
        />
      ))}
    </div>
  ), [todos, toggleComplete, handleEdit, handleDelete, getPriorityLabel])

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
                <h1 className="text-xl font-semibold text-cream-text-dark">待办事项</h1>
              </div>
              <div className="flex items-center">
                <button
                  onClick={() => setShowForm(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-cream-accent hover:bg-cream-accent-hover rounded-lg transition duration-300"
                >
                  添加任务
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* 主内容区域 */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 待办事项列表 */}
          <div className="bg-cream-card rounded-2xl shadow-sm p-6 border border-cream-border">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cream-accent mx-auto"></div>
                <p className="mt-2 text-cream-text-dark">加载中...</p>
              </div>
            ) : todos.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-cream-border p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cream-text-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-cream-text-dark mb-2">暂无待办事项</h3>
                <p className="text-cream-text-light mb-4">点击"添加任务"按钮创建您的第一个待办事项</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-cream-accent hover:bg-cream-accent-hover rounded-lg transition duration-300"
                >
                  添加任务
                </button>
              </div>
            ) : (
              todoList
            )}
          </div>
        </main>

        {/* 添加/编辑待办事项表单模态框 */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-cream-card rounded-2xl shadow-lg p-6 w-full max-w-md border border-cream-border">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-cream-text-dark">
                  {editingTodo ? '编辑任务' : '添加任务'}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false)
                    setEditingTodo(null)
                    setFormData({
                      title: '',
                      description: '',
                      priority: 1,
                      due_date: ''
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
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-cream-text-dark mb-2">
                    标题 *
                  </label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-cream-border focus:outline-none focus:ring-2 focus:ring-cream-accent focus:border-transparent bg-cream-input text-cream-text"
                    placeholder="请输入任务标题"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-cream-text-dark mb-2">
                    描述
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-cream-border focus:outline-none focus:ring-2 focus:ring-cream-accent focus:border-transparent bg-cream-input text-cream-text"
                    placeholder="请输入任务描述"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-cream-text-dark mb-2">
                      优先级
                    </label>
                    <select
                      id="priority"
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-cream-border focus:outline-none focus:ring-2 focus:ring-cream-accent focus:border-transparent bg-cream-input text-cream-text"
                    >
                      <option value={1}>低</option>
                      <option value={2}>中</option>
                      <option value={3}>高</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="due_date" className="block text-sm font-medium text-cream-text-dark mb-2">
                      截止日期
                    </label>
                    <input
                      id="due_date"
                      name="due_date"
                      type="date"
                      value={formData.due_date}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-cream-border focus:outline-none focus:ring-2 focus:ring-cream-accent focus:border-transparent bg-cream-input text-cream-text"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      setEditingTodo(null)
                      setFormData({
                        title: '',
                        description: '',
                        priority: 1,
                        due_date: ''
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
                    {editingTodo ? '更新' : '添加'}
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