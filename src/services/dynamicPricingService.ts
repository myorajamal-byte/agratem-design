import { PriceList, PricingZone, BillboardSize, CustomerType, PriceListType, DurationPricing, ABPricing } from '@/types'
import { municipalityService, Municipality } from './municipalityService'

/**
 * خدمة التسعير الديناميكي - تربط البلديات بالمناطق السعرية تلقائياً
 * تقرأ المنطقة السعرية من بيانات اللوحة (حقل البلدية)
 */
class DynamicPricingService {
  private readonly STORAGE_KEY = 'al-fares-dynamic-pricing'
  private readonly BASE_PRICES_KEY = 'al-fares-base-prices'

  // الأسعار الأساسية التي ستُضرب في معامل البلدية
  private readonly DEFAULT_BASE_PRICES = {
    marketers: { // أسعار المسوقين (الأقل)
      '5x13': 3000,
      '4x12': 2400,
      '4x10': 1900,
      '3x8': 1300,
      '3x6': 900,
      '3x4': 700
    },
    individuals: { // أسعار العاديين
      '5x13': 3500,
      '4x12': 2800,
      '4x10': 2200,
      '3x8': 1500,
      '3x6': 1000,
      '3x4': 800
    },
    companies: { // أسعار الشركات (الأعلى)
      '5x13': 4000,
      '4x12': 3200,
      '4x10': 2500,
      '3x8': 1700,
      '3x6': 1200,
      '3x4': 900
    }
  }

  // الأسعار الأساسية لقوائم A و B
  private readonly DEFAULT_AB_BASE_PRICES = {
    A: {
      '5x13': 3500,
      '4x12': 2800,
      '4x10': 2200,
      '3x8': 1500,
      '3x6': 1000,
      '3x4': 800
    },
    B: {
      '5x13': 4500,
      '4x12': 3800,
      '4x10': 3200,
      '3x8': 2500,
      '3x6': 2000,
      '3x4': 1500
    }
  }

  constructor() {
    this.initializeBasePrices()
  }

  /**
   * تهيئة الأسعار الأساسية
   */
  private initializeBasePrices() {
    if (!localStorage.getItem(this.BASE_PRICES_KEY)) {
      const basePrices = {
        customerTypes: this.DEFAULT_BASE_PRICES,
        abPrices: this.DEFAULT_AB_BASE_PRICES
      }
      localStorage.setItem(this.BASE_PRICES_KEY, JSON.stringify(basePrices))
    }
  }

  /**
   * الحصول على الأسعار الأساسية
   */
  getBasePrices() {
    try {
      const stored = localStorage.getItem(this.BASE_PRICES_KEY)
      return stored ? JSON.parse(stored) : {
        customerTypes: this.DEFAULT_BASE_PRICES,
        abPrices: this.DEFAULT_AB_BASE_PRICES
      }
    } catch {
      return {
        customerTypes: this.DEFAULT_BASE_PRICES,
        abPrices: this.DEFAULT_AB_BASE_PRICES
      }
    }
  }

  /**
   * تحديث الأسعار الأساسية
   */
  updateBasePrices(basePrices: any): boolean {
    try {
      localStorage.setItem(this.BASE_PRICES_KEY, JSON.stringify(basePrices))
      return true
    } catch {
      return false
    }
  }

  /**
   * إنشاء منطقة سعرية ديناميكية بناءً على البلدية
   */
  createDynamicPricingZone(municipality: Municipality): PricingZone {
    const basePrices = this.getBasePrices()
    const multiplier = municipality.multiplier

    // حساب الأسعار للعملاء المختلفين
    const customerTypePrices = {
      marketers: this.applyMultiplierToPrices(basePrices.customerTypes.marketers, multiplier),
      individuals: this.applyMultiplierToPrices(basePrices.customerTypes.individuals, multiplier),
      companies: this.applyMultiplierToPrices(basePrices.customerTypes.companies, multiplier)
    }

    // حساب أسعار قوائم A و B
    const abPrices: ABPricing = {
      A: {
        '1': this.applyMultiplierToPrices(basePrices.abPrices.A, multiplier),
        '3': this.applyMultiplierToPrices(basePrices.abPrices.A, multiplier * 0.95), // خصم 5% للـ 3 أشهر
        '6': this.applyMultiplierToPrices(basePrices.abPrices.A, multiplier * 0.90), // خصم 10% للـ 6 أشهر
        '12': this.applyMultiplierToPrices(basePrices.abPrices.A, multiplier * 0.80) // خصم 20% للسنة
      },
      B: {
        '1': this.applyMultiplierToPrices(basePrices.abPrices.B, multiplier),
        '3': this.applyMultiplierToPrices(basePrices.abPrices.B, multiplier * 0.95),
        '6': this.applyMultiplierToPrices(basePrices.abPrices.B, multiplier * 0.90),
        '12': this.applyMultiplierToPrices(basePrices.abPrices.B, multiplier * 0.80)
      }
    }

    return {
      name: municipality.name,
      prices: customerTypePrices,
      abPrices
    }
  }

  /**
   * تطبيق معامل الضرب على قائمة أسعار
   */
  private applyMultiplierToPrices(prices: Record<BillboardSize, number>, multiplier: number): Record<BillboardSize, number> {
    const result: Record<BillboardSize, number> = {}
    
    for (const [size, price] of Object.entries(prices)) {
      result[size as BillboardSize] = Math.round(price * multiplier)
    }
    
    return result
  }

  /**
   * الحصول على المنطقة السعرية بناءً على اسم البلدية
   */
  getPricingZoneByMunicipality(municipalityName: string): PricingZone | null {
    const municipality = municipalityService.getMunicipalityByName(municipalityName)
    
    if (!municipality) {
      console.warn(`[DynamicPricing] لم يتم العثور على البلدية: ${municipalityName}`)
      return null
    }

    return this.createDynamicPricingZone(municipality)
  }

  /**
   * إنشاء قائمة أسعار ديناميكية لجميع البلديات
   */
  generateDynamicPriceList(): PriceList {
    const municipalities = municipalityService.getMunicipalities()
    const zones: Record<string, PricingZone> = {}

    // إنشاء منطقة سعرية لكل بلدية
    municipalities.forEach(municipality => {
      zones[municipality.name] = this.createDynamicPricingZone(municipality)
    })

    return {
      zones,
      packages: [
        { value: 1, unit: 'month', label: 'شهر واحد', discount: 0 },
        { value: 3, unit: 'months', label: '3 أشهر', discount: 5 },
        { value: 6, unit: 'months', label: '6 أشهر', discount: 10 },
        { value: 12, unit: 'year', label: 'سنة كاملة', discount: 20 }
      ],
      currency: 'د.ل'
    }
  }

  /**
   * الحصول على السعر لبلدية ومقاس محددين
   */
  getPriceForMunicipalityAndSize(
    municipalityName: string, 
    size: BillboardSize, 
    customerType: CustomerType = 'individuals',
    priceListType?: PriceListType,
    duration?: number
  ): number | null {
    const zone = this.getPricingZoneByMunicipality(municipalityName)
    
    if (!zone) {
      return null
    }

    // إذا تم تحديد نوع قائمة الأسعار (A أو B) والمدة
    if (priceListType && duration) {
      const durationKey = duration.toString() as keyof DurationPricing
      const durationPrices = zone.abPrices[priceListType][durationKey]
      return durationPrices[size] || null
    }

    // استخدام الأسعار التقليدية حسب نوع العميل
    return zone.prices[customerType][size] || null
  }

  /**
   * إضافة بلدية جديدة مع أسعارها
   */
  addMunicipalityWithPricing(municipalityData: Omit<Municipality, 'id'>): Municipality | null {
    const newMunicipality = municipalityService.addMunicipality(municipalityData)
    
    if (newMunicipality) {
      console.log(`[DynamicPricing] تم إضافة بلدية جديدة: ${newMunicipality.name} مع معامل ${newMunicipality.multiplier}`)
      
      // إنشاء المنطقة السعرية للبلدية الجديدة
      const pricingZone = this.createDynamicPricingZone(newMunicipality)
      console.log(`[DynamicPricing] تم إنشاء منطقة سعرية للبلدية: ${pricingZone.name}`)
    }
    
    return newMunicipality
  }

  /**
   * تحديث أسعار بلدية عند تغيير معاملها
   */
  updateMunicipalityPricing(municipalityId: string, updates: Partial<Omit<Municipality, 'id'>>): boolean {
    const success = municipalityService.updateMunicipality(municipalityId, updates)
    
    if (success && updates.multiplier) {
      const municipality = municipalityService.getMunicipalityById(municipalityId)
      if (municipality) {
        console.log(`[DynamicPricing] تم تحديث معامل البلدية ${municipality.name} إلى ${municipality.multiplier}`)
        
        // إعادة إنشاء المنطقة السعرية بالمعامل الجديد
        const updatedZone = this.createDynamicPricingZone(municipality)
        console.log(`[DynamicPricing] تم تحديث المنطقة السعرية للبلدية: ${updatedZone.name}`)
      }
    }
    
    return success
  }

  /**
   * الحصول على قائمة البلديات مع أسعارها
   */
  getMunicipalitiesWithPricing(): Array<Municipality & { samplePrice: number }> {
    const municipalities = municipalityService.getMunicipalities()
    const basePrices = this.getBasePrices()
    const sampleSize = '4x12' as BillboardSize
    const basePrice = basePrices.customerTypes.individuals[sampleSize]

    return municipalities.map(municipality => ({
      ...municipality,
      samplePrice: Math.round(basePrice * municipality.multiplier)
    }))
  }

  /**
   * البحث في البلديات والمناطق السعرية
   */
  searchMunicipalitiesWithPricing(query: string): Array<Municipality & { samplePrice: number }> {
    const municipalities = municipalityService.searchMunicipalities(query)
    const basePrices = this.getBasePrices()
    const sampleSize = '4x12' as BillboardSize
    const basePrice = basePrices.customerTypes.individuals[sampleSize]

    return municipalities.map(municipality => ({
      ...municipality,
      samplePrice: Math.round(basePrice * municipality.multiplier)
    }))
  }

  /**
   * تصدير البلديات مع أسعارها
   */
  exportMunicipalitiesWithPricing(): void {
    const municipalities = this.getMunicipalitiesWithPricing()
    const basePrices = this.getBasePrices()
    
    const data = [
      ['البلدية', 'المعامل', 'المنطقة', 'المدينة', '5x13 (أفراد)', '4x12 (أفراد)', '4x10 (أفراد)', '3x8 (أفراد)', '3x6 (أفراد)', '3x4 (أفراد)'],
      ...municipalities.map(m => {
        const zone = this.createDynamicPricingZone(m)
        return [
          m.name,
          m.multiplier.toString(),
          m.region || '',
          m.city || '',
          zone.prices.individuals['5x13'].toString(),
          zone.prices.individuals['4x12'].toString(),
          zone.prices.individuals['4x10'].toString(),
          zone.prices.individuals['3x8'].toString(),
          zone.prices.individuals['3x6'].toString(),
          zone.prices.individuals['3x4'].toString()
        ]
      })
    ]

    // استخدام مكتبة XLSX لتصدير البيانات
    const XLSX = require('xlsx')
    const worksheet = XLSX.utils.aoa_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    
    // تنسيق العرض
    worksheet['!cols'] = [
      { width: 20 }, // البلدية
      { width: 10 }, // المعامل
      { width: 15 }, // المنطقة
      { width: 15 }, // المدينة
      { width: 12 }, // 5x13
      { width: 12 }, // 4x12
      { width: 12 }, // 4x10
      { width: 12 }, // 3x8
      { width: 12 }, // 3x6
      { width: 12 }  // 3x4
    ]

    XLSX.utils.book_append_sheet(workbook, worksheet, 'البلديات والأسعار')
    XLSX.writeFile(workbook, 'municipalities-with-pricing.xlsx')
  }

  /**
   * التحقق من صحة بيانات البلدية والأسعار
   */
  validateMunicipalityPricing(municipality: Partial<Municipality>): string[] {
    const errors = municipalityService.validateMunicipality(municipality)
    
    // التحقق من المعامل للتأكد من أنه منطقي للأسعار
    if (municipality.multiplier !== undefined) {
      if (municipality.multiplier < 0.1) {
        errors.push('معامل الضرب صغير جداً (أقل من 0.1) - قد ينتج أسعار منخفضة جداً')
      }
      
      if (municipality.multiplier > 5) {
        errors.push('معامل الضرب كبير جداً (أكبر من 5) - قد ينتج أسعار مرتفعة جداً')
      }
    }
    
    return errors
  }

  /**
   * إعادة تعيين الأسعار الأساسية للقيم الافتراضية
   */
  resetBasePrices(): boolean {
    localStorage.removeItem(this.BASE_PRICES_KEY)
    this.initializeBasePrices()
    return true
  }

  /**
   * الحصول على إحصائيات الأسعار
   */
  getPricingStatistics(): {
    totalMunicipalities: number
    averageMultiplier: number
    priceRange: {
      min: { municipality: string, price: number }
      max: { municipality: string, price: number }
    }
    sampleSize: string
  } {
    const municipalities = this.getMunicipalitiesWithPricing()
    const sampleSize = '4x12'
    
    if (municipalities.length === 0) {
      return {
        totalMunicipalities: 0,
        averageMultiplier: 0,
        priceRange: {
          min: { municipality: '', price: 0 },
          max: { municipality: '', price: 0 }
        },
        sampleSize
      }
    }

    const multipliers = municipalities.map(m => m.multiplier)
    const averageMultiplier = multipliers.reduce((a, b) => a + b, 0) / multipliers.length

    const prices = municipalities.map(m => ({ municipality: m.name, price: m.samplePrice }))
    const minPrice = prices.reduce((min, current) => current.price < min.price ? current : min)
    const maxPrice = prices.reduce((max, current) => current.price > max.price ? current : max)

    return {
      totalMunicipalities: municipalities.length,
      averageMultiplier: Math.round(averageMultiplier * 100) / 100,
      priceRange: {
        min: minPrice,
        max: maxPrice
      },
      sampleSize
    }
  }
}

export const dynamicPricingService = new DynamicPricingService()

// Export to global scope for easier access
if (typeof window !== 'undefined') {
  (window as any).dynamicPricingService = dynamicPricingService
}