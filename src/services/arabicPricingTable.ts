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

function customerEnToArabic(id: string): string {
  if (id === 'companies') return 'شركات'
  if (id === 'marketers') return 'مسوق'
  return 'عادي'
}

function durationToColumn(value: number): keyof ArabicPricingRow {
  if (value === 1) return 'يوم واحد'
  if (value === 30) return 'شهر واحد'
  if (value === 60) return '2 أشهر'
  if (value === 90) return '3 أشهر'
  if (value === 180) return '6 أشهر'
  return 'سنة كاملة'
}

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

  async upsertCell(size: string, level: string, customerId: 'companies'|'individuals'|'marketers', durationValue: number, price: number): Promise<boolean> {
    try {
      const customerAr = customerEnToArabic(customerId)
      const col = durationToColumn(durationValue)

      if (supabase) {
        // Fetch existing row
        const { data } = await supabase.from('pricing')
          .select('*')
          .eq('المقاس', size)
          .eq('المستوى', level)
          .eq('الزبون', customerAr)
          .maybeSingle()
        if (data) {
          const update: any = {}
          update[col as any] = price
          const { error } = await supabase.from('pricing')
            .update(update)
            .eq('المقاس', size)
            .eq('المستوى', level)
            .eq('الزبون', customerAr)
          return !error
        } else {
          const row: any = { 'المقاس': size, 'المستوى': level, 'الزبون': customerAr, 'شهر واحد': null, '2 أشهر': null, '3 أشهر': null, '6 أشهر': null, 'سنة كاملة': null, 'يوم واحد': null }
          row[col as any] = price
          const { error } = await supabase.from('pricing').insert(row)
          return !error
        }
      }

      // LocalStorage fallback
      const rows = await this.getRows()
      const idx = rows.findIndex(r => (r['المقاس']||'').toString().trim() === size && (r['المستوى']||'').toString().trim().toUpperCase() === level.toUpperCase() && (r['الزبون']||'').toString().trim() === customerAr)
      if (idx >= 0) {
        (rows[idx] as any)[col] = price
      } else {
        const newRow: any = { 'المقاس': size, 'المستوى': level, 'الزبون': customerAr, 'شهر واحد': null, '2 أشهر': null, '3 أشهر': null, '6 أشهر': null, 'سنة كاملة': null, 'يوم واحد': null }
        newRow[col] = price
        rows.push(newRow)
      }
      localStorage.setItem('external_arabic_pricing_rows', JSON.stringify(rows))
      return true
    } catch {
      return false
    }
  }
}
