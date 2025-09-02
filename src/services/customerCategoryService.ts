import { supabase } from '@/supabaseClient'

export type CustomerCategoryId = string

function arabicToId(label: string): string | null {
  const normalized = (label || '').toString().trim()
  if (normalized === 'شركات') return 'companies'
  if (normalized === 'مسوق' || normalized === 'مسوقين') return 'marketers'
  if (normalized === 'عادي' || normalized === 'أفراد') return 'individuals'
  return null
}

export const customerCategoryService = {
  async getCategories(): Promise<{ id: string; label: string }[]> {
    try {
      if (supabase) {
        // Try normalized schema
        let used = false
        try {
          const { data, error } = await supabase.from('pricing').select('customer_type')
          if (!error && Array.isArray(data) && data.length) {
            const ids = Array.from(new Set(data.map((r: any) => (r?.customer_type || '').toString().trim()).filter(Boolean))) as string[]
            if (ids.length) {
              used = true
              return ids.map((id) => ({ id, label: id }))
            }
          }
        } catch {}
        // Fallback Arabic column
        if (!used) {
          const { data: dataAr, error: errAr } = await supabase.from('pricing').select('الزبون')
          if (!errAr && Array.isArray(dataAr)) {
            const labels = Array.from(new Set(dataAr.map((row: any) => (row?.['الزبون'] || '').toString().trim()).filter(Boolean)))
            const mapped = labels
              .map((label) => {
                const id = arabicToId(label)
                if (!id) return null
                return { id, label }
              })
              .filter(Boolean) as { id: string; label: string }[]
            return mapped
          }
        }
      }
    } catch {}
    try {
      const { pricingService } = await import('@/services/pricingService')
      const pricing = pricingService.getPricing()
      const zoneKeys = Object.values(pricing.zones || {})
      const ids = Array.from(new Set(zoneKeys.flatMap((z: any) => Object.keys(z?.prices || {}))))
      return ids.map((id) => ({ id, label: id }))
    } catch {
      return []
    }
  },
}
