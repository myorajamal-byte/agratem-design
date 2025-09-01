import { PriceList, BillboardSize, PriceListType, PackageDuration, Billboard, Quote } from '@/types'
import { pricingService } from '@/services/pricingService'
import { pricingZoneAutoManager } from '@/services/pricingZoneAutoManager'

// قائمة مقاسات افتراضية في حال عدم توفر بيانات
const FALLBACK_SIZES: BillboardSize[] = ['5x13', '4x12', '4x10', '3x8', '3x6', '3x4']

class NewPricingService {
  private readonly SIZES_STORAGE_KEY = 'al-fares-sizes'

  // تخزين المقاسات محلياً عند الضبط
  setSizes(sizes: BillboardSize[]) {
    try { localStorage.setItem(this.SIZES_STORAGE_KEY, JSON.stringify(sizes)) } catch {}
  }

  // إرجاع ا��مقاسات المتاحة (من التخزين المحلي أو استنتاجاً من الأسعار)
  get sizes(): BillboardSize[] {
    try {
      const stored = localStorage.getItem(this.SIZES_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as BillboardSize[]
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch {}

    // استنتاج المقاسات من هيكل الأسعار الحالي
    const pricing = this.getPricing()
    const sizes = new Set<BillboardSize>()
    const zones = Object.values(pricing.zones || {})
    for (const z of zones) {
      // من أسعار القوائم A/B للمدة 1 شهر إن وجدت، ثم باقي المدد
      const abA = (z.abPrices as any)?.A as any
      const abB = (z.abPrices as any)?.B as any
      const durationKeys = ['1','3','6','12']
      for (const dk of durationKeys) {
        Object.keys((abA?.[dk] || {})).forEach(s => sizes.add(s))
        Object.keys((abB?.[dk] || {})).forEach(s => sizes.add(s))
      }
      // من أسعار أنواع العملاء (قديمة)
      Object.keys(z.prices?.companies || {}).forEach(s => sizes.add(s))
      Object.keys(z.prices?.individuals || {}).forEach(s => sizes.add(s))
      Object.keys(z.prices?.marketers || {}).forEach(s => sizes.add(s))
      Object.keys((z.prices as any)?.city || {}).forEach(s => sizes.add(s as any))
    }
    const result = Array.from(sizes)
    return result.length > 0 ? result as BillboardSize[] : FALLBACK_SIZES
  }

  // تحميل/تحديث الأسعار كاملة
  getPricing(): PriceList { return pricingService.getPricing() }
  updatePricing(pricing: PriceList): { success: boolean; error?: string } { return pricingService.updatePricing(pricing) }

  // مزامنة المناطق السعرية مع ملف الإكسل
  async checkNeedForSync(): Promise<{ success: boolean; existingZones: string[]; missingZones: string[]; totalMunicipalities: number; newZonesCreated: string[]; errors: string[] }> {
    const analysis = await pricingZoneAutoManager.analyzePricingZones()
    return analysis
  }
  async syncWithExcelData(): Promise<{ success: boolean; existingZones: string[]; missingZones: string[]; totalMunicipalities: number; newZonesCreated: string[]; errors: string[] }> {
    const result = await pricingZoneAutoManager.syncPricingZonesWithExcel()
    return result
  }

  // مناطق التسعير المتاحة
  getPricingZones(): string[] { return Object.keys(this.getPricing().zones || {}) }

  // أنواع الزبائن
  getCustomerTypes(): Array<'marketers' | 'individuals' | 'companies' | 'city'> {
    return ['marketers','individuals','companies','city']
  }

  // قوائم الأسعار A/B وأنواع المدد
  getPackages(): PackageDuration[] { return pricingService.getPackages() }
  getPriceListTypes(): Array<{ value: PriceListType; label: string }> { return pricingService.getPriceListTypes() }

  // التحقق من صحة المقاسات
  validateSize(size: string): boolean { return /^\d+x\d+$/.test((size || '').toString().trim()) }

  // تحديد المنطقة من البلدية/المنطقة
  determinePricingZone(municipality: string, area?: string): string | null {
    return pricingService.determinePricingZone(municipality, area)
  }

  // تحديد قائمة الأسعار من بيانات اللوحة
  determinePriceListFromBillboard(b: Billboard): PriceListType {
    if (b.priceCategory === 'A' || b.priceCategory === 'B') return b.priceCategory
    const lvl = (b.level || '').toString().toUpperCase()
    if (lvl.includes('A')) return 'A'
    if (lvl.includes('B')) return 'B'
    return 'A'
  }

  // الحصول على سعر قائمة A/B مع المدة، مع معامل البلدية اختياري
  getBillboardPriceABWithDuration(size: BillboardSize, zoneName: string, priceList: PriceListType, duration: number, municipality?: string): number {
    const pricing = this.getPricing()
    const zone = pricing.zones?.[zoneName]
    if (!zone) return 0

    const dKey = String(duration) as '1'|'3'|'6'|'12'
    const ab = zone.abPrices as any
    let basePrice = 0

    // تفضيل البنية حسب المدد
    if (ab?.[priceList]?.[dKey] && typeof ab[priceList][dKey][size] === 'number') {
      basePrice = Number(ab[priceList][dKey][size]) || 0
    } else if (ab?.[priceList] && typeof ab[priceList][size] === 'number') {
      basePrice = Number(ab[priceList][size]) || 0
    } else {
      // fallback للنظام القديم
      const legacy = zone.prices?.companies?.[size] || zone.prices?.individuals?.[size] || zone.prices?.marketers?.[size]
      basePrice = Number(legacy) || 0
    }

    // تطبيق معامل البلدية إن وجد
    if (municipality) {
      const m = pricingService.getMunicipalityMultiplier(municipality)
      basePrice = Math.round(basePrice * m)
    }

    // تطبيق خصم/حساب المدة إن لم تكن الأسعار لكل مدة موجودة
    if (!(ab?.[priceList]?.[dKey] && typeof ab[priceList][dKey][size] === 'number')) {
      const pkg = (this.getPackages() || []).find(p => String(p.value) === String(duration))
      if (pkg) {
        const discount = (basePrice * pkg.discount) / 100
        basePrice = Math.round(basePrice - discount)
      }
    }

    return basePrice
  }

  // إنشاء فاتورة وعرضها
  generateQuote(customerInfo: Quote['customerInfo'], billboards: Array<{ id: string; name: string; location: string; municipality: string; area: string; size: BillboardSize; status: string; imageUrl?: string; level?: string; priceCategory?: PriceListType }>, packageDuration: PackageDuration): Quote {
    return pricingService.generateQuote(customerInfo, billboards as any, packageDuration)
  }
  printQuote(quote: Quote): void { pricingService.printQuote(quote) }

  // إضافة/حذف مقاسات من كل المناطق
  addSizeToAllZones(size: BillboardSize, defaultPrice: number): { success: boolean; error?: string } {
    try {
      const pricing = this.getPricing()
      // تحديث القوائم A/B لكل منطقة ولكل مدة
      const durations: Array<'1'|'3'|'6'|'12'> = ['1','3','6','12']
      Object.values(pricing.zones).forEach((zone) => {
        ;(['A','B'] as const).forEach((pl) => {
          if (!zone.abPrices) (zone as any).abPrices = { A: {}, B: {} }
          durations.forEach((dk) => {
            if (!zone.abPrices[pl][dk]) (zone.abPrices[pl] as any)[dk] = {}
            if (typeof (zone.abPrices[pl] as any)[dk][size] !== 'number') {
              ;(zone.abPrices[pl] as any)[dk][size] = defaultPrice
            }
          })
        })
        // تحديث النظام القديم أيضاً
        ;(['marketers','individuals','companies','city'] as const).forEach((ct) => {
          if (!(zone.prices as any)[ct]) (zone.prices as any)[ct] = {}
          if (typeof (zone.prices as any)[ct][size] !== 'number') (zone.prices as any)[ct][size] = defaultPrice
        })
      })
      const res = this.updatePricing(pricing)
      if (res.success) {
        // حفظ قائمة المقاسات محلياً
        const newSizes = Array.from(new Set([...this.sizes, size])) as BillboardSize[]
        this.setSizes(newSizes)
      }
      return res
    } catch (e: any) {
      return { success: false, error: e?.message || 'تعذر إضافة المقاس' }
    }
  }

  removeSizeFromAllZones(size: BillboardSize): { success: boolean; error?: string } {
    try {
      const current = this.sizes
      if (current.length <= 1) return { success: false, error: 'لا يمكن حذف آخر مقاس' }
      const pricing = this.getPricing()
      Object.values(pricing.zones).forEach((zone) => {
        ;(['A','B'] as const).forEach((pl) => {
          const durations: Array<'1'|'3'|'6'|'12'> = ['1','3','6','12']
          durations.forEach((dk) => { if (zone.abPrices?.[pl]?.[dk]) delete (zone.abPrices as any)[pl][dk][size] })
        })
        ;(['marketers','individuals','companies','city'] as const).forEach((ct) => { if ((zone.prices as any)?.[ct]) delete (zone.prices as any)[ct][size] })
      })
      const res = this.updatePricing(pricing)
      if (res.success) this.setSizes(current.filter((s) => s !== size))
      return res
    } catch (e: any) {
      return { success: false, error: e?.message || 'تعذر حذف المقاس' }
    }
  }

  // إضافة منطقة تسعير لبلدية إن لم تكن موجودة
  addPricingZoneForMunicipality(municipalityName: string): { success: boolean; error?: string } {
    try {
      const pricing = this.getPricing()
      const name = (municipalityName || '').toString().trim()
      if (!name) return { success: false, error: 'اسم البلدية مطلوب' }
      if (pricing.zones[name]) return { success: true }
      const newZone = pricingZoneAutoManager.createDefaultPricingZone(name)
      pricing.zones[name] = newZone
      return this.updatePricing(pricing)
    } catch (e: any) {
      return { success: false, error: e?.message || 'تعذر إضافة المنطقة' }
    }
  }
}

export const newPricingService = new NewPricingService()
