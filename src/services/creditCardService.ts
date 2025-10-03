import { supabase } from '@/lib/supabaseClient'

export interface CreditCard {
  id: string
  user_id: string
  card_name: string
  card_number_last_4: string
  total_amount: number
  monthly_payment: number
  payment_date: string // YYYY-MM-DD格式
  paid_amount: number
  periods: number
  card_type: string // 'installment'(分期) 或 'non_installment'(不分期)
  created_at: string
  updated_at: string
}

// 获取用户的所有信用卡
export const getCreditCards = async (userId: string): Promise<CreditCard[]> => {
  const { data, error } = await supabase
    .from('credit_cards')
    .select('*')
    .eq('user_id', userId)
    .order('payment_date', { ascending: true })

  if (error) {
    console.error('获取信用卡列表失败:', error)
    throw new Error('获取信用卡列表失败')
  }

  return data || []
}

// 添加新信用卡
export const addCreditCard = async (card: Omit<CreditCard, 'id' | 'created_at' | 'updated_at' | 'user_id'>, userId: string) => {
  const { data, error } = await supabase
    .from('credit_cards')
    .insert({
      ...card,
      user_id: userId
    })
    .select()
    .single()

  if (error) {
    console.error('添加信用卡失败:', error)
    throw new Error('添加信用卡失败')
  }

  return data
}

// 更新信用卡信息
export const updateCreditCard = async (id: string, card: Partial<Omit<CreditCard, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
  const { data, error } = await supabase
    .from('credit_cards')
    .update(card)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('更新信用卡失败:', error)
    throw new Error('更新信用卡失败')
  }

  return data
}

// 删除信用卡
export const deleteCreditCard = async (id: string) => {
  const { error } = await supabase
    .from('credit_cards')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('删除信用卡失败:', error)
    throw new Error('删除信用卡失败')
  }

  return true
}

// 获取即将到期的信用卡（未来30天内）
export const getUpcomingPayments = async (userId: string, days: number = 30): Promise<CreditCard[]> => {
  const today = new Date()
  const futureDate = new Date()
  futureDate.setDate(today.getDate() + days)

  const { data, error } = await supabase
    .from('credit_cards')
    .select('*')
    .eq('user_id', userId)
    .gte('payment_date', today.toISOString().split('T')[0])
    .lte('payment_date', futureDate.toISOString().split('T')[0])
    .order('payment_date', { ascending: true })

  if (error) {
    console.error('获取即将到期的信用卡失败:', error)
    throw new Error('获取即将到期的信用卡失败')
  }

  return data || []
}