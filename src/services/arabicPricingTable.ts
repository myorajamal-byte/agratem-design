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
    // 1) Try Supabase
    if (supabase) {
      const select = '"المقاس","المستوى","الزبون","شهر واحد","2 أشهر","3 أشهر","6 أشهر","سنة كاملة","يوم واحد"'
      const { data, error } = await supabase.from('pricing').select(select)
      if (!error && data && data.length > 0) {
        return data as unknown as ArabicPricingRow[]
      }
    }

    // 2) Try localStorage
    try {
      const ls = localStorage.getItem('external_arabic_pricing_rows')
      if (ls) {
        const parsed = JSON.parse(ls)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed as ArabicPricingRow[]
      }
    } catch {}

    // 3) Try window global
    try {
      const w: any = typeof window !== 'undefined' ? window : null
      if (w && Array.isArray(w.ARABIC_PRICING_ROWS) && w.ARABIC_PRICING_ROWS.length > 0) {
        return w.ARABIC_PRICING_ROWS as ArabicPricingRow[]
      }
    } catch {}

    return []
  },
}
