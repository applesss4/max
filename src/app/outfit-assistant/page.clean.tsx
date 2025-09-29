'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { addWardrobeItem, updateWardrobeItem, deleteWardrobeItem, saveOutfitHistory, getOutfitHistory } from '@/services/outfitService'
import { getWeatherByCity, getWeatherByCoordinates, getOneCallWeather, OneCallResponse, WeatherData as WeatherApiData } from '@/services/weatherService'

// 定义类型
interface WardrobeItem {
  id: string
  user_id: string
  name: string
  category: string
  color: string | null
  season: string | null
  image_url: string | null
  purchase_date: string | null
  brand: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

// 从天气服务导入的WeatherData接口会覆盖此定义

interface OutfitRecommendation {
  items: WardrobeItem[]
  notes: string
}

interface OutfitHistoryItem {
  id: string
  user_id: string
  outfit_date: string
  items: string
  weather: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

// 定义标签类型
type Tag = '商务' | '休闲' | '运动' | '正式' | '日常' | '约会' | '度假' | '居家';

export default function OutfitAssistantPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'recommend' | 'wardrobe' | 'history'>('recommend')
  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([])
  const [weatherData, setWeatherData] = useState<WeatherApiData | null>(null)
  const [fullWeatherData, setFullWeatherData] = useState<OneCallResponse | null>(null)
  const [recommendation, setRecommendation] = useState<OutfitRecommendation | null>(null)
  const [outfitHistory, setOutfitHistory] = useState<OutfitHistoryItem[]>([])
  const [loadingWardrobe, setLoadingWardrobe] = useState(true)
  const [loadingRecommendation, setLoadingRecommendation] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<(WardrobeItem & { tags: Tag[] }) | null>(null)
  const [newItem, setNewItem] = useState({
    name: '',
    category: '',
    color: '',
    season: '',
    image_url: '',
    purchase_date: '',
    brand: '',
    notes: '',
    tags: [] as Tag[]
  })

  // 获取用户衣柜物品
  const fetchWardrobeItems = useCallback(async () => {
    if (!user) return

    setLoadingWardrobe(true)
    try {
      const { data, error } = await supabase
        .from('wardrobe_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setWardrobeItems(data || [])
    } catch (error) {
      console.error('获取衣柜物品失败:', error)
    } finally {
      setLoadingWardrobe(false)
    }
  }, [user])

  // 获取穿搭历史
  const fetchOutfitHistory = useCallback(async () => {
    if (!user) return

    setLoadingHistory(true)
    try {
      const { data, error } = await getOutfitHistory(user.id)
      if (error) throw error
      if (data) {
        setOutfitHistory(data)
      }
    } catch (error) {
      console.error('获取穿搭历史失败:', error)
    } finally {
      setLoadingHistory(false)
    }
  }, [user])

  // 获取天气数据（真实的API调用）
  const fetchWeatherData = useCallback(async () => {
    try {
      // 获取日本千叶的天气数据
      console.log('開始获取日本千葉天气数据...');
      // 方法1: 使用城市名获取天气
      const weather = await getWeatherByCity('Chiba');
      
      if (weather) {
        console.log('成功获取千葉天气数据:', weather);
        setWeatherData(weather);
        
        // 获取完整的天气预报数据
        try {
          // 使用千葉の经纬度获取完整天气数据
          // 千葉の经纬度大约为: 纬度35.6073, 经度140.1065
          const fullWeather = await getOneCallWeather(35.6073, 140.1065);
          if (fullWeather) {
            console.log('成功获取千葉完整天气数据:', fullWeather);
            setFullWeatherData(fullWeather);
          }
        } catch (error) {
          console.error('获取千葉完整天气数据失败:', error);
        }
      } else {
        console.warn('无法获取千葉天气数据，尝试使用经纬度获取...');
        // 方法2: 如果城市名获取失败，使用经纬度获取
        // 日本千葉の经纬度大约为: 纬度35.6073, 经度140.1065
        const weatherByCoords = await getWeatherByCoordinates(35.6073, 140.1065);
        if (weatherByCoords) {
          console.log('通过经纬度成功获取千葉天气数据:', weatherByCoords);
          setWeatherData(weatherByCoords);
          
          // 获取完整的天气预报数据
          try {
            const fullWeather = await getOneCallWeather(35.6073, 140.1065);
            if (fullWeather) {
              console.log('成功获取千葉完整天气数据:', fullWeather);
              setFullWeatherData(fullWeather);
            }
          } catch (error) {
            console.error('获取千葉完整天气数据失败:', error);
          }
        } else {
          console.warn('无法通过经纬度获取千葉天气数据，使用模拟数据');
          // 如果API调用失败，使用模拟数据
          const mockWeather: WeatherApiData = {
            temperature: 22,
            condition: '晴',
            humidity: 65,
            windSpeed: 3.2,
            pressure: 1013,
            visibility: 10000,
            city: '千葉',
            country: 'JP',
            icon: '01d',
            description: '晴'
          };
          setWeatherData(mockWeather);
        }
      }
    } catch (error) {
      console.error('获取千葉天气数据失败:', error);
      // 如果API调用失败，使用模拟数据
      const mockWeather: WeatherApiData = {
        temperature: 22,
        condition: '晴',
        humidity: 65,
        windSpeed: 3.2,
        pressure: 1013,
        visibility: 10000,
        city: '千葉',
        country: 'JP',
        icon: '01d',
        description: '晴'
      };
      setWeatherData(mockWeather);
    }
  }, [])

  // 生成穿搭推荐
  const generateOutfitRecommendation = useCallback(async () => {
    if (!weatherData || wardrobeItems.length === 0) return

    setLoadingRecommendation(true)
    try {
      // 根据千葉の气候特点和天气数据推荐合适的衣物
      let recommendedItems: WardrobeItem[] = []
      
      // 根据温度推荐（考虑の季节特点）
      if (weatherData.temperature > 28) {
        // 夏季炎热潮湿：推荐轻薄透气の衣物
        recommendedItems = wardrobeItems.filter(item => 
          item.category === '上衣' && (item.season === '夏' || item.season === '四季') && 
          (item.notes?.includes('轻薄') || item.notes?.includes('透气') || item.notes?.includes('棉质'))
        ).slice(0, 1)
        
        const pants = wardrobeItems.filter(item => 
          item.category === '裤子' && (item.season === '夏' || item.season === '四季') &&
          (item.notes?.includes('轻薄') || item.notes?.includes('透气') || item.notes?.includes('短裤'))
        ).slice(0, 1)
        
        recommendedItems = [...recommendedItems, ...pants]
      } else if (weatherData.temperature > 20) {
        // 春秋季温和：推荐舒适适中の衣物
        recommendedItems = wardrobeItems.filter(item => 
          item.category === '上衣' && (item.season === '春' || item.season === '秋' || item.season === '四季')
        ).slice(0, 1)
        
        const pants = wardrobeItems.filter(item => 
          item.category === '裤子' && (item.season === '春' || item.season === '秋' || item.season === '四季')
        ).slice(0, 1)
        
        recommendedItems = [...recommendedItems, ...pants]
      } else if (weatherData.temperature > 10) {
        // 早春晚秋凉爽：推荐稍厚一些の衣物
        const outer = wardrobeItems.filter(item => 
          item.category === '外套' && (item.season === '春' || item.season === '秋' || item.season === '四季') &&
          (item.notes?.includes('薄外套') || item.notes?.includes('开衫') || item.notes?.includes('风衣'))
        ).slice(0, 1)
        
        const inner = wardrobeItems.filter(item => 
          item.category === '上衣' && (item.season === '春' || item.season === '秋' || item.season === '四季')
        ).slice(0, 1)
        
        const pants = wardrobeItems.filter(item => 
          item.category === '裤子' && (item.season === '春' || item.season === '秋' || item.season === '四季')
        ).slice(0, 1)
        
        recommendedItems = [...outer, ...inner, ...pants]
      } else {
        // 冬季寒冷：推荐保暖衣物
        const outer = wardrobeItems.filter(item => 
          item.category === '外套' && (item.season === '冬' || item.season === '四季') &&
          (item.notes?.includes('厚外套') || item.notes?.includes('羽绒服') || item.notes?.includes('大衣'))
        ).slice(0, 1)
        
        const inner = wardrobeItems.filter(item => 
          item.category === '上衣' && (item.season === '冬' || item.season === '四季') &&
          (item.notes?.includes('毛衣') || item.notes?.includes('保暖') || item.notes?.includes('厚'))
        ).slice(0, 1)
        
        const pants = wardrobeItems.filter(item => 
          item.category === '裤子' && (item.season === '冬' || item.season === '四季') &&
          (item.notes?.includes('厚') || item.notes?.includes('保暖') || item.notes?.includes('加绒'))
        ).slice(0, 1)
        
        recommendedItems = [...outer, ...inner, ...pants]
      }
      
      // 根据天气状况添加配饰
      if (weatherData.condition.includes('雨') || weatherData.condition.includes('Rain')) {
        // 下雨天推荐雨具
        const rainItems = wardrobeItems.filter(item => 
          item.category === '配飾' && 
          (item.notes?.includes('雨伞') || item.notes?.includes('雨衣') || item.notes?.includes('防水'))
        ).slice(0, 2)
        
        recommendedItems = [...recommendedItems, ...rainItems]
      } else if (weatherData.humidity > 70) {
        // 高湿度天气推荐透气配饰
        const accessories = wardrobeItems.filter(item => 
          item.category === '配飾' && 
          (item.notes?.includes('透气') || item.notes?.includes('吸汗') || item.notes?.includes('棉质'))
        ).slice(0, 2)
        
        recommendedItems = [...recommendedItems, ...accessories]
      } else {
        // 普通天气推荐一般配饰
        const accessories = wardrobeItems.filter(item => 
          item.category === '配飾'
        ).slice(0, 2)
        
        recommendedItems = [...recommendedItems, ...accessories]
      }
      
      // 生成推荐说明（针对千叶气候特点）
      let weatherDescription = '';
      if (weatherData.temperature > 28) {
        weatherDescription = '炎热潮湿的夏日';
      } else if (weatherData.temperature > 20) {
        weatherDescription = '温暖舒适的春/秋季';
      } else if (weatherData.temperature > 10) {
        weatherDescription = '凉爽的早春/晚秋';
      } else {
        weatherDescription = '寒冷的冬季';
      }
      
      // 添加湿度信息
      let humidityDescription = '';
      if (weatherData.humidity > 80) {
        humidityDescription = '，湿度较高，建议选择透气性好的衣物';
      } else if (weatherData.humidity > 60) {
        humidityDescription = '，湿度适中';
      } else {
        humidityDescription = '，湿度较低';
      }
      
      const notes = `根据千叶${weatherDescription}${humidityDescription}，当前气温${weatherData.temperature}°C，为您推荐这套适合的穿搭。`;
      
      setRecommendation({
        items: recommendedItems,
        notes
      })
    } catch (error) {
      console.error('生成穿搭推荐失败:', error)
    } finally {
      setLoadingRecommendation(false)
    }
  }, [weatherData, wardrobeItems])

  // 衣装追加
  const handleAddWardrobeItem = async () => {
    if (!user || !newItem.name || !newItem.category) return

    try {
      const itemToAdd = {
        ...newItem,
        user_id: user.id,
        notes: newItem.tags.join(', ') // タグをnotesフィールドに保存
      }

      // @ts-ignore
      const { data, error } = await addWardrobeItem(itemToAdd)

      if (error) throw error
      if (data) {
        // ローカル状態を更新
        setWardrobeItems(prev => [data, ...prev])
        setShowAddModal(false)
        // フォームをリセット
        setNewItem({
          name: '',
          category: '',
          color: '',
          season: '',
          image_url: '',
          purchase_date: '',
          brand: '',
          notes: '',
          tags: []
        })
      }
    } catch (error) {
      console.error('衣装追加失敗:', error)
      alert('衣装の追加に失敗しました。もう一度試してください')
    }
  }

  // 衣装編集
  const handleEditWardrobeItem = async () => {
    if (!editingItem || !editingItem.name || !editingItem.category) return

    try {
      const itemToUpdate = {
        ...editingItem,
        notes: editingItem.tags.join(', ') // タグをnotesフィールドに保存
      }

      // @ts-ignore
      const { data, error } = await updateWardrobeItem(editingItem.id, itemToUpdate)

      if (error) throw error
      if (data) {
        // ローカル状态を更新
        // @ts-ignore
        setWardrobeItems(prev => 
          // @ts-ignore
          prev.map(item => item.id === data.id ? data : item)
        )
        setShowEditModal(false)
        setEditingItem(null)
      }
    } catch (error) {
      console.error('衣装編集失敗:', error)
      alert('衣装の編集に失敗しました。もう一度試してください')
    }
  }

  // 衣装削除
  const handleDeleteWardrobeItem = async () => {
    if (!itemToDelete) return

    try {
      // @ts-ignore
      const { error } = await deleteWardrobeItem(itemToDelete)

      if (error) throw error
      
      // ローカル状态を更新
      setWardrobeItems(prev => 
        prev.filter(item => item.id !== itemToDelete)
      )
      setShowDeleteConfirm(false)
      setItemToDelete(null)
    } catch (error) {
      console.error('衣装削除失敗:', error)
      alert('衣装の削除に失敗しました。もう一度試してください')
    }
  }

  // 衣装履歴保存
  const handleSaveOutfit = async () => {
    if (!user || !recommendation) return

    try {
      const outfitToSave = {
        user_id: user.id,
        items: JSON.stringify(recommendation.items),
        weather: JSON.stringify(weatherData),
        notes: recommendation.notes
      }

      // @ts-ignore
      const { data, error } = await saveOutfitHistory(outfitToSave)

      if (error) throw error
      
      if (data) {
        alert('衣装が履歴に保存されました')
      }
    } catch (error) {
      console.error('衣装履歴保存失敗:', error)
      alert('衣装履歴の保存に失敗しました。もう一度試してください')
    }
  }

  // 衣装統计情報計算
  const getWardrobeStats = () => {
    const totalItems = wardrobeItems.length;
    const categoryCounts: Record<string, number> = {};
    
    wardrobeItems.forEach(item => {
      categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
    });
    
    return { totalItems, categoryCounts };
  };

  // タグ分布取得
  const getTagDistribution = () => {
    const tagCounts: Record<string, number> = {};
    
    wardrobeItems.forEach(item => {
      // 假定各itemにはtags属性があり、这里では実際のデータ構造に合わせて調整が必要
      const tags = item.notes?.split(',') || []; // 一時的にnotesフィールドにタグを保存
      tags.forEach(tag => {
        const trimmedTag = tag.trim();
        if (trimmedTag) {
          tagCounts[trimmedTag] = (tagCounts[trimmedTag] || 0) + 1;
        }
      });
    });
    
    // 转换为数组并排序
    const tagArray = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // 只取前5个标签
    
    return tagArray;
  };

  // 打开编辑模态框
  const openEditModal = (item: WardrobeItem) => {
    // 为现有物品添加标签属性
    const itemWithTags = {
      ...item,
      tags: (item.notes?.split(',').map(tag => tag.trim()) || []) as Tag[]
    };
    setEditingItem(itemWithTags as WardrobeItem & { tags: Tag[] });
    setShowEditModal(true);
  }

  // 打开删除确认框
  const openDeleteConfirm = (itemId: string) => {
    setItemToDelete(itemId)
    setShowDeleteConfirm(true)
  }

  // 处理表单输入变化（添加）
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setNewItem(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // 处理表单输入变化（编辑）
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (editingItem) {
      setEditingItem(prev => prev ? {
        ...prev,
        [name]: value
      } : null)
    }
  }

  // 处理标签变化（添加）
  const handleTagChange = (tag: Tag) => {
    setNewItem(prev => {
      const newTags = prev.tags.includes(tag) 
        ? prev.tags.filter(t => t !== tag) 
        : [...prev.tags, tag];
      
      return {
        ...prev,
        tags: newTags
      };
    });
  };

  // 处理标签变化（编辑）
  const handleEditTagChange = (tag: Tag) => {
    if (editingItem) {
      const newTags = editingItem.tags.includes(tag) 
        ? editingItem.tags.filter(t => t !== tag) 
        : [...editingItem.tags, tag];
      
      setEditingItem(prev => prev ? {
        ...prev,
        tags: newTags
      } : null);
    }
  };

  // 处理重定向逻辑
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // 获取数据
  useEffect(() => {
    if (user) {
      fetchWardrobeItems()
      fetchWeatherData()
    }
  }, [user, fetchWardrobeItems, fetchWeatherData])

  // 获取穿搭历史
  useEffect(() => {
    if (user && activeTab === 'history') {
      fetchOutfitHistory()
    }
  }, [user, activeTab, fetchOutfitHistory])

  // 当天气数据和衣柜物品都准备好后，生成推荐
  useEffect(() => {
    if (weatherData && wardrobeItems.length > 0 && activeTab === 'recommend') {
      generateOutfitRecommendation()
    }
  }, [weatherData, wardrobeItems, activeTab, generateOutfitRecommendation])

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

  // 如果没有用户信息，不渲染页面内容
  if (!user) {
    return null
  }

  // 计算衣柜统计信息
  const wardrobeStats = getWardrobeStats();
  const tagDistribution = getTagDistribution();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-cream-bg">
        {/* 顶部导航栏 */}
        <header className="bg-cream-card shadow-sm border-b border-cream-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-cream-text-dark">智能穿搭助理</h1>
              </div>
              <button
                onClick={() => router.push('/dashboard')}
                className="text-cream-text-light hover:text-cream-text-dark transition duration-300"
              >
                返回主页
              </button>
            </div>
          </div>
        </header>

        {/* 主内容区域 */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 标签页导航 */}
          <div className="flex border-b border-cream-border mb-8">
            <button
              className={`py-2 px-4 font-medium text-sm ${activeTab === 'recommend' ? 'text-cream-accent border-b-2 border-cream-accent' : 'text-cream-text-light hover:text-cream-text-dark'}`}
              onClick={() => setActiveTab('recommend')}
            >
              今日推荐
            </button>
            <button
              className={`py-2 px-4 font-medium text-sm ${activeTab === 'wardrobe' ? 'text-cream-accent border-b-2 border-cream-accent' : 'text-cream-text-light hover:text-cream-text-dark'}`}
              onClick={() => setActiveTab('wardrobe')}
            >
              我的衣柜
            </button>
            <button
              className={`py-2 px-4 font-medium text-sm ${activeTab === 'history' ? 'text-cream-accent border-b-2 border-cream-accent' : 'text-cream-text-light hover:text-cream-text-dark'}`}
              onClick={() => setActiveTab('history')}
            >
              穿搭历史
            </button>
          </div>

          {/* 今日推荐标签页 */}
          {activeTab === 'recommend' && (
            <div>
              <div className="bg-cream-card rounded-2xl shadow-sm p-6 border border-cream-border mb-8">
                <h2 className="text-xl font-semibold text-cream-text-dark mb-4">今日穿搭推荐</h2>
                
                {weatherData && (
                  <div className="bg-cream-bg rounded-lg p-4 mb-6">
                    <h3 className="font-medium text-cream-text-dark mb-2">今日天气</h3>
                    <div className="flex items-center">
                      <div className="text-3xl font-bold text-cream-text-dark mr-4">
                        {weatherData.temperature}°C
                      </div>
                      <div>
                        <p className="text-cream-text">天气: {weatherData.condition}</p>
                        <p className="text-cream-text-light text-sm">湿度: {weatherData.humidity}%</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* 完整天气信息展示 */}
                {fullWeatherData && (
                  <div className="bg-cream-bg rounded-lg p-4 mb-6">
                    <h3 className="font-medium text-cream-text-dark mb-3">详细天气信息</h3>
                    
                    {/* 当前天气详情 */}
                    <div className="mb-4 p-3 bg-cream-card rounded border border-cream-border">
                      <h4 className="font-medium text-cream-text-dark mb-2">当前天气详情</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-cream-text">体感温度:</span>
                          <span className="text-cream-text-dark font-medium">{fullWeatherData.current.feels_like.toFixed(1)}°C</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-cream-text">气压:</span>
                          <span className="text-cream-text-dark font-medium">{fullWeatherData.current.pressure} hPa</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-cream-text">风速:</span>
                          <span className="text-cream-text-dark font-medium">{fullWeatherData.current.wind_speed} m/s</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-cream-text">风向:</span>
                          <span className="text-cream-text-dark font-medium">{fullWeatherData.current.wind_deg}°</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-cream-text">能见度:</span>
                          <span className="text-cream-text-dark font-medium">{(fullWeatherData.current.visibility / 1000).toFixed(1)} km</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-cream-text">紫外线指数:</span>
                          <span className="text-cream-text-dark font-medium">{fullWeatherData.current.uvi}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-cream-text">云量:</span>
                          <span className="text-cream-text-dark font-medium">{fullWeatherData.current.clouds}%</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* 一周天气预报 */}
                    <div className="mb-4">
                      <h4 className="font-medium text-cream-text-dark mb-2">一周天气预报</h4>
                      <div className="space-y-2">
                        {fullWeatherData.daily.slice(0, 7).map((day, index) => {
                          const date = new Date(day.dt * 1000);
                          const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
                          const dayName = index === 0 ? '今天' : weekdays[date.getDay()];
                          
                          return (
                            <div key={day.dt} className="flex items-center justify-between p-2 bg-cream-card rounded border border-cream-border">
                              <div className="w-16 text-cream-text-dark font-medium">{dayName}</div>
                              <div className="flex items-center">
                                <span className="text-cream-text mr-2">{day.weather[0].description}</span>
                                {day.weather[0].icon && (
                                  <img 
                                    src={`https://openweathermap.org/img/wn/${day.weather[0].icon}.png`} 
                                    alt={day.weather[0].description} 
                                    className="w-6 h-6 mr-2"
                                  />
                                )}
                              </div>
                              <div className="w-24 text-right">
                                <span className="text-cream-text-dark font-medium">{day.temp.max.toFixed(0)}°</span>
                                <span className="text-cream-text-light">/{day.temp.min.toFixed(0)}°</span>
                              </div>
                              <div className="w-20 text-right text-cream-text">
                                风力: {day.wind_speed.toFixed(1)} m/s
                              </div>
                              <div className="w-16 text-right text-cream-text">
                                降水: {(day.pop * 100).toFixed(0)}%
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* 小时天气预报 */}
                    <div>
                      <h4 className="font-medium text-cream-text-dark mb-2">24小时预报</h4>
                      <div className="flex overflow-x-auto pb-2 space-x-2">
                        {fullWeatherData.hourly.slice(0, 24).map((hour, index) => {
                          const date = new Date(hour.dt * 1000);
                          const time = date.getHours();
                          
                          return (
                            <div key={hour.dt} className="flex flex-col items-center p-2 bg-cream-card rounded border border-cream-border min-w-[60px]">
                              <div className="text-cream-text text-xs">
                                {index === 0 ? '现在' : `${time}时`}
                              </div>
                              {hour.weather[0].icon && (
                                <img 
                                  src={`https://openweathermap.org/img/wn/${hour.weather[0].icon}.png`} 
                                  alt={hour.weather[0].description} 
                                  className="w-8 h-8 my-1"
                                />
                              )}
                              <div className="text-cream-text-dark font-medium">
                                {hour.temp.toFixed(0)}°
                              </div>
                              <div className="text-cream-text text-xs">
                                风: {hour.wind_speed.toFixed(1)} m/s
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
                
                {loadingRecommendation ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cream-accent mb-2"></div>
                      <p className="text-cream-text-dark">正在生成穿搭推荐...</p>
                    </div>
                  </div>
                ) : recommendation ? (
                  <div>
                    <div className="mb-4">
                      <p className="text-cream-text">{recommendation.notes}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {recommendation.items.map((item) => (
                        <div key={item.id} className="bg-cream-bg rounded-lg p-4 border border-cream-border">
                          {item.image_url ? (
                            <img 
                              src={item.image_url} 
                              alt={item.name} 
                              className="w-full h-32 object-cover rounded mb-2"
                            />
                          ) : (
                            <div className="bg-cream-border w-full h-32 rounded mb-2 flex items-center justify-center">
                              <span className="text-cream-text-light">暂无图片</span>
                            </div>
                          )}
                          <h4 className="font-medium text-cream-text-dark text-sm">{item.name}</h4>
                          <p className="text-cream-text-light text-xs">{item.category}</p>
                          {item.color && <p className="text-cream-text-light text-xs">颜色: {item.color}</p>}
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-6 flex justify-end space-x-3">
                      <button 
                        onClick={() => setActiveTab('wardrobe')}
                        className="px-4 py-2 border border-cream-border text-cream-text-dark rounded-lg hover:bg-cream-bg transition duration-300"
                      >
                        查看衣柜
                      </button>
                      <button 
                        onClick={handleSaveOutfit}
                        className="bg-cream-accent hover:bg-cream-accent-hover text-white px-4 py-2 rounded-lg transition duration-300"
                      >
                        保存到历史
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-cream-text-light">暂无推荐，请先添加衣柜物品</p>
                    <button 
                      onClick={() => setActiveTab('wardrobe')}
                      className="mt-4 bg-cream-accent hover:bg-cream-accent-hover text-white px-4 py-2 rounded-lg transition duration-300"
                    >
                      去添加衣物
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 我的衣柜标签页 */}
          {activeTab === 'wardrobe' && (
            <div>
              {/* 统计信息卡片 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-cream-card rounded-2xl shadow-sm p-6 border border-cream-border">
                  <h3 className="text-lg font-semibold text-cream-text-dark mb-4">衣柜统计</h3>
                  <div className="flex items-center">
                    <div className="bg-cream-accent text-white rounded-full w-12 h-12 flex items-center justify-center mr-4">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-cream-text-light text-sm">总衣物数</p>
                      <p className="text-2xl font-bold text-cream-text-dark">{wardrobeStats.totalItems}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-cream-card rounded-2xl shadow-sm p-6 border border-cream-border">
                  <h3 className="text-lg font-semibold text-cream-text-dark mb-4">类别分布</h3>
                  <div className="space-y-2">
                    {Object.entries(wardrobeStats.categoryCounts).map(([category, count]) => (
                      <div key={category} className="flex justify-between">
                        <span className="text-cream-text">{category}</span>
                        <span className="text-cream-text-dark font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-cream-card rounded-2xl shadow-sm p-6 border border-cream-border">
                  <h3 className="text-lg font-semibold text-cream-text-dark mb-4">标签分布</h3>
                  <div className="space-y-2">
                    {tagDistribution.map(({ tag, count }) => (
                      <div key={tag} className="flex justify-between">
                        <span className="text-cream-text">#{tag}</span>
                        <span className="text-cream-text-dark font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="bg-cream-card rounded-2xl shadow-sm p-6 border border-cream-border mb-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-cream-text-dark">我的衣柜</h2>
                  <button 
                    className="bg-cream-accent hover:bg-cream-accent-hover text-white px-4 py-2 rounded-lg transition duration-300"
                    onClick={() => setShowAddModal(true)}
                  >
                    添加衣物
                  </button>
                </div>
                
                {loadingWardrobe ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cream-accent mb-2"></div>
                      <p className="text-cream-text-dark">正在加载衣柜物品...</p>
                    </div>
                  </div>
                ) : wardrobeItems.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {wardrobeItems.map((item) => (
                      <div key={item.id} className="bg-cream-bg rounded-lg p-4 border border-cream-border relative">
                        <div className="absolute top-2 right-2 flex space-x-1">
                          <button 
                            onClick={() => openEditModal(item)}
                            className="text-cream-text-light hover:text-cream-accent p-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => openDeleteConfirm(item.id)}
                            className="text-cream-text-light hover:text-red-500 p-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                        
                        {item.image_url ? (
                          <img 
                            src={item.image_url} 
                            alt={item.name} 
                            className="w-full h-32 object-cover rounded mb-2"
                          />
                        ) : (
                          <div className="bg-cream-border w-full h-32 rounded mb-2 flex items-center justify-center">
                            <span className="text-cream-text-light">暂无图片</span>
                          </div>
                        )}
                        
                        <h4 className="font-medium text-cream-text-dark text-sm">{item.name}</h4>
                        <p className="text-cream-text-light text-xs">{item.category}</p>
                        {item.color && <p className="text-cream-text-light text-xs">颜色: {item.color}</p>}
                        {item.season && <p className="text-cream-text-light text-xs">季节: {item.season}</p>}
                        {item.brand && <p className="text-cream-text-light text-xs">品牌: {item.brand}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-cream-text-light mb-4">您的衣柜还是空的</p>
                    <button 
                      onClick={() => setShowAddModal(true)}
                      className="bg-cream-accent hover:bg-cream-accent-hover text-white px-4 py-2 rounded-lg transition duration-300"
                    >
                      添加第一件衣物
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 穿搭历史标签页 */}
          {activeTab === 'history' && (
            <div>
              <div className="bg-cream-card rounded-2xl shadow-sm p-6 border border-cream-border">
                <h2 className="text-xl font-semibold text-cream-text-dark mb-6">穿搭历史</h2>
                
                {loadingHistory ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cream-accent mb-2"></div>
                      <p className="text-cream-text-dark">正在加载穿搭历史...</p>
                    </div>
                  </div>
                ) : outfitHistory.length > 0 ? (
                  <div className="space-y-6">
                    {outfitHistory.map((historyItem) => (
                      <div key={historyItem.id} className="bg-cream-bg rounded-lg p-4 border border-cream-border">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-medium text-cream-text-dark">
                              {new Date(historyItem.outfit_date).toLocaleDateString('zh-CN', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </h3>
                            {historyItem.weather && (
                              <p className="text-cream-text-light text-sm">
                                天气: {JSON.parse(historyItem.weather).condition}, 
                                温度: {JSON.parse(historyItem.weather).temperature}°C
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-3">
                          {JSON.parse(historyItem.items).map((item: WardrobeItem) => (
                            <div key={item.id} className="bg-cream-card rounded p-2 border border-cream-border">
                              <p className="text-cream-text-dark text-xs font-medium truncate">{item.name}</p>
                              <p className="text-cream-text-light text-xs truncate">{item.category}</p>
                            </div>
                          ))}
                        </div>
                        
                        {historyItem.notes && (
                          <p className="text-cream-text text-sm">{historyItem.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-cream-text-light mb-4">暂无穿搭历史记录</p>
                    <button 
                      onClick={() => setActiveTab('recommend')}
                      className="bg-cream-accent hover:bg-cream-accent-hover text-white px-4 py-2 rounded-lg transition duration-300"
                    >
                      生成今日推荐
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 添加衣物模态框 */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-cream-card rounded-2xl shadow-lg border border-cream-border w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-cream-text-dark">添加衣物</h3>
                    <button 
                      onClick={() => setShowAddModal(false)}
                      className="text-cream-text-light hover:text-cream-text-dark"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-cream-text-dark mb-1">名称 *</label>
                      <input
                        type="text"
                        name="name"
                        value={newItem.name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-cream-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cream-accent"
                        placeholder="请输入衣物名称"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-cream-text-dark mb-1">类别 *</label>
                      <select
                        name="category"
                        value={newItem.category}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-cream-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cream-accent"
                      >
                        <option value="">请选择类别</option>
                        <option value="上衣">上衣</option>
                        <option value="裤子">裤子</option>
                        <option value="外套">外套</option>
                        <option value="鞋子">鞋子</option>
                        <option value="配饰">配饰</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-cream-text-dark mb-1">颜色</label>
                      <input
                        type="text"
                        name="color"
                        value={newItem.color}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-cream-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cream-accent"
                        placeholder="请输入颜色"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-cream-text-dark mb-1">季节</label>
