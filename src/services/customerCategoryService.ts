import { supabase } from '@/supabaseClient'

export type CustomerCategoryId = 'companies' | 'individuals' | 'marketers'

const DEFAULTS: { id: CustomerCategoryId; label: string }[] = [
  { id: 'individuals', label: 'عادي' },
  { id: 'marketers', label: 'مسوق' },
  { id: 'companies', label: 'شركات' },
]

function arabicToId(label: string): CustomerCategoryId | null {
  const normalized = (label || '').toString().trim()
  if (normalized === 'شركات') return 'companies'
  if (normalized === 'مسوق' || normalized === 'مسوقين') return 'marketers'
  if (normalized === 'عادي' || normalized === 'أفراد') return 'individuals'
  return null
}

export const customerCategoryService = {
  async getCategories(): Promise<{ id: CustomerCategoryId; label: string }[]> {
    try {
      if (supabase) {
        const { data, error } = await supabase.from('pricing').select('الزبون')
        if (!error && Array.isArray(data)) {
          const labels = Array.from(
            new Set(
              data
                .map((row: any) => (row?.['الزبون'] || '').toString().trim())
                .filter(Boolean)
            )
          )
          const mapped = labels
            .map((label) => {
              const id = arabicToId(label)
              if (!id) return null
              return { id, label }
            })
            .filter(Boolean) as { id: CustomerCategoryId; label: string }[]

          // ensure unique by id and preserve label from DB if present
          const byId = new Map<CustomerCategoryId, string>()
          DEFAULTS.forEach((d) => byId.set(d.id, d.label))
          mapped.forEach((m) => byId.set(m.id, m.label))

          return Array.from(byId.entries()).map(([id, label]) => ({ id, label }))
        }
      }
    } catch {}
    return DEFAULTS
  },
}
