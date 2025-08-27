import { PriceList, PricingZone, BillboardSize, QuoteItem, Quote, CustomerType, PackageDuration } from '@/types'

// الباقات الزمنية المتاحة
const DEFAULT_PACKAGES: PackageDuration[] = [
  { value: 1, unit: 'month', label: 'شهر واحد', discount: 0 },
  { value: 3, unit: 'months', label: '3 أشهر', discount: 5 }, // خصم 5%
  { value: 6, unit: 'months', label: '6 أشهر', discount: 10 }, // خصم 10%
  { value: 12, unit: 'year', label: 'سنة كاملة', discount: 20 } // خصم 20%
]

// قائمة الأسعار الافتراضية مع فئات الزبائن
const DEFAULT_PRICING: PriceList = {
  zones: {
    'مصراتة': {
      name: 'مصراتة',
      prices: {
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
    },
    'أبو سليم': {
      name: 'أبو سليم',
      prices: {
        marketers: {
          '5x13': 3400,
          '4x12': 2800,
          '4x10': 2300,
          '3x8': 1700,
          '3x6': 1300,
          '3x4': 900
        },
        individuals: {
          '5x13': 4000,
          '4x12': 3300,
          '4x10': 2700,
          '3x8': 2000,
          '3x6': 1500,
          '3x4': 1000
        },
        companies: {
          '5x13': 4600,
          '4x12': 3800,
          '4x10': 3100,
          '3x8': 2300,
          '3x6': 1700,
          '3x4': 1100
        }
      }
    },
    'شركات': {
      name: 'شركات',
      prices: {
        marketers: {
          '5x13': 3800,
          '4x12': 3200,
          '4x10': 2700,
          '3x8': 2100,
          '3x6': 1700,
          '3x4': 1300
        },
        individuals: {
          '5x13': 4500,
          '4x12': 3800,
          '4x10': 3200,
          '3x8': 2500,
          '3x6': 2000,
          '3x4': 1500
        },
        companies: {
          '5x13': 5200,
          '4x12': 4400,
          '4x10': 3700,
          '3x8': 2900,
          '3x6': 2300,
          '3x4': 1700
        }
      }
    },
    'إجرامات': {
      name: 'إجرامات',
      prices: {
        marketers: {
          '5x13': 3000,
          '4x12': 2400,
          '4x10': 1900,
          '3x8': 1300,
          '3x6': 900,
          '3x4': 700
        },
        individuals: {
          '5x13': 3500,
          '4x12': 2800,
          '4x10': 2200,
          '3x8': 1500,
          '3x6': 1000,
          '3x4': 800
        },
        companies: {
          '5x13': 4000,
          '4x12': 3200,
          '4x10': 2500,
          '3x8': 1700,
          '3x6': 1200,
          '3x4': 900
        }
      }
    }
  },
  packages: DEFAULT_PACKAGES,
  currency: 'د.ل' // دينار ليبي
}

/**
 * خدمة إدارة الأسعار والفواتير
 * تشمل إدارة أسعار اللوحات وإنشاء فواتير العروض
 */
class PricingService {
  private readonly PRICING_STORAGE_KEY = 'al-fares-pricing'

  constructor() {
    this.initializeDefaultPricing()
  }

  /**
   * تهيئة الأسعار الافتراضية
   */
  private initializeDefaultPricing() {
    if (!localStorage.getItem(this.PRICING_STORAGE_KEY)) {
      localStorage.setItem(this.PRICING_STORAGE_KEY, JSON.stringify(DEFAULT_PRICING))
    }
  }

  /**
   * الحصول على قائمة الأسعار
   */
  getPricing(): PriceList {
    try {
      const pricing = localStorage.getItem(this.PRICING_STORAGE_KEY)
      return pricing ? JSON.parse(pricing) : DEFAULT_PRICING
    } catch {
      return DEFAULT_PRICING
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
   * الحصول على سعر لوحة معينة حسب فئة الزبون
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
   * تحديد المنطقة السعرية بناءً على البلدية أو المنطقة
   */
  determinePricingZone(municipality: string, area: string): string {
    const municipalityLower = municipality.toLowerCase()
    const areaLower = area.toLowerCase()
    
    // تحديد المنطقة بناءً على البلدية
    if (municipalityLower.includes('مصراتة')) return 'مصراتة'
    if (municipalityLower.includes('أبو سليم') || areaLower.includes('أبو سليم')) return 'أبو سليم'
    if (municipalityLower.includes('طرابلس') && areaLower.includes('الشط')) return 'شركات'
    
    // إعادة المنطقة الافتراضية
    return 'مصراتة'
  }

  /**
   * حساب إجمالي عرض السعر
   */
  calculateQuoteTotal(items: QuoteItem[]): number {
    return items.reduce((total, item) => total + (item.price * item.duration), 0)
  }

  /**
   * إنشاء فاتورة عرض
   */
  generateQuote(
    customerInfo: {
      name: string
      email: string
      phone: string
      company?: string
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
    }>,
    duration: number = 1 // المدة بالأشهر
  ): Quote {
    const pricing = this.getPricing()
    
    const items: QuoteItem[] = billboards.map(billboard => {
      const zone = this.determinePricingZone(billboard.municipality, billboard.area)
      const price = this.getBillboardPrice(billboard.size, zone)
      
      return {
        billboardId: billboard.id,
        name: billboard.name,
        location: billboard.location,
        size: billboard.size,
        zone,
        price,
        duration,
        total: price * duration
      }
    })

    const subtotal = this.calculateQuoteTotal(items)
    const taxRate = 0.0 // يمكن تعديلها حسب الحاجة
    const tax = subtotal * taxRate
    const total = subtotal + tax

    return {
      id: `Q-${Date.now()}`,
      customerInfo,
      items,
      subtotal,
      tax,
      taxRate,
      total,
      currency: pricing.currency,
      unit: pricing.unit,
      duration,
      createdAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // صالح لـ 30 يوم
    }
  }

  /**
   * الحصول على قائمة المناطق السعرية
   */
  getPricingZones(): string[] {
    const pricing = this.getPricing()
    return Object.keys(pricing.zones)
  }

  /**
   * الحصول على قائمة المقاسات المتاحة
   */
  getAvailableSizes(): BillboardSize[] {
    return ['5x13', '4x12', '4x10', '3x8', '3x6', '3x4']
  }

  /**
   * تصدير فاتورة العرض لـ PDF
   */
  exportQuoteToPDF(quote: Quote): string {
    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>عرض سعر - الفارس الذهبي</title>
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet">
        <style>
          @page {
            size: A4;
            margin: 15mm;
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Tajawal', 'Cairo', 'Arial', sans-serif;
            direction: rtl;
            background: white;
            color: #000;
            line-height: 1.6;
            font-size: 12px;
          }
          .header { 
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px; 
            padding: 15px 0;
            border-bottom: 3px solid #D4AF37;
          }
          .logo-section {
            display: flex;
            align-items: center;
            gap: 15px;
          }
          .logo { 
            width: 80px; 
            height: 80px; 
            object-fit: contain;
          }
          .company-info {
            text-align: right;
          }
          .company-name-ar { 
            font-size: 20px; 
            font-weight: 700; 
            color: #000; 
            margin-bottom: 3px;
          }
          .company-name-en { 
            font-size: 14px; 
            color: #666;
            font-weight: 400;
          }
          .quote-header {
            text-align: center;
            margin-bottom: 30px;
          }
          .quote-title {
            font-size: 24px;
            font-weight: 700;
            color: #000;
            background: linear-gradient(135deg, #D4AF37, #F4E04D);
            padding: 10px 30px;
            border-radius: 25px;
            display: inline-block;
            margin-bottom: 10px;
          }
          .quote-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 25px;
            border: 2px solid #D4AF37;
          }
          .customer-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 25px;
          }
          .info-group h3 {
            color: #D4AF37;
            font-size: 16px;
            font-weight: 700;
            margin-bottom: 10px;
            border-bottom: 2px solid #D4AF37;
            padding-bottom: 5px;
          }
          .info-item {
            margin-bottom: 8px;
            font-size: 13px;
          }
          .info-label {
            font-weight: 700;
            color: #333;
            margin-left: 10px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
            font-size: 11px;
          }
          th, td {
            border: 1px solid #D4AF37;
            padding: 8px 6px;
            text-align: center;
            vertical-align: middle;
          }
          th {
            background: linear-gradient(135deg, #D4AF37, #F4E04D);
            color: #000;
            font-weight: 700;
            font-size: 12px;
          }
          tr:nth-child(even) {
            background: #FFFEF7;
          }
          .price {
            font-weight: 700;
            color: #D4AF37;
          }
          .totals-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            border: 2px solid #D4AF37;
            margin-bottom: 25px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 14px;
          }
          .total-row.final {
            font-size: 18px;
            font-weight: 700;
            color: #D4AF37;
            border-top: 2px solid #D4AF37;
            padding-top: 15px;
            margin-top: 15px;
          }
          .terms {
            background: #f0f9ff;
            padding: 15px;
            border-radius: 8px;
            border-right: 4px solid #3b82f6;
            margin-top: 25px;
          }
          .terms h3 {
            color: #1e40af;
            margin-bottom: 10px;
            font-size: 14px;
          }
          .terms ul {
            list-style: none;
            padding-right: 20px;
          }
          .terms li {
            margin-bottom: 5px;
            font-size: 11px;
            position: relative;
          }
          .terms li:before {
            content: "•";
            color: #3b82f6;
            font-weight: bold;
            position: absolute;
            right: -15px;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            color: #666;
            font-size: 11px;
            border-top: 1px solid #ddd;
            padding-top: 15px;
          }
          @media print {
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-section">
            <img src="${window.location.origin}/logo-symbol.svg" alt="شعار الشركة" class="logo" />
            <div class="company-info">
              <div class="company-name-ar">الفــــارس الذهبــــي</div>
              <div class="company-name-en">AL FARES AL DAHABI</div>
              <div class="company-name-ar" style="font-size: 12px;">للدعــــــاية والإعـــلان</div>
            </div>
          </div>
        </div>

        <div class="quote-header">
          <div class="quote-title">عرض سعر إعلاني</div>
          <div style="color: #666; font-size: 14px;">رقم العرض: ${quote.id}</div>
          <div style="color: #666; font-size: 12px;">تاريخ العرض: ${new Date(quote.createdAt).toLocaleDateString('ar-SA')}</div>
          <div style="color: #666; font-size: 12px;">صالح حتى: ${new Date(quote.validUntil).toLocaleDateString('ar-SA')}</div>
        </div>

        <div class="customer-section">
          <div class="info-group">
            <h3>بيانات العميل</h3>
            <div class="info-item">
              <span class="info-label">الاسم:</span>
              ${quote.customerInfo.name}
            </div>
            <div class="info-item">
              <span class="info-label">البريد الإلكتروني:</span>
              ${quote.customerInfo.email}
            </div>
            <div class="info-item">
              <span class="info-label">رقم الهاتف:</span>
              ${quote.customerInfo.phone}
            </div>
            ${quote.customerInfo.company ? `
            <div class="info-item">
              <span class="info-label">الشركة:</span>
              ${quote.customerInfo.company}
            </div>
            ` : ''}
          </div>
          <div class="info-group">
            <h3>تفاصيل العرض</h3>
            <div class="info-item">
              <span class="info-label">عدد اللوحات:</span>
              ${quote.items.length} لوحة
            </div>
            <div class="info-item">
              <span class="info-label">مدة الإعلان:</span>
              ${quote.duration} ${quote.unit}
            </div>
            <div class="info-item">
              <span class="info-label">العملة:</span>
              ${quote.currency}
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>م</th>
              <th>اسم اللوحة</th>
              <th>الموقع</th>
              <th>المقاس</th>
              <th>المنطقة السعرية</th>
              <th>السعر ${quote.unit}</th>
              <th>المدة</th>
              <th>الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            ${quote.items.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td style="text-align: right; padding-right: 8px;">${item.name}</td>
                <td style="text-align: right; padding-right: 8px;">${item.location}</td>
                <td>${item.size}</td>
                <td>${item.zone}</td>
                <td class="price">${item.price.toLocaleString()} ${quote.currency}</td>
                <td>${item.duration} شهر</td>
                <td class="price">${item.total.toLocaleString()} ${quote.currency}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals-section">
          <div class="total-row">
            <span>المجموع الفرعي:</span>
            <span class="price">${quote.subtotal.toLocaleString()} ${quote.currency}</span>
          </div>
          ${quote.tax > 0 ? `
          <div class="total-row">
            <span>الضريبة (${(quote.taxRate * 100).toFixed(1)}%):</span>
            <span class="price">${quote.tax.toLocaleString()} ${quote.currency}</span>
          </div>
          ` : ''}
          <div class="total-row final">
            <span>الإجمالي النهائي:</span>
            <span>${quote.total.toLocaleString()} ${quote.currency}</span>
          </div>
        </div>

        <div class="terms">
          <h3>الشروط والأحكام</h3>
          <ul>
            <li>هذا العرض صالح لمدة 30 يوماً من تاريخ الإصدار</li>
            <li>الأسعار المذكورة شاملة جميع الخدمات</li>
            <li>يتم الدفع مقدماً قبل بدء الح��لة الإعلانية</li>
            <li>في حالة إلغاء الحجز، يتم استرداد 50% من المبلغ المدفوع</li>
            <li>الشركة غير مسؤولة عن أي أضرار طبيعية قد تلحق باللوحة</li>
            <li>يحق للشركة تغيير موقع اللوحة في حالات الضرورة القصوى</li>
          </ul>
        </div>

        <div class="footer">
          <p>الفارس الذهبي للدعاية والإعلان | هاتف: 218913228908+ | البريد: g.faris.business@gmail.com</p>
          <p>نشكركم لثقتكم بخدماتنا ونتطلع للعمل معكم</p>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 1000);
            }, 500);
          };
        </script>
      </body>
      </html>
    `

    return printContent
  }

  /**
   * فتح نافذة طباعة فاتورة العرض
   */
  printQuote(quote: Quote): void {
    const printContent = this.exportQuoteToPDF(quote)
    const printWindow = window.open('', '_blank')
    
    if (!printWindow) {
      alert('يرجى السماح بف��ح النوافذ المنبثقة لطباعة الفاتورة')
      return
    }

    printWindow.document.write(printContent)
    printWindow.document.close()
  }
}

export const pricingService = new PricingService()
