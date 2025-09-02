import { supabase } from '@/supabaseClient'

export type ArabicPricingRow = {
  المقاس: string
  المستوى: string
  الزبون: string // 'شركات' | 'أفراد' | 'عادي' | 'مسوق'
  'شهر واحد'?: number | null
  '2 أشهر'?: number | null
  '3 أشهر'?: number | null
  '6 أشهر'?: number | null
  'سنة كاملة'?: number | null
  'يوم واحد'?: number | null
}

const STORAGE_KEY = 'external_arabic_pricing_rows'

function customerEnToArabic(id: 'companies' | 'individuals' | 'marketers'): string {
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
    try {
      if (supabase) {
        // Prefer Arabic-structured table
        const { data, error } = await supabase.from('pricing_ar').select('*')
        if (!error && data) {
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch {}
          return data as unknown as ArabicPricingRow[]
        }
        // Fallback to legacy table name if exists
        const { data: dataLegacy, error: errLegacy } = await supabase.from('pricing').select('*')
        if (!errLegacy && dataLegacy) {
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(dataLegacy)) } catch {}
          return dataLegacy as unknown as ArabicPricingRow[]
        }
      }
    } catch (e) {
      console.warn('Supabase error, fallback to localStorage', e)
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as ArabicPricingRow[]) : []
    } catch {
      return []
    }
  },

  async upsertCell(
    size: string,
    level: string,
    customer: 'companies' | 'individuals' | 'marketers',
    duration: number,
    value: number
  ): Promise<boolean> {
    try {
      const customerArabic = customerEnToArabic(customer)
      const column = durationToColumn(duration)

      if (supabase) {
        const { error } = await supabase.from('pricing_ar').upsert({
          المقاس: size,
          المستوى: level,
          الزبون: customerArabic,
          [column]: value,
        } as any)
        if (!error) return true
        try { console.error('Supabase upsert failed', JSON.stringify(error)) } catch { console.error('Supabase upsert failed', error) }
      }

      // Fallback to localStorage
      const rows = await this.getRows()
      const idx = rows.findIndex(
        (r) =>
          (r['المقاس'] || '').toString().trim() === size &&
          (r['المستوى'] || '').toString().trim() === level &&
          (r['الزبون'] || '').toString().trim() === customerArabic
      )
      if (idx >= 0) {
        ;(rows[idx] as any)[column] = value
      } else {
        rows.push({
          المقاس: size,
          المستوى: level,
          الزبون: customerArabic,
          'شهر واحد': null,
          '2 أشهر': null,
          '3 أشهر': null,
          '6 أشهر': null,
          'سنة كاملة': null,
          'يوم واحد': null,
          [column]: value,
        } as any)
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rows))
      return true
    } catch (e) {
      console.error('arabicPricingTable.upsertCell error', e)
      return false
    }
  },
}
