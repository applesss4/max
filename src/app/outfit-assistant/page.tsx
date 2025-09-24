'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { 
  getWardrobeItems, 
  getOutfitHistory, 
  getOutfitPreviews,
  addWardrobeItem, 
  updateWardrobeItem, 
  deleteWardrobeItem, 
  saveOutfitHistory, 
  saveOutfitPreview,
  updateOutfitPreview,
  deleteOutfitPreview,
  generateOptimizedOutfitRecommendation 
} from '@/services/outfitService'
import { 
  getWeatherByCity, 
  getWeatherByCoordinates, 
  getOneCallWeather, 
  OneCallResponse, 
  WeatherData as WeatherApiData 
} from '@/services/weatherService'
import { getNetworkOutfitRecommendation } from '@/services/networkOutfitService'

// 定义类型
interface WardrobeItem {
  id: string
  user_id: string
  name: string
  category: string
  color: string | null
  season: string | null
  tags: string[] | null
  image_url: string | null
  purchase_date: string | null
  brand: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

interface OutfitRecommendation {
  items: WardrobeItem[]
  notes: string
  networkImageUrl?: string // 添加网络图片URL字段
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

// 定义搭配预览类型
interface OutfitPreview {
  id: string
  user_id: string
  name: string
  items: WardrobeItem[]
  network_image_url?: string | null
  created_at: string
  updated_at: string
}

// 定义标签类型
type Tag = '商务' | '休闲' | '運動' | '正式' | '日常' | '约会' | '度假' | '居家';

// 定义穿搭预览类型
interface OutfitPreviewModal {
  id: string
  name: string
  items: WardrobeItem[]
  createdAt: string
}

export default function OutfitAssistantPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'recommend' | 'wardrobe' | 'history' | 'preview'>('recommend')
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
  const [editingItem, setEditingItem] = useState<(WardrobeItem & { tags: string[] }) | null>(null)
  const [newItem, setNewItem] = useState({
    name: '',
    category: '',
    color: '',
    season: '',
    tags: [] as string[],
    image_url: '',
    purchase_date: '',
    brand: '',
    notes: ''
  })
  const [outfitPreviews, setOutfitPreviews] = useState<OutfitPreview[]>([])
  const [loadingPreviews, setLoadingPreviews] = useState(true)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [selectedPreview, setSelectedPreview] = useState<OutfitPreview | null>(null)
  const [showWardrobeSelector, setShowWardrobeSelector] = useState(false)
  const [filteredCategory, setFilteredCategory] = useState<string | null>(null) // 添加筛选类别状态

  // 获取用户衣柜物品
  const fetchWardrobeItems = useCallback(async () => {
    console.log('開始获取用户衣柜物品...', { userId: user?.id });
    if (!user) {
      console.log('无法获取衣柜物品：用户未登录');
      return;
    }

    setLoadingWardrobe(true);
    try {
      const { data, error } = await getWardrobeItems(user.id);
      console.log('获取衣柜物品结果:', { data, error });
      if (error) throw error;
      if (data) {
        setWardrobeItems(data);
        console.log('成功设置衣柜物品:', data.length);
      }
    } catch (error) {
      console.error('获取衣柜物品失败:', error);
      alert('获取衣柜物品失败，请稍后重试');
    } finally {
      setLoadingWardrobe(false);
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
      alert('获取穿搭历史失败，请稍后重试')
    } finally {
      setLoadingHistory(false)
    }
  }, [user])

  // 获取搭配预览
  const fetchOutfitPreviews = useCallback(async () => {
    if (!user) return

    setLoadingPreviews(true)
    try {
      const { data, error } = await getOutfitPreviews(user.id)
      if (error) throw error
      if (data) {
        // 解析items字段
        const parsedData = data.map((preview: any) => ({
          ...preview,
          items: Array.isArray(preview.items) ? preview.items : []
        }))
        setOutfitPreviews(parsedData)
      }
    } catch (error) {
      console.error('获取搭配预览失败:', error)
      alert('获取搭配预览失败，请稍后重试')
    } finally {
      setLoadingPreviews(false)
    }
  }, [user])

  // 获取天气数据（真实的API调用）
  const fetchWeatherData = useCallback(async () => {
    console.log('開始获取天气数据...');
    try {
      // 获取日本千葉の天气データ
      console.log('開始获取日本千葉天气データ...');
      // 方法1: 使用城市名获取天气
      const weather = await getWeatherByCity('Chiba');
      
      console.log('城市天气データ获取結果:', weather);
      
      if (weather) {
        console.log('成功获取千葉天气データ:', weather);
        setWeatherData(weather);
        
        // 获取完整的天气预报データ
        try {
          // 使用千葉の经纬度获取完整天气データ
          // 千葉の经纬度大约为: 纬度35.6073, 经度140.1065
          const fullWeather = await getOneCallWeather(35.6073, 140.1065);
          console.log('完整天气データ获取結果:', fullWeather);
          if (fullWeather) {
            console.log('成功获取千葉完整天气データ:', fullWeather);
            setFullWeatherData(fullWeather);
          } else {
            console.warn('无法获取千葉完整天气データ');
          }
        } catch (error) {
          console.error('获取千葉完整天气データ失败:', error);
        }
      } else {
        console.warn('无法获取千葉天气データ，尝试使用经纬度获取...');
        // 方法2: 如果城市名获取失败，使用经纬度获取
        // 日本千葉の经纬度大约为: 纬度35.6073, 经度140.1065
        const weatherByCoords = await getWeatherByCoordinates(35.6073, 140.1065);
        console.log('经纬度天气データ获取結果:', weatherByCoords);
        if (weatherByCoords) {
          console.log('通过经纬度成功获取千葉天气データ:', weatherByCoords);
          setWeatherData(weatherByCoords);
          
          // 获取完整的天气预报データ
          try {
            const fullWeather = await getOneCallWeather(35.6073, 140.1065);
            console.log('完整天气データ获取結果(经纬度):', fullWeather);
            if (fullWeather) {
              console.log('成功获取千葉完整天气データ:', fullWeather);
              setFullWeatherData(fullWeather);
            } else {
              console.warn('无法获取千葉完整天气データ');
            }
          } catch (error) {
            console.error('获取千葉完整天气データ失败:', error);
          }
        } else {
          console.warn('无法通过经纬度获取千葉天气データ，使用模拟データ');
          // 如果API调用失败，使用模拟データ
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
            description: '晴',
            latitude: 35.6073,
            longitude: 140.1065
          };
          setWeatherData(mockWeather);
          alert('无法获取实时天气データ，将使用模拟データ');
        }
      }
    } catch (error) {
      console.error('获取千葉天气データ失败:', error);
      // 如果API调用失败，使用模拟データ
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
        description: '晴',
        latitude: 35.6073,
        longitude: 140.1065
      };
      setWeatherData(mockWeather);
      alert('获取天气データ失败，将使用模拟データ');
    }
  }, []);

  // 模拟天气データ（用于测试）
  const mockWeatherData = {
    temperature: 22,
    condition: '晴朗',
    humidity: 65,
    windSpeed: 3.5,
    pressure: 1013,
    visibility: 10000,
    city: '千葉',
    country: 'JP',
    icon: '01d',
    description: '晴朗',
    latitude: 35.6073,
    longitude: 140.1065
  };

  // 模拟完整天气データ（用于テスト）
  const mockFullWeatherData = {
    lat: 35.6073,
    lon: 140.1065,
    timezone: 'Asia/Tokyo',
    timezone_offset: 32400,
    current: {
      dt: Math.floor(Date.now() / 1000),
      sunrise: Math.floor(Date.now() / 1000) - 3600,
      sunset: Math.floor(Date.now() / 1000) + 3600,
      temp: 22,
      feels_like: 23,
      pressure: 1013,
      humidity: 65,
      dew_point: 15,
      uvi: 5,
      clouds: 0,
      visibility: 10000,
      wind_speed: 3.5,
      wind_deg: 180,
      wind_gust: 5.1,
      weather: [
        {
          id: 800,
          main: 'Clear',
          description: '晴朗',
          icon: '01d'
        }
      ]
    },
    hourly: Array(48).fill(null).map((_, index) => ({
      dt: Math.floor(Date.now() / 1000) + index * 3600,
      temp: 22 + Math.sin(index / 4) * 5,
      feels_like: 23 + Math.sin(index / 4) * 5,
      pressure: 1013,
      humidity: 65,
      dew_point: 15,
      uvi: Math.max(0, 5 - Math.abs(index - 12) / 3),
      clouds: Math.floor(Math.random() * 100),
      visibility: 10000,
      wind_speed: 3.5,
      wind_deg: 180,
      wind_gust: 5.1,
      weather: [
        {
          id: 800,
          main: 'Clear',
          description: '晴朗',
          icon: index < 6 || index > 18 ? '01n' : '01d'
        }
      ],
      pop: Math.random() * 0.3
    })),
    daily: Array(8).fill(null).map((_, index) => ({
      dt: Math.floor(Date.now() / 1000) + index * 86400,
      sunrise: Math.floor(Date.now() / 1000) - 3600 + index * 86400,
      sunset: Math.floor(Date.now() / 1000) + 3600 + index * 86400,
      moonrise: 0,
      moonset: 0,
      moon_phase: 0.5,
      temp: {
        day: 22 + Math.sin(index) * 8,
        min: 18 + Math.sin(index) * 5,
        max: 25 + Math.sin(index) * 10,
        night: 20 + Math.sin(index) * 6,
        eve: 21 + Math.sin(index) * 7,
        morn: 19 + Math.sin(index) * 5
      },
      feels_like: {
        day: 23 + Math.sin(index) * 8,
        night: 21 + Math.sin(index) * 6,
        eve: 22 + Math.sin(index) * 7,
        morn: 20 + Math.sin(index) * 5
      },
      pressure: 1013,
      humidity: 65,
      dew_point: 15,
      wind_speed: 3.5,
      wind_deg: 180,
      wind_gust: 5.1,
      weather: [
        {
          id: 800,
          main: 'Clear',
          description: index === 0 ? '今日天气晴朗' : `第${index + 1}天天气晴朗`,
          icon: '01d'
        }
      ],
      clouds: Math.floor(Math.random() * 100),
      pop: Math.random() * 0.3,
      uvi: 5
    }))
  };

  // 生成穿搭推荐
  const generateOutfitRecommendation = useCallback(async () => {
    console.log('開始生成穿搭推薦...', { 
      hasWeatherData: !!weatherData, 
      wardrobeItemsCount: wardrobeItems.length,
      weatherData,
      wardrobeItems
    });
    
    if (!weatherData || wardrobeItems.length === 0) {
      console.log('無法生成推薦：缺少必要數據', { 
        hasWeatherData: !!weatherData, 
        wardrobeItemsCount: wardrobeItems.length
      });
      return;
    }

    setLoadingRecommendation(true);
    try {
      // 使用优化的推荐逻辑
      console.log('調用推薦算法...');
      const result = generateOptimizedOutfitRecommendation(
        {
          temperature: weatherData.temperature,
          condition: weatherData.condition
        },
        wardrobeItems
      );
      
      // 添加网络推荐图片
      console.log('获取网络推荐图片...');
      const networkImageUrl = await getNetworkOutfitRecommendation(
        weatherData.temperature,
        weatherData.condition
      );
      
      if (networkImageUrl) {
        console.log('成功获取网络推荐图片:', networkImageUrl);
        setRecommendation({
          ...result,
          networkImageUrl
        });
      } else {
        console.log('未获取到网络推荐图片，使用默认推荐');
        setRecommendation(result);
      }
    } catch (error) {
      console.error('生成穿搭推薦失敗:', error);
      // 出错时提供默认推荐
      const defaultItems = wardrobeItems.slice(0, 3);
      const notes = `根据当前天气情况，为您推荐这套基础穿搭搭配。`;
      
      const defaultRecommendation = {
        items: defaultItems,
        notes
      };
      
      console.log('使用默认推荐:', defaultRecommendation);
      setRecommendation(defaultRecommendation);
    } finally {
      setLoadingRecommendation(false);
    }
  }, [weatherData, wardrobeItems])

  // 保存穿搭预览到数据库
  const saveOutfitPreviewToDB = async (preview: any) => {
    try {
      const { data, error } = await saveOutfitPreview(preview)
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('保存搭配预览失败:', error)
      return { data: null, error }
    }
  }

  // 保存穿搭预览
  const handleSaveOutfitPreview = async () => {
    if (selectedPreview && user) {
      try {
        // 检查是否是新预览还是更新现有预览
        if (selectedPreview.id && selectedPreview.id.length > 10 && !selectedPreview.id.startsWith('temp_')) {
          // 更新现有预览
          const { data, error } = await updateOutfitPreview(selectedPreview.id, {
            name: selectedPreview.name,
            items: selectedPreview.items
          })
          
          if (error) throw error
          
          // 更新本地状态
          setOutfitPreviews(prev => 
            prev.map(preview => preview.id === selectedPreview.id ? {...selectedPreview, updated_at: new Date().toISOString()} : preview)
          )
        } else {
          // 创建新预览
          const newPreview = {
            user_id: user.id,
            name: selectedPreview.name,
            items: selectedPreview.items
          }
          
          const { data, error } = await saveOutfitPreviewToDB(newPreview)
          
          if (error) throw error
          
          if (data) {
            // 添加到本地状态
            setOutfitPreviews(prev => [{
              ...data,
              items: data.items || selectedPreview.items
            }, ...prev])
          }
        }
        
        alert(`穿搭预览 "${selectedPreview.name}" 已保存!`)
        setShowPreviewModal(false)
      } catch (error) {
        console.error('保存搭配预览失败:', error)
        alert('保存搭配预览失败，请稍后重试')
      }
    }
  }

  // 保存当前推荐为穿搭预览
  const saveCurrentRecommendationAsPreview = async () => {
    if (recommendation && recommendation.items.length > 0 && user) {
      try {
        const newPreview = {
          user_id: user.id,
          name: `今日推荐 ${new Date().toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}`,
          items: recommendation.items,
          network_image_url: recommendation.networkImageUrl || null // 保存网络图片URL
        }
        
        const { data, error } = await saveOutfitPreviewToDB(newPreview)
        
        if (error) throw error
        
        if (data) {
          // 添加到本地状态
          setOutfitPreviews(prev => [{
            ...data,
            items: data.items || recommendation.items
          }, ...prev])
          
          setSelectedPreview({
            ...data,
            items: data.items || recommendation.items
          } as OutfitPreview)
          setShowPreviewModal(true)
          alert('推荐搭配已保存为预览!')
        }
      } catch (error) {
        console.error('保存推荐搭配失败:', error)
        alert('保存推荐搭配失败，请稍后重试')
      }
    } else {
      alert('当前没有推荐搭配可保存!')
    }
  }

  // 衣装履歴保存
  const handleSaveOutfit = async () => {
    if (!user || !recommendation) {
      alert('没有推荐搭配可保存');
      return;
    }

    try {
      const outfitToSave = {
        user_id: user.id,
        items: JSON.stringify(recommendation.items),
        weather: JSON.stringify(weatherData),
        notes: recommendation.notes
      };

      // @ts-ignore
      const { data, error } = await saveOutfitHistory(outfitToSave);

      if (error) throw error;
      
      if (data) {
        alert('衣装が履歴に保存されました');
      }
    } catch (error) {
      console.error('衣装履歴保存失敗:', error);
      alert('衣装履歴の保存に失敗しました。もう一度試してください');
    }
  };

  // 根据分类筛选衣柜物品
  const filterWardrobeByCategory = (category: string) => {
    setFilteredCategory(category);
    setActiveTab('wardrobe');
    console.log(`筛选 ${category} 类别的衣物`);
  };



  // 打开编辑模态框
  const openEditModal = (item: WardrobeItem) => {
    setEditingItem(item as WardrobeItem & { tags: string[] });
    setShowEditModal(true);
  };

  // 打开删除确认框
  const openDeleteConfirm = (itemId: string) => {
    setItemToDelete(itemId);
    setShowDeleteConfirm(true);
  };

  // 从历史记录创建穿搭预览
  const createPreviewFromHistory = async (historyItem: OutfitHistoryItem) => {
    try {
      const items = JSON.parse(historyItem.items)
      if (user) {
        const newPreview = {
          user_id: user.id,
          name: `历史搭配 ${new Date(historyItem.outfit_date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}`,
          items: items
        }
        
        const { data, error } = await saveOutfitPreviewToDB(newPreview)
        
        if (error) throw error
        
        if (data) {
          // 添加到本地状态
          setOutfitPreviews(prev => [{
            ...data,
            items: data.items || items
          }, ...prev])
          
          setSelectedPreview({
            ...data,
            items: data.items || items
          } as OutfitPreview)
          setShowPreviewModal(true)
          alert('历史搭配已添加到预览!')
        }
      }
    } catch (error) {
      console.error('解析历史记录失败:', error)
      alert('解析历史记录失败')
    }
  }

  // 删除搭配预览
  const deleteOutfitPreviewById = async (id: string) => {
    try {
      const { error } = await deleteOutfitPreview(id)
      if (error) throw error
      
      // 更新本地状态
      setOutfitPreviews(prev => prev.filter(preview => preview.id !== id))
      if (selectedPreview?.id === id) {
        setSelectedPreview(null)
      }
      
      alert('搭配预览已删除!')
    } catch (error) {
      console.error('删除搭配预览失败:', error)
      alert('删除搭配预览失败，请稍后重试')
    }
  }

  // 衣装统计信息計算
  const getWardrobeStats = () => {
    const totalItems = wardrobeItems.length;
    const categoryCounts: Record<string, number> = {};
    
    wardrobeItems.forEach(item => {
      categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
    });
    
    return { totalItems, categoryCounts };
  };

  // 标签分布获取
  const getTagDistribution = () => {
    const tagCounts: Record<string, number> = {};
    
    wardrobeItems.forEach(item => {
      // 使用tags字段
      const tags = item.tags || [];
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
  const handleEditTagChange = (tag: string) => {
    if (editingItem) {
      setEditingItem(prev => prev ? {
        ...prev,
        tags: prev.tags.includes(tag) 
          ? prev.tags.filter(t => t !== tag) 
          : [...prev.tags, tag]
      } : null);
    }
  };

  // 衣装追加
  const handleAddWardrobeItem = async () => {
    if (!user || !newItem.name || !newItem.category) {
      alert('请填写必要的信息（名称和类别）');
      return;
    }

    try {
      const itemToAdd = {
        ...newItem,
        user_id: user.id
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
        alert('衣物添加成功！');
      }
    } catch (error) {
      console.error('衣装追加失敗:', error)
      alert('衣装の追加に失敗しました。もう一度試してください')
    }
  }

  // 衣装編集
  const handleEditWardrobeItem = async () => {
    if (!editingItem || !editingItem.name || !editingItem.category) {
      alert('请填写必要的信息（名称和类别）');
      return;
    }

    try {
      // @ts-ignore
      const { data, error } = await updateWardrobeItem(editingItem.id, editingItem)

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
        alert('衣物编辑成功！');
      }
    } catch (error) {
      console.error('衣装編集失敗:', error)
      alert('衣装の編集に失敗しました。もう一度試してください')
    }
  }

  // 衣装削除
  const handleDeleteWardrobeItem = async () => {
    if (!itemToDelete) {
      alert('请选择要删除的衣物');
      return;
    }

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
      alert('衣物删除成功！');
    } catch (error) {
      console.error('衣装削除失敗:', error)
      alert('衣装の削除に失敗しました。もう一度試してください')
    }
  }

  // 从衣柜选择器保存搭配
  const saveOutfitFromWardrobeSelector = async () => {
    if (selectedPreview && user) {
      try {
        // 检查是否是新预览还是更新现有预览
        if (selectedPreview.id && selectedPreview.id.length > 10 && !selectedPreview.id.startsWith('temp_')) {
          // 更新现有预览
          const { data, error } = await updateOutfitPreview(selectedPreview.id, {
            name: selectedPreview.name,
            items: selectedPreview.items
          })
          
          if (error) throw error
          
          // 更新本地状态
          setOutfitPreviews(prev => 
            prev.map(preview => preview.id === selectedPreview.id ? {...selectedPreview, updated_at: new Date().toISOString()} : preview)
          )
        } else {
          // 创建新预览
          const newPreview = {
            user_id: user.id,
            name: selectedPreview.name,
            items: selectedPreview.items
          }
          
          const { data, error } = await saveOutfitPreviewToDB(newPreview)
          
          if (error) throw error
          
          if (data) {
            // 添加到本地状态
            setOutfitPreviews(prev => [{
              ...data,
              items: data.items || selectedPreview.items
            }, ...prev])
          }
        }
        
        setShowWardrobeSelector(false)
        alert(`搭配 "${selectedPreview.name}" 已保存!`)
      } catch (error) {
        console.error('保存搭配失败:', error)
        alert('保存搭配失败，请稍后重试')
      }
    }
  }

  // 从衣柜创建新的搭配预览
  const createNewPreviewFromWardrobe = () => {
    const newPreview: OutfitPreview = {
      id: `temp_${Date.now()}`,
      user_id: user?.id || '',
      name: `搭配 ${outfitPreviews.length + 1}`,
      items: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    setSelectedPreview(newPreview)
    // 不再立即添加到预览列表中，而是等到用户明确保存时再添加
    setShowWardrobeSelector(true)
  }

  // 处理衣柜选择器中的物品选择
  const handleWardrobeItemSelect = (item: WardrobeItem) => {
    if (selectedPreview) {
      // 检查是否已选择该物品
      const isItemSelected = selectedPreview.items.some(i => i.id === item.id)
      if (isItemSelected) {
        // 如果已选择，则移除
        setSelectedPreview(prev => prev ? {
          ...prev,
          items: prev.items.filter(i => i.id !== item.id)
        } : null)
      } else {
        // 如果未选择，则添加
        setSelectedPreview(prev => prev ? {
          ...prev,
          items: [...prev.items, item]
        } : null)
      }
    }
  }

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

  // 获取搭配预览
  useEffect(() => {
    if (user && activeTab === 'preview') {
      fetchOutfitPreviews()
    }
  }, [user, activeTab, fetchOutfitPreviews])

  // 当天气数据和衣柜物品都准备好后，生成推荐
  useEffect(() => {
    console.log('检查推荐条件:', { 
      hasWeatherData: !!weatherData, 
      hasWardrobeItems: wardrobeItems.length > 0, 
      isRecommendTab: activeTab === 'recommend',
      wardrobeItemsCount: wardrobeItems.length
    });
    
    if (weatherData && wardrobeItems.length > 0 && activeTab === 'recommend') {
      console.log('满足推荐条件，生成穿搭推荐...');
      generateOutfitRecommendation();
    } else if (activeTab === 'recommend' && !weatherData) {
      console.log('在推荐标签页但没有天气数据，尝试获取天气数据...');
      fetchWeatherData();
    } else if (activeTab === 'recommend' && weatherData && wardrobeItems.length === 0) {
      console.log('在推荐标签页且有天气数据但没有衣柜物品，提示用户添加物品...');
      // 这种情况下会在UI中显示提示信息
    }
  }, [weatherData, wardrobeItems, activeTab, generateOutfitRecommendation, fetchWeatherData]);

  // 添加定时刷新天气数据的功能
  // 当用户切换到推荐标签页时，确保获取最新的天气数据
  // 同时设置定时器定期更新天气数据，确保信息是最新的
  useEffect(() => {
    if (activeTab !== 'recommend' || !user) return;

    // 立即获取一次数据
    fetchWeatherData();

    // 设置定时器，每15分钟刷新一次天气データ
    const intervalId = setInterval(() => {
      console.log('定时刷新天气データ...');
      fetchWeatherData();
    }, 15 * 60 * 1000); // 15分钟

    // 清理定时器
    return () => {
      console.log('清理天气データ刷新定时器');
      clearInterval(intervalId);
    };
  }, [activeTab, user, fetchWeatherData]);

  // 当切换到推荐标签页时，确保获取最新的天气数据
  useEffect(() => {
    if (activeTab === 'recommend' && user) {
      fetchWeatherData();
    }
  }, [activeTab, user, fetchWeatherData]);

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
  const wardrobeStats = {
    totalItems: wardrobeItems.length,
    categoryCounts: (() => {
      const categoryCounts: Record<string, number> = {};
      wardrobeItems.forEach(item => {
        categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
      });
      return categoryCounts;
    })()
  };
  


  const tagDistribution = (() => {
    const tagCounts: Record<string, number> = {};
    
    wardrobeItems.forEach(item => {
      // 使用tags字段
      const tags = item.tags || [];
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
  })();

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
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/today-weather')}
                  className="text-cream-text-light hover:text-cream-text-dark transition duration-300 p-2 rounded-full hover:bg-cream-bg"
                  title="城市设置"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="text-cream-text-light hover:text-cream-text-dark transition duration-300"
                >
                  返回主页
                </button>
              </div>
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
            <button
              className={`py-2 px-4 font-medium text-sm ${activeTab === 'preview' ? 'text-cream-accent border-b-2 border-cream-accent' : 'text-cream-text-light hover:text-cream-text-dark'}`}
              onClick={() => setActiveTab('preview')}
            >
              搭配预览
            </button>
          </div>

          {/* 今日推荐标签页 */}
          {activeTab === 'recommend' && (
            <div>
              <div className="bg-cream-card rounded-2xl shadow-sm p-6 border border-cream-border mb-8">
                <h2 className="text-xl font-semibold text-cream-text-dark mb-4">今日穿搭推荐</h2>
                
                {/* 已删除网络推荐图功能 */}
                
                <div className="bg-cream-bg rounded-lg p-4 mb-6">
                  <h3 className="font-medium text-cream-text-dark mb-2">今日天气</h3>
                  {weatherData ? (
                    <div className="flex items-center">
                      <div className="text-3xl font-bold text-cream-text-dark mr-4">
                        {weatherData.temperature}°C
                      </div>
                      <div>
                        <p className="text-cream-text">
                          城市: {weatherData.city}, {weatherData.country}
                        </p>
                        <p className="text-cream-text">天气: {weatherData.condition}</p>
                        <p className="text-cream-text-light text-sm">湿度: {weatherData.humidity}%</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-cream-text-light">正在加载天气数据...</p>
                  )}
                </div>
                
                {/* 完整天气情報展示 */}
                {fullWeatherData ? (
                  <div className="bg-cream-bg rounded-lg p-4 mb-6">
                    <h3 className="font-medium text-cream-text-dark mb-3">詳細天气情報</h3>
                    
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
                    
                    {/* 24小时预报 */}
                    <div className="mb-4">
                      <h4 className="font-medium text-cream-text-dark mb-2">24小时预报</h4>
                      <div className="flex overflow-x-auto pb-2 space-x-2">
                        {fullWeatherData.hourly && fullWeatherData.hourly.length > 0 ? (
                          fullWeatherData.hourly.slice(0, 24).map((hour, index) => {
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
                          })
                        ) : (
                          <p className="text-cream-text-light">暂无小时预报数据</p>
                        )}
                      </div>
                    </div>
                    
                    {/* 一周天气预报 */}
                    <div>
                      <h4 className="font-medium text-cream-text-dark mb-2">一周天气预报</h4>
                      <div className="space-y-2">
                        {fullWeatherData.daily && fullWeatherData.daily.length > 0 ? (
                          fullWeatherData.daily.slice(0, 7).map((day, index) => {
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
                          })
                        ) : (
                          <p className="text-cream-text-light">暂无预报数据</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-cream-bg rounded-lg p-4 mb-6">
                    <h3 className="font-medium text-cream-text-dark mb-3">詳細天气情報</h3>
                    <p className="text-cream-text-light">正在加载天气预报数据...</p>
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
                    <div className="mb-6 p-4 bg-cream-bg rounded-lg border border-cream-border">
                      <h3 className="font-medium text-cream-text-dark mb-2">推荐说明</h3>
                      <p className="text-cream-text">{recommendation.notes}</p>
                      {recommendation.networkImageUrl && (
                        <div className="mt-4">
                          <h4 className="font-medium text-cream-text-dark mb-2">网络推荐参考图</h4>
                          <div className="flex justify-center">
                            <img 
                              src={recommendation.networkImageUrl} 
                              alt="网络推荐搭配参考" 
                              className="max-w-full h-auto rounded-lg shadow-md"
                              style={{ maxHeight: '300px' }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-medium text-cream-text-dark">推荐搭配</h3>
                        <span className="text-cream-text-light text-sm">{recommendation.items.length} 件单品</span>
                      </div>
                      {recommendation.items.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {recommendation.items.map((item) => (
                            <div key={item.id} className="bg-cream-bg rounded-lg p-4 border border-cream-border hover:shadow-md transition-shadow duration-300">
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
                              <h4 className="font-medium text-cream-text-dark text-sm mb-1">{item.name}</h4>
                              <div className="flex justify-between items-center">
                                <span className="text-cream-text-light text-xs">{item.category}</span>
                                {item.color && <span className="text-cream-text-light text-xs">颜色: {item.color}</span>}
                              </div>
                              {item.season && (
                                <div className="mt-1">
                                  <span className="inline-block px-2 py-1 text-xs bg-cream-accent text-white rounded">
                                    {item.season}
                                  </span>
                                </div>
                              )}
                              {item.tags && item.tags.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {item.tags.slice(0, 2).map((tag: string, index: number) => (
                                    <span key={index} className="text-xs text-cream-accent bg-cream-accent bg-opacity-20 px-1 rounded">
                                      #{tag}
                                    </span>
                                  ))}
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
                    
                    <div className="mt-6 flex flex-wrap gap-3 justify-end">
                      <button 
                        onClick={() => setActiveTab('wardrobe')}
                        className="px-4 py-2 border border-cream-border text-cream-text-dark rounded-lg hover:bg-cream-bg transition duration-300"
                      >
                        查看衣柜
                      </button>
                      <button 
                        onClick={saveCurrentRecommendationAsPreview}
                        className="px-4 py-2 border border-cream-border text-cream-text-dark rounded-lg hover:bg-cream-bg transition duration-300"
                        disabled={recommendation.items.length === 0}
                      >
                        保存为预览
                      </button>
                      <button 
                        onClick={handleSaveOutfit}
                        className="bg-cream-accent hover:bg-cream-accent-hover text-white px-4 py-2 rounded-lg transition duration-300"
                        disabled={recommendation.items.length === 0}
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

          {/* 我の衣柜标签页 */}
          {activeTab === 'wardrobe' && (
            <div>
              {/* 统計情報カード */}
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
                      <div key={category} className="flex justify-between cursor-pointer hover:bg-cream-bg p-2 rounded" onClick={() => filterWardrobeByCategory(category)}>
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
                  <div>
                    <h2 className="text-xl font-semibold text-cream-text-dark">我的衣柜</h2>
                    {filteredCategory && (
                      <p className="text-cream-text-light text-sm mt-1">
                        当前筛选: {filteredCategory} 
                        <button 
                          onClick={() => setFilteredCategory(null)}
                          className="text-cream-accent hover:text-cream-accent-hover ml-2"
                        >
                          清除筛选
                        </button>
                      </p>
                    )}
                  </div>
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
                    {(filteredCategory ? wardrobeItems.filter(item => item.category === filteredCategory) : wardrobeItems).map((item) => (
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
                          <button
                            onClick={() => createPreviewFromHistory(historyItem)}
                            className="text-cream-accent hover:text-cream-accent-hover text-sm"
                          >
                            创建预览
                          </button>
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

          {/* 搭配预览标签页 */}
          {activeTab === 'preview' && (
            <div>
              <div className="bg-cream-card rounded-2xl shadow-sm p-6 border border-cream-border">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-cream-text-dark">搭配预览</h2>
                  <button 
                    onClick={createNewPreviewFromWardrobe}
                    className="bg-cream-accent hover:bg-cream-accent-hover text-white px-4 py-2 rounded-lg transition duration-300"
                  >
                    从衣柜创建
                  </button>
                </div>
                
                {loadingPreviews ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cream-accent mb-2"></div>
                      <p className="text-cream-text-dark">正在加载搭配预览...</p>
                    </div>
                  </div>
                ) : outfitPreviews.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {outfitPreviews.map((preview) => (
                      <div key={preview.id} className="bg-cream-bg rounded-lg p-4 border border-cream-border">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-medium text-cream-text-dark">{preview.name}</h3>
                          <button
                            onClick={() => {
                              setSelectedPreview(preview);
                              setShowPreviewModal(true);
                            }}
                            className="text-cream-accent hover:text-cream-accent-hover text-sm"
                          >
                            查看详情
                          </button>
                        </div>
                        
                        {preview.items.length > 0 ? (
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            {preview.items.slice(0, 4).map((item) => (
                              <div key={item.id} className="bg-cream-card rounded p-2 border border-cream-border">
                                {item.image_url ? (
                                  <img 
                                    src={item.image_url} 
                                    alt={item.name} 
                                    className="w-full h-16 object-cover rounded mb-1"
                                  />
                                ) : (
                                  <div className="bg-cream-border w-full h-16 rounded mb-1 flex items-center justify-center">
                                    <span className="text-cream-text-light text-xs">无图片</span>
                                  </div>
                                )}
                                <p className="text-cream-text-dark text-xs font-medium truncate">{item.name}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 bg-cream-bg rounded mb-3">
                            <p className="text-cream-text-light text-sm">暂无物品</p>
                          </div>
                        )}
                        
                        <p className="text-cream-text-light text-xs">
                          {new Date(preview.created_at).toLocaleDateString('zh-CN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                        
                        <div className="flex justify-end mt-3 space-x-2">
                          <button
                            onClick={() => {
                              setSelectedPreview(preview);
                              setShowWardrobeSelector(true);
                            }}
                            className="text-cream-text-light hover:text-cream-accent text-xs"
                          >
                            添加物品
                          </button>
                          <button
                            onClick={() => deleteOutfitPreviewById(preview.id)}
                            className="text-cream-text-light hover:text-red-500 text-xs"
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-cream-text-light mb-4">暂无搭配预览</p>
                    <button 
                      onClick={() => setActiveTab('recommend')}
                      className="bg-cream-accent hover:bg-cream-accent-hover text-white px-4 py-2 rounded-lg transition duration-300 mr-3"
                    >
                      生成推荐搭配
                    </button>
                    <button 
                      onClick={createNewPreviewFromWardrobe}
                      className="bg-cream-accent hover:bg-cream-accent-hover text-white px-4 py-2 rounded-lg transition duration-300"
                    >
                      从衣柜创建
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
                      <select
                        name="season"
                        value={newItem.season}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-cream-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cream-accent"
                      >
                        <option value="">请选择季节</option>
                        <option value="春">春</option>
                        <option value="夏">夏</option>
                        <option value="秋">秋</option>
                        <option value="冬">冬</option>
                        <option value="四季">四季</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-cream-text-dark mb-1">标签</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {(['商务', '休闲', '运动', '正式', '日常', '约会', '度假', '居家'] as Tag[]).map(tag => (
                          <span 
                            key={tag}
                            className={`text-xs px-2 py-1 rounded cursor-pointer ${
                              newItem.tags.includes(tag)
                                ? 'bg-cream-accent text-white'
                                : 'bg-cream-bg border border-cream-border text-cream-text hover:bg-cream-accent hover:text-white'
                            }`}
                            onClick={() => handleTagChange(tag)}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <input
                        type="text"
                        name="tags"
                        value={newItem.tags.join(', ')}
                        onChange={(e) => {
                          const tags = e.target.value.split(',').map(tag => tag.trim() as Tag);
                          setNewItem(prev => ({
                            ...prev,
                            tags: tags.filter(tag => tag) as Tag[]
                          }));
                        }}
                        className="w-full px-3 py-2 border border-cream-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cream-accent"
                        placeholder="请输入标签，用逗号分隔"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-cream-text-dark mb-1">品牌</label>
                      <input
                        type="text"
                        name="brand"
                        value={newItem.brand}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-cream-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cream-accent"
                        placeholder="请输入品牌"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-cream-text-dark mb-1">购买日期</label>
                      <input
                        type="date"
                        name="purchase_date"
                        value={newItem.purchase_date}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-cream-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cream-accent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-cream-text-dark mb-1">图片链接</label>
                      <input
                        type="text"
                        name="image_url"
                        value={newItem.image_url}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-cream-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cream-accent"
                        placeholder="请输入图片链接"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-cream-text-dark mb-1">备注</label>
                      <textarea
                        name="notes"
                        value={newItem.notes}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-cream-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cream-accent"
                        placeholder="请输入备注"
                      ></textarea>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end space-x-3">
                    <button 
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 border border-cream-border text-cream-text-dark rounded-lg hover:bg-cream-bg transition duration-300"
                    >
                      取消
                    </button>
                    <button 
                      onClick={handleAddWardrobeItem}
                      className="px-4 py-2 bg-cream-accent text-white rounded-lg hover:bg-cream-accent-hover transition duration-300"
                    >
                      添加
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 编辑衣物模态框 */}
          {showEditModal && editingItem && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-cream-card rounded-2xl shadow-lg border border-cream-border w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-cream-text-dark">编辑衣物</h3>
                    <button 
                      onClick={() => setShowEditModal(false)}
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
                        value={editingItem.name}
                        onChange={handleEditInputChange}
                        className="w-full px-3 py-2 border border-cream-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cream-accent"
                        placeholder="请输入衣物名称"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-cream-text-dark mb-1">类别 *</label>
                      <select
                        name="category"
                        value={editingItem.category}
                        onChange={handleEditInputChange}
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
                        value={editingItem.color || ''}
                        onChange={handleEditInputChange}
                        className="w-full px-3 py-2 border border-cream-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cream-accent"
                        placeholder="请输入颜色"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-cream-text-dark mb-1">季节</label>
                      <select
                        name="season"
                        value={editingItem.season || ''}
                        onChange={handleEditInputChange}
                        className="w-full px-3 py-2 border border-cream-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cream-accent"
                      >
                        <option value="">请选择季节</option>
                        <option value="春">春</option>
                        <option value="夏">夏</option>
                        <option value="秋">秋</option>
                        <option value="冬">冬</option>
                        <option value="四季">四季</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-cream-text-dark mb-1">标签</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {(['商务', '休闲', '运动', '正式', '日常', '约会', '度假', '居家'] as Tag[]).map(tag => (
                          <span 
                            key={tag}
                            className={`text-xs px-2 py-1 rounded cursor-pointer ${
                              editingItem?.tags.includes(tag)
                                ? 'bg-cream-accent text-white'
                                : 'bg-cream-bg border border-cream-border text-cream-text hover:bg-cream-accent hover:text-white'
                            }`}
                            onClick={() => editingItem && handleTagChange(tag)}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <input
                        type="text"
                        name="tags"
                        value={editingItem?.tags.join(', ') || ''}
                        onChange={(e) => {
                          if (editingItem) {
                            const tags = e.target.value.split(',').map(tag => tag.trim() as Tag);
                            setEditingItem(prev => prev ? {
                              ...prev,
                              tags: tags.filter(tag => tag) as Tag[]
                            } : null);
                          }
                        }}
                        className="w-full px-3 py-2 border border-cream-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cream-accent"
                        placeholder="请输入标签，用逗号分隔"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-cream-text-dark mb-1">品牌</label>
                      <input
                        type="text"
                        name="brand"
                        value={editingItem.brand || ''}
                        onChange={handleEditInputChange}
                        className="w-full px-3 py-2 border border-cream-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cream-accent"
                        placeholder="请输入品牌"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-cream-text-dark mb-1">购买日期</label>
                      <input
                        type="date"
                        name="purchase_date"
                        value={editingItem.purchase_date || ''}
                        onChange={handleEditInputChange}
                        className="w-full px-3 py-2 border border-cream-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cream-accent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-cream-text-dark mb-1">图片链接</label>
                      <input
                        type="text"
                        name="image_url"
                        value={editingItem.image_url || ''}
                        onChange={handleEditInputChange}
                        className="w-full px-3 py-2 border border-cream-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cream-accent"
                        placeholder="请输入图片链接"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-cream-text-dark mb-1">备注</label>
                      <textarea
                        name="notes"
                        value={editingItem.notes || ''}
                        onChange={handleEditInputChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-cream-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cream-accent"
                        placeholder="请输入备注"
                      ></textarea>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end space-x-3">
                    <button 
                      onClick={() => setShowEditModal(false)}
                      className="px-4 py-2 border border-cream-border text-cream-text-dark rounded-lg hover:bg-cream-bg transition duration-300"
                    >
                      取消
                    </button>
                    <button 
                      onClick={handleEditWardrobeItem}
                      className="px-4 py-2 bg-cream-accent text-white rounded-lg hover:bg-cream-accent-hover transition duration-300"
                    >
                      保存
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 删除确认模态框 */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-cream-card rounded-2xl shadow-lg border border-cream-border w-full max-w-md">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-cream-text-dark">确认删除</h3>
                    <button 
                      onClick={() => setShowDeleteConfirm(false)}
                      className="text-cream-text-light hover:text-cream-text-dark"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <p className="text-cream-text-dark mb-6">确定要删除这件衣物吗？此操作无法撤销。</p>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2 border border-cream-border text-cream-text-dark rounded-lg hover:bg-cream-bg transition duration-300"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleDeleteWardrobeItem}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-300"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 穿搭预览模态框 */}
          {showPreviewModal && selectedPreview && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-cream-card rounded-2xl shadow-lg border border-cream-border w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-cream-text-dark">
                      搭配预览: {selectedPreview.name}
                    </h3>
                    <button 
                      onClick={() => setShowPreviewModal(false)}
                      className="text-cream-text-light hover:text-cream-text-dark"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-cream-text-dark mb-1">搭配名称</label>
                    <input
                      type="text"
                      value={selectedPreview.name}
                      onChange={(e) => setSelectedPreview(prev => prev ? {
                        ...prev,
                        name: e.target.value
                      } : null)}
                      className="w-full px-3 py-2 border border-cream-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cream-accent"
                    />
                  </div>
                  
                  {/* 网络推荐图展示 */}
                  {(selectedPreview as any).network_image_url && (
                    <div className="mb-6">
                      <h4 className="font-medium text-cream-text-dark mb-2">网络推荐搭配图</h4>
                      <div className="flex justify-center">
                        <img 
                          src={(selectedPreview as any).network_image_url} 
                          alt="网络推荐搭配" 
                          className="max-w-full h-auto rounded-lg shadow-md"
                          style={{ maxHeight: '300px' }}
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="mb-6">
                    <h4 className="font-medium text-cream-text-dark mb-3">搭配详情</h4>
                    {selectedPreview.items.length === 0 ? (
                      <div className="text-center py-4 bg-cream-bg rounded-lg border border-cream-border">
                        <p className="text-cream-text-light">暂无物品，请从衣柜添加</p>
                        <button
                          onClick={() => {
                            setShowPreviewModal(false);
                            setShowWardrobeSelector(true);
                          }}
                          className="mt-2 bg-cream-accent hover:bg-cream-accent-hover text-white px-3 py-1 rounded text-sm"
                        >
                          从衣柜添加
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {selectedPreview.items.map((item) => (
                          <div key={item.id} className="bg-cream-bg rounded-lg p-3 border border-cream-border relative">
                            <button
                              onClick={() => {
                                // 从搭配中移除物品
                                setSelectedPreview(prev => prev ? {
                                  ...prev,
                                  items: prev.items.filter(i => i.id !== item.id)
                                } : null);
                              }}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              ×
                            </button>
                            {item.image_url ? (
                              <img 
                                src={item.image_url} 
                                alt={item.name} 
                                className="w-full h-24 object-cover rounded mb-2"
                              />
                            ) : (
                              <div className="bg-cream-border w-full h-24 rounded mb-2 flex items-center justify-center">
                                <span className="text-cream-text-light text-xs">暂无图片</span>
                              </div>
                            )}
                            <h4 className="font-medium text-cream-text-dark text-sm truncate">{item.name}</h4>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-cream-text-light text-xs">{item.category}</span>
                              {item.color && <span className="text-cream-text-light text-xs">{item.color}</span>}
                            </div>
                            {item.season && (
                              <div className="mt-1">
                                <span className="inline-block px-2 py-1 text-xs bg-cream-accent text-white rounded">
                                  {item.season}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {selectedPreview.items.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-medium text-cream-text-dark mb-2">搭配说明</h4>
                      <div className="bg-cream-bg rounded-lg p-4 border border-cream-border">
                        <p className="text-cream-text">
                          这套搭配包含 {selectedPreview.items.length} 件单品，适合多种场合穿着。
                          {selectedPreview.items.some(item => item.category === '外套') && ' 外套可根据天气变化灵活搭配。'}
                          {selectedPreview.items.some(item => item.category === '配饰') && ' 配饰为整体造型增添亮点。'}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowPreviewModal(false)}
                      className="px-4 py-2 border border-cream-border text-cream-text-dark rounded-lg hover:bg-cream-bg transition duration-300"
                    >
                      关闭
                    </button>
                    <button
                      onClick={() => {
                        setShowPreviewModal(false);
                        setShowWardrobeSelector(true);
                      }}
                      className="px-4 py-2 border border-cream-border text-cream-text-dark rounded-lg hover:bg-cream-bg transition duration-300"
                    >
                      继续添加
                    </button>
                    {selectedPreview.items.length > 0 && (
                      <button
                        onClick={handleSaveOutfitPreview}
                        className="px-4 py-2 bg-cream-accent text-white rounded-lg hover:bg-cream-accent-hover transition duration-300"
                      >
                        保存搭配
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 衣柜选择器模态框 */}
          {showWardrobeSelector && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-cream-card rounded-2xl shadow-lg border border-cream-border w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-cream-text-dark">从衣柜选择物品</h3>
                    <button 
                      onClick={() => {
                        // 清除临时预览
                        setSelectedPreview(null);
                        setShowWardrobeSelector(false);
                      }}
                      className="text-cream-text-light hover:text-cream-text-dark"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* 如果没有选中任何预览，则创建一个新的 */}
                  {!selectedPreview && (
                    <div className="mb-4 p-3 bg-cream-bg rounded-lg border border-cream-border">
                      <p className="text-cream-text-dark mb-2">您需要先创建一个搭配预览或选择一个现有的预览</p>
                      <button
                        onClick={createNewPreviewFromWardrobe}
                        className="bg-cream-accent hover:bg-cream-accent-hover text-white px-3 py-1 rounded text-sm"
                      >
                        创建新的搭配预览
                      </button>
                    </div>
                  )}
                  
                  {selectedPreview && (
                    <div className="mb-4 p-3 bg-cream-bg rounded-lg border border-cream-border">
                      <h4 className="font-medium text-cream-text-dark mb-2">当前搭配: {selectedPreview.name}</h4>
                      <p className="text-cream-text text-sm">已选择 {selectedPreview.items.length} 件物品</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                    {wardrobeItems.map((item) => (
                      <div 
                        key={item.id} 
                        className={`bg-cream-bg rounded-lg p-3 border cursor-pointer transition duration-300 relative ${
                          selectedPreview && selectedPreview.items.some(i => i.id === item.id) 
                            ? 'border-cream-accent bg-cream-accent bg-opacity-10' 
                            : 'border-cream-border hover:border-cream-accent'
                        }`}
                        onClick={() => {
                          if (selectedPreview) {
                            handleWardrobeItemSelect(item);
                          } else {
                            // 如果没有选中的预览，创建一个新的
                            createNewPreviewFromWardrobe();
                          }
                        }}
                      >
                        {selectedPreview && selectedPreview.items.some(i => i.id === item.id) && (
                          <div className="absolute top-1 right-1 w-6 h-6 bg-cream-accent rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                        
                        {item.image_url ? (
                          <img 
                            src={item.image_url} 
                            alt={item.name} 
                            className="w-full h-24 object-cover rounded mb-2"
                          />
                        ) : (
                          <div className="bg-cream-border w-full h-24 rounded mb-2 flex items-center justify-center">
                            <span className="text-cream-text-light text-xs">暂无图片</span>
                          </div>
                        )}
                        <h4 className="font-medium text-cream-text-dark text-sm truncate">{item.name}</h4>
                        <p className="text-cream-text-light text-xs">{item.category}</p>
                        {item.color && <p className="text-cream-text-light text-xs">颜色: {item.color}</p>}
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        // 清除临时预览
                        setSelectedPreview(null);
                        setShowWardrobeSelector(false);
                      }}
                      className="px-4 py-2 border border-cream-border text-cream-text-dark rounded-lg hover:bg-cream-bg transition duration-300"
                    >
                      取消
                    </button>
                    {selectedPreview && selectedPreview.items.length > 0 && (
                      <>
                        <button
                          onClick={() => {
                            if (selectedPreview && selectedPreview.items.length > 0) {
                              setShowWardrobeSelector(false);
                              setShowPreviewModal(true);
                            }
                          }}
                          className="px-4 py-2 border border-cream-border text-cream-text-dark rounded-lg hover:bg-cream-bg transition duration-300"
                        >
                          查看搭配
                        </button>
                        <button
                          onClick={saveOutfitFromWardrobeSelector}
                          className="px-4 py-2 bg-cream-accent text-white rounded-lg hover:bg-cream-accent-hover transition duration-300"
                        >
                          保存搭配
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}