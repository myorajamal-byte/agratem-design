import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) || ''
const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || ''
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

export const sizesDatabase = {
  async getSizes(): Promise<string[]> {
    if (!supabase) return []
    const { data, error } = await supabase.from('sizes').select('size')
    if (error || !data) return []
    return (data as any[]).map((r) => r.size).filter(Boolean)
  },
  async getDistinctSizesFromPricing(): Promise<string[]> {
    if (!supabase) return []
    const { data, error } = await supabase.from('pricing').select('billboard_size')
    if (error || !data) return []
    const unique = Array.from(new Set((data as any[]).map(r => (r.billboard_size || '').toString().trim()).filter(Boolean)))
    unique.sort((a,b)=>a.localeCompare(b,'ar'))
    return unique
  },
  async saveSizes(sizes: string[]): Promise<boolean> {
    if (!supabase) return false
    await supabase.from('sizes').delete().neq('size', '')
    const rows = sizes.map((size) => ({ size }))
    const { error } = await supabase.from('sizes').insert(rows as any)
    return !error
  }
}
