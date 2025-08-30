import { PriceList, PricingZone, BillboardSize, QuoteItem, Quote, CustomerType, PackageDuration, PriceListType } from '@/types'
import { formatGregorianDate } from '@/lib/dateUtils'
import { cloudDatabase } from './cloudDatabase'

/**
 * خدمة إدارة الأسعار والفواتير
 * تعتمد كليًا على البيانات المحفوظة في JSON أو Cloud
 */
class PricingService {
  private readonly PRICING_STORAGE_KEY = 'al-fares-pricing'

  constructor() {
    this.initializePricingFromDB()
  }

  /**
   * تهيئة الأسعار من قاعدة البيانات فقط
   */
  
private initializePricingFromDB() {
  // Clear any local/demo data; hydrate only from Supabase
  try { localStorage.removeItem(this.PRICING_STORAGE_KEY) } catch {}
  ;(async () => {
    try {
      const remote = await cloudDatabase.getRentalPricing()
      if (remote) {
        localStorage.setItem(this.PRICING_STORAGE_KEY, JSON.stringify(remote))
      }
    } catch {}
  })()
}

    // محاولة التحميل من قاعدة بيانات Supabase / السحابة
    ;(async () => {
      try {
        const remote = await cloudDatabase.getRentalPricing()
        if (remote) {
          // إزالة أي أسعار تجريبية واستبدالها بالبيانات من القاعدة
          localStorage.setItem(this.PRICING_STORAGE_KEY, JSON.stringify(remote))
          jsonDatabase.saveRentalPricing(remote)
        }
      } catch {
        // تجاهل الأخطاء وابقَ على البيانات المحلية إن وجدت
      }
    })()
  }

  /**
   * الحصول على قائمة الأسعار
   */
  

getPricing(): PriceList | null {
  try {
    const storedPricing = localStorage.getItem(this.PRICING_STORAGE_KEY)
    return storedPricing ? JSON.parse(storedPricing) : null
  } catch {
    return null
  }
}

      if (storedPricing) return JSON.parse(storedPricing)
      const dbPricing = jsonDatabase.getRentalPricing()
      if (dbPricing) return dbPricing
      return null
    } catch {
      return null
    }
  }

  /**
   * تحديث قائمة الأسعار في DB وCloud
   */
  updatePricing(pricing: PriceList): { success: boolean; error?: string } {
    try {
      localStorage.setItem(this.PRICING_STORAGE_KEY, JSON.stringify(pricing))
      void cloudDatabase.saveRentalPricing(pricing)
      return { success: true }
    } catch (error) {
      console.error('خطأ في تحديث الأسعار:', error)
      return { success: false, error: 'حدث خطأ في حفظ الأسعار' }
    }
  }

  /**
   * الحصول على سعر لوحة معينة حسب فئة الزبون
   */
  getBillboardPrice(size: BillboardSize, zone: string, customerType: CustomerType = 'individuals', municipality?: string): number {
    const pricing = this.getPricing()
    if (!pricing) return 0
    const zoneData = pricing.zones[zone]
    if (!zoneData || !zoneData.prices[customerType] || !zoneData.prices[customerType][size]) return 0

    const basePrice = zoneData.prices[customerType][size]

    if (municipality) {
      const multiplier = this.getMunicipalityMultiplier(municipality)
      return Math.round(basePrice * multiplier)
    }

    return basePrice
  }

  getBillboardPriceAB(size: BillboardSize, zone: string, priceList: PriceListType = 'A', municipality?: string): number {
    const pricing = this.getPricing()
    if (!pricing) return 0
    const zoneData = pricing.zones[zone]
    if (!zoneData || !zoneData.abPrices || !zoneData.abPrices[priceList] || !zoneData.abPrices[priceList][size]) return 0

    const basePrice = zoneData.abPrices[priceList][size]
    if (municipality) {
      const multiplier = this.getMunicipalityMultiplier(municipality)
      return Math.round(basePrice * multiplier)
    }
    return basePrice
  }

  getMunicipalityMultiplier(municipality: string): number {
    try {
      const municipalityService = (window as any)?.municipalityService
      if (municipalityService) {
        const data = municipalityService.getMunicipalityByName(municipality)
        if (data && data.multiplier) return data.multiplier
      }
    } catch {}
    return 1.0
  }

  getPackages(): PackageDuration[] {
    const pricing = this.getPricing()
    return pricing?.packages || []
  }

  calculatePriceWithDiscount(basePrice: number, packageDuration: PackageDuration) {
    const discountAmount = (basePrice * packageDuration.discount) / 100
    const finalPrice = basePrice - discountAmount
    return { finalPrice, discount: packageDuration.discount, totalDiscount: discountAmount * packageDuration.value }
  }

  determinePricingZone(municipality: string, area?: string): string | null {
    const pricing = this.getPricing()
    if (!pricing) return null

    const zoneName = municipality.trim()
    if (pricing.zones[zoneName]) return zoneName

    const availableZones = Object.keys(pricing.zones)
    const municipalityLower = municipality.toLowerCase().trim()
    for (const zone of availableZones) {
      if (zone.toLowerCase().includes(municipalityLower) || municipalityLower.includes(zone.toLowerCase())) return zone
    }

    this.addPricingZoneForMunicipality(municipality)
    return municipality.trim()
  }

  addPricingZoneForMunicipality(municipality: string, baseZone: string): boolean {
    const pricing = this.getPricing()
    if (!pricing) return false
    const zoneName = municipality.trim()
    if (pricing.zones[zoneName]) return true

    const baseZoneData = pricing.zones[baseZone]
    if (!baseZoneData) return false

    pricing.zones[zoneName] = { ...baseZoneData, name: zoneName }
    return this.updatePricing(pricing).success
  }

  calculateQuoteTotal(items: QuoteItem[]): number {
    return items.reduce((total, item) => total + item.total, 0)
  }

  getCustomerTypeLabel(type: CustomerType): string {
    const labels = { marketers: 'المسوقين', individuals: 'العاديين', companies: 'الشركات' }
    return labels[type] || 'غير محدد'
  }

  generateQuote(customerInfo: { name: string; email: string; phone: string; company?: string; type: CustomerType }, billboards: Array<{ id: string; name: string; location: string; municipality: string; area: string; size: BillboardSize; status: string; imageUrl?: string }>, packageDuration: PackageDuration): Quote {
    const pricing = this.getPricing()
    if (!pricing) throw new Error('لا توجد بيانات أسعار متاحة.')

    const items: QuoteItem[] = billboards.map(b => {
      const zone = this.determinePricingZone(b.municipality, b.area) || ''
      const basePrice = this.getBillboardPrice(b.size, zone, customerInfo.type, b.municipality)
      const priceCalc = this.calculatePriceWithDiscount(basePrice, packageDuration)
      return {
        billboardId: b.id,
        name: b.name,
        location: b.location,
        size: b.size,
        zone,
        basePrice,
        finalPrice: priceCalc.finalPrice,
        duration: packageDuration.value,
        discount: priceCalc.discount,
        total: priceCalc.finalPrice * packageDuration.value,
        imageUrl: b.imageUrl
      }
    })

    const subtotal = items.reduce((sum, item) => sum + (item.basePrice * item.duration), 0)
    const totalDiscount = items.reduce((sum, item) => sum + ((item.basePrice - item.finalPrice) * item.duration), 0)
    const taxRate = 0.0
    const tax = (subtotal - totalDiscount) * taxRate
    const total = subtotal - totalDiscount + tax

    return {
      id: `Q-${Date.now()}`,
      customerInfo,
      packageInfo: { duration: packageDuration.value, label: packageDuration.label, discount: packageDuration.discount },
      items,
      subtotal,
      totalDiscount,
      tax,
      taxRate,
      total,
      currency: pricing.currency,
      createdAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }
  }

  // بقية الدوال مثل printQuote، exportQuoteToPDF، enableDynamicPricing، disableDynamicPricing تبقى كما هي
}

export const pricingService = new PricingService()
