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
      // 获取日本千叶の天气データ
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
        // 日本千葉の经纬度大约为: 緯度35.6073, 经度140.1065
        const weatherByCoords = await getWeatherByCoordinates(35.6073, 140.1065);
        if (weatherByCoords) {
          console.log('通过经纬度成功获取千葉天气データ:', weatherByCoords);
          setWeatherData(weatherByCoords);
          
          // 获取完整的天气预报数据
          try {
            const fullWeather = await getOneCallWeather(35.6073, 140.1065);
            if (fullWeather) {
              console.log('成功获取千葉完整天气データ:', fullWeather);
              setFullWeatherData(fullWeather);
            }
          } catch (error) {
            console.error('获取千葉完整天气データ失败:', error);
          }
        } else {
          console.warn('无法通过经纬度获取千葉天气データ，使用模拟データ');
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
            description: '晴',
            latitude: 35.6073,
            longitude: 140.1065
          };
          setWeatherData(mockWeather);
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
    }
  }, [])

  // 生成穿搭推荐
  const generateOutfitRecommendation = useCallback(async () => {
    if (!weatherData || wardrobeItems.length === 0) return

    setLoadingRecommendation(true)
    try {
      // 根据千葉の气候特点和天气データ推荐合适的衣物
      let recommendedItems: WardrobeItem[] = []
      
      // 根据温度推荐（考虑の季节特点）
      if (weatherData.temperature > 28) {
        // 夏季炎热潮湿：推荐轻薄透气の衣物
        recommendedItems = wardrobeItems.filter(item => 
          item.category === '上衣' && (item.season === '夏' || item.season === '四季') && 
          (item.notes?.includes('轻薄') || item.notes?.includes('透气') || item.notes?.includes('棉質'))
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
          (item.notes?.includes('薄外套') || item.notes?.includes('開衫') || item.notes?.includes('風衣'))
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
          (item.notes?.includes('厚外套') || item.notes?.includes('羽絨服') || item.notes?.includes('大衣'))
        ).slice(0, 1)
        
        const inner = wardrobeItems.filter(item => 
          item.category === '上衣' && (item.season === '冬' || item.season === '四季') &&
          (item.notes?.includes('毛衣') || item.notes?.includes('保暖') || item.notes?.includes('厚'))
        ).slice(0, 1)
        
        const pants = wardrobeItems.filter(item => 
          item.category === '裤子' && (item.season === '冬' || item.season === '四季') &&
          (item.notes?.includes('厚') || item.notes?.includes('保暖') || item.notes?.includes('加絨'))
        ).slice(0, 1)
        
        recommendedItems = [...outer, ...inner, ...pants]
      }
      
      // 根据天气狀況添加配飾
      if (weatherData.condition.includes('雨') || weatherData.condition.includes('Rain')) {
        // 下雨天推荐雨具
        const rainItems = wardrobeItems.filter(item => 
          item.category === '配飾' && 
          (item.notes?.includes('雨傘') || item.notes?.includes('雨衣') || item.notes?.includes('防水'))
        ).slice(0, 2)
        
        recommendedItems = [...recommendedItems, ...rainItems]
      } else if (weatherData.humidity > 70) {
        // 高湿度天气推荐透气配飾
        const accessories = wardrobeItems.filter(item => 
          item.category === '配飾' && 
          (item.notes?.includes('透气') || item.notes?.includes('吸汗') || item.notes?.includes('棉質'))
        ).slice(0, 2)
        
        recommendedItems = [...recommendedItems, ...accessories]
      } else {
        // 普通天气推荐一般配飾
        const accessories = wardrobeItems.filter(item => 
          item.category === '配飾'
        ).slice(0, 2)
        
        recommendedItems = [...recommendedItems, ...accessories]
      }
      
      // 生成推荐说明（针对千葉气候特点）
      let weatherDescription = '';
      if (weatherData.temperature > 28) {
        weatherDescription = '炎热潮湿の夏日';
      } else if (weatherData.temperature > 20) {
        weatherDescription = '温暖舒适的春/秋季';
      } else if (weatherData.temperature > 10) {
        weatherDescription = '凉爽の早春/晚秋';
      } else {
        weatherDescription = '寒冷の冬季';
      }
      
      // 添加湿度情報
      let humidityDescription = '';
      if (weatherData.humidity > 80) {
        humidityDescription = '，湿度が高い、透气性の良い衣装をおすすめします';
      } else if (weatherData.humidity > 60) {
        humidityDescription = '，湿度が適中です';
      } else {
        humidityDescription = '，湿度が低いです';
      }
      
      const notes = `千葉の${weatherDescription}${humidityDescription}、現在の気温は${weatherData.temperature}°Cです。この天気に対応した衣装をおすすめします。`;
      
      setRecommendation({
        items: recommendedItems,
        notes
      })
    } catch (error) {
      console.error('生成穿搭推薦失敗:', error)
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

  // 衣装統計情報計算
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
    
    // 轉換为数组并排序
    const tagArray = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // 只取前5个标签
    
    return tagArray;
  };

  // 打開編集モーダル
  const openEditModal = (item: WardrobeItem) => {
    // 为现有物品添加标签属性
    const itemWithTags = {
      ...item,
      tags: (item.notes?.split(',').map(tag => tag.trim()) || []) as Tag[]
    };
    setEditingItem(itemWithTags as WardrobeItem & { tags: Tag[] });
    setShowEditModal(true);
  }

  // 打開削除確認
  const openDeleteConfirm = (itemId: string) => {
    setItemToDelete(itemId)
    setShowDeleteConfirm(true)
  }

  // 処理フォーム入力変化（追加）
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setNewItem(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // 処理フォーム入力変化（編集）
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (editingItem) {
      setEditingItem(prev => prev ? {
        ...prev,
        [name]: value
      } : null)
    }
  }

  // 処理タグ変化（追加）
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

  // 処理タグ変化（編集）
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

  // 処理リダイレクトロジック
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // データ取得
  useEffect(() => {
    if (user) {
      fetchWardrobeItems()
      fetchWeatherData()
    }
  }, [user, fetchWardrobeItems, fetchWeatherData])

  // 穿搭履歴取得
  useEffect(() => {
    if (user && activeTab === 'history') {
      fetchOutfitHistory()
    }
  }, [user, activeTab, fetchOutfitHistory])

  // 当天気データと衣装アイテムが準備できたら、おすすめを生成
  useEffect(() => {
    if (weatherData && wardrobeItems.length > 0 && activeTab === 'recommend') {
      generateOutfitRecommendation()
    }
  }, [weatherData, wardrobeItems, activeTab, generateOutfitRecommendation])

  // ローディング状態表示
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-bg">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cream-accent"></div>
          <p className="mt-2 text-cream-text-dark">読み込み中...</p>
        </div>
      </div>
    )
  }

  // ユーザー情報がない場合はページコンテンツをレンダリングしない
  if (!user) {
    return null
  }

  // 衣装統計情報計算
  const wardrobeStats = getWardrobeStats();
  const tagDistribution = getTagDistribution();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-cream-bg">
        {/* トップナビゲーション */}
        <header className="bg-cream-card shadow-sm border-b border-cream-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-cream-text-dark">スマート衣装アシスタント</h1>
              </div>
              <button
                onClick={() => router.push('/dashboard')}
                className="text-cream-text-light hover:text-cream-text-dark transition duration-300"
              >
                ホームに戻る
              </button>
            </div>
          </div>
        </header>

        {/* メインコンテンツエリア */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* タブナビゲーション */}
          <div className="flex border-b border-cream-border mb-8">
            <button
              className={`py-2 px-4 font-medium text-sm ${activeTab === 'recommend' ? 'text-cream-accent border-b-2 border-cream-accent' : 'text-cream-text-light hover:text-cream-text-dark'}`}
              onClick={() => setActiveTab('recommend')}
            >
              今日のおすすめ
            </button>
            <button
              className={`py-2 px-4 font-medium text-sm ${activeTab === 'wardrobe' ? 'text-cream-accent border-b-2 border-cream-accent' : 'text-cream-text-light hover:text-cream-text-dark'}`}
              onClick={() => setActiveTab('wardrobe')}
            >
              衣装クローゼット
            </button>
            <button
              className={`py-2 px-4 font-medium text-sm ${activeTab === 'history' ? 'text-cream-accent border-b-2 border-cream-accent' : 'text-cream-text-light hover:text-cream-text-dark'}`}
              onClick={() => setActiveTab('history')}
            >
              穿た衣装履歴
            </button>
          </div>

          {/* 今日のおすすめタブ */}
          {activeTab === 'recommend' && (
            <div>
              <div className="bg-cream-card rounded-2xl shadow-sm p-6 border border-cream-border mb-8">
                <h2 className="text-xl font-semibold text-cream-text-dark mb-4">今日の衣装おすすめ</h2>
                
                {weatherData && (
                  <div className="bg-cream-bg rounded-lg p-4 mb-6">
                    <h3 className="font-medium text-cream-text-dark mb-2">今日の天気</h3>
                    <div className="flex items-center">
                      <div className="text-3xl font-bold text-cream-text-dark mr-4">
                        {weatherData.temperature}°C
                      </div>
                      <div>
                        <p className="text-cream-text">天気: {weatherData.condition}</p>
                        <p className="text-cream-text-light text-sm">湿度: {weatherData.humidity}%</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* 完全な天気情報表示 */}
                {fullWeatherData && (
                  <div className="bg-cream-bg rounded-lg p-4 mb-6">
                    <h3 className="font-medium text-cream-text-dark mb-3">詳細な天気情報</h3>
                    
                    {/* 現在の天気詳細 */}
                    <div className="mb-4 p-3 bg-cream-card rounded border border-cream-border">
                      <h4 className="font-medium text-cream-text-dark mb-2">現在の天気詳細</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-cream-text">体感温度:</span>
                          <span className="text-cream-text-dark font-medium">{fullWeatherData.current.feels_like.toFixed(1)}°C</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-cream-text">気圧:</span>
                          <span className="text-cream-text-dark font-medium">{fullWeatherData.current.pressure} hPa</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-cream-text">風速:</span>
                          <span className="text-cream-text-dark font-medium">{fullWeatherData.current.wind_speed} m/s</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-cream-text">風向:</span>
                          <span className="text-cream-text-dark font-medium">{fullWeatherData.current.wind_deg}°</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-cream-text">視界:</span>
                          <span className="text-cream-text-dark font-medium">{(fullWeatherData.current.visibility / 1000).toFixed(1)} km</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-cream-text">紫外線指数:</span>
                          <span className="text-cream-text-dark font-medium">{fullWeatherData.current.uvi}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-cream-text">雲量:</span>
                          <span className="text-cream-text-dark font-medium">{fullWeatherData.current.clouds}%</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* 1週間の天気予報 */}
                    <div className="mb-4">
                      <h4 className="font-medium text-cream-text-dark mb-2">1週間の天気予報</h4>
                      <div className="space-y-2">
                        {fullWeatherData.daily.slice(0, 7).map((day, index) => {
                          const date = new Date(day.dt * 1000);
                          const weekdays = ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'];
                          const dayName = index === 0 ? '今日' : weekdays[date.getDay()];
                          
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
                                風力: {day.wind_speed.toFixed(1)} m/s
                              </div>
                              <div className="w-16 text-right text-cream-text">
                                降水: {(day.pop * 100).toFixed(0)}%
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* 24時間の予報 */}
                    <div>
                      <h4 className="font-medium text-cream-text-dark mb-2">24時間予報</h4>
                      <div className="flex overflow-x-auto pb-2 space-x-2">
                        {fullWeatherData.hourly.slice(0, 24).map((hour, index) => {
                          const date = new Date(hour.dt * 1000);
                          const time = date.getHours();
                          
                          return (
                            <div key={hour.dt} className="flex flex-col items-center p-2 bg-cream-card rounded border border-cream-border min-w-[60px]">
                              <div className="text-cream-text text-xs">
                                {index === 0 ? '現在' : `${time}時`}
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
                                風: {hour.wind_speed.toFixed(1)} m/s
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
                      <p className="text-cream-text-dark">衣装おすすめを生成しています...</p>
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
                              <span className="text-cream-text-light">画像なし</span>
                            </div>
                          )}
                          <h4 className="font-medium text-cream-text-dark text-sm">{item.name}</h4>
                          <p className="text-cream-text-light text-xs">{item.category}</p>
                          {item.color && <p className="text-cream-text-light text-xs">色: {item.color}</p>}
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-6 flex justify-end space-x-3">
                      <button 
                        onClick={() => setActiveTab('wardrobe')}
                        className="px-4 py-2 border border-cream-border text-cream-text-dark rounded-lg hover:bg-cream-bg transition duration-300"
                      >
                        衣装クローゼットを見る
                      </button>
                      <button 
                        onClick={handleSaveOutfit}
                        className="bg-cream-accent hover:bg-cream-accent-hover text-white px-4 py-2 rounded-lg transition duration-300"
                      >
                        履歴に保存
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-cream-text-light">おすすめがありません。衣装を追加してください</p>
                    <button 
                      onClick={() => setActiveTab('wardrobe')}
                      className="mt-4 bg-cream-accent hover:bg-cream-accent-hover text-white px-4 py-2 rounded-lg transition duration-300"
                    >
                      衣装を追加する
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 衣装クローゼットタブ */}
          {activeTab === 'wardrobe' && (
            <div>
              {/* 統計情報カード */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-cream-card rounded-2xl shadow-sm p-6 border border-cream-border">
                  <h3 className="text-lg font-semibold text-cream-text-dark mb-4">衣装統計</h3>
                  <div className="flex items-center">
                    <div className="bg-cream-accent text-white rounded-full w-12 h-12 flex items-center justify-center mr-4">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-cream-text-light text-sm">総衣装数</p>
                      <p className="text-2xl font-bold text-cream-text-dark">{wardrobeStats.totalItems}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-cream-card rounded-2xl shadow-sm p-6 border border-cream-border">
                  <h3 className="text-lg font-semibold text-cream-text-dark mb-4">カテゴリ分布</h3>
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
                  <h3 className="text-lg font-semibold text-cream-text-dark mb-4">タグ分布</h3>
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
                  <h2 className="text-xl font-semibold text-cream-text-dark">衣装クローゼット</h2>
                  <button 
                    className="bg-cream-accent hover:bg-cream-accent-hover text-white px-4 py-2 rounded-lg transition duration-300"
                    onClick={() => setShowAddModal(true)}
                  >
                    衣装を追加
                  </button>
                </div>
                
                {loadingWardrobe ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cream-accent mb-2"></div>
                      <p className="text-cream-text-dark">衣装アイテムを読み込み中...</p>
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
                            <span className="text-cream-text-light">画像なし</span>
                          </div>
                        )}
                        
                        <h4 className="font-medium text-cream-text-dark text-sm">{item.name}</h4>
                        <p className="text-cream-text-light text-xs">{item.category}</p>
                        {item.color && <p className="text-cream-text-light text-xs">色: {item.color}</p>}
                        {item.season && <p className="text-cream-text-light text-xs">季節: {item.season}</p>}
                        {item.brand && <p className="text-cream-text-light text-xs">ブランド: {item.brand}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-cream-text-light mb-4">衣装クローゼットは空です</p>
                    <button 
                      onClick={() => setShowAddModal(true)}
                      className="bg-cream-accent hover:bg-cream-accent-hover text-white px-4 py-2 rounded-lg transition duration-300"
                    >
                      最初の衣装を追加
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 穿た衣装履歴タブ */}
          {activeTab === 'history' && (
            <div>
              <div className="bg-cream-card rounded-2xl shadow-sm p-6 border border-cream-border">
                <h2 className="text-xl font-semibold text-cream-text-dark mb-6">穿た衣装履歴</h2>
                
                {loadingHistory ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cream-accent mb-2"></div>
                      <p className="text-cream-text-dark">衣装履歴を読み込み中...</p>
                    </div>
                  </div>
                ) : outfitHistory.length > 0 ? (
                  <div className="space-y-6">
                    {outfitHistory.map((historyItem) => (
                      <div key={historyItem.id} className="bg-cream-bg rounded-lg p-4 border border-cream-border">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-medium text-cream-text-dark">
                              {new Date(historyItem.outfit_date).toLocaleDateString('ja-JP', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </h3>
                            {historyItem.weather && (
                              <p className="text-cream-text-light text-sm">
                                天気: {JSON.parse(historyItem.weather).condition}, 
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
                    <p className="text-cream-text-light mb-4">衣装履歴の記録はありません</p>
                    <button 
                      onClick={() => setActiveTab('recommend')}
                      className="bg-cream-accent hover:bg-cream-accent-hover text-white px-4 py-2 rounded-lg transition duration-300"
                    >
                      今日のおすすめを生成
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 衣装追加モーダル */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-cream-card rounded-2xl shadow-lg border border-cream-border w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-cream-text-dark">衣装を追加</h3>
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
                        placeholder="衣装の名称を入力してください"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-cream-text-dark mb-1">カテゴリ *</label>
                      <select
                        name="category"
                        value={newItem.category}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-cream-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cream-accent"
                      >
                        <option value="">カテゴリを選択してください</option>
                        <option value="上衣">上衣</option>
                        <option value="裤子">パンツ</option>
                        <option value="外套">アウター</option>
                        <option value="鞋子">シューズ</option>
                        <option value="配飾">アクセサリー</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-cream-text-dark mb-1">色</label>
                      <input
                        type="text"
                        name="color"
                        value={newItem.color}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-cream-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cream-accent"
                        placeholder="色を入力してください"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-cream-text-dark mb-1">季節</label>
                      <select
                        name="season"
                        value={newItem.season}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-cream-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cream-accent"
                      >
                        <option value="">季節を選択してください</option>
                        <option value="春">春</option>
                        <option value="夏">夏</option>
                        <option value="秋">秋</option>
                        <option value="冬">冬</option>
                        <option value="四季">四季</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-cream-text-dark mb-1">タグ</label>
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
                        placeholder="タグを入力してください、カンマで区切る"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-cream-text-dark mb-1">ブランド</label>
                      <input
                        type="text"
                        name="brand"
                        value={newItem.brand}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-cream-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cream-accent"
                        placeholder="ブランドを入力してください"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-cream-text-dark mb-1">購入日</label>
                      <input
                        type="date"
                        name="purchase_date"
                        value={newItem.purchase_date}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-cream-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cream-accent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-cream-text-dark mb-1">画像リンク</label>
                      <input
                        type="text"
                        name="image_url"
                        value={newItem.image_url}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-cream-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cream-accent"
                        placeholder="画像リンクを入力してください"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-cream-text-dark mb-1">備考</label>
                      <textarea
                        name="notes"
                        value={newItem.notes}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-cream-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cream-accent"
                        placeholder="備考を入力してください"
                      ></textarea>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end space-x-3">
                    <button 
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 border border-cream-border text-cream-text-dark rounded-lg hover:bg-cream-bg transition duration-300"
                    >
                      キャンセル
                    </button>
                    <button 
                      onClick={handleAddWardrobeItem}
                      className="px-4 py-2 bg-cream-accent text-white rounded-lg hover:bg-cream-accent-hover transition duration-300"
                    >
                      追加
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 衣装編集モーダル */}
          {showEditModal && editingItem && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-cream-card rounded-2xl shadow-lg border border-cream-border w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-cream-text-dark">衣装を編集</h3>
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
                        placeholder="衣装の名称を入力してください"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-cream-text-dark mb-1">カテゴリ *</label>
                      <select
                        name="category"
                        value={editingItem.category}
                        onChange={handleEditInputChange}
                        className="w-full px-3 py-2 border border-cream-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cream-accent"
                      >
                        <option value="">カテゴリを選択してください</option>
                        <option value="上衣">上衣</option>
                        <option value="パンツ">パンツ</option>
                        <option value="アウター">アウター</option>
                        <option value="シューズ">シューズ</option>
                        <option value="アクセサリー">アクセサリー</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-cream-text-dark mb-1">色</label>
                      <input
                        type="text"
                        name="color"
                        value={editingItem.color || ''}
                        onChange={handleEditInputChange}
                        className="w-full px-3 py-2 border border-cream-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cream-accent"
                        placeholder="色を入力してください"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-cream-text-dark mb-1">季節</label>
                      <select
                        name="season"
                        value={editingItem.season || ''}
                        onChange={handleEditInputChange}
                        className="w-full px-3 py-2 border border-cream-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cream-accent"
                      >
                        <option value="">季節を選択してください</option>
                        <option value="春">春</option>
                        <option value="夏">夏</option>
                        <option value="秋">秋</option>
                        <option value="冬">冬</option>
                        <option value="四季">四季</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-cream-text-dark mb-1">タグ</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {(['商务', '休闲', '运动', '正式', '日常', '约会', '度假', '居家'] as Tag[]).map(tag => (
                          <span 
                            key={tag}
                            className={`text-xs px-2 py-1 rounded cursor-pointer ${
                              editingItem?.tags.includes(tag)
                                ? 'bg-cream-accent text-white'
                                : 'bg-cream-bg border border-cream-border text-cream-text hover:bg-cream-accent hover:text-white'
                            }`}
                            onClick={() => editingItem && handleEditTagChange(tag)}
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
                        placeholder="タグを入力してください、カンマで区切る"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-cream-text-dark mb-1">ブランド</label>
                      <input
                        type="text"
                        name="brand"
                        value={editingItem.brand || ''}
                        onChange={handleEditInputChange}
                        className="w-full px-3 py-2 border border-cream-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cream-accent"
                        placeholder="ブランドを入力してください"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-cream-text-dark mb-1">購入日</label>
                      <input
                        type="date"
                        name="purchase_date"
                        value={editingItem.purchase_date || ''}
                        onChange={handleEditInputChange}
                        className="w-full px-3 py-2 border border-cream-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cream-accent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-cream-text-dark mb-1">画像リンク</label>
                      <input
                        type="text"
                        name="image_url"
                        value={editingItem.image_url || ''}
                        onChange={handleEditInputChange}
                        className="w-full px-3 py-2 border border-cream-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cream-accent"
                        placeholder="画像リンクを入力してください"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-cream-text-dark mb-1">備考</label>
                      <textarea
                        name="notes"
                        value={editingItem.notes || ''}
                        onChange={handleEditInputChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-cream-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cream-accent"
                        placeholder="備考を入力してください"
                      ></textarea>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end space-x-3">
                    <button 
                      onClick={() => setShowEditModal(false)}
                      className="px-4 py-2 border border-cream-border text-cream-text-dark rounded-lg hover:bg-cream-bg transition duration-300"
                    >
                      キャンセル
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

          {/* 削除確認モーダル */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-cream-card rounded-2xl shadow-lg border border-cream-border w-full max-w-md">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-cream-text-dark">削除確認</h3>
                    <button 
                      onClick={() => setShowDeleteConfirm(false)}
                      className="text-cream-text-light hover:text-cream-text-dark"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <p className="text-cream-text-dark mb-6">この衣装を削除しますか？この操作は取り消せません。</p>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2 border border-cream-border text-cream-text-dark rounded-lg hover:bg-cream-bg transition duration-300"
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={handleDeleteWardrobeItem}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-300"
                    >
                      削除
                    </button>
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
