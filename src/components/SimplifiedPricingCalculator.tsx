import React, { useState, useEffect } from 'react'
import { 
  Calculator, 
  Calendar, 
  MapPin, 
  Users, 
  Building2, 
  Wrench, 
  FileText, 
  X, 
  Clock,
  DollarSign,
  Target,
  Grid3X3,
  CheckCircle,
  AlertTriangle,
  Printer,
  Save
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Billboard, BillboardSize, PriceListType } from '@/types'
import { arabicPricingService } from '@/services/arabicPricingService'
import { formatGregorianDate } from '@/lib/dateUtils'

interface BillboardCalculation {
  billboard: Billboard
  basePrice: number
  totalDays: number
  installationCost: number
  totalPrice: number
  dailyRate: number
  breakdown: string[]
}

interface SimplifiedPricingCalculatorProps {
  onClose: () => void
  selectedBillboards?: string[]
  allBillboards?: Billboard[]
}

const SimplifiedPricingCalculator: React.FC<SimplifiedPricingCalculatorProps> = ({
  onClose,
  selectedBillboards = [],
  allBillboards = []
}) => {
  // حالة النظام الأساسية
  const [pricingMode, setPricingMode] = useState<'daily' | 'package'>('daily')
  const [customerType, setCustomerType] = useState<'عادي' | 'مسوق' | 'شركات' | 'المدينة'>('عادي')
  
  // التواريخ للحساب اليومي
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState<string>(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
  
  // الباقات
  const [selectedPackage, setSelectedPackage] = useState<'شهر واحد' | '2 أشهر' | '3 أشهر' | '6 أشهر' | 'سنة كاملة'>('شهر واحد')
  
  // التركيب
  const [includeInstallation, setIncludeInstallation] = useState<boolean>(false)
  const [installationPricePerBoard, setInstallationPricePerBoard] = useState<number>(500)
  
  // معلومات العميل
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    company: '',
    phone: '',
    email: ''
  })

  // البيانات المحسوبة
  const [selectedBillboardsData, setSelectedBillboardsData] = useState<Billboard[]>([])
  const [calculations, setCalculations] = useState<BillboardCalculation[]>([])
  const [totalCalculation, setTotalCalculation] = useState({
    totalPrice: 0,
    totalDailyRate: 0,
    totalInstallation: 0,
    grandTotal: 0,
    averageDailyRate: 0
  })

  // حالة التحميل والأخطاء
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // تحميل اللوحات المختارة
  useEffect(() => {
    if (selectedBillboards.length > 0 && allBillboards.length > 0) {
      const selected = allBillboards.filter(billboard => selectedBillboards.includes(billboard.id))
      setSelectedBillboardsData(selected)
    }
  }, [selectedBillboards, allBillboards])

  // حساب الأسعار عند تغيير المدخلات
  useEffect(() => {
    if (selectedBillboardsData.length > 0) {
      calculatePricing()
    }
  }, [
    selectedBillboardsData, 
    pricingMode, 
    customerType, 
    startDate, 
    endDate, 
    selectedPackage, 
    includeInstallation, 
    installationPricePerBoard
  ])

  // حساب عدد الأيام
  const calculateDays = (): number => {
    if (pricingMode === 'daily') {
      const start = new Date(startDate)
      const end = new Date(endDate)
      const diffTime = end.getTime() - start.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
      return Math.max(diffDays, 1)
    } else {
      // حساب أيام الباقة
      const packageDays: Record<string, number> = {
        'شهر واحد': 30,
        '2 أشهر': 60,
        '3 أشهر': 90,
        '6 أشهر': 180,
        'سنة كاملة': 365
      }
      return packageDays[selectedPackage] || 30
    }
  }

  // تحويل نوع الزبون للإنجليزية
  const mapCustomerType = (arabicType: string): 'individuals' | 'marketers' | 'companies' => {
    const mapping: Record<string, 'individuals' | 'marketers' | 'companies'> = {
      'عادي': 'individuals',
      'مسوق': 'marketers',
      'شركات': 'companies',
      'المدينة': 'companies'
    }
    return mapping[arabicType] || 'individuals'
  }

  // حساب التسعير لجميع اللوحات
  const calculatePricing = async () => {
    if (selectedBillboardsData.length === 0) return

    setLoading(true)
    setError('')

    try {
      const totalDays = calculateDays()
      const englishCustomerType = mapCustomerType(customerType)
      const newCalculations: BillboardCalculation[] = []
      let totalPrice = 0
      let totalDailyRate = 0
      let totalInstallation = 0

      for (const billboard of selectedBillboardsData) {
        const size = billboard.size
        const level = (billboard.level || 'A') as PriceListType
        const municipality = billboard.municipality

        // الحصول على السعر من جدول الأسعار العربية
        let basePrice = 0
        
        if (pricingMode === 'daily') {
          // للحساب اليومي، استخدم سعر "يوم واحد"
          basePrice = await arabicPricingService.getPrice(size, level, englishCustomerType, 1)
        } else {
          // للباقات، استخدم السعر المناسب للمدة
          const durationMap: Record<string, number> = {
            'شهر واحد': 30,
            '2 أشهر': 60,
            '3 أشهر': 90,
            '6 أشهر': 180,
            'سنة كاملة': 365
          }
          const duration = durationMap[selectedPackage]
          basePrice = await arabicPricingService.getPrice(size, level, englishCustomerType, duration)
        }

        // إذا لم يجد السعر، استخدم سعر افتراضي
        if (basePrice === 0) {
          const defaultPrices: Record<string, number> = {
            '5x13': 3500,
            '4x12': 2800,
            '4x10': 2200,
            '3x8': 1500,
            '3x6': 1000,
            '3x4': 800
          }
          basePrice = defaultPrices[size] || 1000
        }

        // حساب السعر الإجمالي
        let totalBillboardPrice = 0
        let dailyRate = 0
        const breakdown: string[] = []

        if (pricingMode === 'daily') {
          // الحساب اليومي: السعر اليومي × عدد الأيام
          totalBillboardPrice = basePrice * totalDays
          dailyRate = basePrice
          breakdown.push(`السعر اليومي: ${basePrice.toLocaleString()} د.ل`)
          breakdown.push(`عدد الأيام: ${totalDays} يوم`)
          breakdown.push(`الإجمالي: ${totalBillboardPrice.toLocaleString()} د.ل`)
        } else {
          // نظام الباقات: السعر الثابت للباقة
          totalBillboardPrice = basePrice
          dailyRate = basePrice / totalDays
          breakdown.push(`سعر الباقة (${selectedPackage}): ${basePrice.toLocaleString()} د.ل`)
          breakdown.push(`السعر اليومي: ${dailyRate.toFixed(2)} د.ل`)
        }

        // إضافة تكلفة التركيب
        const installationCost = includeInstallation ? installationPricePerBoard : 0
        if (installationCost > 0) {
          totalBillboardPrice += installationCost
          breakdown.push(`تكلفة التركيب: ${installationCost.toLocaleString()} د.ل`)
        }

        breakdown.push(`المجموع النهائي: ${totalBillboardPrice.toLocaleString()} د.ل`)

        const calculation: BillboardCalculation = {
          billboard,
          basePrice,
          totalDays,
          installationCost,
          totalPrice: totalBillboardPrice,
          dailyRate,
          breakdown
        }

        newCalculations.push(calculation)
        totalPrice += totalBillboardPrice
        totalDailyRate += dailyRate
        totalInstallation += installationCost
      }

      setCalculations(newCalculations)
      setTotalCalculation({
        totalPrice,
        totalDailyRate,
        totalInstallation,
        grandTotal: totalPrice,
        averageDailyRate: totalDailyRate / selectedBillboardsData.length
      })

    } catch (error: any) {
      setError(`خطأ في حساب الأسعار: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // إنشاء عرض السعر
  const generateQuote = () => {
    if (!customerInfo.name.trim()) {
      setError('يرجى إدخال اسم العميل')
      return
    }

    if (calculations.length === 0) {
      setError('لا توجد حسابات متاحة')
      return
    }

    const quoteHtml = generateQuoteHTML()
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(quoteHtml)
      printWindow.document.close()
    }

    setSuccess('تم إنشاء عرض السعر بنجاح')
  }

  // إنشاء HTML لعرض السعر
  const generateQuoteHTML = (): string => {
    const totalDays = calculateDays()
    const endDateFormatted = pricingMode === 'daily' ? endDate : 
      new Date(new Date(startDate).getTime() + totalDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>عرض سعر - الفارس الذهبي</title>
      <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet">
      <style>
        @page { size: A4; margin: 15mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Tajawal', Arial, sans-serif; 
          direction: rtl; 
          background: white; 
          color: #000; 
          line-height: 1.6; 
          font-size: 14px; 
        }
        .header { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          margin-bottom: 30px; 
          padding: 20px 0; 
          border-bottom: 4px solid #D4AF37; 
        }
        .logo-section { 
          display: flex; 
          align-items: center; 
          gap: 20px; 
        }
        .company-info { 
          text-align: right; 
        }
        .company-name { 
          font-size: 28px; 
          font-weight: 800; 
          color: #D4AF37; 
          margin-bottom: 8px; 
        }
        .company-subtitle { 
          font-size: 16px; 
          color: #666; 
          font-weight: 600;
        }
        .quote-info { 
          text-align: left; 
        }
        .quote-title { 
          font-size: 24px; 
          font-weight: 800; 
          color: #333; 
          margin-bottom: 10px; 
        }
        .quote-details { 
          font-size: 14px; 
          color: #666; 
          line-height: 1.8;
        }
        .section { 
          margin: 25px 0; 
          padding: 20px; 
          background: #f8f9fa; 
          border-radius: 12px; 
          border: 1px solid #e9ecef;
        }
        .section-title { 
          font-size: 20px; 
          font-weight: 700; 
          color: #D4AF37; 
          margin-bottom: 15px; 
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .info-grid { 
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          gap: 15px; 
        }
        .info-row { 
          display: flex; 
          justify-content: space-between; 
          padding: 8px 0; 
          border-bottom: 1px dotted #ccc; 
        }
        .info-label { 
          font-weight: 600; 
          color: #555; 
        }
        .info-value { 
          font-weight: 700; 
          color: #333; 
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 20px 0; 
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        th, td { 
          border: 1px solid #D4AF37; 
          padding: 12px 8px; 
          text-align: center; 
        }
        th { 
          background: linear-gradient(135deg, #D4AF37, #F4E04D); 
          color: #000; 
          font-weight: 800; 
          font-size: 14px;
        }
        tr:nth-child(even) { 
          background: #f8f9fa; 
        }
        .price-cell { 
          font-weight: 700; 
          color: #D4AF37; 
          font-size: 15px;
        }
        .total-section { 
          background: linear-gradient(135deg, #D4AF37, #F4E04D); 
          color: #000; 
          padding: 25px; 
          border-radius: 12px; 
          margin: 30px 0; 
          text-align: center;
        }
        .total-title { 
          font-size: 24px; 
          font-weight: 800; 
          margin-bottom: 15px; 
        }
        .total-amount { 
          font-size: 36px; 
          font-weight: 900; 
          margin: 15px 0; 
        }
        .total-details { 
          font-size: 16px; 
          font-weight: 600; 
          opacity: 0.9;
        }
        .footer { 
          margin-top: 40px; 
          padding-top: 25px; 
          border-top: 2px solid #D4AF37; 
          text-align: center; 
          font-size: 14px; 
          color: #666; 
        }
        .breakdown-item {
          background: white;
          margin: 8px 0;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }
        .billboard-header {
          font-weight: 700;
          color: #D4AF37;
          font-size: 16px;
          margin-bottom: 8px;
        }
        @media print { 
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } 
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo-section">
          <div class="company-info">
            <div class="company-name">الفــــارس الذهبــــي</div>
            <div class="company-subtitle">للدعــــــاية والإعـــلان</div>
          </div>
        </div>
        <div class="quote-info">
          <div class="quote-title">عرض سعر حملة إعلانية</div>
          <div class="quote-details">
            <div>رقم العرض: Q-${Date.now()}</div>
            <div>التاريخ: ${formatGregorianDate(new Date())}</div>
            <div>صالح حتى: ${formatGregorianDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">
          👤 معلومات العميل
        </div>
        <div class="info-grid">
          <div class="info-row">
            <span class="info-label">الاسم:</span>
            <span class="info-value">${customerInfo.name}</span>
          </div>
          ${customerInfo.company ? `
          <div class="info-row">
            <span class="info-label">الشركة:</span>
            <span class="info-value">${customerInfo.company}</span>
          </div>
          ` : ''}
          <div class="info-row">
            <span class="info-label">الهاتف:</span>
            <span class="info-value">${customerInfo.phone || 'غير محدد'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">البريد الإلكتروني:</span>
            <span class="info-value">${customerInfo.email || 'غير محدد'}</span>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">
          📋 تفاصيل الحملة الإعلانية
        </div>
        <div class="info-grid">
          <div class="info-row">
            <span class="info-label">عدد اللوحات:</span>
            <span class="info-value">${selectedBillboardsData.length} لوحة</span>
          </div>
          <div class="info-row">
            <span class="info-label">نوع العميل:</span>
            <span class="info-value">${customerType}</span>
          </div>
          <div class="info-row">
            <span class="info-label">نوع التسعير:</span>
            <span class="info-value">${pricingMode === 'daily' ? 'حساب يومي' : 'نظام باقات'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">تاريخ البداية:</span>
            <span class="info-value">${formatGregorianDate(startDate)}</span>
          </div>
          <div class="info-row">
            <span class="info-label">تاريخ النهاية:</span>
            <span class="info-value">${formatGregorianDate(endDateFormatted)}</span>
          </div>
          <div class="info-row">
            <span class="info-label">إجمالي الأيام:</span>
            <span class="info-value">${totalDays} يوم</span>
          </div>
          ${pricingMode === 'package' ? `
          <div class="info-row">
            <span class="info-label">نوع الباقة:</span>
            <span class="info-value">${selectedPackage}</span>
          </div>
          ` : ''}
          ${includeInstallation ? `
          <div class="info-row">
            <span class="info-label">تكلفة التركيب:</span>
            <span class="info-value">${installationPricePerBoard.toLocaleString()} د.ل لكل لوحة</span>
          </div>
          ` : ''}
        </div>
      </div>

      <div class="section">
        <div class="section-title">
          📊 تفصيل اللوحات والأسعار
        </div>
        <table>
          <thead>
            <tr>
              <th>م</th>
              <th>اسم اللوحة</th>
              <th>الموقع</th>
              <th>المقاس</th>
              <th>المستوى</th>
              <th>البلدية</th>
              <th>${pricingMode === 'daily' ? 'السعر اليومي' : 'سعر الباقة'}</th>
              ${includeInstallation ? '<th>التركيب</th>' : ''}
              <th>الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            ${calculations.map((calc, index) => `
              <tr>
                <td>${index + 1}</td>
                <td style="text-align: right; padding-right: 12px;">${calc.billboard.name}</td>
                <td style="text-align: right; padding-right: 12px;">${calc.billboard.location}</td>
                <td><strong>${calc.billboard.size}</strong></td>
                <td><strong>${calc.billboard.level || 'A'}</strong></td>
                <td>${calc.billboard.municipality}</td>
                <td class="price-cell">${calc.basePrice.toLocaleString()} د.ل</td>
                ${includeInstallation ? `<td class="price-cell">${calc.installationCost.toLocaleString()} د.ل</td>` : ''}
                <td class="price-cell"><strong>${calc.totalPrice.toLocaleString()} د.ل</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="section">
        <div class="section-title">
          💰 ملخص مالي تفصيلي
        </div>
        <div class="info-grid">
          <div class="info-row">
            <span class="info-label">إجمالي أسعار الإعلان:</span>
            <span class="info-value">${(totalCalculation.totalPrice - totalCalculation.totalInstallation).toLocaleString()} د.ل</span>
          </div>
          ${includeInstallation ? `
          <div class="info-row">
            <span class="info-label">إجمالي تكلفة التركيب:</span>
            <span class="info-value">${totalCalculation.totalInstallation.toLocaleString()} د.ل</span>
          </div>
          ` : ''}
          <div class="info-row">
            <span class="info-label">متوسط السعر اليومي:</span>
            <span class="info-value">${totalCalculation.averageDailyRate.toFixed(2)} د.ل</span>
          </div>
          <div class="info-row">
            <span class="info-label">إجمالي السعر اليومي:</span>
            <span class="info-value">${totalCalculation.totalDailyRate.toFixed(2)} د.ل</span>
          </div>
        </div>
      </div>

      <div class="total-section">
        <div class="total-title">المبلغ الإجمالي النهائي</div>
        <div class="total-amount">${totalCalculation.grandTotal.toLocaleString()} د.ل</div>
        <div class="total-details">
          ${selectedBillboardsData.length} لوحة إعلانية • ${totalDays} يوم • ${pricingMode === 'daily' ? 'حساب يومي' : selectedPackage}
        </div>
      </div>

      <div class="footer">
        <p><strong>شركة الفارس الذهبي للدعاية والإعلان</strong></p>
        <p>زليتن - ليبيا • هاتف: +218.91.322.8908</p>
        <p>هذا عرض أسعار صالح لمدة 30 يوماً من تاريخ الإصدار</p>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
            setTimeout(function() { window.close(); }, 1000);
          }, 500);
        };
      </script>
    </body>
    </html>
    `
  }

  // تنسيق السعر
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('ar-SA').format(price) + ' د.ل'
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Calculator className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-black mb-2">حاسبة تسعير اللوحات المختارة</h1>
                <p className="text-lg opacity-90">
                  {selectedBillboardsData.length > 0 
                    ? `حساب أسعار ${selectedBillboardsData.length} لوحة مختارة`
                    : 'لم يتم اختيار أي لوحات'
                  }
                </p>
              </div>
            </div>
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
              className="bg-white/20 border-white/30 text-white hover:bg-white/30 rounded-xl"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(95vh-140px)]">
          {/* رسائل التنبيه */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-semibold">{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-lg">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">{success}</span>
              </div>
            </div>
          )}

          {/* تحذير عدم وجود لوحات */}
          {selectedBillboardsData.length === 0 && (
            <Card className="mb-6 p-8 bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300">
              <div className="text-center">
                <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-yellow-900 mb-3">لا توجد لوحات مختارة</h3>
                <p className="text-yellow-800 text-lg mb-4">
                  لاستخدام هذه الحاسبة، يرجى اختيار لوحات من الصفحة الرئيسية أولاً
                </p>
                <div className="bg-yellow-100 p-4 rounded-lg border border-yellow-300">
                  <h4 className="font-bold text-yellow-900 mb-2">كيفية الاستخدام:</h4>
                  <ol className="text-yellow-800 text-sm space-y-1 text-right">
                    <li>1. ارجع للصفحة الرئيسية</li>
                    <li>2. اختر اللوحات المطلوبة بالضغط على مربعات الاختيار</li>
                    <li>3. اضغط على زر "حساب الأسعار"</li>
                    <li>4. ستفتح هذه الحاسبة تلقائياً مع اللوحات المختارة</li>
                  </ol>
                </div>
              </div>
            </Card>
          )}

          {selectedBillboardsData.length > 0 && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Panel الأيسر - الإعدادات */}
              <div className="xl:col-span-1 space-y-6">
                {/* نوع التسعير */}
                <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
                  <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Calculator className="w-5 h-5 text-white" />
                    </div>
                    نوع التسعير
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={() => setPricingMode('daily')}
                      className={`p-4 h-auto ${
                        pricingMode === 'daily'
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'bg-white text-gray-700 hover:bg-blue-50 border-2 border-blue-200'
                      }`}
                    >
                      <div className="text-center">
                        <Clock className="w-6 h-6 mx-auto mb-2" />
                        <div className="font-bold">حساب يومي</div>
                        <div className="text-xs opacity-75">حسب التواريخ</div>
                      </div>
                    </Button>
                    <Button
                      onClick={() => setPricingMode('package')}
                      className={`p-4 h-auto ${
                        pricingMode === 'package'
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'bg-white text-gray-700 hover:bg-blue-50 border-2 border-blue-200'
                      }`}
                    >
                      <div className="text-center">
                        <Building2 className="w-6 h-6 mx-auto mb-2" />
                        <div className="font-bold">نظام باقات</div>
                        <div className="text-xs opacity-75">باقات ثابتة</div>
                      </div>
                    </Button>
                  </div>
                </Card>

                {/* التواريخ والمدة */}
                <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
                  <h3 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    {pricingMode === 'daily' ? 'التواريخ' : 'الباقة والتاريخ'}
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">تاريخ البداية</label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full text-center font-semibold"
                      />
                    </div>

                    {pricingMode === 'daily' ? (
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">تاريخ النهاية</label>
                        <Input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          min={startDate}
                          className="w-full text-center font-semibold"
                        />
                        <div className="mt-2 p-2 bg-green-100 rounded-lg text-center">
                          <span className="text-sm font-bold text-green-800">
                            المدة: {calculateDays()} يوم
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">نوع الباقة</label>
                        <select
                          value={selectedPackage}
                          onChange={(e) => setSelectedPackage(e.target.value as any)}
                          className="w-full p-3 border-2 border-green-300 rounded-lg text-center font-semibold"
                        >
                          <option value="شهر واحد">شهر واحد (30 يوم)</option>
                          <option value="2 أشهر">شهران (60 يوم)</option>
                          <option value="3 أشهر">3 أشهر (90 يوم)</option>
                          <option value="6 أشهر">6 أشهر (180 يوم)</option>
                          <option value="سنة كاملة">سنة كاملة (365 يوم)</option>
                        </select>
                        <div className="mt-2 p-2 bg-green-100 rounded-lg text-center">
                          <span className="text-sm font-bold text-green-800">
                            المدة: {calculateDays()} يوم
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                {/* نوع العميل */}
                <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
                  <h3 className="text-xl font-bold text-purple-900 mb-4 flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    نوع العميل
                  </h3>
                  <select
                    value={customerType}
                    onChange={(e) => setCustomerType(e.target.value as any)}
                    className="w-full p-3 border-2 border-purple-300 rounded-lg text-center font-semibold"
                  >
                    <option value="عادي">عادي (فرد)</option>
                    <option value="مسوق">مسوق</option>
                    <option value="شركات">شركات</option>
                    <option value="المدينة">المدينة</option>
                  </select>
                </Card>

                {/* التركيب */}
                <Card className="p-6 bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200">
                  <h3 className="text-xl font-bold text-orange-900 mb-4 flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
                      <Wrench className="w-5 h-5 text-white" />
                    </div>
                    تكلفة التركيب
                  </h3>
                  <div className="space-y-4">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={includeInstallation}
                        onChange={(e) => setIncludeInstallation(e.target.checked)}
                        className="w-5 h-5 text-orange-600 rounded"
                      />
                      <span className="font-semibold text-gray-800">إضافة تكلفة التركيب</span>
                    </label>
                    
                    {includeInstallation && (
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          تكلفة التركيب لكل لوحة (د.ل)
                        </label>
                        <Input
                          type="number"
                          value={installationPricePerBoard}
                          onChange={(e) => setInstallationPricePerBoard(parseInt(e.target.value) || 0)}
                          min="0"
                          className="w-full text-center font-semibold"
                          placeholder="500"
                        />
                      </div>
                    )}
                  </div>
                </Card>

                {/* معلومات العميل */}
                <Card className="p-6 bg-gradient-to-br from-gray-50 to-slate-50 border-2 border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    معلومات العميل
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">اسم العميل *</label>
                      <Input
                        value={customerInfo.name}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="أدخل اسم العميل"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">الشركة</label>
                      <Input
                        value={customerInfo.company}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, company: e.target.value }))}
                        placeholder="اسم الشركة (اختياري)"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">رقم الهاتف</label>
                      <Input
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="رقم الهاتف"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">البريد الإلكتروني</label>
                      <Input
                        value={customerInfo.email}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="البريد الإلكتروني"
                        className="w-full"
                      />
                    </div>
                  </div>
                </Card>
              </div>

              {/* Panel الأيمن - النتائج */}
              <div className="xl:col-span-2 space-y-6">
                {/* اللوحات المختارة */}
                {selectedBillboardsData.length > 0 && (
                  <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
                    <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Grid3X3 className="w-5 h-5 text-white" />
                      </div>
                      اللوحات المختارة ({selectedBillboardsData.length})
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-64 overflow-y-auto">
                      {selectedBillboardsData.map((billboard, index) => (
                        <div
                          key={billboard.id}
                          className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm hover:shadow-md transition-all"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-gray-900 text-sm mb-1 truncate">
                                {billboard.name}
                              </h4>
                              <p className="text-xs text-gray-600 mb-2 truncate">
                                {billboard.location}
                              </p>
                              <div className="flex flex-wrap gap-1">
                                <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800">
                                  {billboard.size}
                                </Badge>
                                <Badge variant="outline" className="text-xs bg-green-100 text-green-800">
                                  {billboard.level || 'A'}
                                </Badge>
                                <Badge variant="outline" className="text-xs bg-purple-100 text-purple-800">
                                  {billboard.municipality}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* إحصائيات سريعة */}
                    <div className="mt-4 grid grid-cols-3 gap-4 p-4 bg-blue-100 rounded-lg">
                      <div className="text-center">
                        <div className="font-bold text-blue-900">{[...new Set(selectedBillboardsData.map(b => b.size))].length}</div>
                        <div className="text-xs text-blue-700">مقاسات مختلفة</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-blue-900">{[...new Set(selectedBillboardsData.map(b => b.municipality))].length}</div>
                        <div className="text-xs text-blue-700">بلديات مختلفة</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-blue-900">{selectedBillboardsData.filter(b => b.status === 'متاح').length}</div>
                        <div className="text-xs text-blue-700">لوحة متاحة</div>
                      </div>
                    </div>
                  </Card>
                )}

                {/* النتائج المالية */}
                {calculations.length > 0 && (
                  <Card className="p-6 bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200">
                    <h3 className="text-xl font-bold text-emerald-900 mb-4 flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-white" />
                      </div>
                      الملخص المالي
                    </h3>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                        <span className="text-gray-700 font-semibold">إجمالي أسعار الإعلان:</span>
                        <span className="font-bold text-emerald-700">
                          {formatPrice(totalCalculation.totalPrice - totalCalculation.totalInstallation)}
                        </span>
                      </div>

                      {includeInstallation && totalCalculation.totalInstallation > 0 && (
                        <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                          <span className="text-gray-700 font-semibold">إجمالي تكلفة التركيب:</span>
                          <span className="font-bold text-orange-700">
                            {formatPrice(totalCalculation.totalInstallation)}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                        <span className="text-gray-700 font-semibold">متوسط السعر اليومي:</span>
                        <span className="font-bold text-blue-700">
                          {formatPrice(totalCalculation.averageDailyRate)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm">
                        <span className="text-gray-700 font-semibold">إجمالي السعر اليومي:</span>
                        <span className="font-bold text-purple-700">
                          {formatPrice(totalCalculation.totalDailyRate)}
                        </span>
                      </div>
                    </div>

                    {/* الإجمالي النهائي */}
                    <div className="mt-6 p-6 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl text-center">
                      <div className="text-sm opacity-90 mb-2">المبلغ الإجمالي النهائي</div>
                      <div className="text-4xl font-black mb-2">
                        {formatPrice(totalCalculation.grandTotal)}
                      </div>
                      <div className="text-sm opacity-90">
                        {selectedBillboardsData.length} لوحة • {calculateDays()} يوم • {pricingMode === 'daily' ? 'حساب يومي' : selectedPackage}
                      </div>
                    </div>
                  </Card>
                )}

                {/* أزرار العمل */}
                <Card className="p-6">
                  <div className="space-y-3">
                    <Button
                      onClick={generateQuote}
                      disabled={!customerInfo.name.trim() || calculations.length === 0 || loading}
                      className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white py-4 text-lg font-bold"
                    >
                      <FileText className="w-6 h-6 ml-2" />
                      إنشاء وطباعة عرض السعر
                    </Button>
                    
                    <Button
                      onClick={calculatePricing}
                      disabled={loading || selectedBillboardsData.length === 0}
                      variant="outline"
                      className="w-full py-3 border-2 border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                      <Calculator className={`w-5 h-5 ml-2 ${loading ? 'animate-spin' : ''}`} />
                      {loading ? 'جاري الحساب...' : 'إعادة حساب الأسعار'}
                    </Button>
                  </div>
                </Card>
              </div>

              {/* تفصيل الحسابات */}
              {calculations.length > 0 && (
                <div className="xl:col-span-3">
                  <Card className="p-6 bg-gradient-to-br from-gray-50 to-slate-50 border-2 border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center">
                        <Target className="w-5 h-5 text-white" />
                      </div>
                      تفصيل حسابات كل لوحة
                    </h3>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {calculations.map((calc, index) => (
                        <div
                          key={calc.billboard.id}
                          className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all"
                        >
                          {/* رأس اللوحة */}
                          <div className="flex items-start gap-3 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-xl flex items-center justify-center font-bold">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-900 mb-1">{calc.billboard.name}</h4>
                              <p className="text-sm text-gray-600 mb-2">{calc.billboard.location}</p>
                              <div className="flex flex-wrap gap-1">
                                <Badge className="bg-blue-100 text-blue-800 text-xs">
                                  {calc.billboard.size}
                                </Badge>
                                <Badge className="bg-green-100 text-green-800 text-xs">
                                  مستوى {calc.billboard.level || 'A'}
                                </Badge>
                                <Badge className="bg-purple-100 text-purple-800 text-xs">
                                  {calc.billboard.municipality}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          {/* تفصيل الحساب */}
                          <div className="space-y-2">
                            {calc.breakdown.map((item, itemIndex) => (
                              <div
                                key={itemIndex}
                                className="flex justify-between items-center p-2 bg-gray-50 rounded-lg text-sm"
                              >
                                <span className="text-gray-700">{item.split(':')[0]}:</span>
                                <span className="font-bold text-gray-900">{item.split(':')[1]}</span>
                              </div>
                            ))}
                          </div>

                          {/* السعر النهائي للوحة */}
                          <div className="mt-4 p-3 bg-gradient-to-r from-emerald-100 to-green-100 rounded-lg text-center">
                            <div className="text-sm text-emerald-800 mb-1">إجمالي هذه اللوحة</div>
                            <div className="text-xl font-black text-emerald-900">
                              {formatPrice(calc.totalPrice)}
                            </div>
                            <div className="text-xs text-emerald-700">
                              يومي: {formatPrice(calc.dailyRate)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              )}
            </div>
          )}

          {/* حالة التحميل */}
          {loading && (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4 animate-spin"></div>
              <p className="text-gray-700 font-bold text-lg">جاري حساب الأسعار...</p>
              <p className="text-sm text-gray-500 mt-2">يرجى الانتظار</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SimplifiedPricingCalculator