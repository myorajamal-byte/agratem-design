import { createClient } from '@supabase/supabase-js'
import type { PriceList, InstallationPricing } from '@/types'
import { createClient } from '@supabase/supabase-js'
import * as XLSX from 'xlsx'

// Prefer Supabase for cloud persistence; fallback to Netlify KV if not configured
const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) || ''
const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || ''
const hasSupabase = !!(supabaseUrl && supabaseAnonKey)

const API_BASE = '/.netlify/functions/kv-pricing'

// Optional Google Sheets/Excel sources (read-only)
const PRICING_XLSX_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_PRICING_XLSX_URL) || ''
const PRICING_CSV_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_PRICING_CSV_URL) || ''
const INSTALL_XLSX_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_INSTALLATION_XLSX_URL) || ''
const INSTALL_CSV_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_INSTALLATION_CSV_URL) || ''

async function fetchWorkbookFromUrl(url: string, timeoutMs = 12000): Promise<XLSX.WorkBook | null> {
  if (!url) return null
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
    const res = await fetch(`${url}${url.includes('?') ? '&' : '?'}cachebuster=${Date.now()}`, { signal: controller.signal, redirect: 'follow' })
    clearTimeout(timeout)
    if (!res.ok) return null
    const ct = res.headers.get('content-type') || ''
    if (ct.includes('text') || ct.includes('csv')) {
      const text = await res.text()
      if (!text) return null
      return XLSX.read(text, { type: 'string' })
    }
    const buffer = await res.arrayBuffer()
    if (!buffer || buffer.byteLength === 0) return null
    return XLSX.read(buffer, { type: 'array', cellDates: true })
  } catch {
    return null
  }
}

async function kvGet<T>(key: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}?key=${encodeURIComponent(key)}`, { method: 'GET' })
    if (!res.ok) return null
    const data = await res.json().catch(() => ({}))
    return (data?.value ?? null) as T | null
  } catch {
    return null
  }
}

async function kvSet<T>(key: string, value: T): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value })
    })
    return res.ok
  } catch {
    return false
  }
}

// Supabase client (anon key is fine for RLS-enabled public data)
const supabase = hasSupabase ? createClient(supabaseUrl, supabaseAnonKey) : null

// Map Supabase rows to our PriceList type
type PricingRow = {
  id: number
  zone_id: number | null
  zone_name: string
  billboard_size: string
  customer_type: 'marketers' | 'individuals' | 'companies' | null
  price: number
  ab_type: 'A' | 'B' | null
  package_duration: number | null
  package_discount: number | null
  currency: string | null
  created_at: string | null
}

function rowsToPriceList(rows: PricingRow[]): PriceList {
  const zones: PriceList['zones'] = {}
  const packagesSet = new Set<number>()
  let currency: string = 'د.ل'

  for (const r of rows) {
    if (!zones[r.zone_name]) {
      zones[r.zone_name] = {
        name: r.zone_name,
        prices: { marketers: {}, individuals: {}, companies: {} },
        abPrices: { A: { '1': {}, '3': {}, '6': {}, '12': {} }, B: { '1': {}, '3': {}, '6': {}, '12': {} } }
      }
    }
    if (r.currency) currency = r.currency

    if (r.customer_type) {
      zones[r.zone_name].prices[r.customer_type][r.billboard_size] = Number(r.price) || 0
    }
    if (r.ab_type && r.package_duration) {
      const durKey = String(r.package_duration) as '1' | '3' | '6' | '12'
      if (!zones[r.zone_name].abPrices[r.ab_type][durKey]) zones[r.zone_name].abPrices[r.ab_type][durKey] = {}
      zones[r.zone_name].abPrices[r.ab_type][durKey][r.billboard_size] = Number(r.price) || 0
      packagesSet.add(r.package_duration)
    }
  }

  const packages = Array.from(packagesSet).sort((a, b) => a - b).map(value => ({
    value,
    unit: value === 12 ? 'year' : 'months',
    label: value === 1 ? 'شهر واحد' : value === 3 ? '3 أشهر' : value === 6 ? '6 أشهر' : 'سنة كاملة',
    discount: value === 1 ? 0 : value === 3 ? 5 : value === 6 ? 10 : 20
  }))

  return { zones, packages, currency }
}

export const cloudDatabase = {
  async getRentalPricing(): Promise<PriceList | null> {
    // Try Google Sheets/Excel if provided
    if (PRICING_CSV_URL || PRICING_XLSX_URL) {
      const wb = (await fetchWorkbookFromUrl(PRICING_CSV_URL)) || (await fetchWorkbookFromUrl(PRICING_XLSX_URL))
      if (wb && wb.SheetNames?.length) {
        const sheet = wb.Sheets[wb.SheetNames[0]]
        const json = XLSX.utils.sheet_to_json(sheet, { defval: '' }) as any[]
        if (json?.length) {
          const headers = Object.keys(json[0] || {}).map(k => k.toString())
          const hasDurations = headers.some(k => ['30','60','90','180','360'].includes(k))

          const mapCustomer = (v: string): 'marketers'|'individuals'|'companies'|null => {
            const s = (v||'').toString().trim()
            if (!s) return null
            const lower = s.toLowerCase()
            if (['الشركات','companies','company'].some(x=>lower.includes(x))) return 'companies'
            if (['الأفراد','individuals','individual'].some(x=>lower.includes(x))) return 'individuals'
            if (['المسوقين','marketers','marketer'].some(x=>lower.includes(x))) return 'marketers'
            return null
          }

          const mapLevel = (v: string): 'A'|'B'|null => {
            const s = (v||'').toString().trim().toUpperCase()
            return s === 'A' || s === 'B' ? (s as 'A'|'B') : null
          }

          const durMap: Record<string, number> = { '30': 1, '60': 2, '90': 3, '180': 6, '360': 12 }

          const rows: PricingRow[] = []
          for (let i = 0; i < json.length; i++) {
            const r: any = json[i]
            const size = (r['المقاس'] || r['size'] || r['billboard_size'] || '').toString()
            const customer = mapCustomer(r['الزبون'] || r['customer'])
            const level = mapLevel(r['المستوى'] || r['level'] || r['price_list'])

            if (hasDurations) {
              if (level) {
                Object.entries(durMap).forEach(([col, dur]) => {
                  const price = Number(r[col] || 0)
                  if (size && price) {
                    rows.push({ id: rows.length+1, zone_id: null, zone_name: 'عام', billboard_size: size, customer_type: null, price, ab_type: level, package_duration: dur, package_discount: null, currency: 'د.ل', created_at: null })
                  }
                })
              }
              if (customer) {
                const base = Number(r['30'] || 0)
                if (size && base) {
                  rows.push({ id: rows.length+1, zone_id: null, zone_name: 'عام', billboard_size: size, customer_type: customer, price: base, ab_type: null, package_duration: null, package_discount: null, currency: 'د.ل', created_at: null })
                }
              }
            } else {
              const price = Number(r['السعر'] || r['price'] || 0)
              if (customer && size && price) {
                rows.push({ id: rows.length+1, zone_id: null, zone_name: 'عام', billboard_size: size, customer_type: customer, price, ab_type: null, package_duration: null, package_discount: null, currency: 'د.ل', created_at: null })
              }
            }
          }
          const pl = rowsToPriceList(rows)
          if (Object.keys(pl.zones).length > 0) return pl
        }
      }
    }

    if (supabase) {
      const { data, error } = await supabase.from('pricing').select('*')
      if (error) return null
      if (!data || data.length === 0) return null
      return rowsToPriceList(data as unknown as PricingRow[])
    }
    return await kvGet<PriceList>('rental_pricing')
  },
  async saveRentalPricing(pricing: PriceList): Promise<boolean> {
    if (supabase) {
      // Upsert per-cell rows for A/B durations and customer types
      const rows: PricingRow[] = [] as any
      Object.entries(pricing.zones).forEach(([zone_name, zone]) => {
        // customer types
        (['marketers','individuals','companies'] as const).forEach(ct => {
          Object.entries(zone.prices[ct]).forEach(([billboard_size, price]) => {
            rows.push({ id: 0, zone_id: null, zone_name, billboard_size, customer_type: ct, price: Number(price), ab_type: null, package_duration: null, package_discount: null, currency: pricing.currency, created_at: new Date().toISOString() })
          })
        })
        // A/B with durations
        (['A','B'] as const).forEach(ab => {
          const abEntry: any = (zone.abPrices as any)[ab] || {}
          const keys = Object.keys(abEntry)
          const hasDurations = keys.some(k => ['1','3','6','12'].includes(k))
          if (hasDurations) {
            ;(['1','3','6','12'] as const).forEach(dk => {
              const durationPrices = abEntry[dk] || {}
              Object.entries(durationPrices).forEach(([billboard_size, price]) => {
                rows.push({ id: 0, zone_id: null, zone_name, billboard_size, customer_type: null, price: Number(price), ab_type: ab, package_duration: Number(dk), package_discount: null, currency: pricing.currency, created_at: new Date().toISOString() })
              })
            })
          } else {
            // Support flat map (size -> price) edited from interactive table; default duration = 1
            Object.entries(abEntry).forEach(([billboard_size, price]) => {
              rows.push({ id: 0, zone_id: null, zone_name, billboard_size, customer_type: null, price: Number(price), ab_type: ab, package_duration: 1, package_discount: null, currency: pricing.currency, created_at: new Date().toISOString() })
            })
          }
        })
      })
      // Strategy: simple replace -> delete all then insert
      await supabase.from('pricing').delete().neq('id', -1)
      const { error } = await supabase.from('pricing').insert(rows as any)
      return !error
    }
    return await kvSet<PriceList>('rental_pricing', pricing)
  },
  async getInstallationPricing(): Promise<InstallationPricing | null> {
    // Try Google Sheets/Excel if provided
    if (INSTALL_CSV_URL || INSTALL_XLSX_URL) {
      const wb = (await fetchWorkbookFromUrl(INSTALL_CSV_URL)) || (await fetchWorkbookFromUrl(INSTALL_XLSX_URL))
      if (wb && wb.SheetNames?.length) {
        const sheet = wb.Sheets[wb.SheetNames[0]]
        const json = XLSX.utils.sheet_to_json(sheet, { defval: '' }) as any[]
        if (json?.length) {
          const zones: InstallationPricing['zones'] = {}
          let currency: string = 'د.ل'
          for (const r0 of json as any[]) {
            const zone_name = (r0.zone_name || r0['zone'] || r0['المنطقة'] || '').toString()
            const size = (r0.billboard_size || r0['size'] || r0['المقاس'] || '').toString()
            const price = Number(r0.price || r0['السعر'] || 0)
            const multiplier = r0.multiplier != null ? Number(r0.multiplier) : 1.0
            const desc = (r0.description || '').toString() || undefined
            const cur = (r0.currency || r0['العملة'] || 'د.ل').toString()
            if (!zones[zone_name]) zones[zone_name] = { name: zone_name, prices: {}, multiplier, description: desc }
            zones[zone_name].prices[size as any] = price
            if (cur) currency = cur
          }
          const sizes = Array.from(new Set(json.map((r: any) => (r.billboard_size || r['size'] || r['المقاس'] || '').toString()).filter(Boolean))) as any
          return { zones, sizes, currency, lastUpdated: new Date().toISOString() }
        }
      }
    }

    if (supabase) {
      type Row = {
        id: number
        zone_name: string
        billboard_size: string
        price: number
        multiplier: number | null
        currency: string | null
        description: string | null
        created_at: string | null
      }
      const { data, error } = await supabase.from('installation_pricing').select('*')
      if (!error && data && data.length > 0) {
        const zones: InstallationPricing['zones'] = {}
        let currency: string = 'د.ل'
        for (const r of data as unknown as Row[]) {
          if (!zones[r.zone_name]) {
            zones[r.zone_name] = {
              name: r.zone_name,
              prices: {},
              multiplier: r.multiplier ?? 1.0,
              description: r.description || undefined
            }
          }
          zones[r.zone_name].prices[r.billboard_size as any] = Number(r.price) || 0
          if (r.currency) currency = r.currency
        }
        const sizes = Array.from(new Set((data as Row[]).map(r => r.billboard_size))) as any
        return {
          zones,
          sizes,
          currency,
          lastUpdated: new Date().toISOString()
        }
      }
    }
    return await kvGet<InstallationPricing>('installation_pricing')
  },
  async saveInstallationPricing(pricing: InstallationPricing): Promise<boolean> {
    if (supabase) {
      type Row = {
        id: number
        zone_name: string
        billboard_size: string
        price: number
        multiplier: number | null
        currency: string | null
        description: string | null
        created_at: string | null
      }
      const rows: Row[] = [] as any
      Object.entries(pricing.zones).forEach(([zone_name, zone]) => {
        Object.entries(zone.prices).forEach(([billboard_size, price]) => {
          rows.push({
            id: 0,
            zone_name,
            billboard_size,
            price: Number(price),
            multiplier: zone.multiplier ?? 1.0,
            currency: pricing.currency,
            description: zone.description || null,
            created_at: new Date().toISOString()
          } as any)
        })
      })
      await supabase.from('installation_pricing').delete().neq('id', -1)
      const { error } = await supabase.from('installation_pricing').insert(rows as any)
      return !error
    }
    return await kvSet<InstallationPricing>('installation_pricing', pricing)
  }
}
