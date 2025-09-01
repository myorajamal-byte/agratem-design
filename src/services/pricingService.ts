import { PriceList, PricingZone, BillboardSize, QuoteItem, Quote, CustomerType, PackageDuration, PriceListType } from '@/types'
import { formatGregorianDate } from '@/lib/dateUtils'
import { cloudDatabase } from './cloudDatabase'
import { dynamicPricingService } from './dynamicPricingService'

class PricingService {
  private readonly PRICING_STORAGE_KEY = 'al-fares-pricing'
  private readonly DYNAMIC_FLAG_KEY = 'al-fares-dynamic-enabled'

  constructor() {
    this.initializePricingFromDB()
  }

  /**
   * تحميل الأسعار من Supabase وتخزينها محلياً
   */
  private initializePricingFromDB() {
    try { localStorage.removeItem(this.PRICING_STORAGE_KEY) } catch {}
    cloudDatabase.getRentalPricing()
      .then(remote => {
        if (remote) {
          localStorage.setItem(this.PRICING_STORAGE_KEY, JSON.stringify(remote))
        }
      })
      .catch(() => {})
  }

  /**
   * الحصول على الأسعار المخزنة
   */
  getPricing(): PriceList {
    try {
      const stored = localStorage.getItem(this.PRICING_STORAGE_KEY)
      if (stored) return JSON.parse(stored)
    } catch {}
    return { zones: {}, packages: [], currency: 'د.ل' }
  }

  updatePricing(pricing: PriceList): { success: boolean; error?: string } {
    try {
      localStorage.setItem(this.PRICING_STORAGE_KEY, JSON.stringify(pricing))
      try { void cloudDatabase.saveRentalPricing(pricing) } catch {}
      return { success: true }
    } catch (error) {
      console.error('خطأ في تحديث الأسعار:', error)
      return { success: false, error: 'حدث خطأ في حفظ الأسعار' }
    }
  }

  getBillboardPrice(size: BillboardSize, zone: string, customerType: CustomerType = 'individuals', municipality?: string): number {
    const pricing = this.getPricing()
    const zoneData = pricing.zones[zone]
    if (!zoneData || !zoneData.prices?.[customerType]) return 0
    const basePrice = zoneData.prices[customerType][size]
    if (!basePrice) return 0
    if (municipality) {
      const m = this.getMunicipalityMultiplier(municipality)
      return Math.round(basePrice * m)
    }
    return basePrice
  }

  getBillboardPriceAB(size: BillboardSize, zone: string, priceList: PriceListType = 'A', municipality?: string): number {
    const pricing = this.getPricing()
    const zoneData = pricing.zones[zone]
    if (!zoneData || !zoneData.abPrices?.[priceList]) return 0
    const durationPrices = (zoneData.abPrices[priceList] as any)['1'] || (zoneData.abPrices as any)[priceList]
    const basePrice = durationPrices?.[size]
    if (!basePrice) return 0
    if (municipality) {
      const m = this.getMunicipalityMultiplier(municipality)
      return Math.round(basePrice * m)
    }
    return basePrice
  }

  getMunicipalityMultiplier(municipality: string): number {
    try {
      const municipalityService = (window as any)?.municipalityService
      if (municipalityService) {
        const data = municipalityService.getMunicipalityByName(municipality)
        if (data && typeof data.multiplier === 'number') return data.multiplier
      }
    } catch {}
    return 1.0
  }

  getPackages(): PackageDuration[] {
    const pricing = this.getPricing()
    return pricing.packages || []
  }

  private getDefaultPackages(): PackageDuration[] { return [] }

  calculatePriceWithDiscount(basePrice: number, packageDuration: PackageDuration) {
    const discountAmount = (basePrice * packageDuration.discount) / 100
    const finalPrice = basePrice - discountAmount
    return { finalPrice, discount: packageDuration.discount, totalDiscount: discountAmount * packageDuration.value }
  }

  determinePricingZone(municipality: string, area?: string): string | null {
    const pricing = this.getPricing()
    const zoneName = (municipality || '').trim()
    if (!zoneName) return pricing.zones['عام'] ? 'عام' : null
    if (pricing.zones[zoneName]) return zoneName
    const available = Object.keys(pricing.zones)
    const lower = zoneName.toLowerCase()
    for (const z of available) {
      if (z.toLowerCase().includes(lower) || lower.includes(z.toLowerCase())) return z
    }
    // Fallback to a default/general zone when specific match is not found
    if (pricing.zones['عام']) return 'عام'
    return available[0] || null
  }

  calculateQuoteTotal(items: QuoteItem[]): number {
    return items.reduce((total, item) => total + item.total, 0)
  }

  getCustomerTypeLabel(type: CustomerType): string {
    const labels = { marketers: 'المسوقين', individuals: 'العاديين', companies: 'الشركات' }
    return (labels as any)[type] || 'غير محدد'
  }

  generateQuote(
    customerInfo: { name: string; email: string; phone: string; company?: string; type: CustomerType },
    billboards: Array<{ id: string; name: string; location: string; municipality: string; area: string; size: BillboardSize; status: string; imageUrl?: string }>,
    packageDuration: PackageDuration
  ): Quote {
    const pricing = this.getPricing()

    const items: QuoteItem[] = billboards.map((b) => {
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
        imageUrl: b.imageUrl,
      }
    })

    const subtotal = items.reduce((sum, item) => sum + item.basePrice * item.duration, 0)
    const totalDiscount = items.reduce((sum, item) => sum + (item.basePrice - item.finalPrice) * item.duration, 0)
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
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }
  }

  printQuote(quote: Quote): void {
    const html = this.exportQuoteToPDF(quote)
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(html)
    win.document.close()
  }

  exportQuoteToPDF(quote: Quote): string {
    return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>عرض سعر - الفارس الذهبي</title>
<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet">
<style>
  body{font-family:'Tajawal','Cairo','Arial',sans-serif;direction:rtl;color:#000}
  .header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;padding:10px 0;border-bottom:3px solid #D4AF37}
  table{width:100%;border-collapse:collapse;margin-top:12px}
  th,td{border:1px solid #D4AF37;padding:6px 8px;text-align:center}
  th{background:linear-gradient(135deg,#D4AF37,#F4E04D)}
  .price{font-weight:700;color:#D4AF37}
</style>
</head>
<body>
  <div class="header">
    <div style="display:flex;align-items:center;gap:12px">
      <img src="${window.location.origin}/logo-symbol.svg" width="64" height="64" />
      <div>
        <div style="font-size:18px;font-weight:700">الفارس الذهبي</div>
        <div style="font-size:12px;color:#666">عرض سعر</div>
      </div>
    </div>
    <div style="text-align:left">
      <div>رقم العرض: ${quote.id}</div>
      <div>تاريخ: ${formatGregorianDate(quote.createdAt)}</div>
      <div>صالح حتى: ${formatGregorianDate(quote.validUntil)}</div>
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th>م</th><th>اسم اللوحة</th><th>الموقع</th><th>المقاس</th><th>المنطقة</th><th>السعر/شهر</th><th>المدة</th><th>الإجمالي</th>
      </tr>
    </thead>
    <tbody>
      ${quote.items.map((it, i)=>`<tr>
        <td>${i+1}</td>
        <td style="text-align:right">${it.name}</td>
        <td style="text-align:right">${it.location}</td>
        <td>${it.size}</td>
        <td>${it.zone}</td>
        <td class="price">${it.finalPrice.toLocaleString()} ${quote.currency}</td>
        <td>${it.duration} شهر</td>
        <td class="price">${it.total.toLocaleString()} ${quote.currency}</td>
      </tr>`).join('')}
    </tbody>
  </table>
  <div style="margin-top:12px">
    <div>المجموع قبل الخصم: <span class="price">${quote.subtotal.toLocaleString()} ${quote.currency}</span></div>
    <div>إجمالي الخصم (${quote.packageInfo.discount}%): <span class="price">-${quote.totalDiscount.toLocaleString()} ${quote.currency}</span></div>
    <div>الإجمالي النهائي: <strong>${quote.total.toLocaleString()} ${quote.currency}</strong></div>
  </div>
  <script>window.onload=function(){setTimeout(function(){window.print(); setTimeout(function(){window.close()}, 600)}, 300)};<\/script>
</body>
</html>`
  }

  getPriceListTypes(): Array<{ value: PriceListType; label: string }> {
    return [
      { value: 'A', label: 'مستوى 1 - سيتي A' },
      { value: 'B', label: 'مستوى 2 - مسوقين' },
    ]
  }

  comparePriceListsForZone(zoneName: string): {
    sizes: Array<{ size: BillboardSize; priceA: number; priceB: number; difference: number; percentDifference: number }>
  } | null {
    const pricing = this.getPricing()
    const zone = pricing.zones[zoneName]
    if (!zone || !zone.abPrices) return null
    const pricesA = (zone.abPrices.A as any)['1'] || (zone.abPrices as any).A
    const pricesB = (zone.abPrices.B as any)['1'] || (zone.abPrices as any).B
    const sizes = Array.from(new Set([...(Object.keys(pricesA||{})), ...(Object.keys(pricesB||{}))])) as BillboardSize[]
    const result = sizes.map((size) => {
      const a = (pricesA?.[size] as number) || 0
      const b = (pricesB?.[size] as number) || 0
      const diff = b - a
      const percent = a === 0 ? 0 : Math.round((diff / a) * 100)
      return { size, priceA: a, priceB: b, difference: diff, percentDifference: percent }
    })
    return { sizes: result }
  }

  isDynamicPricingEnabled(): boolean {
    try { return localStorage.getItem(this.DYNAMIC_FLAG_KEY) === '1' } catch { return false }
  }

  enableDynamicPricing(): void {
    try {
      localStorage.setItem(this.DYNAMIC_FLAG_KEY, '1')
      const generated = dynamicPricingService.generateDynamicPriceList()
      this.updatePricing(generated)
    } catch {}
  }

  disableDynamicPricing(): void {
    try { localStorage.setItem(this.DYNAMIC_FLAG_KEY, '0') } catch {}
  }
}

export const pricingService = new PricingService()
