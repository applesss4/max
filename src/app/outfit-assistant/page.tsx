'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { addWardrobeItem, updateWardrobeItem, deleteWardrobeItem, saveOutfitHistory, getOutfitHistory } from '@/services/outfitService'
import { uploadFile } from '@/services/fileUploadService'
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
  image_urls: string[] | null
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
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [editingImageFile, setEditingImageFile] = useState<File | null>(null)
  const [editingImageFiles, setEditingImageFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)

  // 在模态框打开时阻止页面滚动
  useEffect(() => {
    if (showAddModal || showEditModal || showDeleteConfirm) {
      // 添加样式以阻止滚动
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = '15px'; // 防止页面跳动
    } else {
      // 恢复正常滚动
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    
    // 清理函数
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      setImageFiles([]);
      setEditingImageFiles([]);
    };
  }, [showAddModal, showEditModal, showDeleteConfirm]);

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
      // 获取中国北京的天气数据
      console.log('开始获取中国北京天气数据...');
      // 方法1: 使用城市名获取天气
      const weather = await getWeatherByCity('Beijing');
      
      if (weather) {
        console.log('成功获取北京天气数据:', weather);
        setWeatherData(weather);
        
        // 获取完整的天气预报数据
        try {
          // 使用北京的经纬度获取完整天气数据
          // 北京的经纬度大约为: 纬度39.9042, 经度116.4074
          const fullWeather = await getOneCallWeather(39.9042, 116.4074);
          if (fullWeather) {
            console.log('成功获取北京完整天气数据:', fullWeather);
            setFullWeatherData(fullWeather);
          }
        } catch (error) {
          console.error('获取北京完整天气数据失败:', error);
        }
      } else {
        console.warn('无法获取北京天气数据，尝试使用经纬度获取...');
        // 方法2: 如果城市名获取失败，使用经纬度获取
        // 中国北京的经纬度大约为: 纬度39.9042, 经度116.4074
        const weatherByCoords = await getWeatherByCoordinates(39.9042, 116.4074);
        if (weatherByCoords) {
          console.log('通过经纬度成功获取北京天气数据:', weatherByCoords);
          setWeatherData(weatherByCoords);
          
          // 获取完整的天气预报数据
          try {
            const fullWeather = await getOneCallWeather(39.9042, 116.4074);
            if (fullWeather) {
              console.log('成功获取北京完整天气数据:', fullWeather);
              setFullWeatherData(fullWeather);
            }
          } catch (error) {
            console.error('获取北京完整天气数据失败:', error);
          }
        } else {
          console.warn('无法通过经纬度获取北京天气数据，使用模拟数据');
          // 如果API调用失败，使用模拟数据
          const mockWeather: WeatherApiData = {
            temperature: 22,
            condition: '晴',
            humidity: 65,
            windSpeed: 3.2,
            pressure: 1013,
            visibility: 10000,
            city: '北京',
            country: 'CN',
            icon: '01d',
            description: '晴',
            latitude: 39.9042,
            longitude: 116.4074
          };
          setWeatherData(mockWeather);
        }
      }
    } catch (error) {
      console.error('获取北京天气数据失败:', error);
      // 如果API调用失败，使用模拟数据
      const mockWeather: WeatherApiData = {
        temperature: 22,
        condition: '晴',
        humidity: 65,
        windSpeed: 3.2,
        pressure: 1013,
        visibility: 10000,
        city: '北京',
        country: 'CN',
        icon: '01d',
        description: '晴',
        latitude: 39.9042,
        longitude: 116.4074
      };
      setWeatherData(mockWeather);
    }
  }, [])

  // 生成穿搭推荐
  const generateOutfitRecommendation = useCallback(async () => {
    if (!weatherData || wardrobeItems.length === 0) return

    setLoadingRecommendation(true)
    try {
      // 根据北京的气候特点和天气数据推荐合适的衣物
      let recommendedItems: WardrobeItem[] = []
      
      // 根据温度推荐（考虑中国的季节特点）
      if (weatherData.temperature > 28) {
        // 夏季炎热潮湿：推荐轻薄透气的衣物
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
        // 春秋季温和：推荐舒适适中的衣物
        recommendedItems = wardrobeItems.filter(item => 
          item.category === '上衣' && (item.season === '春' || item.season === '秋' || item.season === '四季')
        ).slice(0, 1)
        
        const pants = wardrobeItems.filter(item => 
          item.category === '裤子' && (item.season === '春' || item.season === '秋' || item.season === '四季')
        ).slice(0, 1)
        
        recommendedItems = [...recommendedItems, ...pants]
      } else if (weatherData.temperature > 10) {
        // 早春晚秋凉爽：推荐稍厚一些的衣物
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
      
      // 根据天气状况添加配饰
      if (weatherData.condition.includes('雨') || weatherData.condition.includes('Rain')) {
        // 下雨天推荐雨具
        const rainItems = wardrobeItems.filter(item => 
          item.category === '配飾' && 
          (item.notes?.includes('雨傘') || item.notes?.includes('雨衣') || item.notes?.includes('防水'))
        ).slice(0, 2)
        
        recommendedItems = [...recommendedItems, ...rainItems]
      } else if (weatherData.humidity > 70) {
        // 高湿度天气推荐透气配饰
        const accessories = wardrobeItems.filter(item => 
          item.category === '配飾' && 
          (item.notes?.includes('透气') || item.notes?.includes('吸汗') || item.notes?.includes('棉質'))
        ).slice(0, 2)
        
        recommendedItems = [...recommendedItems, ...accessories]
      } else {
        // 普通天气推荐一般配饰
        const accessories = wardrobeItems.filter(item => 
          item.category === '配飾'
        ).slice(0, 2)
        
        recommendedItems = [...recommendedItems, ...accessories]
      }
      
      // 生成推荐说明（针对北京气候特点）
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
      
      const notes = `根据北京${weatherDescription}${humidityDescription}，当前气温${weatherData.temperature}°C，为您推荐这套适合的穿搭。`;
      
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

  // 衣物添加
  const handleAddWardrobeItem = async () => {
    if (!user || !newItem.name || !newItem.category) return

    try {
      console.log('开始添加衣物，用户ID:', user.id);
      let imageUrl = newItem.image_url
      let imageUrls: string[] = []
      
      // 如果有选择文件，先上传文件
      if (imageFile) {
        console.log('需要文件:', imageFile.name);
        setIsUploading(true)
        const { publicUrl, error } = await uploadFile(imageFile)
        setIsUploading(false)
        
        if (error) {
          console.error('文件上传失败:', error);
          throw new Error('文件上传失败: ' + error.message)
        }
        
        imageUrl = publicUrl || ''
        console.log('文件上传成功，URL:', imageUrl);
      }
      
      // 上传多张图片
      if (imageFiles.length > 0) {
        setIsUploading(true)
        const uploadPromises = imageFiles.map(file => uploadFile(file))
        const results = await Promise.all(uploadPromises)
        setIsUploading(false)
        
        // 检查是否有上传失败
        const errors = results.filter(result => result.error)
        if (errors.length > 0) {
          throw new Error('部分文件上传失败: ' + errors.map(e => e.error?.message).join(', '))
        }
        
        // 获取所有上传成功的URL
        imageUrls = results.map(result => result.publicUrl || '').filter(url => url)
        console.log('多文件上传成功，URLs:', imageUrls);
      }

      const itemToAdd = {
        ...newItem,
        image_url: imageUrl, // 使用上传后的URL或用户输入的URL
        image_urls: imageUrls.length > 0 ? imageUrls : null, // 存储多张图片URL
        user_id: user.id,
        notes: newItem.tags.join(', ') // 将标签保存到notes字段
      }

      console.log('添加衣物数据:', itemToAdd);
      // @ts-ignore
      const { data, error } = await addWardrobeItem(itemToAdd)

      if (error) {
        console.error('衣物添加失败:', error);
        throw error;
      }
      if (data) {
        console.log('衣物追加成功:', data);
        // 更新本地状态
        setWardrobeItems(prev => [data, ...prev])
        setShowAddModal(false)
        // 重置表单
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
        setImageFile(null) // 重置文件选择
        setImageFiles([]) // 重置多文件选择
      }
    } catch (error) {
      console.error('添加衣物失败:', error)
      alert('添加衣物失败，请重试')
    }
  }

  // 衣物编辑
  const handleEditWardrobeItem = async () => {
    if (!editingItem || !editingItem.name || !editingItem.category) return

    try {
      let imageUrl = editingItem.image_url
      let imageUrls = editingItem.image_urls || []
      
      // 如果选择了新文件，先上传文件
      if (editingImageFile) {
        setIsUploading(true)
        const { publicUrl, error } = await uploadFile(editingImageFile)
        setIsUploading(false)
        
        if (error) {
          throw new Error('文件上传失败: ' + error.message)
        }
        
        imageUrl = publicUrl || ''
      }
      
      // 上传多张新图片
      if (editingImageFiles.length > 0) {
        setIsUploading(true)
        const uploadPromises = editingImageFiles.map(file => uploadFile(file))
        const results = await Promise.all(uploadPromises)
        setIsUploading(false)
        
        // 检查是否有上传失败
        const errors = results.filter(result => result.error)
        if (errors.length > 0) {
          throw new Error('部分文件上传失败: ' + errors.map(e => e.error?.message).join(', '))
        }
        
        // 获取所有上传成功的URL
        const newImageUrls = results.map(result => result.publicUrl || '').filter(url => url)
        imageUrls = [...imageUrls, ...newImageUrls]
        console.log('新增多文件上传成功，URLs:', newImageUrls);
      }

      const itemToUpdate = {
        ...editingItem,
        image_url: imageUrl, // 使用上传后的URL或现有URL
        image_urls: imageUrls.length > 0 ? imageUrls : null, // 更新多张图片URL
        notes: editingItem.tags.join(', ') // 将标签保存到notes字段
      }

      // @ts-ignore
      const { data, error } = await updateWardrobeItem(editingItem.id, itemToUpdate)

      if (error) throw error
      if (data) {
        // 更新本地状态
        // @ts-ignore
        setWardrobeItems(prev => 
          // @ts-ignore
          prev.map(item => item.id === data.id ? data : item)
        )
        setShowEditModal(false)
        setEditingItem(null)
        setEditingImageFile(null) // 重置文件选择
        setEditingImageFiles([]) // 重置多文件选择
      }
    } catch (error) {
      console.error('编辑衣物失败:', error)
      alert('编辑衣物失败，请重试')
    }
  }

  // 衣物删除
  const handleDeleteWardrobeItem = async () => {
    if (!itemToDelete) return

    try {
      // @ts-ignore
      const { error } = await deleteWardrobeItem(itemToDelete)

      if (error) throw error
      
      // 更新本地状态
      setWardrobeItems(prev => 
        prev.filter(item => item.id !== itemToDelete)
      )
      setShowDeleteConfirm(false)
      setItemToDelete(null)
    } catch (error) {
      console.error('删除衣物失败:', error)
      alert('删除衣物失败，请重试')
    }
  }

  // 穿搭履历保存
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
        alert('穿搭已保存到历史记录')
      }
    } catch (error) {
      console.error('保存穿搭历史失败:', error)
      alert('保存穿搭历史失败，请重试')
    }
  }

  // 衣物统计信息计算
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
      // 假设每个item都有tags属性，这里根据实际数据结构进行调整
      const tags = item.notes?.split(',') || []; // 临时将标签保存在notes字段中
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
      .slice(0, 5); // 只获取前5个标签
    
    return tagArray;
  };

  // 编辑模态框打开
  const openEditModal = (item: WardrobeItem) => {
    // 为现有项目添加tags属性
    const itemWithTags = {
      ...item,
      tags: (item.notes?.split(',').map(tag => tag.trim()) || []) as Tag[]
    };
    setEditingItem(itemWithTags as WardrobeItem & { tags: Tag[] });
    setShowEditModal(true);
  }

  // 删除确认打开
  const openDeleteConfirm = (itemId: string) => {
    setItemToDelete(itemId)
    setShowDeleteConfirm(true)
  }

  // 表单输入变更处理（添加）
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setNewItem(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // 文件选择处理
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0])
    }
  }
  
  // 多文件选择处理
  const handleMultipleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      setImageFiles(files)
    }
  }

  // 编辑时的文件选择处理
  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setEditingImageFile(e.target.files[0])
    }
  }
  
  // 编辑时的多文件选择处理
  const handleEditMultipleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      setEditingImageFiles(files)
    }
  }

  // 表单输入变更处理（编辑）
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (editingItem) {
      setEditingItem(prev => prev ? {
        ...prev,
        [name]: value
      } : null)
    }
  }

  // 标签变更处理（添加）
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

  // 标签变更处理（编辑）
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

  // 重定向逻辑处理
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // 数据获取
  useEffect(() => {
    if (user) {
      fetchWardrobeItems()
      fetchWeatherData()
    }
  }, [user, fetchWardrobeItems, fetchWeatherData])

  // 处理编辑请求（来自详情页或其他地方）
  useEffect(() => {
    const editItemId = new URLSearchParams(window.location.search).get('edit');
    if (editItemId) {
      // 如果衣柜物品已经加载，直接查找并打开编辑模态框
      if (!loadingWardrobe && wardrobeItems.length > 0) {
        const itemToEdit = wardrobeItems.find(item => item.id === editItemId);
        if (itemToEdit) {
          openEditModal(itemToEdit);
        }
        // 清除URL参数
        router.replace('/outfit-assistant');
      }
      // 如果还在加载中，等待加载完成后再处理
      else if (loadingWardrobe) {
        // 将在另一个useEffect中处理
      }
      // 如果没有物品，重新获取
      else if (wardrobeItems.length === 0 && user) {
        fetchWardrobeItems();
      }
      // 如果物品已加载但未找到，可能需要重新获取
      else if (!loadingWardrobe && wardrobeItems.length > 0 && !wardrobeItems.find(item => item.id === editItemId)) {
        fetchWardrobeItems();
      }
    }
  }, [wardrobeItems, router, loadingWardrobe, user, fetchWardrobeItems]);

  // 穿搭履历获取
  useEffect(() => {
    if (user && activeTab === 'history') {
      fetchOutfitHistory()
    }
  }, [user, activeTab, fetchOutfitHistory])

  // 当天气数据和衣柜物品都准备好时生成推荐
  useEffect(() => {
    if (weatherData && wardrobeItems.length > 0) {
      generateOutfitRecommendation()
    }
  }, [weatherData, wardrobeItems, generateOutfitRecommendation])

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-cream-bg">
        {/* 顶部导航 */}
        <header className="bg-cream-card shadow-sm border-b border-cream-border sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <h1 className="text-xl font-semibold text-cream-text-dark">智能穿搭助手</h1>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-cream-accent hover:bg-cream-accent-hover text-white px-4 py-2 rounded-lg transition duration-300 flex items-center"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                添加衣物
              </button>
            </div>
          </div>
        </header>

        {/* 主要内容区域 */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 标签导航 */}
          <div className="flex border-b border-cream-border mb-8">
            <button
              className={`py-2 px-4 font-medium text-sm ${activeTab === 'recommend' ? 'border-b-2 border-cream-accent text-cream-accent' : 'text-cream-text-light hover:text-cream-text-dark'}`}
              onClick={() => setActiveTab('recommend')}
            >
              穿搭推荐
            </button>
            <button
              className={`py-2 px-4 font-medium text-sm ${activeTab === 'wardrobe' ? 'border-b-2 border-cream-accent text-cream-accent' : 'text-cream-text-light hover:text-cream-text-dark'}`}
              onClick={() => setActiveTab('wardrobe')}
            >
              衣物管理
            </button>
            <button
              className={`py-2 px-4 font-medium text-sm ${activeTab === 'history' ? 'border-b-2 border-cream-accent text-cream-accent' : 'text-cream-text-light hover:text-cream-text-dark'}`}
              onClick={() => setActiveTab('history')}
            >
              历史记录
            </button>
          </div>

          {/* 标签内容 */}
          {activeTab === 'recommend' && (
            <div>
              {/* 天气信息和推荐 */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 天气信息 */}
                <div className="lg:col-span-1">
                  <div className="bg-cream-card rounded-2xl shadow-sm p-6 border border-cream-border">
                    <h2 className="text-lg font-semibold text-cream-text-dark mb-4">北京天气</h2>
                    {weatherData ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="text-4xl font-bold text-cream-text-dark">{Math.round(weatherData.temperature)}°C</div>
                            <div className="ml-4">
                              <div className="text-cream-text-dark">{weatherData.condition}</div>
                              <div className="text-cream-text-light text-sm">{weatherData.description}</div>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center">
                            <svg className="w-5 h-5 text-cream-text-light mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4 4 0 003 15z" />
                            </svg>
                            <span className="text-cream-text">湿度: {weatherData.humidity}%</span>
                          </div>
                          <div className="flex items-center">
                            <svg className="w-5 h-5 text-cream-text-light mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <span className="text-cream-text">风速: {weatherData.windSpeed} m/s</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-center items-center py-8">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-cream-accent"></div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 穿搭推荐 */}
                <div className="lg:col-span-2">
                  <div className="bg-cream-card rounded-2xl shadow-sm p-6 border border-cream-border">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold text-cream-text-dark">今日推荐</h2>
                      <button
                        onClick={generateOutfitRecommendation}
                        disabled={loadingRecommendation}
                        className="bg-cream-accent hover:bg-cream-accent-hover disabled:opacity-50 text-white px-4 py-2 rounded-lg transition duration-300 flex items-center text-sm"
                      >
                        {loadingRecommendation ? (
                          <>
                            <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                            生成中...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            重新生成
                          </>
                        )}
                      </button>
                    </div>
                    
                    {loadingRecommendation ? (
                      <div className="flex justify-center items-center py-12">
                        <div className="text-center">
                          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cream-accent mb-2"></div>
                          <p className="text-cream-text-dark">正在为您生成穿搭推荐...</p>
                        </div>
                      </div>
                    ) : recommendation ? (
                      <div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          {recommendation.items.map((item, index) => (
                            <div key={index} className="flex items-center bg-cream-bg rounded-lg p-4 border border-cream-border">
                              {item.image_url ? (
                                <img src={item.image_url} alt={item.name} className="w-16 h-16 object-cover rounded-lg mr-4" />
                              ) : (
                                <div className="w-16 h-16 bg-cream-border rounded-lg mr-4 flex items-center justify-center">
                                  <svg className="w-8 h-8 text-cream-text-light" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              )}
                              <div>
                                <h3 className="font-medium text-cream-text-dark">{item.name}</h3>
                                <p className="text-cream-text text-sm">{item.category} {item.color ? `| ${item.color}` : ''}</p>
                                {item.season && <p className="text-cream-text-light text-xs">{item.season}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="bg-cream-bg rounded-lg p-4 border border-cream-border">
                          <p className="text-cream-text">{recommendation.notes}</p>
                        </div>
                        <div className="mt-6 flex justify-end">
                          <button
                            onClick={handleSaveOutfit}
                            className="bg-cream-accent hover:bg-cream-accent-hover text-white px-4 py-2 rounded-lg transition duration-300 flex items-center"
                          >
                            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                            保存到历史
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="text-cream-text-light mb-4">
                          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <p className="text-cream-text-dark mb-4">暂无推荐</p>
                        <button
                          onClick={generateOutfitRecommendation}
                          className="bg-cream-accent hover:bg-cream-accent-hover text-white px-4 py-2 rounded-lg transition duration-300"
                        >
                          生成穿搭推荐
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'wardrobe' && (
            <div>
              {/* 衣物统计 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-cream-card rounded-2xl shadow-sm p-6 border border-cream-border">
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-100 rounded-lg mr-4">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-cream-text-light text-sm">总衣物数</p>
                      <p className="text-2xl font-bold text-cream-text-dark">{getWardrobeStats().totalItems}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-cream-card rounded-2xl shadow-sm p-6 border border-cream-border">
                  <div className="flex items-center">
                    <div className="p-3 bg-green-100 rounded-lg mr-4">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-cream-text-light text-sm">分类数</p>
                      <p className="text-2xl font-bold text-cream-text-dark">{Object.keys(getWardrobeStats().categoryCounts).length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-cream-card rounded-2xl shadow-sm p-6 border border-cream-border">
                  <div className="flex items-center">
                    <div className="p-3 bg-purple-100 rounded-lg mr-4">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-cream-text-light text-sm">最近更新</p>
                      <p className="text-2xl font-bold text-cream-text-dark">
                        {wardrobeItems.length > 0 
                          ? new Date(wardrobeItems[0].updated_at).toLocaleDateString('zh-CN') 
                          : '无'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 衣物列表 */}
              <div className="bg-cream-card rounded-2xl shadow-sm p-6 border border-cream-border">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold text-cream-text-dark">我的衣物</h2>
                  <div className="flex space-x-2">
                    <select 
                      className="border border-cream-border rounded-lg px-3 py-2 text-cream-text-dark bg-white"
                      value={''}
                      onChange={(e) => {}}
                    >
                      <option value="">所有分类</option>
                      {Array.from(new Set(wardrobeItems.map(item => item.category))).map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                    <select 
                      className="border border-cream-border rounded-lg px-3 py-2 text-cream-text-dark bg-white"
                      value={''}
                      onChange={(e) => {}}
                    >
                      <option value="">所有季节</option>
                      {Array.from(new Set(wardrobeItems.map(item => item.season))).filter(season => season).map(season => (
                        <option key={season} value={season}>{season}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {loadingWardrobe ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cream-accent"></div>
                  </div>
                ) : wardrobeItems.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {wardrobeItems.map(item => (
                      <div key={item.id} className="border border-cream-border rounded-xl overflow-hidden bg-white hover:shadow-md transition duration-300">
                        <div className="relative">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="w-full h-48 object-cover" />
                          ) : (
                            <div className="w-full h-48 bg-cream-bg flex items-center justify-center">
                              <svg className="w-12 h-12 text-cream-text-light" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                          <div className="absolute top-2 right-2 flex space-x-1">
                            <button 
                              onClick={() => openEditModal(item)}
                              className="bg-white bg-opacity-80 hover:bg-opacity-100 text-cream-text-dark p-1 rounded-full transition duration-300"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button 
                              onClick={() => openDeleteConfirm(item.id)}
                              className="bg-white bg-opacity-80 hover:bg-opacity-100 text-red-500 p-1 rounded-full transition duration-300"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.85L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-medium text-cream-text-dark truncate">{item.name}</h3>
                          <div className="flex flex-wrap items-center gap-1 mt-2">
                            <span className="bg-cream-accent text-white text-xs px-2 py-1 rounded">
                              {item.category}
                            </span>
                            {item.season && (
                              <span className="bg-cream-bg border border-cream-border text-cream-text text-xs px-2 py-1 rounded">
                                {item.season}
                              </span>
                            )}
                            {item.color && (
                              <span className="bg-cream-bg border border-cream-border text-cream-text text-xs px-2 py-1 rounded">
                                {item.color}
                              </span>
                            )}
                          </div>
                          <div className="mt-3 flex justify-between items-center">
                            <span className="text-cream-text-light text-sm">
                              {new Date(item.created_at).toLocaleDateString('zh-CN')}
                            </span>
                            <button 
                              onClick={() => router.push(`/outfit-assistant/detail?id=${item.id}`)}
                              className="text-cream-accent hover:text-cream-accent-hover text-sm font-medium flex items-center"
                            >
                              查看详情
                              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-cream-text-light mb-4">
                      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-cream-text-dark mb-4">暂无衣物</p>
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

          {activeTab === 'history' && (
            <div>
              <div className="bg-cream-card rounded-2xl shadow-sm p-6 border border-cream-border">
                <h2 className="text-lg font-semibold text-cream-text-dark mb-6">穿搭历史</h2>
                
                {loadingHistory ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cream-accent"></div>
                  </div>
                ) : outfitHistory.length > 0 ? (
                  <div className="space-y-6">
                    {outfitHistory.map(history => {
                      let items = [];
                      try {
                        items = JSON.parse(history.items);
                      } catch (e) {
                        console.error('解析历史记录失败:', e);
                      }
                      
                      let weather = null;
                      try {
                        weather = JSON.parse(history.weather);
                      } catch (e) {
                        console.error('解析天气数据失败:', e);
                      }
                      
                      return (
                        <div key={history.id} className="border border-cream-border rounded-xl p-6 bg-white">
                          <div className="flex justify-between items-start mb-4">
                            <h3 className="font-medium text-cream-text-dark">
                              {new Date(history.outfit_date).toLocaleDateString('zh-CN', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </h3>
                            <span className="text-cream-text-light text-sm">
                              {new Date(history.created_at).toLocaleDateString('zh-CN', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          
                          {weather && (
                            <div className="flex items-center mb-4 p-3 bg-cream-bg rounded-lg">
                              <div className="text-lg font-bold text-cream-text-dark mr-3">
                                {Math.round(weather.temperature)}°C
                              </div>
                              <div>
                                <div className="text-cream-text-dark">{weather.condition}</div>
                                <div className="text-cream-text-light text-sm">{weather.description}</div>
                              </div>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                            {items.map((item: any, index: number) => (
                              <div key={index} className="flex items-center bg-cream-bg rounded-lg p-3">
                                {item.image_url ? (
                                  <img src={item.image_url} alt={item.name} className="w-12 h-12 object-cover rounded mr-3" />
                                ) : (
                                  <div className="w-12 h-12 bg-cream-border rounded mr-3 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-cream-text-light" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                )}
                                <div>
                                  <div className="font-medium text-cream-text-dark text-sm">{item.name}</div>
                                  <div className="text-cream-text-light text-xs">{item.category}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {history.notes && (
                            <div className="bg-cream-bg rounded-lg p-3">
                              <p className="text-cream-text text-sm">{history.notes}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-cream-text-light mb-4">
                      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-cream-text-dark">暂无穿搭历史</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* 添加衣物模态框 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-cream-card rounded-2xl shadow-sm w-full max-w-md max-h-[90vh] overflow-y-auto border border-cream-border">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-cream-text-dark">添加衣物</h2>
                <button 
                  onClick={() => {
                    setShowAddModal(false);
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
                    });
                    setImageFile(null);
                    setImageFiles([]);
                  }}
                  className="text-cream-text-light hover:text-cream-text-dark"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-cream-text-dark text-sm font-medium mb-2">名称 *</label>
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
                  <label className="block text-cream-text-dark text-sm font-medium mb-2">分类 *</label>
                  <select
                    name="category"
                    value={newItem.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-cream-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cream-accent"
                  >
                    <option value="">请选择分类</option>
                    <option value="上衣">上衣</option>
                    <option value="裤子">裤子</option>
                    <option value="裙子">裙子</option>
                    <option value="外套">外套</option>
                    <option value="配飾">配飾</option>
                    <option value="鞋子">鞋子</option>
                    <option value="内衣">内衣</option>
                    <option value="其他">其他</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-cream-text-dark text-sm font-medium mb-2">颜色</label>
                    <input
                      type="text"
                      name="color"
                      value={newItem.color}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-cream-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cream-accent"
                      placeholder="例如：黑色"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-cream-text-dark text-sm font-medium mb-2">季节</label>
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
                </div>
                
                <div>
                  <label className="block text-cream-text-dark text-sm font-medium mb-2">购买日期</label>
                  <input
                    type="date"
                    name="purchase_date"
                    value={newItem.purchase_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-cream-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cream-accent"
                  />
                </div>
                
                <div>
                  <label className="block text-cream-text-dark text-sm font-medium mb-2">品牌</label>
                  <input
                    type="text"
                    name="brand"
                    value={newItem.brand}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-cream-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cream-accent"
                    placeholder="例如：Nike"
                  />
                </div>
                
                <div>
                  <label className="block text-cream-text-dark text-sm font-medium mb-2">图片</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 border border-cream-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cream-accent"
                  />
                  {imageFile && (
                    <div className="mt-2 text-cream-text text-sm">
                      已选择: {imageFile.name}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-cream-text-dark text-sm font-medium mb-2">多张图片</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleMultipleFileChange}
                    className="w-full px-3 py-2 border border-cream-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cream-accent"
                  />
                  {imageFiles.length > 0 && (
                    <div className="mt-2 text-cream-text text-sm">
                      已选择 {imageFiles.length} 张图片
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-cream-text-dark text-sm font-medium mb-2">标签</label>
                  <div className="flex flex-wrap gap-2">
                    {(['商务', '休闲', '运动', '正式', '日常', '约会', '度假', '居家'] as Tag[]).map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleTagChange(tag)}
                        className={`px-3 py-1 text-sm rounded-full transition duration-300 ${
                          newItem.tags.includes(tag)
                            ? 'bg-cream-accent text-white'
                            : 'bg-cream-bg border border-cream-border text-cream-text hover:bg-cream-border'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-cream-text-dark text-sm font-medium mb-2">备注</label>
                  <textarea
                    name="notes"
                    value={newItem.notes}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-cream-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cream-accent"
                    placeholder="请输入备注信息"
                  />
                </div>
              </div>
              
              <div className="mt-8 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowAddModal(false);
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
                    });
                    setImageFile(null);
                    setImageFiles([]);
                  }}
                  className="px-4 py-2 border border-cream-border text-cream-text-dark rounded-lg hover:bg-cream-bg transition duration-300"
                >
                  取消
                </button>
                <button
                  onClick={handleAddWardrobeItem}
                  disabled={!newItem.name || !newItem.category || isUploading}
                  className="px-4 py-2 bg-cream-accent hover:bg-cream-accent-hover disabled:opacity-50 text-white rounded-lg transition duration-300 flex items-center"
                >
                  {isUploading ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      上传中...
                    </>
                  ) : (
                    '添加'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 编辑衣物模态框 */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-cream-card rounded-2xl shadow-sm w-full max-w-md max-h-[90vh] overflow-y-auto border border-cream-border">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-cream-text-dark">编辑衣物</h2>
                <button 
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingItem(null);
                    setEditingImageFile(null);
                    setEditingImageFiles([]);
                  }}
                  className="text-cream-text-light hover:text-cream-text-dark"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-cream-text-dark text-sm font-medium mb-2">名称 *</label>
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
                  <label className="block text-cream-text-dark text-sm font-medium mb-2">分类 *</label>
                  <select
                    name="category"
                    value={editingItem.category}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-cream-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cream-accent"
                  >
                    <option value="">请选择分类</option>
                    <option value="上衣">上衣</option>
                    <option value="裤子">裤子</option>
                    <option value="裙子">裙子</option>
                    <option value="外套">外套</option>
                    <option value="配飾">配飾</option>
                    <option value="鞋子">鞋子</option>
                    <option value="内衣">内衣</option>
                    <option value="其他">其他</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-cream-text-dark text-sm font-medium mb-2">颜色</label>
                    <input
                      type="text"
                      name="color"
                      value={editingItem.color || ''}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 border border-cream-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cream-accent"
                      placeholder="例如：黑色"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-cream-text-dark text-sm font-medium mb-2">季节</label>
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
                </div>
                
                <div>
                  <label className="block text-cream-text-dark text-sm font-medium mb-2">购买日期</label>
                  <input
                    type="date"
                    name="purchase_date"
                    value={editingItem.purchase_date || ''}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-cream-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cream-accent"
                  />
                </div>
                
                <div>
                  <label className="block text-cream-text-dark text-sm font-medium mb-2">品牌</label>
                  <input
                    type="text"
                    name="brand"
                    value={editingItem.brand || ''}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-cream-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cream-accent"
                    placeholder="例如：Nike"
                  />
                </div>
                
                <div>
                  <label className="block text-cream-text-dark text-sm font-medium mb-2">图片</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleEditFileChange}
                    className="w-full px-3 py-2 border border-cream-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cream-accent"
                  />
                  {editingImageFile && (
                    <div className="mt-2 text-cream-text text-sm">
                      已选择: {editingImageFile.name}
                    </div>
                  )}
                  {editingItem.image_url && !editingImageFile && (
                    <div className="mt-2">
                      <div className="text-cream-text text-sm mb-2">当前图片:</div>
                      <img src={editingItem.image_url} alt="当前图片" className="w-24 h-24 object-cover rounded" />
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-cream-text-dark text-sm font-medium mb-2">多张图片</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleEditMultipleFileChange}
                    className="w-full px-3 py-2 border border-cream-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cream-accent"
                  />
                  {editingImageFiles.length > 0 && (
                    <div className="mt-2 text-cream-text text-sm">
                      已选择 {editingImageFiles.length} 张新图片
                    </div>
                  )}
                  {editingItem.image_urls && editingItem.image_urls.length > 0 && (
                    <div className="mt-2">
                      <div className="text-cream-text text-sm mb-2">当前图片:</div>
                      <div className="flex flex-wrap gap-2">
                        {editingItem.image_urls.map((url, index) => (
                          <img key={index} src={url} alt={`图片 ${index + 1}`} className="w-16 h-16 object-cover rounded" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-cream-text-dark text-sm font-medium mb-2">标签</label>
                  <div className="flex flex-wrap gap-2">
                    {(['商务', '休闲', '运动', '正式', '日常', '约会', '度假', '居家'] as Tag[]).map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleEditTagChange(tag)}
                        className={`px-3 py-1 text-sm rounded-full transition duration-300 ${
                          editingItem.tags.includes(tag)
                            ? 'bg-cream-accent text-white'
                            : 'bg-cream-bg border border-cream-border text-cream-text hover:bg-cream-border'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-cream-text-dark text-sm font-medium mb-2">备注</label>
                  <textarea
                    name="notes"
                    value={editingItem.notes || ''}
                    onChange={handleEditInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-cream-border rounded-lg focus:outline-none focus:ring-2 focus:ring-cream-accent"
                    placeholder="请输入备注信息"
                  />
                </div>
              </div>
              
              <div className="mt-8 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingItem(null);
                    setEditingImageFile(null);
                    setEditingImageFiles([]);
                  }}
                  className="px-4 py-2 border border-cream-border text-cream-text-dark rounded-lg hover:bg-cream-bg transition duration-300"
                >
                  取消
                </button>
                <button
                  onClick={handleEditWardrobeItem}
                  disabled={!editingItem.name || !editingItem.category || isUploading}
                  className="px-4 py-2 bg-cream-accent hover:bg-cream-accent-hover disabled:opacity-50 text-white rounded-lg transition duration-300 flex items-center"
                >
                  {isUploading ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      上传中...
                    </>
                  ) : (
                    '保存'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认模态框 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-cream-card rounded-2xl shadow-sm w-full max-w-md border border-cream-border">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-cream-text-dark">确认删除</h2>
                <button 
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setItemToDelete(null);
                  }}
                  className="text-cream-text-light hover:text-cream-text-dark"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-6">
                <p className="text-cream-text-dark">确定要删除这件衣物吗？此操作无法撤销。</p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setItemToDelete(null);
                  }}
                  className="px-4 py-2 border border-cream-border text-cream-text-dark rounded-lg hover:bg-cream-bg transition duration-300"
                >
                  取消
                </button>
                <button
                  onClick={handleDeleteWardrobeItem}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition duration-300"
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  )
}

