import { supabase } from '@/lib/supabaseClient'
import { Barcode } from '@/types/supabase'

// 条形码服务接口
export interface BarcodeData {
  barcode_value: string
  barcode_type: string
  product_name?: string
  product_description?: string
  product_price?: number
  product_category?: string
  product_image_url?: string
}

// 导出Barcode类型
export type { Barcode }

// 获取用户的所有条形码记录
export const getUserBarcodes = async (userId: string): Promise<{ data: Barcode[] | null, error: any }> => {
  const { data, error } = await supabase
    .from('barcodes')
    .select('*')
    .eq('user_id', userId)
    .order('scanned_at', { ascending: false })
  
  return { data, error }
}

// 根据条形码值获取条形码信息
export const getBarcodeByValue = async (userId: string, barcodeValue: string): Promise<{ data: Barcode | null, error: any }> => {
  const { data, error } = await supabase
    .from('barcodes')
    .select('*')
    .eq('user_id', userId)
    .eq('barcode_value', barcodeValue)
    .single()
  
  return { data, error }
}

// 创建新的条形码记录
export const createBarcode = async (userId: string, barcodeData: BarcodeData): Promise<{ data: Barcode | null, error: any }> => {
  const { data, error } = await supabase
    .from('barcodes')
    .insert([{
      user_id: userId,
      ...barcodeData
    }])
    .select()
    .single()
  
  return { data, error }
}

// 更新条形码记录
export const updateBarcode = async (id: string, updates: Partial<BarcodeData>): Promise<{ data: Barcode | null, error: any }> => {
  const { data, error } = await supabase
    .from('barcodes')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  
  return { data, error }
}

// 删除条形码记录
export const deleteBarcode = async (id: string): Promise<{ data: null, error: any }> => {
  const { data, error } = await supabase
    .from('barcodes')
    .delete()
    .eq('id', id)
  
  return { data, error }
}