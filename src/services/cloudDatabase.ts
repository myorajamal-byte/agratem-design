import type { PriceList, InstallationPricing } from '@/types'

const API_BASE = '/.netlify/functions/kv-pricing'

async function get<T>(key: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}?key=${encodeURIComponent(key)}`, { method: 'GET' })
    if (!res.ok) return null
    const data = await res.json().catch(() => ({}))
    return (data?.value ?? null) as T | null
  } catch {
    return null
  }
}

async function set<T>(key: string, value: T): Promise<boolean> {
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

export const cloudDatabase = {
  async getRentalPricing(): Promise<PriceList | null> {
    return await get<PriceList>('rental_pricing')
  },
  async saveRentalPricing(pricing: PriceList): Promise<boolean> {
    return await set<PriceList>('rental_pricing', pricing)
  },
  async getInstallationPricing(): Promise<InstallationPricing | null> {
    return await get<InstallationPricing>('installation_pricing')
  },
  async saveInstallationPricing(pricing: InstallationPricing): Promise<boolean> {
    return await set<InstallationPricing>('installation_pricing', pricing)
  }
}
