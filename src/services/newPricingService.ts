import { PriceList, BillboardSize, QuoteItem, Quote, CustomerType, PackageDuration, PriceListType, SizeManagement, DurationPricing } from '@/types'

// المقاسات الافتراضية
const DEFAULT_SIZES: BillboardSize[] = ['5x13', '4x12', '4x10', '3x8', '3x6', '3x4']

// الباقات الزمنية المتاحة
const DEFAULT_PACKAGES: PackageDuration[] = [
  { value: 1, unit: 'month', label: 'شهر واحد', discount: 0 },
  { value: 3, unit: 'months', label: '3 أشهر', discount: 5 },
  { value: 6, unit: 'months', label: '6 أشهر', discount: 10 },
  { value: 12, unit: 'year', label: 'سنة كاملة', discount: 20 }
]

// إنشاء أسعار افتراضية لمدة معينة
const createDefaultPricesForDuration = (duration: number): Record<BillboardSize, number> => {
  const basePrices: Record<BillboardSize, number> = {
    '5x13': 3500,
    '4x12': 2800,
    '4x10': 2200,
    '3x8': 1500,
    '3x6': 1000,
    '3x4': 800
  }

  // تطبيق خصم حسب المدة
  const discount = duration === 1 ? 0 : duration === 3 ? 0.05 : duration === 6 ? 0.1 : duration === 12 ? 0.2 : 0
  
  const result: Record<BillboardSize, number> = {}
  Object.entries(basePrices).forEach(([size, price]) => {
    result[size] = Math.round(price * (1 - discount))
  })
  
  return result
}

// إنشاء أسعار A/B افتراضية مع المدد
const createDefaultABPricing = (): DurationPricing => ({
  '1': createDefaultPricesForDuration(1),
  '3': createDefaultPricesForDuration(3),
  '6': createDefaultPricesForDuration(6),
  '12': createDefaultPricesForDuration(12)
})

// قائمة الأسعار الافتراضية الجديدة
const DEFAULT_PRICING_NEW: PriceList = {
  zones: {
    'مصراتة': {
      name: 'مصراتة',
      prices: {
        marketers: createDefaultPricesForDuration(1),
        individuals: createDefaultPricesForDuration(1),
        companies: createDefaultPricesForDuration(1)
      },
      abPrices: {
        A: createDefaultABPricing(),
        B: {
          '1': createDefaultPricesForDuration(1),
          '3': createDefaultPricesForDuration(3),
          '6': createDefaultPricesForDuration(6),
          '12': createDefaultPricesForDuration(12)
        }
      }
    },
    'أبو سليم': {
      name: 'أبو سليم',
      prices: {
        marketers: createDefaultPricesForDuration(1),
        individuals: createDefaultPricesForDuration(1),
        companies: createDefaultPricesForDuration(1)
      },
      abPrices: {
        A: createDefaultABPricing(),
        B: createDefaultABPricing()
      }
    }
  },
  packages: DEFAULT_PACKAGES,
  currency: 'د.ل'
}

/**
 * خدمة إدارة الأسعار المحدثة
 * تدعم المدد المختلفة والمقاسات الديناميكية
 */
class NewPricingService implements SizeManagement {
  private readonly PRICING_STORAGE_KEY = 'al-fares-pricing-v2'
  private readonly SIZES_STORAGE_KEY = 'al-fares-sizes'
  public sizes: BillboardSize[] = []

  constructor() {
    this.initializeDefaults()
    this.loadSizes()
  }

  /**
   * تهيئة البيانات الافتراضية
   */
  private initializeDefaults() {
    if (!localStorage.getItem(this.PRICING_STORAGE_KEY)) {
      localStorage.setItem(this.PRICING_STORAGE_KEY, JSON.stringify(DEFAULT_PRICING_NEW))
    }
    if (!localStorage.getItem(this.SIZES_STORAGE_KEY)) {
      localStorage.setItem(this.SIZES_STORAGE_KEY, JSON.stringify(DEFAULT_SIZES))
    }
  }

  /**
   * تحميل المقاسات من التخزين
   */
  private loadSizes() {
    try {
      const sizes = localStorage.getItem(this.SIZES_STORAGE_KEY)
      this.sizes = sizes ? JSON.parse(sizes) : DEFAULT_SIZES
    } catch {
      this.sizes = DEFAULT_SIZES
    }
  }

  /**
   * حفظ المقاسات في التخزين
   */
  private saveSizes() {
    localStorage.setItem(this.SIZES_STORAGE_KEY, JSON.stringify(this.sizes))
  }

  /**
   * إضافة مقاس جديد
   */
  addSize(size: BillboardSize): boolean {
    if (!this.validateSize(size) || this.sizes.includes(size)) {
      return false
    }
    this.sizes.push(size)
    this.saveSizes()
    return true
  }

  /**
   * حذف مقاس
   */
  removeSize(size: BillboardSize): boolean {
    const index = this.sizes.indexOf(size)
    if (index === -1 || this.sizes.length <= 1) {
      return false
    }
    this.sizes.splice(index, 1)
    this.saveSizes()
    return true
  }

  /**
   * التحقق من صحة المقاس
   */
  validateSize(size: string): boolean {
    // تحقق من أن المقاس بصيغة مثل "5x13" أو "4x12"
    const sizePattern = /^\d+x\d+$/
    return sizePattern.test(size) && size.length <= 10
  }

  /**
   * الحصول على قائمة الأسعار
   */
  getPricing(): PriceList {
    try {
      const pricing = localStorage.getItem(this.PRICING_STORAGE_KEY)
      return pricing ? JSON.parse(pricing) : DEFAULT_PRICING_NEW
    } catch {
      return DEFAULT_PRICING_NEW
    }
  }

  /**
   * تحديث قائمة الأسعار
   */
  updatePricing(pricing: PriceList): { success: boolean; error?: string } {
    try {
      localStorage.setItem(this.PRICING_STORAGE_KEY, JSON.stringify(pricing))
      return { success: true }
    } catch (error) {
      console.error('خطأ في تحديث الأسعار:', error)
      return { success: false, error: 'حدث خطأ في حفظ الأسعار' }
    }
  }

  /**
   * الحصول على سعر لوحة حسب القائمة والمدة
   */
  getBillboardPriceABWithDuration(
    size: BillboardSize, 
    zone: string, 
    priceList: PriceListType = 'A', 
    duration: number = 1
  ): number {
    const pricing = this.getPricing()
    const zoneData = pricing.zones[zone]

    if (!zoneData || !zoneData.abPrices || !zoneData.abPrices[priceList]) {
      return 0
    }

    const durationKey = duration.toString() as keyof DurationPricing
    const durationPrices = zoneData.abPrices[priceList][durationKey]

    if (!durationPrices || !durationPrices[size]) {
      return 0
    }

    return durationPrices[size]
  }

  /**
   * الحصول على سعر لوحة حسب فئة الزبون (للنظام القديم)
   */
  getBillboardPrice(size: BillboardSize, zone: string, customerType: CustomerType = 'individuals'): number {
    const pricing = this.getPricing()
    const zoneData = pricing.zones[zone]

    if (!zoneData || !zoneData.prices[customerType] || !zoneData.prices[customerType][size]) {
      return 0
    }

    return zoneData.prices[customerType][size]
  }

  /**
   * تحديد قائمة الأسعار من بيانات اللوحة
   */
  determinePriceListFromBillboard(billboard: any): PriceListType {
    // إذا كان للوحة تصنيف سعر محدد
    if (billboard.priceCategory && (billboard.priceCategory === 'A' || billboard.priceCategory === 'B')) {
      return billboard.priceCategory
    }

    // إذا كان المستوى يحدد القائمة
    if (billboard.level) {
      const level = billboard.level.toLowerCase()
      if (level.includes('مسوق') || level.includes('a') || level === '1') {
        return 'A'
      }
      if (level.includes('شرك') || level.includes('b') || level === '2') {
        return 'B'
      }
    }

    // القيمة الافتراضية
    return 'A'
  }

  /**
   * الحصول على الباقات الزمنية المتاحة
   */
  getPackages(): PackageDuration[] {
    const pricing = this.getPricing()
    return pricing.packages || DEFAULT_PACKAGES
  }

  /**
   * حساب السعر مع الخصم حسب الباقة
   */
  calculatePriceWithDiscount(basePrice: number, packageDuration: PackageDuration): {
    finalPrice: number
    discount: number
    totalDiscount: number
  } {
    const discountAmount = (basePrice * packageDuration.discount) / 100
    const finalPrice = basePrice - discountAmount

    return {
      finalPrice,
      discount: packageDuration.discount,
      totalDiscount: discountAmount * packageDuration.value
    }
  }

  /**
   * إنشاء فاتورة عرض محدثة
   */
  generateQuote(
    customerInfo: {
      name: string
      email: string
      phone: string
      company?: string
      type: CustomerType
    },
    billboards: Array<{
      id: string
      name: string
      location: string
      municipality: string
      area: string
      size: BillboardSize
      status: string
      imageUrl?: string
      level?: string
      priceCategory?: PriceListType
    }>,
    packageDuration: PackageDuration
  ): Quote {
    const pricing = this.getPricing()

    const items: QuoteItem[] = billboards.map(billboard => {
      const zone = this.determinePricingZone(billboard.municipality, billboard.area)
      const priceList = this.determinePriceListFromBillboard(billboard)
      const basePrice = this.getBillboardPriceABWithDuration(
        billboard.size, 
        zone, 
        priceList, 
        packageDuration.value
      )
      const priceCalc = this.calculatePriceWithDiscount(basePrice, packageDuration)

      return {
        billboardId: billboard.id,
        name: billboard.name,
        location: billboard.location,
        size: billboard.size,
        zone,
        basePrice,
        finalPrice: priceCalc.finalPrice,
        duration: packageDuration.value,
        discount: priceCalc.discount,
        total: priceCalc.finalPrice * packageDuration.value,
        imageUrl: billboard.imageUrl
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
      packageInfo: {
        duration: packageDuration.value,
        label: packageDuration.label,
        discount: packageDuration.discount
      },
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

  /**
   * تحديد المنطقة السعرية بناءً على البلدية أو المنطقة
   */
  determinePricingZone(municipality: string, area: string): string {
    const municipalityLower = municipality.toLowerCase()
    const areaLower = area.toLowerCase()
    
    if (municipalityLower.includes('مصراتة')) return 'مصراتة'
    if (municipalityLower.includes('أبو سليم') || areaLower.includes('أبو سليم')) return 'أبو سليم'
    if (municipalityLower.includes('طرابلس') && areaLower.includes('الشط')) return 'شركات'
    
    return 'مصراتة'
  }

  /**
   * الحصول على قائمة المناطق السعرية
   */
  getPricingZones(): string[] {
    const pricing = this.getPricing()
    return Object.keys(pricing.zones)
  }

  /**
   * الحصول على قائمة فئات الزبائن المتاحة
   */
  getCustomerTypes(): Array<{value: CustomerType, label: string}> {
    return [
      { value: 'marketers', label: 'المسوقين' },
      { value: 'individuals', label: 'العاديين' },
      { value: 'companies', label: 'الشركات' }
    ]
  }

  /**
   * الحصول على قوائم الأسعار المتاحة (A و B)
   */
  getPriceListTypes(): Array<{value: PriceListType, label: string}> {
    return [
      { value: 'A', label: 'مستوى 1 - سيتي A' },
      { value: 'B', label: 'مستوى 2 - مسوقين' }
    ]
  }

  /**
   * إضافة مقاس جديد لجميع المناطق والقوائم
   */
  addSizeToAllZones(size: BillboardSize, defaultPrice: number = 1000): boolean {
    if (!this.addSize(size)) {
      return false
    }

    const pricing = this.getPricing()
    const updatedPricing = { ...pricing }

    // إضافة المقاس لجميع المناطق
    Object.keys(updatedPricing.zones).forEach(zoneName => {
      const zone = updatedPricing.zones[zoneName]
      
      // إضافة للأسعار العادية
      if (zone.prices) {
        Object.keys(zone.prices).forEach(customerType => {
          zone.prices[customerType as CustomerType][size] = defaultPrice
        })
      }

      // إضافة لقوائم A/B
      if (zone.abPrices) {
        Object.keys(zone.abPrices).forEach(priceList => {
          const list = zone.abPrices[priceList as PriceListType]
          Object.keys(list).forEach(duration => {
            list[duration as keyof DurationPricing][size] = defaultPrice
          })
        })
      }
    })

    return this.updatePricing(updatedPricing).success
  }

  /**
   * حذف مقاس من جميع المناطق والقوائم
   */
  removeSizeFromAllZones(size: BillboardSize): boolean {
    if (!this.removeSize(size)) {
      return false
    }

    const pricing = this.getPricing()
    const updatedPricing = { ...pricing }

    // حذف المقاس من جميع المناطق
    Object.keys(updatedPricing.zones).forEach(zoneName => {
      const zone = updatedPricing.zones[zoneName]
      
      // حذف من الأسعار العادية
      if (zone.prices) {
        Object.keys(zone.prices).forEach(customerType => {
          delete zone.prices[customerType as CustomerType][size]
        })
      }

      // حذف من قوائم A/B
      if (zone.abPrices) {
        Object.keys(zone.abPrices).forEach(priceList => {
          const list = zone.abPrices[priceList as PriceListType]
          Object.keys(list).forEach(duration => {
            delete list[duration as keyof DurationPricing][size]
          })
        })
      }
    })

    return this.updatePricing(updatedPricing).success
  }
}

export const newPricingService = new NewPricingService()
