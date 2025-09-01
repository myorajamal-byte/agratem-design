import { createClient } from '@supabase/supabase-js'

export type ArabicPricingRow = {
  المقاس: string
  المستوى: string // 'A' | 'B'
  الزبون: string // 'شركات' | 'أفراد' | 'مسوقين'
  'شهر واحد'?: number | null
  '2 أشهر'?: number | null
  '3 أشهر'?: number | null
  '6 أشهر'?: number | null
  'سنة كاملة'?: number | null
  'يوم واحد'?: number | null
}

const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) || ''
const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || ''
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

export const arabicPricingTable = {
  async getRows(): Promise<ArabicPricingRow[]> {
    if (!supabase) return []
    const select = '"المقاس","المستوى","الزبون","شهر واحد","2 أشهر","3 أشهر","6 أشهر","سنة كاملة","يوم واحد"'
    const { data, error } = await supabase.from('pricing').select(select)
    if (error || !data) return []
    return data as unknown as ArabicPricingRow[]
  },
}
