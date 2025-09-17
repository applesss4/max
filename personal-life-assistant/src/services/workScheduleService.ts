import { supabase } from '@/lib/supabaseClient'

// 排班数据类型
export interface WorkSchedule {
  id: string
  user_id: string
  shop_name: string
  work_date: string // YYYY-MM-DD格式的日期字符串
  start_time: string // HH:MM格式的时间字符串
  end_time: string // HH:MM格式的时间字符串
  break_duration: number | null // 休息时长（小时）
  duration: number | null // 工作时长（小时）
  hourly_rate: number | null // 时薪
  created_at: string // ISO格式的时间字符串
  updated_at: string // ISO格式的时间字符串
}

// 店铺时薪类型
export interface ShopHourlyRate {
  id: string
  user_id: string
  shop_name: string
  day_shift_rate: number // 白班时薪（8:00-22:00）
  night_shift_rate: number // 夜班时薪（22:00-8:00）
  created_at: string // ISO格式的时间字符串
  updated_at: string // ISO格式的时间字符串
}

// 创建排班参数类型
export interface CreateWorkScheduleParams {
  user_id: string
  shop_name: string
  work_date: string
  start_time: string
  end_time: string
  break_duration?: number // 休息时长（小时）
}

// 更新排班参数类型
export interface UpdateWorkScheduleParams {
  shop_name?: string
  work_date?: string
  start_time?: string
  end_time?: string
  break_duration?: number // 休息时长（小时）
  hourly_rate?: number
}

// 创建店铺时薪参数类型
export interface CreateShopHourlyRateParams {
  user_id: string
  shop_name: string
  day_shift_rate: number // 白班时薪
  night_shift_rate: number // 夜班时薪
}

// 更新店铺时薪参数类型
export interface UpdateShopHourlyRateParams {
  shop_name?: string
  day_shift_rate?: number // 白班时薪
  night_shift_rate?: number // 夜班时薪
}

// 获取用户排班数据
export const getUserWorkSchedules = async (userId: string): Promise<{ data: WorkSchedule[] | null, error: any }> => {
  try {
    const { data, error } = await supabase
      .from('work_schedules')
      .select(`
        id,
        user_id,
        shop_name,
        work_date,
        start_time,
        end_time,
        break_duration,
        duration,
        hourly_rate,
        created_at,
        updated_at
      `)
      .eq('user_id', userId)
      .order('work_date', { ascending: false })
      // 限制返回的数据量以提高性能
      .limit(200)
    
    return { data, error }
  } catch (error) {
    console.error('获取排班数据失败:', error)
    return { data: null, error }
  }
}

// 创建排班
export const createWorkSchedule = async (schedule: CreateWorkScheduleParams): Promise<{ data: WorkSchedule | null, error: any }> => {
  try {
    // 计算工作时长（考虑休息时间）
    // 处理24:00的特殊情况
    const normalizedEndTime = schedule.end_time === '24:00' ? '00:00' : schedule.end_time;
    
    const startTime = new Date(`1970-01-01T${schedule.start_time}`)
    const endTime = new Date(`1970-01-01T${normalizedEndTime}`)
    
    // 如果是跨天工作（结束时间小于开始时间），加上24小时
    if (endTime < startTime || schedule.end_time === '24:00' || (schedule.start_time !== '00:00' && schedule.end_time === '00:00')) {
      endTime.setDate(endTime.getDate() + 1)
    }
    
    let duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
    
    // 减去休息时间
    const breakDuration = schedule.break_duration || 0
    duration = Math.max(0, duration - breakDuration)
    
    const newSchedule = {
      user_id: schedule.user_id,
      shop_name: schedule.shop_name,
      work_date: schedule.work_date,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      break_duration: breakDuration,
      duration: duration,
      hourly_rate: null
    }

    const result: any = await supabase
      .from('work_schedules')
      .insert([newSchedule])
      .select()
      .single()
    
    return result
  } catch (error) {
    console.error('创建排班失败:', error)
    return { data: null, error }
  }
}

// 更新排班
export const updateWorkSchedule = async (id: string, updates: UpdateWorkScheduleParams): Promise<{ data: WorkSchedule | null, error: any }> => {
  try {
    // 如果同时更新了开始和结束时间，重新计算工作时长（考虑休息时间）
    let durationUpdates: { duration?: number } = {}
    if (updates.start_time && updates.end_time) {
      // 处理24:00的特殊情况
      const normalizedEndTime = updates.end_time === '24:00' ? '00:00' : updates.end_time;
      
      const startTime = new Date(`1970-01-01T${updates.start_time}`)
      const endTime = new Date(`1970-01-01T${normalizedEndTime}`)
      
      // 如果是跨天工作（结束时间小于开始时间），加上24小时
      if (endTime < startTime || updates.end_time === '24:00' || (updates.start_time !== '00:00' && updates.end_time === '00:00')) {
        endTime.setDate(endTime.getDate() + 1)
      }
      
      let duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
      
      // 减去休息时间
      const breakDuration = updates.break_duration !== undefined ? updates.break_duration : 0
      duration = Math.max(0, duration - breakDuration)
      
      durationUpdates = { duration: duration }
    }
    
    // 合并更新对象
    const updateData = {
      ...updates,
      ...durationUpdates,
      updated_at: new Date().toISOString()
    }
    
    const result: any = await supabase
      .from('work_schedules')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    return result
  } catch (error) {
    console.error('更新排班失败:', error)
    return { data: null, error }
  }
}

// 删除排班
export const deleteWorkSchedule = async (id: string): Promise<{ data: null, error: any }> => {
  try {
    const result: any = await supabase
      .from('work_schedules')
      .delete()
      .eq('id', id)
    
    return result
  } catch (error) {
    console.error('删除排班失败:', error)
    return { data: null, error }
  }
}

// 获取店铺时薪数据
export const getShopHourlyRates = async (userId: string): Promise<{ data: ShopHourlyRate[] | null, error: any }> => {
  try {
    const { data, error } = await supabase
      .from('shop_hourly_rates')
      .select(`
        id,
        user_id,
        shop_name,
        day_shift_rate,
        night_shift_rate,
        created_at,
        updated_at
      `)
      .eq('user_id', userId)
      .order('shop_name', { ascending: true })
      // 限制返回的数据量以提高性能
      .limit(50)
    
    return { data, error }
  } catch (error) {
    console.error('获取店铺时薪数据失败:', error)
    return { data: null, error }
  }
}

// 创建店铺时薪设置
export const createShopHourlyRate = async (rate: CreateShopHourlyRateParams): Promise<{ data: ShopHourlyRate | null, error: any }> => {
  try {
    const newRate = {
      user_id: rate.user_id,
      shop_name: rate.shop_name,
      day_shift_rate: rate.day_shift_rate,
      night_shift_rate: rate.night_shift_rate
    }
    
    const result: any = await supabase
      .from('shop_hourly_rates')
      .insert([newRate])
      .select()
      .single()
    
    return result
  } catch (error) {
    console.error('创建店铺时薪设置失败:', error)
    return { data: null, error }
  }
}

// 更新店铺时薪设置
export const updateShopHourlyRate = async (id: string, updates: UpdateShopHourlyRateParams): Promise<{ data: ShopHourlyRate | null, error: any }> => {
  try {
    // 合并更新对象
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    }
    
    const result: any = await supabase
      .from('shop_hourly_rates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    return result
  } catch (error) {
    console.error('更新店铺时薪设置失败:', error)
    return { data: null, error }
  }
}

// 删除店铺时薪设置
export const deleteShopHourlyRate = async (id: string): Promise<{ data: null, error: any }> => {
  try {
    const result: any = await supabase
      .from('shop_hourly_rates')
      .delete()
      .eq('id', id)
    
    return result
  } catch (error) {
    console.error('删除店铺时薪设置失败:', error)
    return { data: null, error }
  }
}