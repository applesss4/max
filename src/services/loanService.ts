import { supabase } from '@/lib/supabaseClient'

export interface Loan {
  id: string
  user_id: string
  loan_name: string
  loan_type: string
  total_amount: number
  monthly_payment: number
  payment_date: string // YYYY-MM-DD格式
  paid_amount: number
  periods: number
  interest_rate: number
  start_date: string
  end_date: string
  created_at: string
  updated_at: string
}

// 获取用户的所有贷款
export const getLoans = async (userId: string): Promise<Loan[]> => {
  const { data, error } = await supabase
    .from('loans')
    .select('*')
    .eq('user_id', userId)
    .order('payment_date', { ascending: true })

  if (error) {
    console.error('获取贷款列表失败:', error)
    throw new Error('获取贷款列表失败')
  }

  return data || []
}

// 添加新贷款
export const addLoan = async (loan: Omit<Loan, 'id' | 'created_at' | 'updated_at' | 'user_id'>, userId: string) => {
  const { data, error } = await supabase
    .from('loans')
    .insert({
      ...loan,
      user_id: userId
    })
    .select()
    .single()

  if (error) {
    console.error('添加贷款失败:', error)
    throw new Error('添加贷款失败')
  }

  return data
}

// 更新贷款信息
export const updateLoan = async (id: string, loan: Partial<Omit<Loan, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
  const { data, error } = await supabase
    .from('loans')
    .update(loan)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('更新贷款失败:', error)
    throw new Error('更新贷款失败')
  }

  return data
}

// 删除贷款
export const deleteLoan = async (id: string) => {
  const { error } = await supabase
    .from('loans')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('删除贷款失败:', error)
    throw new Error('删除贷款失败')
  }

  return true
}

// 获取即将到期的贷款（未来30天内）
export const getUpcomingLoanPayments = async (userId: string, days: number = 30): Promise<Loan[]> => {
  const today = new Date()
  const futureDate = new Date()
  futureDate.setDate(today.getDate() + days)

  const { data, error } = await supabase
    .from('loans')
    .select('*')
    .eq('user_id', userId)
    .gte('payment_date', today.toISOString().split('T')[0])
    .lte('payment_date', futureDate.toISOString().split('T')[0])
    .order('payment_date', { ascending: true })

  if (error) {
    console.error('获取即将到期的贷款失败:', error)
    throw new Error('获取即将到期的贷款失败')
  }

  return data || []
}