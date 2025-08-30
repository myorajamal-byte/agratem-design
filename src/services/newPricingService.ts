import cloudDatabase from "@/lib/cloud-database"
import { DEFAULT_SIZES } from "@/lib/data/sizes"

export type RentalPricing = {
  id: string
  pricePerMonth: number
  size: string
}

class NewPricingService {
  private readonly PRICING_STORAGE_KEY = "rental_pricing"
  private readonly SIZES_STORAGE_KEY = "rental_sizes"

  constructor() {
    this.initializeDefaults()
  }

  private initializeDefaults() {
    try {
      localStorage.removeItem(this.PRICING_STORAGE_KEY)
    } catch {}

    // تحميل الأسعار من Supabase
    cloudDatabase.getRentalPricing()
      .then(remote => {
        if (remote) {
          localStorage.setItem(this.PRICING_STORAGE_KEY, JSON.stringify(remote))
        }
      })
      .catch(() => {})

    // إذا ما فيه مقاسات محفوظة نحط الافتراضية
    if (!localStorage.getItem(this.SIZES_STORAGE_KEY)) {
      localStorage.setItem(this.SIZES_STORAGE_KEY, JSON.stringify(DEFAULT_SIZES))
    }
  }

  getPricing(): RentalPricing[] {
    const data = localStorage.getItem(this.PRICING_STORAGE_KEY)
    if (!data) return []
    try {
      return JSON.parse(data) as RentalPricing[]
    } catch {
      return []
    }
  }

  async savePricing(pricing: RentalPricing[]) {
    localStorage.setItem(this.PRICING_STORAGE_KEY, JSON.stringify(pricing))
    try {
      await cloudDatabase.saveRentalPricing(pricing)
    } catch {}
  }

  getSizes(): string[] {
    const data = localStorage.getItem(this.SIZES_STORAGE_KEY)
    if (!data) return DEFAULT_SIZES
    try {
      return JSON.parse(data) as string[]
    } catch {
      return DEFAULT_SIZES
    }
  }

  async saveSizes(sizes: string[]) {
    localStorage.setItem(this.SIZES_STORAGE_KEY, JSON.stringify(sizes))
    try {
      await cloudDatabase.saveSizes(sizes)
    } catch {}
  }
}

export const newPricingService = new NewPricingService()
