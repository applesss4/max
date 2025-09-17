'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react'
import { 
  getUserWorkSchedules, 
  createWorkSchedule, 
  updateWorkSchedule, 
  deleteWorkSchedule,
  getShopHourlyRates,
  createShopHourlyRate,
  updateShopHourlyRate,
  deleteShopHourlyRate
} from '@/services/workScheduleService'
import { WorkSchedule, ShopHourlyRate, CreateWorkScheduleParams, CreateShopHourlyRateParams } from '@/services/workScheduleService'
import html2canvas from 'html2canvas'

// 懒加载日历组件和图标组件
const Calendar = lazy(() => import('react-calendar'))
const CalendarIcon = lazy(() => import('@/components/icons/CalendarIcon'))
const ClockIcon = lazy(() => import('@/components/icons/ClockIcon'))
const CurrencyIcon = lazy(() => import('@/components/icons/CurrencyIcon'))
const EditIcon = lazy(() => import('@/components/icons/EditIcon'))
const DeleteIcon = lazy(() => import('@/components/icons/DeleteIcon'))
const CloseIcon = lazy(() => import('@/components/icons/CloseIcon'))
const BackIcon = lazy(() => import('@/components/icons/BackIcon'))

// 懒加载其他组件
const ShopHourlyRates = lazy(() => import('@/components/ShopHourlyRates'))

export default function WorkSchedulePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [schedules, setSchedules] = useState<WorkSchedule[]>([])
  const [shopRates, setShopRates] = useState<ShopHourlyRate[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<WorkSchedule | null>(null)
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState('');

  const [showSalaryForm, setShowSalaryForm] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [formData, setFormData] = useState({
    shop_name: '',
    work_date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '17:00',
    break_duration: 0 // 休息时长，默认为0小时
  })
  const [salaryFormData, setSalaryFormData] = useState({
    shop_name: '',
    day_shift_rate: '',
    night_shift_rate: ''
  })
  const [shiftRates, setShiftRates] = useState({
    day_shift_rate: 0,
    night_shift_rate: 0
  })
  const [isLoading, setIsLoading] = useState(false)

  // 修复日期格式化函数，确保日期正确处理
  const formatDateForComparison = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 初始化数据
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;
      
      try {
        // 加载排班数据
        const { data: userSchedules, error: scheduleError } = await getUserWorkSchedules(user.id);
        if (userSchedules) {
          setSchedules(userSchedules);
        }
        
        // 加载店铺时薪数据
        const { data: userShopRates, error: rateError } = await getShopHourlyRates(user.id);
        if (userShopRates) {
          setShopRates(userShopRates);
        }
      } catch (error) {
        console.error('加载数据失败:', error);
      }
    };
    
    loadData();
  }, [user])

  // 计算选中日期的排班
  const schedulesForSelectedDate = useMemo(() => {
    const dateStr = formatDateForComparison(selectedDate);
    return schedules
      .filter(schedule => schedule.work_date === dateStr)
      .sort((a, b) => {
        // 按上班时间排序，早的在前面
        return a.start_time.localeCompare(b.start_time);
      });
  }, [schedules, selectedDate])

  // 处理表单输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'break_duration' ? parseFloat(value) : value
    }))
  }

  // 处理工资表单输入变化
  const handleSalaryInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setSalaryFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // 提交排班表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      if (!user?.id) {
        throw new Error('用户未登录');
      }
      
      const scheduleParams: CreateWorkScheduleParams = {
        user_id: user.id,
        shop_name: formData.shop_name,
        work_date: formData.work_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        break_duration: formData.break_duration
      };
      
      if (editingSchedule) {
        // 更新现有排班
        const { data: updatedSchedule, error } = await updateWorkSchedule(editingSchedule.id, scheduleParams);
        if (error) {
          throw error;
        }
        
        if (updatedSchedule) {
          setSchedules(prev => 
            prev.map(schedule => 
              schedule.id === editingSchedule.id ? updatedSchedule : schedule
            )
          );
        }
        setEditingSchedule(null);
      } else {
        // 添加新排班
        const { data: newSchedule, error } = await createWorkSchedule(scheduleParams);
        if (error) {
          throw error;
        }
        
        if (newSchedule) {
          setSchedules(prev => [newSchedule, ...prev]);
        }
      }
      
      // 重置表单
      setFormData({
        shop_name: '',
        work_date: formatDateForComparison(new Date()),
        start_time: '09:00',
        end_time: '17:00',
        break_duration: 0
      })
      setShowForm(false)
    } catch (error) {
      console.error('保存排班失败:', error)
      alert('保存排班失败: ' + (error instanceof Error ? error.message : '未知错误'))
    } finally {
      setIsLoading(false)
    }
  }

  // 提交工资表单
  const handleSalarySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (!user?.id) {
        throw new Error('用户未登录');
      }
      
      if (salaryFormData.shop_name && (salaryFormData.day_shift_rate || salaryFormData.night_shift_rate)) {
        const existingRate = shopRates.find(rate => rate.shop_name === salaryFormData.shop_name)
        
        const rateParams: CreateShopHourlyRateParams = {
          user_id: user.id,
          shop_name: salaryFormData.shop_name,
          day_shift_rate: parseFloat(salaryFormData.day_shift_rate) || 0,
          night_shift_rate: parseFloat(salaryFormData.night_shift_rate) || 0
        };
        
        if (existingRate) {
          // 更新现有时薪设置
          const { data: updatedRate, error } = await updateShopHourlyRate(existingRate.id, {
            day_shift_rate: rateParams.day_shift_rate,
            night_shift_rate: rateParams.night_shift_rate
          });
          
          if (error) {
            throw error;
          }
          
          if (updatedRate) {
            setShopRates(prev => 
              prev.map(rate => 
                rate.id === existingRate.id ? updatedRate : rate
              )
            );
          }
        } else {
          // 添加新时薪设置
          const { data: newRate, error } = await createShopHourlyRate(rateParams);
          
          if (error) {
            throw error;
          }
          
          if (newRate) {
            setShopRates(prev => [newRate, ...prev]);
          }
        }
        
        // 重置表单
        setSalaryFormData({
          shop_name: '',
          day_shift_rate: '',
          night_shift_rate: ''
        })
      }
      
      setShowSalaryForm(false)
      alert('设置已保存')
    } catch (error) {
      console.error('保存设置失败:', error)
      alert('保存设置失败: ' + (error instanceof Error ? error.message : '未知错误'))
    }
  }

  // 删除店铺时薪设置
  const handleDeleteShopRate = async (id: string, shopName: string) => {
    if (confirm(`确定要删除店铺"${shopName}"的时薪设置吗？`)) {
      try {
        const { error } = await deleteShopHourlyRate(id);
        if (error) {
          throw error;
        }
        
        setShopRates(prev => prev.filter(rate => rate.id !== id));
        alert('删除成功');
      } catch (error) {
        console.error('删除失败:', error)
        alert('删除失败: ' + (error instanceof Error ? error.message : '未知错误'))
      }
    }
  }

  // 编辑排班
  const handleEdit = (schedule: WorkSchedule) => {
    setEditingSchedule(schedule)
    setFormData({
      shop_name: schedule.shop_name,
      work_date: schedule.work_date,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      break_duration: (schedule as any).break_duration || 0 // 默认休息时长为0
    })
    setShowForm(true)
  }

  // 删除排班
  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个排班吗？')) {
      try {
        const { error } = await deleteWorkSchedule(id);
        if (error) {
          throw error;
        }
        
        setSchedules(prev => prev.filter(schedule => schedule.id !== id));
      } catch (error) {
        console.error('删除排班失败:', error)
        alert('删除排班失败: ' + (error instanceof Error ? error.message : '未知错误'))
      }
    }
  }

  // 获取一周的日期
  const getWeekDates = (date: Date) => {
    const week = []
    const startDate = new Date(date)
    startDate.setDate(startDate.getDate() - startDate.getDay() + (startDate.getDay() === 0 ? -6 : 1)) // 从周一开始
    
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate)
      currentDate.setDate(startDate.getDate() + i)
      week.push(currentDate)
    }
    
    return week
  }

  // 导出周排班表为CSV
  const exportWeeklyScheduleAsCSV = async () => {
    try {
      // 获取当前周的日期
      const weekDates = getWeekDates(selectedDate)
      
      // 获取当前周的所有排班数据
      const weekStart = new Date(weekDates[0])
      const weekEnd = new Date(weekDates[6])
      weekEnd.setHours(23, 59, 59, 999)
      
      const weekSchedules = schedules.filter(schedule => {
        const scheduleDate = new Date(schedule.work_date)
        return scheduleDate >= weekStart && scheduleDate <= weekEnd
      })
      
      // 按日期分组排班数据
      const schedulesByDate: Record<string, WorkSchedule[]> = {}
      
      weekDates.forEach(date => {
        const dateStr = formatDateForComparison(date)
        schedulesByDate[dateStr] = weekSchedules.filter(s => s.work_date === dateStr)
      })
      
      // 计算班次的白班和夜班工时，并考虑休息时间
      const calculateShiftHours = (startTime: string, endTime: string, breakDuration: number = 0) => {
        // 将时间转换为分钟数
        const parseTimeToMinutes = (time: string): number => {
          const [hours, minutes] = time.split(':').map(Number);
          return hours * 60 + minutes;
        };

        let startMinutes = parseTimeToMinutes(startTime);
        let endMinutes = parseTimeToMinutes(endTime);

        // 处理跨天情况
        if (endMinutes <= startMinutes) {
          endMinutes += 24 * 60; // 加24小时
        }

        // 白班时间段：08:00-22:00 (480-1320分钟)
        const dayShiftStart = 8 * 60;    // 08:00
        const dayShiftEnd = 22 * 60;     // 22:00

        let dayShiftMinutes = 0;
        let nightShiftMinutes = 0;

        // 计算与白班时间段的交集
        const workStartInDayShift = Math.max(startMinutes, dayShiftStart);
        const workEndInDayShift = Math.min(endMinutes, dayShiftEnd);
            
        if (workStartInDayShift < workEndInDayShift) {
          dayShiftMinutes = workEndInDayShift - workStartInDayShift;
        }

        // 计算与夜班时间段的交集
        // 夜班时间段：22:00-08:00，分为两部分：
        // 1. 当天22:00-24:00 (1320-1440分钟)
        const nightShiftStart1 = 22 * 60;  // 22:00
        const nightShiftEnd1 = 24 * 60;    // 24:00
        
        const workStartInNightShift1 = Math.max(startMinutes, nightShiftStart1);
        const workEndInNightShift1 = Math.min(endMinutes, nightShiftEnd1);
        
        if (workStartInNightShift1 < workEndInNightShift1) {
          nightShiftMinutes += workEndInNightShift1 - workStartInNightShift1;
        }
        
        // 2. 第二天00:00-08:00 (0-480分钟)
        // 只有当工作时间跨天时才需要考虑这部分
        if (endMinutes > 24 * 60) {
          const nightShiftStart2 = 0;      // 00:00
          const nightShiftEnd2 = 8 * 60;   // 08:00
          const adjustedEndMinutes = endMinutes - 24 * 60; // 调整到第二天的时间
          
          const workStartInNightShift2 = nightShiftStart2;
          const workEndInNightShift2 = Math.min(adjustedEndMinutes, nightShiftEnd2);
          
          if (workStartInNightShift2 < workEndInNightShift2) {
            nightShiftMinutes += workEndInNightShift2 - workStartInNightShift2;
          }
        }
      
        // 如果工作时间从夜班开始（早于08:00），也需要考虑第二天的夜班部分
        if (startMinutes < 8 * 60 && endMinutes > 24 * 60) {
          const nightShiftStart2 = 0;      // 00:00
          const nightShiftEnd2 = 8 * 60;   // 08:00
          const adjustedEndMinutes = endMinutes - 24 * 60; // 调整到第二天的时间
          
          const workStartInNightShift2 = nightShiftStart2;
          const workEndInNightShift2 = Math.min(adjustedEndMinutes, nightShiftEnd2);
          
          if (workStartInNightShift2 < workEndInNightShift2) {
            nightShiftMinutes += workEndInNightShift2 - workStartInNightShift2;
          }
        }
        
        // 修正：如果工作时间完全在白班时间段内，则没有夜班时间
        if (startMinutes >= dayShiftStart && endMinutes <= dayShiftEnd) {
          nightShiftMinutes = 0;
        }
        
        // 修正：如果工作时间完全在夜班时间段内（第一天の夜班22:00-24:00），则没有白班時間
        if (startMinutes >= nightShiftStart1 && endMinutes <= nightShiftEnd1) {
          dayShiftMinutes = 0;
        }
        
        // 修正：如果工作时间完全在夜班时间段内（第二天の夜班00:00-08:00），则没有白班時間
        if (endMinutes > 24 * 60 && startMinutes >= 24 * 60 && (endMinutes - 24 * 60) <= 8 * 60) {
          const adjustedStartMinutes = startMinutes - 24 * 60;
          const adjustedEndMinutes = endMinutes - 24 * 60;
          if (adjustedStartMinutes >= 0 && adjustedEndMinutes <= 8 * 60) {
            dayShiftMinutes = 0;
          }
        }

        // 将分钟转换为小时
        let dayShiftHours = dayShiftMinutes / 60;
        let nightShiftHours = nightShiftMinutes / 60;

        // 考虑休息时长的影响
        // 修复：休息时长应该只从白班工时中扣除，而不是按比例分配到白班和夜班
        if (breakDuration > 0) {
          // 优先从白班工时中扣除休息时间
          if (dayShiftHours >= breakDuration) {
            // 如果白班工时足够扣除休息时间
            dayShiftHours -= breakDuration;
          } else {
            // 如果白班工时不够扣除休息时间
            // 先扣除所有白班工时
            const remainingBreak = breakDuration - dayShiftHours;
            dayShiftHours = 0;
            
            // 剩余的休息时间从夜班工时中扣除
            nightShiftHours = Math.max(0, nightShiftHours - remainingBreak);
          }
        }

        return {
          dayShiftHours: dayShiftHours,
          nightShiftHours: nightShiftHours
        };
      };
      
      // 计算单个排班的预计工资
      const calculateScheduleSalary = (schedule: WorkSchedule) => {
        const shopRate = shopRates.find(rate => rate.shop_name === schedule.shop_name);
        const dayShiftRate = shopRate ? shopRate.day_shift_rate : 0;
        const nightShiftRate = shopRate ? shopRate.night_shift_rate : 0;
        
        const breakDuration = (schedule as any).break_duration || 0;
        const shiftHours = calculateShiftHours(schedule.start_time, schedule.end_time, breakDuration);
        const dayShiftHours = shiftHours.dayShiftHours;
        const nightShiftHours = shiftHours.nightShiftHours;
        
        const totalSalary = dayShiftHours * dayShiftRate + nightShiftHours * nightShiftRate;
        return Math.round(totalSalary);
      };
      
      // 计算本周总工资和总休息时长
      let totalWeeklySalary = 0;
      let totalWeeklyBreakHours = 0;
      
      weekSchedules.forEach(schedule => {
        const salary = calculateScheduleSalary(schedule);
        totalWeeklySalary += salary;
        totalWeeklyBreakHours += (schedule as any).break_duration || 0;
      });
      
      // 构建CSV内容
      let csvContent = '\uFEFF'; // 添加BOM以支持中文编码
      csvContent += '店铺信息,上班时间,下班时间,当天工资\n';
      
      // 按日期顺序添加排班信息
      weekDates.forEach(date => {
        const dateStr = formatDateForComparison(date);
        const schedulesForDate = schedulesByDate[dateStr] || [];
        
        if (schedulesForDate.length > 0) {
          schedulesForDate.forEach(schedule => {
            const salary = calculateScheduleSalary(schedule);
            csvContent += `"${schedule.shop_name}",${schedule.start_time},${schedule.end_time},${salary}\n`;
          });
        } else {
          // 如果当天没有排班，添加休息标记
          csvContent += `"休息",,,\n`;
        }
      });
      
      // 添加总计信息
      csvContent += '\n';
      csvContent += `本周预计总工资,${totalWeeklySalary}日元\n`;
      csvContent += `本周休息時長,${totalWeeklyBreakHours.toFixed(1)}小时\n`;
      
      // 创建下载链接
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const fileName = `周排班表_${weekDates[0].getFullYear()}年${weekDates[0].getMonth() + 1}月${weekDates[0].getDate()}日_至_${weekDates[6].getFullYear()}年${weekDates[6].getMonth() + 1}月${weekDates[6].getDate()}日.csv`;
      link.download = fileName;
      link.href = URL.createObjectURL(blob);
      link.click();
      
    } catch (error) {
      console.error('导出周排班表失败:', error);
      alert('导出周排班表失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  }

  // 导出周排班表为图片
  const exportWeeklyScheduleAsImage = async () => {
    try {
      // 获取当前周的日期
      const weekDates = getWeekDates(selectedDate)
      
      // 获取当前周的所有排班数据
      const weekStart = new Date(weekDates[0])
      const weekEnd = new Date(weekDates[6])
      weekEnd.setHours(23, 59, 59, 999)
      
      const weekSchedules = schedules.filter(schedule => {
        const scheduleDate = new Date(schedule.work_date)
        return scheduleDate >= weekStart && scheduleDate <= weekEnd
      })
      
      // 按日期分组排班数据
      const schedulesByDate: Record<string, WorkSchedule[]> = {}
      
      weekDates.forEach(date => {
        const dateStr = formatDateForComparison(date)
        schedulesByDate[dateStr] = weekSchedules.filter(s => s.work_date === dateStr)
      })
      
      // 获取本周所有店铺名称
      const shopNames = Array.from(new Set(weekSchedules.map(schedule => schedule.shop_name))).sort()
      
      // 计算班次的白班和夜班工时，并考虑休息时间
      const calculateShiftHours = (startTime: string, endTime: string, breakDuration: number = 0) => {
        // 将时间转换为分钟数
        const parseTimeToMinutes = (time: string): number => {
          const [hours, minutes] = time.split(':').map(Number);
          return hours * 60 + minutes;
        };

        let startMinutes = parseTimeToMinutes(startTime);
        let endMinutes = parseTimeToMinutes(endTime);

        // 处理跨天情况
        if (endMinutes <= startMinutes) {
          endMinutes += 24 * 60; // 加24小时
        }

        // 白班时间段：08:00-22:00 (480-1320分钟)
        const dayShiftStart = 8 * 60;    // 08:00
        const dayShiftEnd = 22 * 60;     // 22:00

        let dayShiftMinutes = 0;
        let nightShiftMinutes = 0;

        // 计算与白班时间段的交集
        const workStartInDayShift = Math.max(startMinutes, dayShiftStart);
        const workEndInDayShift = Math.min(endMinutes, dayShiftEnd);
            
        if (workStartInDayShift < workEndInDayShift) {
          dayShiftMinutes = workEndInDayShift - workStartInDayShift;
        }

        // 计算与夜班时间段的交集
        // 夜班时间段：22:00-08:00，分为两部分：
        // 1. 当天22:00-24:00 (1320-1440分钟)
        const nightShiftStart1 = 22 * 60;  // 22:00
        const nightShiftEnd1 = 24 * 60;    // 24:00
        
        const workStartInNightShift1 = Math.max(startMinutes, nightShiftStart1);
        const workEndInNightShift1 = Math.min(endMinutes, nightShiftEnd1);
        
        if (workStartInNightShift1 < workEndInNightShift1) {
          nightShiftMinutes += workEndInNightShift1 - workStartInNightShift1;
        }
        
        // 2. 第二天00:00-08:00 (0-480分钟)
        // 只有当工作时间跨天时才需要考虑这部分
        if (endMinutes > 24 * 60) {
          const nightShiftStart2 = 0;      // 00:00
          const nightShiftEnd2 = 8 * 60;   // 08:00
          const adjustedEndMinutes = endMinutes - 24 * 60; // 调整到第二天的时间
          
          const workStartInNightShift2 = nightShiftStart2;
          const workEndInNightShift2 = Math.min(adjustedEndMinutes, nightShiftEnd2);
          
          if (workStartInNightShift2 < workEndInNightShift2) {
            nightShiftMinutes += workEndInNightShift2 - workStartInNightShift2;
          }
        }
      
        // 如果工作时间从夜班开始（早于08:00），也需要考虑第二天的夜班部分
        if (startMinutes < 8 * 60 && endMinutes > 24 * 60) {
          const nightShiftStart2 = 0;      // 00:00
          const nightShiftEnd2 = 8 * 60;   // 08:00
          const adjustedEndMinutes = endMinutes - 24 * 60; // 调整到第二天的时间
          
          const workStartInNightShift2 = nightShiftStart2;
          const workEndInNightShift2 = Math.min(adjustedEndMinutes, nightShiftEnd2);
          
          if (workStartInNightShift2 < workEndInNightShift2) {
            nightShiftMinutes += workEndInNightShift2 - workStartInNightShift2;
          }
        }
        
        // 修正：如果工作时间完全在白班时间段内，则没有夜班时间
        if (startMinutes >= dayShiftStart && endMinutes <= dayShiftEnd) {
          nightShiftMinutes = 0;
        }
        
        // 修正：如果工作时间完全在夜班时间段内（第一天の夜班22:00-24:00），则没有白班時間
        if (startMinutes >= nightShiftStart1 && endMinutes <= nightShiftEnd1) {
          dayShiftMinutes = 0;
        }
        
        // 修正：如果工作时间完全在夜班时间段内（第二天の夜班00:00-08:00），则没有白班時間
        if (endMinutes > 24 * 60 && startMinutes >= 24 * 60 && (endMinutes - 24 * 60) <= 8 * 60) {
          const adjustedStartMinutes = startMinutes - 24 * 60;
          const adjustedEndMinutes = endMinutes - 24 * 60;
          if (adjustedStartMinutes >= 0 && adjustedEndMinutes <= 8 * 60) {
            dayShiftMinutes = 0;
          }
        }

        // 将分钟转换为小时
        let dayShiftHours = dayShiftMinutes / 60;
        let nightShiftHours = nightShiftMinutes / 60;

        // 考虑休息时长的影响
        // 修复：休息时长应该只从白班工时中扣除，而不是按比例分配到白班和夜班
        if (breakDuration > 0) {
          // 优先从白班工时中扣除休息时间
          if (dayShiftHours >= breakDuration) {
            // 如果白班工时足够扣除休息时间
            dayShiftHours -= breakDuration;
          } else {
            // 如果白班工时不够扣除休息时间
            // 先扣除所有白班工时
            const remainingBreak = breakDuration - dayShiftHours;
            dayShiftHours = 0;
            
            // 剩余的休息时间从夜班工时中扣除
            nightShiftHours = Math.max(0, nightShiftHours - remainingBreak);
          }
        }

        return {
          dayShiftHours: dayShiftHours,
          nightShiftHours: nightShiftHours
        };
      };
      
      // 计算单个排班的预计工资
      const calculateScheduleSalary = (schedule: WorkSchedule) => {
        const shopRate = shopRates.find(rate => rate.shop_name === schedule.shop_name);
        const dayShiftRate = shopRate ? shopRate.day_shift_rate : 0;
        const nightShiftRate = shopRate ? shopRate.night_shift_rate : 0;
        
        const breakDuration = (schedule as any).break_duration || 0;
        const shiftHours = calculateShiftHours(schedule.start_time, schedule.end_time, breakDuration);
        const dayShiftHours = shiftHours.dayShiftHours;
        const nightShiftHours = shiftHours.nightShiftHours;
        
        const totalSalary = dayShiftHours * dayShiftRate + nightShiftHours * nightShiftRate;
        return Math.round(totalSalary);
      };
      
      // 计算本周总工资和总休息时长
      let totalWeeklySalary = 0;
      let totalWeeklyBreakHours = 0;
      
      weekSchedules.forEach(schedule => {
        const salary = calculateScheduleSalary(schedule);
        totalWeeklySalary += salary;
        totalWeeklyBreakHours += (schedule as any).break_duration || 0;
      });
      
      // 创建用于导出的隐藏表格元素
      const exportContainer = document.createElement('div');
      exportContainer.style.position = 'absolute';
      exportContainer.style.left = '-9999px';
      exportContainer.style.zIndex = '-1';
      exportContainer.style.backgroundColor = '#f8f1eb';
      exportContainer.style.padding = '20px';
      exportContainer.style.fontFamily = 'sans-serif';
      exportContainer.style.width = '1200px';
      
      // 创建表格HTML - 按照新要求重新设计
      let tableHTML = `
        <div style="background: linear-gradient(135deg, #f8f1eb 0%, #e8dcd3 100%); padding: 30px; font-family: 'Segoe UI', sans-serif; width: 1200px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.15);">
          <h2 style="text-align: center; color: #5d504b; margin-bottom: 25px; font-size: 28px; font-weight: 600; text-shadow: 1px 1px 2px rgba(0,0,0,0.1);">周排班表</h2>
          <table style="width: 100%; border-collapse: collapse; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
            <thead>
              <tr style="background: linear-gradient(to right, #a89383, #8b7d77); color: white;">
                <th style="padding: 15px; text-align: center; border: 1px solid #d4c8c2; font-weight: 600; font-size: 16px;">店铺情報</th>
      `;
      
      // 添加日期表头（星期、上班時間、下班時間、当天工资）
      weekDates.forEach(date => {
        const weekday = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
        tableHTML += `
          <th style="padding: 15px; text-align: center; border: 1px solid #d4c8c2; font-weight: 600; font-size: 14px;">
            ${weekday}<br/>${date.getMonth() + 1}/${date.getDate()}
          </th>
        `;
      });
      
      // 添加总计列
      tableHTML += `
                <th style="padding: 15px; text-align: center; border: 1px solid #d4c8c2; font-weight: 600; font-size: 16px;">总计</th>
              </tr>
              <tr style="background: linear-gradient(to right, #a89383, #8b7d77); color: white;">
                <th style="padding: 15px; text-align: center; border: 1px solid #d4c8c2; font-weight: 600; font-size: 16px;"></th>
      `;
      
      // 添加子表头（上班時間、下班時間、当天工资）
      weekDates.forEach(() => {
        tableHTML += `
          <th style="padding: 8px; text-align: center; border: 1px solid #d4c8c2; font-weight: 500; font-size: 12px;">
            <div>上班時間</div>
            <div>下班時間</div>
            <div>当天工资</div>
          </th>
        `;
      });
      
      // 添加总计子表头
      tableHTML += `
                <th style="padding: 15px; text-align: center; border: 1px solid #d4c8c2; font-weight: 600; font-size: 16px;">工资</th>
              </tr>
            </thead>
            <tbody>
      `;
      
      // 为每个店铺添加一行
      shopNames.forEach((shopName, shopIndex) => {
        const shopSchedules = weekSchedules.filter(schedule => schedule.shop_name === shopName);
        let shopTotalSalary = 0;
        
        // 交替行背景色
        const rowBgColor = shopIndex % 2 === 0 ? '#ffffff' : '#f9f5f3';
        
        tableHTML += `<tr style="border-bottom: 1px solid #d4c8c2; background-color: ${rowBgColor};">
          <td style="padding: 15px; text-align: center; border: 1px solid #d4c8c2; font-weight: 600;">${shopName}</td>`;
        
        // 为每个日期添加排班信息
        weekDates.forEach(date => {
          const dateStr = formatDateForComparison(date);
          const schedulesForDate = shopSchedules.filter(schedule => schedule.work_date === dateStr);
          
          if (schedulesForDate.length > 0) {
            let cellContent = '';
            let cellSalary = 0;
            
            // 只取第一个排班（通常一个店铺一天只有一个班次）
            const schedule = schedulesForDate[0];
            const salary = calculateScheduleSalary(schedule);
            cellSalary += salary;
            
            cellContent = `
              <div>${schedule.start_time}</div>
              <div>${schedule.end_time}</div>
              <div style="font-weight: 600; color: #a89383; margin-top: 5px;">${salary}</div>
            `;
            
            shopTotalSalary += cellSalary;
            tableHTML += `<td style="padding: 8px; text-align: center; border: 1px solid #d4c8c2; font-weight: 500; color: #5d504b;">${cellContent}</td>`;
          } else {
            tableHTML += `<td style="padding: 8px; text-align: center; border: 1px solid #d4c8c2; color: #a89383;">
              <div>--:--</div>
              <div>--:--</div>
              <div style="font-weight: 600; color: #a89383; margin-top: 5px;">0</div>
            </td>`;
          }
        });
        
        // 添加店铺总计
        tableHTML += `<td style="padding: 15px; text-align: center; border: 1px solid #d4c8c2; font-weight: 600; color: #a89383;">${shopTotalSalary}</td>`;
        tableHTML += `</tr>`;
      });
      
      // 添加总计行
      tableHTML += `
              <tr style="background: linear-gradient(to right, #a89383, #8b7d77); color: white; font-weight: 600;">
                <td style="padding: 15px; text-align: center; border: 1px solid #d4c8c2;">总计</td>
      `;
      
      // 计算每天的总工资
      let totalSalaryForAllDays = 0;
      weekDates.forEach(date => {
        const dateStr = formatDateForComparison(date);
        const schedulesForDate = weekSchedules.filter(schedule => schedule.work_date === dateStr);
        let dailyTotalSalary = 0;
        
        schedulesForDate.forEach(schedule => {
          const salary = calculateScheduleSalary(schedule);
          dailyTotalSalary += salary;
        });
        
        totalSalaryForAllDays += dailyTotalSalary;
        tableHTML += `<td style="padding: 15px; text-align: center; border: 1px solid #d4c8c2;">${dailyTotalSalary}</td>`;
      });
      
      tableHTML += `<td style="padding: 15px; text-align: center; border: 1px solid #d4c8c2;">${totalSalaryForAllDays}</td>`;
      tableHTML += `</tr>`;
      
      // 添加总计信息（本周预计总工资和本周休息时长）
      tableHTML += `
            </tbody>
          </table>
          <div style="margin-top: 25px; padding: 20px; background: linear-gradient(to right, #a89383, #8b7d77); border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
              <div style="font-weight: 600; color: white; font-size: 18px;">本周预计总工资:</div>
              <div style="font-weight: 700; color: white; font-size: 18px;">${totalWeeklySalary} 日元</div>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <div style="font-weight: 600; color: white; font-size: 18px;">本周休息时长:</div>
              <div style="font-weight: 700; color: white; font-size: 18px;">${totalWeeklyBreakHours.toFixed(1)} 小时</div>
            </div>
          </div>
        </div>
      `;
      
      exportContainer.innerHTML = tableHTML;
      document.body.appendChild(exportContainer);
      
      // 使用html2canvas将表格转换为图片
      const canvas = await html2canvas(exportContainer, {
        scale: 2, // 提高图片质量
        useCORS: true,
        backgroundColor: '#f8f1eb'
      });
      
      // 移除临时元素
      document.body.removeChild(exportContainer);
      
      // 创建下载链接
      const link = document.createElement('a');
      const fileName = `周排班表_${weekDates[0].getFullYear()}年${weekDates[0].getMonth() + 1}月${weekDates[0].getDate()}日_至_${weekDates[6].getFullYear()}年${weekDates[6].getMonth() + 1}月${weekDates[6].getDate()}日.png`;
      link.download = fileName;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
    } catch (error) {
      console.error('导出周排班表图片失败:', error);
      alert('导出周排班表图片失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  // 预览周排班表
  const previewWeeklySchedule = async () => {
    try {
      // 获取当前周的日期
      const weekDates = getWeekDates(selectedDate)
      
      // 获取当前周的所有排班数据
      const weekStart = new Date(weekDates[0])
      const weekEnd = new Date(weekDates[6])
      weekEnd.setHours(23, 59, 59, 999)
      
      const weekSchedules = schedules.filter(schedule => {
        const scheduleDate = new Date(schedule.work_date)
        return scheduleDate >= weekStart && scheduleDate <= weekEnd
      })
      
      // 按日期分组排班数据
      const schedulesByDate: Record<string, WorkSchedule[]> = {}
      
      weekDates.forEach(date => {
        const dateStr = formatDateForComparison(date)
        schedulesByDate[dateStr] = weekSchedules.filter(s => s.work_date === dateStr)
      })
      
      // 获取本周所有店铺名称
      const shopNames = Array.from(new Set(weekSchedules.map(schedule => schedule.shop_name))).sort()
      
      // 计算班次的白班和夜班工时，并考虑休息时间
      const calculateShiftHours = (startTime: string, endTime: string, breakDuration: number = 0) => {
        // 将时间转换为分钟数
        const parseTimeToMinutes = (time: string): number => {
          const [hours, minutes] = time.split(':').map(Number);
          return hours * 60 + minutes;
        };

        let startMinutes = parseTimeToMinutes(startTime);
        let endMinutes = parseTimeToMinutes(endTime);

        // 处理跨天情况
        if (endMinutes <= startMinutes) {
          endMinutes += 24 * 60; // 加24小时
        }

        // 白班时间段：08:00-22:00 (480-1320分钟)
        const dayShiftStart = 8 * 60;    // 08:00
        const dayShiftEnd = 22 * 60;     // 22:00

        let dayShiftMinutes = 0;
        let nightShiftMinutes = 0;

        // 计算与白班时间段的交集
        const workStartInDayShift = Math.max(startMinutes, dayShiftStart);
        const workEndInDayShift = Math.min(endMinutes, dayShiftEnd);
            
        if (workStartInDayShift < workEndInDayShift) {
          dayShiftMinutes = workEndInDayShift - workStartInDayShift;
        }

        // 计算与夜班时间段的交集
        // 夜班时间段：22:00-08:00，分为两部分：
        // 1. 当天22:00-24:00 (1320-1440分钟)
        const nightShiftStart1 = 22 * 60;  // 22:00
        const nightShiftEnd1 = 24 * 60;    // 24:00
        
        const workStartInNightShift1 = Math.max(startMinutes, nightShiftStart1);
        const workEndInNightShift1 = Math.min(endMinutes, nightShiftEnd1);
        
        if (workStartInNightShift1 < workEndInNightShift1) {
          nightShiftMinutes += workEndInNightShift1 - workStartInNightShift1;
        }
        
        // 2. 第二天00:00-08:00 (0-480分钟)
        // 只有当工作时间跨天时才需要考虑这部分
        if (endMinutes > 24 * 60) {
          const nightShiftStart2 = 0;      // 00:00
          const nightShiftEnd2 = 8 * 60;   // 08:00
          const adjustedEndMinutes = endMinutes - 24 * 60; // 调整到第二天的时间
          
          const workStartInNightShift2 = nightShiftStart2;
          const workEndInNightShift2 = Math.min(adjustedEndMinutes, nightShiftEnd2);
          
          if (workStartInNightShift2 < workEndInNightShift2) {
            nightShiftMinutes += workEndInNightShift2 - workStartInNightShift2;
          }
        }
      
        // 如果工作时间从夜班开始（早于08:00），也需要考虑第二天的夜班部分
        if (startMinutes < 8 * 60 && endMinutes > 24 * 60) {
          const nightShiftStart2 = 0;      // 00:00
          const nightShiftEnd2 = 8 * 60;   // 08:00
          const adjustedEndMinutes = endMinutes - 24 * 60; // 调整到第二天的时间
          
          const workStartInNightShift2 = nightShiftStart2;
          const workEndInNightShift2 = Math.min(adjustedEndMinutes, nightShiftEnd2);
          
          if (workStartInNightShift2 < workEndInNightShift2) {
            nightShiftMinutes += workEndInNightShift2 - workStartInNightShift2;
          }
        }
        
        // 修正：如果工作时间完全在白班时间段内，则没有夜班时间
        if (startMinutes >= dayShiftStart && endMinutes <= dayShiftEnd) {
          nightShiftMinutes = 0;
        }
        
        // 修正：如果工作时间完全在夜班时间段内（第一天の夜班22:00-24:00），则没有白班時間
        if (startMinutes >= nightShiftStart1 && endMinutes <= nightShiftEnd1) {
          dayShiftMinutes = 0;
        }
        
        // 修正：如果工作时间完全在夜班时间段内（第二天の夜班00:00-08:00），则没有白班時間
        if (endMinutes > 24 * 60 && startMinutes >= 24 * 60 && (endMinutes - 24 * 60) <= 8 * 60) {
          const adjustedStartMinutes = startMinutes - 24 * 60;
          const adjustedEndMinutes = endMinutes - 24 * 60;
          if (adjustedStartMinutes >= 0 && adjustedEndMinutes <= 8 * 60) {
            dayShiftMinutes = 0;
          }
        }

        // 将分钟转换为小时
        let dayShiftHours = dayShiftMinutes / 60;
        let nightShiftHours = nightShiftMinutes / 60;

        // 考虑休息时长的影响
        // 修复：休息时长应该只从白班工时中扣除，而不是按比例分配到白班和夜班
        if (breakDuration > 0) {
          // 优先从白班工时中扣除休息时间
          if (dayShiftHours >= breakDuration) {
            // 如果白班工时足够扣除休息时间
            dayShiftHours -= breakDuration;
          } else {
            // 如果白班工时不够扣除休息时间
            // 先扣除所有白班工时
            const remainingBreak = breakDuration - dayShiftHours;
            dayShiftHours = 0;
            
            // 剩余的休息时间从夜班工时中扣除
            nightShiftHours = Math.max(0, nightShiftHours - remainingBreak);
          }
        }

        return {
          dayShiftHours: dayShiftHours,
          nightShiftHours: nightShiftHours
        };
      };
      
      // 计算单个排班的预计工资
      const calculateScheduleSalary = (schedule: WorkSchedule) => {
        const shopRate = shopRates.find(rate => rate.shop_name === schedule.shop_name);
        const dayShiftRate = shopRate ? shopRate.day_shift_rate : 0;
        const nightShiftRate = shopRate ? shopRate.night_shift_rate : 0;
        
        const breakDuration = (schedule as any).break_duration || 0;
        const shiftHours = calculateShiftHours(schedule.start_time, schedule.end_time, breakDuration);
        const dayShiftHours = shiftHours.dayShiftHours;
        const nightShiftHours = shiftHours.nightShiftHours;
        
        const totalSalary = dayShiftHours * dayShiftRate + nightShiftHours * nightShiftRate;
        return Math.round(totalSalary);
      };
      
      // 计算本周总工资和总休息时长
      let totalWeeklySalary = 0;
      let totalWeeklyBreakHours = 0;
      
      weekSchedules.forEach(schedule => {
        const salary = calculateScheduleSalary(schedule);
        totalWeeklySalary += salary;
        totalWeeklyBreakHours += (schedule as any).break_duration || 0;
      });
      
      // 创建预览HTML - 按照新要求重新设计
      let previewHTML = `
        <div style="background: linear-gradient(135deg, #f8f1eb 0%, #e8dcd3 100%); padding: 30px; font-family: 'Segoe UI', sans-serif; width: 100%; max-width: 1200px; margin: 0 auto; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.15);">
          <h2 style="text-align: center; color: #5d504b; margin-bottom: 25px; font-size: 28px; font-weight: 600; text-shadow: 1px 1px 2px rgba(0,0,0,0.1);">周排班表预览</h2>
          <table style="width: 100%; border-collapse: collapse; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
            <thead>
              <tr style="background: linear-gradient(to right, #a89383, #8b7d77); color: white;">
                <th style="padding: 15px; text-align: center; border: 1px solid #d4c8c2; font-weight: 600; font-size: 16px;">店铺情報</th>
      `;
      
      // 添加日期表头（星期、上班時間、下班時間、当天工资）
      weekDates.forEach(date => {
        const weekday = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
        previewHTML += `
          <th style="padding: 15px; text-align: center; border: 1px solid #d4c8c2; font-weight: 600; font-size: 14px;">
            ${weekday}<br/>${date.getMonth() + 1}/${date.getDate()}
          </th>
        `;
      });
      
      // 添加总计列
      previewHTML += `
                <th style="padding: 15px; text-align: center; border: 1px solid #d4c8c2; font-weight: 600; font-size: 16px;">总计</th>
              </tr>
              <tr style="background: linear-gradient(to right, #a89383, #8b7d77); color: white;">
                <th style="padding: 15px; text-align: center; border: 1px solid #d4c8c2; font-weight: 600; font-size: 16px;"></th>
      `;
      
      // 添加子表头（上班時間、下班時間、当天工资）
      weekDates.forEach(() => {
        previewHTML += `
          <th style="padding: 8px; text-align: center; border: 1px solid #d4c8c2; font-weight: 500; font-size: 12px;">
            <div>上班時間</div>
            <div>下班時間</div>
            <div>当天工资</div>
          </th>
        `;
      });
      
      // 添加总计子表头
      previewHTML += `
                <th style="padding: 15px; text-align: center; border: 1px solid #d4c8c2; font-weight: 600; font-size: 16px;">工资</th>
              </tr>
            </thead>
            <tbody>
      `;
      
      // 为每个店铺添加一行
      shopNames.forEach((shopName, shopIndex) => {
        const shopSchedules = weekSchedules.filter(schedule => schedule.shop_name === shopName);
        let shopTotalSalary = 0;
        
        // 交替行背景色
        const rowBgColor = shopIndex % 2 === 0 ? '#ffffff' : '#f9f5f3';
        
        previewHTML += `<tr style="border-bottom: 1px solid #d4c8c2; background-color: ${rowBgColor};">
          <td style="padding: 15px; text-align: center; border: 1px solid #d4c8c2; font-weight: 600;">${shopName}</td>`;
        
        // 为每个日期添加排班信息
        weekDates.forEach(date => {
          const dateStr = formatDateForComparison(date);
          const schedulesForDate = shopSchedules.filter(schedule => schedule.work_date === dateStr);
          
          if (schedulesForDate.length > 0) {
            let cellContent = '';
            let cellSalary = 0;
            
            // 只取第一个排班（通常一个店铺一天只有一个班次）
            const schedule = schedulesForDate[0];
            const salary = calculateScheduleSalary(schedule);
            cellSalary += salary;
            
            cellContent = `
              <div>${schedule.start_time}</div>
              <div>${schedule.end_time}</div>
              <div style="font-weight: 600; color: #a89383; margin-top: 5px;">${salary}</div>
            `;
            
            shopTotalSalary += cellSalary;
            previewHTML += `<td style="padding: 8px; text-align: center; border: 1px solid #d4c8c2; font-weight: 500; color: #5d504b;">${cellContent}</td>`;
          } else {
            previewHTML += `<td style="padding: 8px; text-align: center; border: 1px solid #d4c8c2; color: #a89383;">
              <div>--:--</div>
              <div>--:--</div>
              <div style="font-weight: 600; color: #a89383; margin-top: 5px;">0</div>
            </td>`;
          }
        });
        
        // 添加店铺总计
        previewHTML += `<td style="padding: 15px; text-align: center; border: 1px solid #d4c8c2; font-weight: 600; color: #a89383;">${shopTotalSalary}</td>`;
        previewHTML += `</tr>`;
      });
      
      // 添加总计行
      previewHTML += `
              <tr style="background: linear-gradient(to right, #a89383, #8b7d77); color: white; font-weight: 600;">
                <td style="padding: 15px; text-align: center; border: 1px solid #d4c8c2;">总计</td>
      `;
      
      // 计算每天的总工资
      let totalSalaryForAllDays = 0;
      weekDates.forEach(date => {
        const dateStr = formatDateForComparison(date);
        const schedulesForDate = weekSchedules.filter(schedule => schedule.work_date === dateStr);
        let dailyTotalSalary = 0;
        
        schedulesForDate.forEach(schedule => {
          const salary = calculateScheduleSalary(schedule);
          dailyTotalSalary += salary;
        });
        
        totalSalaryForAllDays += dailyTotalSalary;
        previewHTML += `<td style="padding: 15px; text-align: center; border: 1px solid #d4c8c2;">${dailyTotalSalary}</td>`;
      });
      
      previewHTML += `<td style="padding: 15px; text-align: center; border: 1px solid #d4c8c2;">${totalSalaryForAllDays}</td>`;
      previewHTML += `</tr>`;
      
      // 添加总计信息（本周预计总工资和本周休息时长）
      previewHTML += `
            </tbody>
          </table>
          <div style="margin-top: 25px; padding: 20px; background: linear-gradient(to right, #a89383, #8b7d77); border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
              <div style="font-weight: 600; color: white; font-size: 18px;">本周预计总工资:</div>
              <div style="font-weight: 700; color: white; font-size: 18px;">${totalWeeklySalary} 日元</div>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <div style="font-weight: 600; color: white; font-size: 18px;">本周休息时長:</div>
              <div style="font-weight: 700; color: white; font-size: 18px;">${totalWeeklyBreakHours.toFixed(1)} 小时</div>
            </div>
          </div>
        </div>
      `;
      
      setPreviewContent(previewHTML);
      setShowPreview(true);
      
    } catch (error) {
      console.error('预览周排班表失败:', error);
      alert('预览周排班表失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  // 获取当前月份的排班数据
  const currentMonthSchedules = useMemo(() => {
    const firstDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
    const lastDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0)
    return schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.work_date)
      return scheduleDate >= firstDayOfMonth && scheduleDate <= lastDayOfMonth
    })
  }, [selectedDate, schedules])

  // 计算工资统计
  const salaryStats = useMemo(() => {
    // 获取当前月份和年份
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // getMonth() 返回 0-11，所以需要 +1
    
    // 过滤出当前月份的排班数据
    const currentMonthSchedules = schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.work_date);
      return scheduleDate.getFullYear() === currentYear && 
             scheduleDate.getMonth() + 1 === currentMonth;
    });

    const stats: Record<string, { 
      totalHours: number; 
      totalSalary: number;
      dayShiftHours: number;
      nightShiftHours: number;
      totalBreakHours: number; // 添加总休息时长统计
    }> = {}
      
    currentMonthSchedules.forEach(schedule => {
      const shopName = schedule.shop_name
      
      // 使用更精确的班次时间计算算法，并考虑休息时间
      const calculateShiftHours = (startTime: string, endTime: string, breakDuration: number = 0) => {
        // 将时间转换为分钟数
        const parseTimeToMinutes = (time: string): number => {
          const [hours, minutes] = time.split(':').map(Number);
          return hours * 60 + minutes;
        };

        let startMinutes = parseTimeToMinutes(startTime);
        let endMinutes = parseTimeToMinutes(endTime);

        // 处理跨天情况
        if (endMinutes <= startMinutes) {
          endMinutes += 24 * 60; // 加24小时
        }

        // 白班时间段：08:00-22:00 (480-1320分钟)
        const dayShiftStart = 8 * 60;    // 08:00
        const dayShiftEnd = 22 * 60;     // 22:00

        let dayShiftMinutes = 0;
        let nightShiftMinutes = 0;

        // 计算与白班时间段的交集
        const workStartInDayShift = Math.max(startMinutes, dayShiftStart);
        const workEndInDayShift = Math.min(endMinutes, dayShiftEnd);
            
        if (workStartInDayShift < workEndInDayShift) {
          dayShiftMinutes = workEndInDayShift - workStartInDayShift;
        }

        // 计算与夜班时间段的交集
        // 夜班时间段：22:00-08:00，分为两部分：
        // 1. 当天22:00-24:00 (1320-1440分钟)
        const nightShiftStart1 = 22 * 60;  // 22:00
        const nightShiftEnd1 = 24 * 60;    // 24:00
        
        const workStartInNightShift1 = Math.max(startMinutes, nightShiftStart1);
        const workEndInNightShift1 = Math.min(endMinutes, nightShiftEnd1);
        
        if (workStartInNightShift1 < workEndInNightShift1) {
          nightShiftMinutes += workEndInNightShift1 - workStartInNightShift1;
        }
        
        // 2. 第二天00:00-08:00 (0-480分钟)
        // 只有当工作时间跨天时才需要考虑这部分
        if (endMinutes > 24 * 60) {
          const nightShiftStart2 = 0;      // 00:00
          const nightShiftEnd2 = 8 * 60;   // 08:00
          const adjustedEndMinutes = endMinutes - 24 * 60; // 调整到第二天的时间
          
          const workStartInNightShift2 = nightShiftStart2;
          const workEndInNightShift2 = Math.min(adjustedEndMinutes, nightShiftEnd2);
          
          if (workStartInNightShift2 < workEndInNightShift2) {
            nightShiftMinutes += workEndInNightShift2 - workStartInNightShift2;
          }
        }
      
        // 如果工作时间从夜班开始（早于08:00），也需要考虑第二天的夜班部分
        if (startMinutes < 8 * 60 && endMinutes > 24 * 60) {
          const nightShiftStart2 = 0;      // 00:00
          const nightShiftEnd2 = 8 * 60;   // 08:00
          const adjustedEndMinutes = endMinutes - 24 * 60; // 调整到第二天的时间
          
          const workStartInNightShift2 = nightShiftStart2;
          const workEndInNightShift2 = Math.min(adjustedEndMinutes, nightShiftEnd2);
          
          if (workStartInNightShift2 < workEndInNightShift2) {
            nightShiftMinutes += workEndInNightShift2 - workStartInNightShift2;
          }
        }
        
        // 修正：如果工作时间完全在白班时间段内，则没有夜班时间
        if (startMinutes >= dayShiftStart && endMinutes <= dayShiftEnd) {
          nightShiftMinutes = 0;
        }
        
        // 修正：如果工作时间完全在夜班时间段内（第一天の夜班22:00-24:00），则没有白班時間
        if (startMinutes >= nightShiftStart1 && endMinutes <= nightShiftEnd1) {
          dayShiftMinutes = 0;
        }
        
        // 修正：如果工作时间完全在夜班时间段内（第二天の夜班00:00-08:00），则没有白班時間
        if (endMinutes > 24 * 60 && startMinutes >= 24 * 60 && (endMinutes - 24 * 60) <= 8 * 60) {
          const adjustedStartMinutes = startMinutes - 24 * 60;
          const adjustedEndMinutes = endMinutes - 24 * 60;
          if (adjustedStartMinutes >= 0 && adjustedEndMinutes <= 8 * 60) {
            dayShiftMinutes = 0;
          }
        }

        // 将分钟转换为小时
        let dayShiftHours = dayShiftMinutes / 60;
        let nightShiftHours = nightShiftMinutes / 60;

        // 考虑休息时长的影响
        // 修复：休息时长应该只从白班工时中扣除，而不是按比例分配到白班和夜班
        if (breakDuration > 0) {
          // 优先从白班工时中扣除休息时间
          if (dayShiftHours >= breakDuration) {
            // 如果白班工时足够扣除休息时间
            dayShiftHours -= breakDuration;
          } else {
            // 如果白班工时不够扣除休息时间
            // 先扣除所有白班工时
            const remainingBreak = breakDuration - dayShiftHours;
            dayShiftHours = 0;
            
            // 剩余的休息时间从夜班工时中扣除
            nightShiftHours = Math.max(0, nightShiftHours - remainingBreak);
          }
        }

        return {
          dayShiftHours: dayShiftHours,
          nightShiftHours: nightShiftHours
        };
      };
      
      const breakDuration = (schedule as any).break_duration || 0;
      const shiftHours = calculateShiftHours(schedule.start_time, schedule.end_time, breakDuration);
      const dayShiftHours = shiftHours.dayShiftHours;
      const nightShiftHours = shiftHours.nightShiftHours;
      const totalHours = dayShiftHours + nightShiftHours;
      
      const shopRate = shopRates.find(rate => rate.shop_name === shopName)
      const dayShiftRate = shopRate ? shopRate.day_shift_rate : 0
      const nightShiftRate = shopRate ? shopRate.night_shift_rate : 0
      
      const totalSalary = dayShiftHours * dayShiftRate + nightShiftHours * nightShiftRate
      
      if (!stats[shopName]) {
        stats[shopName] = {
          totalHours: 0,
          totalSalary: 0,
          dayShiftHours: 0,
          nightShiftHours: 0,
          totalBreakHours: 0 // 初始化总休息时长
        }
      }
      
      stats[shopName].totalHours += totalHours
      stats[shopName].totalSalary += totalSalary
      stats[shopName].dayShiftHours += dayShiftHours
      stats[shopName].nightShiftHours += nightShiftHours
      stats[shopName].totalBreakHours += breakDuration // 累加休息时长
    })
    
    return stats
  }, [schedules, shopRates])

  // 自定义日历样式
  const customCalendarStyles = `
    .react-calendar {
      width: 100%;
      border: none;
      border-radius: 1rem;
      background-color: #ffffff;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
      /* 启用硬件加速 */
      transform: translateZ(0);
      will-change: transform;
    }
    
    .react-calendar__navigation {
      margin-bottom: 1rem;
    }
    
    .react-calendar__navigation button {
      min-width: 44px;
      background: none;
      border: none;
      color: #5d504b;
      font-weight: 500;
      /* 优化按钮性能 */
      transform: translateZ(0);
      will-change: transform;
    }
    
    .react-calendar__navigation button:enabled:hover,
    .react-calendar__navigation button:enabled:focus {
      background-color: #f0eae4;
      border-radius: 0.5rem;
    }
    
    .react-calendar__month-view__weekdays {
      text-align: center;
      text-transform: uppercase;
      font-weight: 500;
      font-size: 0.75rem;
      color: #a89f9a;
    }
    
    .react-calendar__month-view__weekdays__weekday {
      padding: 0.5rem 0;
    }
    
    .react-calendar__tile {
      max-width: 100%;
      padding: 0.75rem 0.5rem;
      background: none;
      text-align: center;
      border-radius: 0.5rem;
      color: #5d504b;
      /* 优化瓷砖性能 */
      transform: translateZ(0);
      will-change: transform;
    }
    
    .react-calendar__tile:enabled:hover,
    .react-calendar__tile:enabled:focus {
      background-color: #f0eae4;
    }
    
    .react-calendar__tile--now {
      background-color: #c5b3a7;
      color: white;
    }
    
    .react-calendar__tile--now:enabled:hover,
    .react-calendar__tile--now:enabled:focus {
      background-color: #a89383;
      color: white;
    }
    
    .react-calendar__tile--hasActive {
      background-color: #f0eae4;
      color: #5d504b;
    }
    
    .react-calendar__tile--hasActive:enabled:hover,
    .react-calendar__tile--hasActive:enabled:focus {
      background-color: #c5b3a7;
    }
    
    .react-calendar__tile--active {
      background-color: #a89383;
      color: white;
    }
    
    .react-calendar__tile--active:enabled:hover,
    .react-calendar__tile--active:enabled:focus {
      background-color: #8b7d77;
    }
    
    .react-calendar--selectRange .react-calendar__tile--hover {
      background-color: #f0eae4;
    }
    
    /* 移动端优化 */
    @media (max-width: 768px) {
      .react-calendar {
        border-radius: 0.5rem;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
      }
      
      .react-calendar__tile {
        padding: 0.5rem 0.25rem;
        font-size: 0.875rem;
      }
    }
  `;

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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-cream-bg">
        {/* 自定义日历样式 */}
        <style>{customCalendarStyles}</style>
        
        {/* 顶部导航栏 */}
        <header className="bg-cream-card shadow-sm border-b border-cream-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <button 
                  onClick={() => router.push('/dashboard')}
                  className="text-cream-text-dark hover:text-cream-accent mr-4 mobile-optimized hover-effect"
                  aria-label="返回仪表板"
                >
                  <Suspense fallback={<span className="h-6 w-6" />}>
                    <BackIcon className="h-6 w-6" ariaHidden={false} />
                  </Suspense>
                </button>
                <h1 className="text-xl font-semibold text-cream-text-dark">个人排班表</h1>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={previewWeeklySchedule}
                  className="px-3 py-2 text-sm font-medium text-cream-text-dark bg-cream-border hover:bg-cream-bg rounded-lg transition duration-300 mobile-optimized hover-effect"
                  aria-label="预览周排班表"
                >
                  预览周排班
                </button>
                <button
                  onClick={exportWeeklyScheduleAsCSV}
                  className="px-3 py-2 text-sm font-medium text-cream-text-dark bg-cream-border hover:bg-cream-bg rounded-lg transition duration-300 mobile-optimized hover-effect"
                  aria-label="导出周排班表CSV"
                >
                  导出周排班(CSV)
                </button>
                <button
                  onClick={() => setShowSalaryForm(true)}
                  className="px-3 py-2 text-sm font-medium text-cream-text-dark bg-cream-border hover:bg-cream-bg rounded-lg transition duration-300 mobile-optimized hover-effect"
                  aria-label="工资设置"
                >
                  工资设置
                </button>
                <button
                  onClick={() => setShowForm(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-cream-accent hover:bg-cream-accent-hover rounded-lg transition duration-300 mobile-optimized hover-effect"
                  aria-label="添加排班"
                >
                  添加排班
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* 主内容区域 */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 日历区域 */}
            <div className="lg:col-span-2">
              <div className="bg-cream-card rounded-2xl shadow-sm p-6 border border-cream-border optimize-animation work-schedule-calendar">
                <h2 className="text-lg font-medium text-cream-text-dark mb-4 flex items-center">
                  <Suspense fallback={<span className="h-6 w-6 mr-2" />}>
                    <CalendarIcon className="h-6 w-6 mr-2" ariaHidden={false} />
                  </Suspense>
                  排班日历
                </h2>
                <div className="flex justify-center">
                  <Suspense fallback={<div className="text-center py-8 text-cream-text-dark">加载日历中...</div>}>
                    <Calendar
                      onChange={(value) => {
                        if (value instanceof Date) {
                          setSelectedDate(value);
                        }
                      }}
                      value={selectedDate}
                      className="border-0 rounded-lg w-full work-schedule-calendar"
                      tileClassName={({ date, view }) => {
                        const dateStr = formatDateForComparison(date);
                        const hasSchedule = schedules.some(schedule => schedule.work_date === dateStr)
                        return hasSchedule ? 'react-calendar__tile--hasActive' : ''
                      }}
                    />
                  </Suspense>
                </div>
              </div>
            </div>

            {/* 排班详情区域 */}
            <div>
              <div className="bg-cream-card rounded-2xl shadow-sm p-6 border border-cream-border mb-6 optimize-animation">
                <h2 className="text-lg font-medium text-cream-text-dark mb-4">
                  {selectedDate.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
                </h2>
                
                {schedulesForSelectedDate.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="bg-cream-border p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                      <Suspense fallback={<span className="h-6 w-6" />}>
                        <CalendarIcon className="h-6 w-6" ariaHidden={false} />
                      </Suspense>
                    </div>
                    <p className="text-cream-text-light">当天暂无排班</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {schedulesForSelectedDate.map(schedule => (
                      <ScheduleItem 
                        key={schedule.id} 
                        schedule={schedule} 
                        onEdit={handleEdit} 
                        onDelete={handleDelete}
                        shopRates={shopRates}
                        shiftRates={shiftRates}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* 工资统计区域 */}
              <div className="bg-cream-card rounded-2xl shadow-sm p-6 border border-cream-border optimize-animation">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium text-cream-text-dark">工资统计</h2>
                  {Object.keys(salaryStats).length > 0 && (
                    <div className="text-lg font-bold text-cream-text-dark">
                      合计: {Object.values(salaryStats).reduce((total, stats) => total + Math.round(stats.totalSalary), 0)}日元
                    </div>
                  )}
                </div>
                {Object.keys(salaryStats).length === 0 ? (
                  <p className="text-cream-text-light text-center py-4">暂无工资统计</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(salaryStats).map(([shopName, stats]) => {
                      const dayRate = Math.round(shopRates.find(rate => rate.shop_name === shopName)?.day_shift_rate || shiftRates.day_shift_rate);
                      const nightRate = Math.round(shopRates.find(rate => rate.shop_name === shopName)?.night_shift_rate || shiftRates.night_shift_rate);
                      const daySalary = Math.round(stats.dayShiftHours * dayRate);
                      const nightSalary = Math.round(stats.nightShiftHours * nightRate);
                      
                      return (
                        <div key={shopName} className="border-b border-cream-border pb-3 last:border-0 last:pb-0">
                          <div className="flex justify-between">
                            <span className="font-medium text-cream-text-dark">{shopName}</span>
                            <span className="text-cream-text">{Math.round(stats.totalSalary)}日元</span>
                          </div>
                          <div className="text-sm text-cream-text-light mt-1">
                            <div>总工时: {stats.totalHours.toFixed(1)} 小时</div>
                            <div>总休息时长: {stats.totalBreakHours?.toFixed(1) || '0.0'} 小时</div>
                            <div>白班: {stats.dayShiftHours.toFixed(1)}h × {dayRate}日元/小时 = {daySalary}日元</div>
                            <div>夜班: {stats.nightShiftHours.toFixed(1)}h × {nightRate}日元/小时 = {nightSalary}日元</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              

            </div>
          </div>
        </main>

        {/* 添加/编辑排班表单模态框 */}
        {showForm && (
          <div className="fixed inset-0 bg-cream-bg bg-opacity-80 flex justify-center p-4 z-50 modal-backdrop" style={{ alignItems: 'flex-start', paddingTop: '80px' }}>
            <div className="bg-cream-card rounded-2xl shadow-lg p-6 w-full max-w-md border border-cream-border modal-fullscreen-mobile optimize-animation">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-cream-text-dark">
                  {editingSchedule ? '编辑排班' : '添加排班'}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false)
                    setEditingSchedule(null)
                    setFormData({
                      shop_name: '',
                      work_date: formatDateForComparison(new Date()),
                      start_time: '09:00',
                      end_time: '17:00',
                      break_duration: 0
                    })
                  }}
                  className="text-cream-text-light hover:text-cream-text mobile-optimized hover-effect"
                  aria-label="关闭模态框"
                >
                  <Suspense fallback={<span className="h-6 w-6" />}>
                    <CloseIcon className="h-6 w-6" ariaHidden={false} />
                  </Suspense>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="shop_name" className="block text-sm font-medium text-cream-text-dark mb-2">
                    工作店铺 *
                  </label>
                  <input
                    id="shop_name"
                    name="shop_name"
                    type="text"
                    value={formData.shop_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-cream-border focus:outline-none focus:ring-2 focus:ring-cream-accent focus:border-transparent bg-cream-input text-cream-text mobile-optimized form-input"
                    placeholder="请输入店铺名称"
                    required
                    aria-required="true"
                  />
                </div>

                <div>
                  <label htmlFor="work_date" className="block text-sm font-medium text-cream-text-dark mb-2">
                    排班日期 *
                  </label>
                  <input
                    id="work_date"
                    name="work_date"
                    type="date"
                    value={formData.work_date}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-cream-border focus:outline-none focus:ring-2 focus:ring-cream-accent focus:border-transparent bg-cream-input text-cream-text mobile-optimized form-input"
                    required
                    aria-required="true"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="start_time" className="block text-sm font-medium text-cream-text-dark mb-2">
                      上班时间 *
                    </label>
                    <input
                      id="start_time"
                      name="start_time"
                      type="time"
                      value={formData.start_time}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-cream-border focus:outline-none focus:ring-2 focus:ring-cream-accent focus:border-transparent bg-cream-input text-cream-text mobile-optimized form-input"
                      required
                      aria-required="true"
                    />
                  </div>

                  <div>
                    <label htmlFor="end_time" className="block text-sm font-medium text-cream-text-dark mb-2">
                      下班时间 *
                    </label>
                    <input
                      id="end_time"
                      name="end_time"
                      type="time"
                      value={formData.end_time}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-cream-border focus:outline-none focus:ring-2 focus:ring-cream-accent focus:border-transparent bg-cream-input text-cream-text mobile-optimized form-input"
                      required
                      aria-required="true"
                    />
                  </div>
                </div>

                {/* 休息时长选择 */}
                <div>
                  <label htmlFor="break_duration" className="block text-sm font-medium text-cream-text-dark mb-2">
                    休息时长
                  </label>
                  <select
                    id="break_duration"
                    name="break_duration"
                    value={formData.break_duration}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-cream-border focus:outline-none focus:ring-2 focus:ring-cream-accent focus:border-transparent bg-cream-input text-cream-text mobile-optimized form-select"
                  >
                    <option value={0}>无休息</option>
                    <option value={0.5}>0.5小时</option>
                    <option value={1}>1小时</option>
                    <option value={1.5}>1.5小时</option>
                    <option value={2}>2小时</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      setEditingSchedule(null)
                      setFormData({
                        shop_name: '',
                        work_date: formatDateForComparison(new Date()),
                        start_time: '09:00',
                        end_time: '17:00',
                        break_duration: 0
                      })
                    }}
                    className="px-4 py-2 text-sm font-medium text-cream-text-dark bg-cream-border hover:bg-cream-bg rounded-lg transition duration-300 mobile-optimized hover-effect"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-cream-accent hover:bg-cream-accent-hover rounded-lg transition duration-300 mobile-optimized hover-effect"
                    disabled={isLoading}
                  >
                    {isLoading ? '保存中...' : (editingSchedule ? '更新' : '添加')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 预览模态框 */}
        {showPreview && (
          <div className="fixed inset-0 bg-cream-bg bg-opacity-80 flex justify-center items-center p-4 z-50 modal-backdrop">
            <div className="bg-cream-card rounded-2xl shadow-lg p-6 w-full max-w-4xl border border-cream-border modal-fullscreen-mobile optimize-animation">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-cream-text-dark">排班表预览</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={exportWeeklyScheduleAsImage}
                    className="px-4 py-2 text-sm font-medium text-white bg-cream-accent hover:bg-cream-accent-hover rounded-lg transition duration-300 mobile-optimized hover-effect"
                  >
                    导出为图片
                  </button>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="text-cream-text-light hover:text-cream-text mobile-optimized hover-effect"
                    aria-label="关闭预览"
                  >
                    <Suspense fallback={<span className="h-6 w-6" />}>
                      <CloseIcon className="h-6 w-6" ariaHidden={false} />
                    </Suspense>
                  </button>
                </div>
              </div>
              <div dangerouslySetInnerHTML={{ __html: previewContent }} />
            </div>
          </div>
        )}

        {/* 工资设置表单模态框 */}
        {showSalaryForm && (
          <div className="fixed inset-0 bg-cream-bg bg-opacity-80 flex justify-center p-4 z-50 modal-backdrop" style={{ alignItems: 'flex-start', paddingTop: '80px' }}>
            <div className="bg-cream-card rounded-2xl shadow-lg p-6 w-full max-w-md border border-cream-border modal-fullscreen-mobile optimize-animation">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-cream-text-dark">工资设置</h2>
                <button
                  onClick={() => {
                    setShowSalaryForm(false)
                    setSalaryFormData({
                      shop_name: '',
                      day_shift_rate: '',
                      night_shift_rate: ''
                    })
                  }}
                  className="text-cream-text-light hover:text-cream-text mobile-optimized hover-effect"
                  aria-label="关闭模态框"
                >
                  <Suspense fallback={<span className="h-6 w-6" />}>
                    <CloseIcon className="h-6 w-6" ariaHidden={false} />
                  </Suspense>
                </button>
              </div>

              <form onSubmit={handleSalarySubmit} className="space-y-4">
                <div>
                  <h3 className="text-md font-medium text-cream-text-dark mb-2">店铺时薪设置</h3>
                  <div>
                    <label htmlFor="salary_shop_name" className="block text-sm font-medium text-cream-text-dark mb-2">
                      店铺名称 *
                    </label>
                    <input
                      id="salary_shop_name"
                      name="shop_name"
                      type="text"
                      value={salaryFormData.shop_name}
                      onChange={handleSalaryInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-cream-border focus:outline-none focus:ring-2 focus:ring-cream-accent focus:border-transparent bg-cream-input text-cream-text mobile-optimized form-input"
                      placeholder="请输入店铺名称"
                    />
                  </div>

                  <div>
                    <label htmlFor="day_shift_rate" className="block text-sm font-medium text-cream-text-dark mb-2">
                      白班时薪 (8:00-22:00) *
                    </label>
                    <input
                      id="day_shift_rate"
                      name="day_shift_rate"
                      type="number"
                      step="1"
                      value={salaryFormData.day_shift_rate}
                      onChange={handleSalaryInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-cream-border focus:outline-none focus:ring-2 focus:ring-cream-accent focus:border-transparent bg-cream-input text-cream-text mobile-optimized form-input"
                      placeholder="请输入白班时薪"
                    />
                  </div>

                  <div>
                    <label htmlFor="night_shift_rate" className="block text-sm font-medium text-cream-text-dark mb-2">
                      夜班时薪 (22:00-8:00) *
                    </label>
                    <input
                      id="night_shift_rate"
                      name="night_shift_rate"
                      type="number"
                      step="1"
                      value={salaryFormData.night_shift_rate}
                      onChange={handleSalaryInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-cream-border focus:outline-none focus:ring-2 focus:ring-cream-accent focus:border-transparent bg-cream-input text-cream-text mobile-optimized form-input"
                      placeholder="请输入夜班时薪"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSalaryForm(false)
                      setSalaryFormData({
                        shop_name: '',
                        day_shift_rate: '',
                        night_shift_rate: ''
                      })
                    }}
                    className="px-4 py-2 text-sm font-medium text-cream-text-dark bg-cream-border hover:bg-cream-bg rounded-lg transition duration-300 mobile-optimized hover-effect"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-cream-accent hover:bg-cream-accent-hover rounded-lg transition duration-300 mobile-optimized hover-effect"
                  >
                    保存
                  </button>
                </div>
              </form>

              {shopRates.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-cream-text-dark mb-2">已设置的店铺时薪</h3>
                  <div className="space-y-3">
                    {shopRates.map(rate => (
                      <div key={rate.id} className="p-3 bg-cream-bg rounded-lg flex justify-between items-start">
                        <div>
                          <div className="font-medium text-cream-text-dark">{rate.shop_name}</div>
                          <div className="text-sm text-cream-text mt-1">
                            <p>白班时薪: {Math.round(rate.day_shift_rate)}日元/小时</p>
                            <p>夜班时薪: {Math.round(rate.night_shift_rate)}日元/小时</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteShopRate(rate.id, rate.shop_name)}
                          className="text-red-500 hover:text-red-700 flex items-center mobile-optimized hover-effect"
                          aria-label={`删除${rate.shop_name}的时薪设置`}
                        >
                          <Suspense fallback={<span className="h-5 w-5" />}>
                            <DeleteIcon className="h-5 w-5" ariaHidden={false} />
                          </Suspense>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}

// 排班项组件
const ScheduleItem = React.memo(({ 
  schedule, 
  onEdit, 
  onDelete,
  shopRates,
  shiftRates
}: { 
  schedule: WorkSchedule; 
  onEdit: (schedule: WorkSchedule) => void; 
  onDelete: (id: string) => void;
  shopRates: ShopHourlyRate[];
  shiftRates: { day_shift_rate: number; night_shift_rate: number };
}) => {
  const calculateWorkHours = (start: string, end: string, breakDuration: number = 0) => {
    // 处理24:00的特殊情况
    const normalizedEnd = end === '24:00' ? '00:00' : end;
    
    const startDate = new Date(`1970-01-01T${start}`);
    const endDate = new Date(`1970-01-01T${normalizedEnd}`);
    
    // 处理跨天情况
    if (endDate < startDate || end === '24:00' || (start !== '00:00' && end === '00:00')) {
      endDate.setDate(endDate.getDate() + 1);
    }
    
    const totalHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    
    // 减去休息时长
    const actualWorkHours = totalHours - breakDuration;
    
    return actualWorkHours > 0 ? actualWorkHours : 0;
  };

  // 总是使用我们修复后的计算函数来确保准确性
  const workHours = useMemo(() => {
    return calculateWorkHours(schedule.start_time, schedule.end_time, (schedule as any).break_duration || 0);
  }, [schedule.start_time, schedule.end_time, (schedule as any).break_duration]);

  const calculateSalary = () => {
    const shopRate = shopRates.find(rate => rate.shop_name === schedule.shop_name);
    const dayShiftRate = shopRate ? shopRate.day_shift_rate : shiftRates.day_shift_rate;
    const nightShiftRate = shopRate ? shopRate.night_shift_rate : shiftRates.night_shift_rate;
    
    // 使用更精确的班次时间计算算法，并考虑休息时长
    const calculateShiftHours = (startTime: string, endTime: string, breakDuration: number = 0) => {
      // 将时间转换为分钟数
      const parseTimeToMinutes = (time: string): number => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
      };

      let startMinutes = parseTimeToMinutes(startTime);
      let endMinutes = parseTimeToMinutes(endTime);

      // 处理跨天情况
      if (endMinutes <= startMinutes) {
        endMinutes += 24 * 60; // 加24小时
      }

      // 白班时间段：08:00-22:00 (480-1320分钟)
      const dayShiftStart = 8 * 60;    // 08:00
      const dayShiftEnd = 22 * 60;     // 22:00

      let dayShiftMinutes = 0;
      let nightShiftMinutes = 0;

      // 计算与白班时间段的交集
      const workStartInDayShift = Math.max(startMinutes, dayShiftStart);
      const workEndInDayShift = Math.min(endMinutes, dayShiftEnd);
      
      if (workStartInDayShift < workEndInDayShift) {
        dayShiftMinutes = workEndInDayShift - workStartInDayShift;
      }

      // 计算与夜班时间段的交集
      // 夜班时间段：22:00-08:00，分为两部分：
      // 1. 当天22:00-24:00 (1320-1440分钟)
      const nightShiftStart1 = 22 * 60;  // 22:00
      const nightShiftEnd1 = 24 * 60;    // 24:00
      
      const workStartInNightShift1 = Math.max(startMinutes, nightShiftStart1);
      const workEndInNightShift1 = Math.min(endMinutes, nightShiftEnd1);
      
      if (workStartInNightShift1 < workEndInNightShift1) {
        nightShiftMinutes += workEndInNightShift1 - workStartInNightShift1;
      }
      
      // 2. 第二天00:00-08:00 (0-480分钟)
      // 只有当工作时间跨天时才需要考虑这部分
      if (endMinutes > 24 * 60) {
        const nightShiftStart2 = 0;      // 00:00
        const nightShiftEnd2 = 8 * 60;   // 08:00
        const adjustedEndMinutes = endMinutes - 24 * 60; // 调整到第二天的时间
        
        const workStartInNightShift2 = nightShiftStart2;
        const workEndInNightShift2 = Math.min(adjustedEndMinutes, nightShiftEnd2);
        
        if (workStartInNightShift2 < workEndInNightShift2) {
          nightShiftMinutes += workEndInNightShift2 - workStartInNightShift2;
        }
      }
      
      // 如果工作时间从夜班开始（早于08:00），也需要考虑第二天的夜班部分
      if (startMinutes < 8 * 60 && endMinutes > 24 * 60) {
        const nightShiftStart2 = 0;      // 00:00
        const nightShiftEnd2 = 8 * 60;   // 08:00
        const adjustedEndMinutes = endMinutes - 24 * 60; // 调整到第二天的时间
        
        const workStartInNightShift2 = nightShiftStart2;
        const workEndInNightShift2 = Math.min(adjustedEndMinutes, nightShiftEnd2);
        
        if (workStartInNightShift2 < workEndInNightShift2) {
          nightShiftMinutes += workEndInNightShift2 - workStartInNightShift2;
        }
      }
      
      // 修正：如果工作时间完全在白班时间段内，则没有夜班时间
      if (startMinutes >= dayShiftStart && endMinutes <= dayShiftEnd) {
        nightShiftMinutes = 0;
      }
      
      // 修正：如果工作时间完全在夜班时间段内（第一天の夜班22:00-24:00），则没有白班時間
      if (startMinutes >= nightShiftStart1 && endMinutes <= nightShiftEnd1) {
        dayShiftMinutes = 0;
      }
      
      // 修正：如果工作时间完全在夜班时间段内（第二天の夜班00:00-08:00），则没有白班時間
      if (endMinutes > 24 * 60 && startMinutes >= 24 * 60 && (endMinutes - 24 * 60) <= 8 * 60) {
        const adjustedStartMinutes = startMinutes - 24 * 60;
        const adjustedEndMinutes = endMinutes - 24 * 60;
        if (adjustedStartMinutes >= 0 && adjustedEndMinutes <= 8 * 60) {
          dayShiftMinutes = 0;
        }
      }

      // 将分钟转换为小时
      let dayShiftHours = dayShiftMinutes / 60;
      let nightShiftHours = nightShiftMinutes / 60;

      // 考虑休息时长的影响
      // 修复：休息时长应该只从白班工时中扣除，而不是按比例分配到白班和夜班
      if (breakDuration > 0) {
        // 优先从白班工时中扣除休息时间
        if (dayShiftHours >= breakDuration) {
          // 如果白班工时足够扣除休息时间
          dayShiftHours -= breakDuration;
        } else {
          // 如果白班工时不够扣除休息时间
          // 先扣除所有白班工时
          const remainingBreak = breakDuration - dayShiftHours;
          dayShiftHours = 0;
          
          // 剩余的休息时间从夜班工时中扣除
          nightShiftHours = Math.max(0, nightShiftHours - remainingBreak);
        }
      }

      return {
        dayShiftHours: dayShiftHours,
        nightShiftHours: nightShiftHours
      };
    };
    
    const breakDuration = (schedule as any).break_duration || 0;
    const shiftHours = calculateShiftHours(schedule.start_time, schedule.end_time, breakDuration);
    const dayShiftHours = shiftHours.dayShiftHours;
    const nightShiftHours = shiftHours.nightShiftHours;
    const totalSalary = dayShiftHours * dayShiftRate + nightShiftHours * nightShiftRate;
    
    return {
      totalSalary,
      dayShiftHours,
      nightShiftHours,
      dayShiftRate,
      nightShiftRate
    };
  };
  
  const salaryDetails = useMemo(() => calculateSalary(), [workHours, schedule.shop_name, shopRates, shiftRates]);

  // 格式化时间显示为 HH:MM
  const formatTime = (time: string): string => {
    if (!time) return '';
    
    // 统一格式化为 HH:MM 格式
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(time)) {
      const [hours, minutes] = time.split(':');
      return `${hours.padStart(2, '0')}:${minutes}`;
    }
    
    // 其他情况返回原始时间
    return time;
  };

  return (
    <div className="border border-cream-border rounded-xl p-4 hover:shadow-md transition duration-300 bg-cream-card optimize-animation mobile-optimized hover-effect">
      <div className="flex justify-between">
        <div>
          <h3 className="font-medium text-cream-text-dark">{schedule.shop_name}</h3>
          <p className="text-cream-text-light text-sm mt-1">
            {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
          </p>
          <div className="flex items-center mt-2 text-sm text-cream-text">
            <Suspense fallback={<span className="h-4 w-4 mr-1" />}>
              <ClockIcon className="h-4 w-4 mr-1" ariaHidden={false} />
            </Suspense>
            工作时长: {workHours.toFixed(1)} 小时
          </div>
          <div className="flex items-center mt-1 text-sm text-cream-text">
            <Suspense fallback={<span className="h-4 w-4 mr-1" />}>
              <CurrencyIcon className="h-4 w-4 mr-1" ariaHidden={false} />
            </Suspense>
            工资: {Math.round(salaryDetails.totalSalary)}日元
          </div>
          <div className="text-xs text-cream-text-light mt-1">
            <div>白班: {salaryDetails.dayShiftHours.toFixed(1)}h × {Math.round(salaryDetails.dayShiftRate)}日元/小时 = {Math.round(salaryDetails.dayShiftHours * salaryDetails.dayShiftRate)}日元</div>
            <div>夜班: {salaryDetails.nightShiftHours.toFixed(1)}h × {Math.round(salaryDetails.nightShiftRate)}日元/小时 = {Math.round(salaryDetails.nightShiftHours * salaryDetails.nightShiftRate)}日元</div>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(schedule)}
            className="text-cream-accent hover:text-cream-accent-hover mobile-optimized hover-effect"
            aria-label={`编辑${schedule.shop_name}的排班`}
          >
            <Suspense fallback={<span className="h-5 w-5" />}>
              <EditIcon className="h-5 w-5" ariaHidden={false} />
            </Suspense>
          </button>
          <button
            onClick={() => onDelete(schedule.id)}
            className="text-red-500 hover:text-red-700 mobile-optimized hover-effect"
            aria-label={`删除${schedule.shop_name}的排班`}
          >
            <Suspense fallback={<span className="h-5 w-5" />}>
              <DeleteIcon className="h-5 w-5" ariaHidden={false} />
            </Suspense>
          </button>
        </div>
      </div>
    </div>
  )
})
