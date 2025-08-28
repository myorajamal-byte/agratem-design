import React, { useState, useEffect } from 'react'
import { Calculator, DollarSign, MapPin, Clock, Users, Building2, Wrench, FileText, Download, X, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { newPricingService } from '@/services/newPricingService'
import { BillboardSize, PriceListType, CustomerType, Billboard } from '@/types'

interface PricingCalculation {
  basePrice: number
  municipalityMultiplier: number
  durationDiscount: number
  installationCost: number
  finalPrice: number
  dailyRate: number
  breakdown: string[]
}

interface SimplifiedPricingCalculatorProps {
  onClose: () => void
  selectedBillboards?: string[] // معرفات اللوحات المختارة
  allBillboards?: Billboard[] // جميع اللوحات للمراجعة
}

const SimplifiedPricingCalculator: React.FC<SimplifiedPricingCalculatorProps> = ({
  onClose,
  selectedBillboards,
  allBillboards
}) => {
  // State for pricing inputs
  const [selectedSize, setSelectedSize] = useState<BillboardSize>('5x13')
  const [selectedLevel, setSelectedLevel] = useState<PriceListType>('A')
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>('مصراتة')
  const [selectedCustomerType, setSelectedCustomerType] = useState<CustomerType>('individuals')
  const [pricingMode, setPricingMode] = useState<'daily' | 'package'>('daily')
  const [daysCount, setDaysCount] = useState<number>(1)
  const [packageDuration, setPackageDuration] = useState<number>(30)
  const [installationCost, setInstallationCost] = useState<number>(0)
  const [needInstallation, setNeedInstallation] = useState<boolean>(false)
  
  // Customer information for quote
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    company: '',
    phone: '',
    email: ''
  })

  // Available options
  const [availableSizes, setAvailableSizes] = useState<BillboardSize[]>([])
  const [availableMunicipalities, setAvailableMunicipalities] = useState<string[]>([])
  const [calculation, setCalculation] = useState<PricingCalculation | null>(null)

  // Load available options
  useEffect(() => {
    const pricing = newPricingService.getPricing()
    setAvailableSizes(['5x13', '4x12', '4x10', '3x8', '3x6', '3x4'])
    setAvailableMunicipalities(Object.keys(pricing.zones))
  }, [])

  // Calculate pricing when inputs change
  useEffect(() => {
    calculatePricing()
  }, [selectedSize, selectedLevel, selectedMunicipality, selectedCustomerType, pricingMode, daysCount, packageDuration, installationCost, needInstallation])

  const calculatePricing = () => {
    try {
      const pricing = newPricingService.getPricing()
      const zone = pricing.zones[selectedMunicipality]
      
      if (!zone) {
        console.warn(`المنطقة "${selectedMunicipality}" غير موجودة`)
        return
      }

      let basePrice = 0
      let breakdown: string[] = []

      // Get base price based on customer type and level
      if (pricingMode === 'daily') {
        // For daily pricing, use the customer type pricing
        const customerPricing = zone.prices[selectedCustomerType]
        basePrice = customerPricing?.[selectedSize] || 0
        breakdown.push(`السعر الأساسي اليومي (${selectedCustomerType}): ${basePrice.toLocaleString()} د.ل`)
      } else {
        // For package pricing, use AB pricing system
        const abPricing = zone.abPrices?.[selectedLevel]
        basePrice = abPricing?.[selectedSize] || 0
        breakdown.push(`سعر الباقة الأساسي (مستوى ${selectedLevel}): ${basePrice.toLocaleString()} د.ل`)
      }

      // Apply municipality multiplier if available
      const municipalityMultiplier = 1.0 // Default multiplier
      // Note: Municipality multipliers are handled within the pricing zones now
      
      let finalPrice = basePrice
      let dailyRate = basePrice

      if (pricingMode === 'daily') {
        // For daily pricing, multiply by number of days
        finalPrice = basePrice * daysCount
        breakdown.push(`إجمالي ${daysCount} أيام: ${finalPrice.toLocaleString()} د.ل`)
        dailyRate = basePrice
      } else {
        // For package pricing, calculate daily rate
        const daysInPackage = packageDuration === 30 ? 30 : packageDuration === 90 ? 90 : packageDuration === 180 ? 180 : 365
        dailyRate = finalPrice / daysInPackage
        breakdown.push(`السعر اليومي للباقة: ${dailyRate.toFixed(2)} د.ل`)
      }

      // Add installation cost if needed
      let totalInstallationCost = 0
      if (needInstallation && installationCost > 0) {
        totalInstallationCost = installationCost
        finalPrice += totalInstallationCost
        breakdown.push(`تكلفة التركيب: ${totalInstallationCost.toLocaleString()} د.ل`)
      }

      // Apply company discount if applicable
      if (selectedCustomerType === 'companies') {
        const discount = Math.round(finalPrice * 0.05) // 5% discount for companies
        finalPrice -= discount
        breakdown.push(`خصم الشركات (5%): -${discount.toLocaleString()} د.ل`)
      } else if (selectedCustomerType === 'marketers') {
        const discount = Math.round(finalPrice * 0.15) // 15% discount for marketers
        finalPrice -= discount
        breakdown.push(`خصم المسوقين (15%): -${discount.toLocaleString()} د.ل`)
      }

      breakdown.push(`السعر النهائي: ${finalPrice.toLocaleString()} د.ل`)

      setCalculation({
        basePrice,
        municipalityMultiplier,
        durationDiscount: 0,
        installationCost: totalInstallationCost,
        finalPrice,
        dailyRate,
        breakdown
      })

    } catch (error) {
      console.error('خطأ في حساب التسعير:', error)
    }
  }

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price) + ' د.ل'
  }

  const generateQuote = () => {
    if (!calculation || !customerInfo.name) {
      alert('يرجى ملء معلومات العميل لإنشاء عرض السعر')
      return
    }

    const quoteData = {
      date: new Date().toLocaleDateString('ar-SA'),
      customer: customerInfo,
      billboard: {
        size: selectedSize,
        level: selectedLevel,
        municipality: selectedMunicipality,
        customerType: selectedCustomerType
      },
      pricing: {
        mode: pricingMode,
        days: pricingMode === 'daily' ? daysCount : undefined,
        package: pricingMode === 'package' ? packageDuration : undefined,
        calculation
      }
    }

    // Generate quote document
    const quoteHtml = generateQuoteHTML(quoteData)
    
    // Open in new window for printing
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(quoteHtml)
      printWindow.document.close()
    }
  }

  const generateQuoteHTML = (data: any) => {
    return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>عرض سعر - الفارس الذهبي</title>
      <style>
        @page { size: A4; margin: 20mm; }
        body { font-family: 'Arial', sans-serif; direction: rtl; line-height: 1.6; }
        .header { text-align: center; border-bottom: 3px solid #D4AF37; padding-bottom: 20px; margin-bottom: 30px; }
        .company-name { font-size: 28px; font-weight: bold; color: #D4AF37; margin-bottom: 10px; }
        .quote-title { font-size: 24px; color: #333; margin: 20px 0; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
        .section-title { font-size: 18px; font-weight: bold; color: #D4AF37; margin-bottom: 10px; }
        .info-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px dotted #ccc; }
        .breakdown { background: #f9f9f9; padding: 15px; border-radius: 5px; }
        .total { font-size: 20px; font-weight: bold; color: #D4AF37; text-align: center; padding: 20px; background: #f5f5f5; border-radius: 8px; }
        .footer { text-align: center; margin-top: 40px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">الفارس الذهبي للدعاية والإعلان</div>
        <div>AL FARES AL DAHABI</div>
      </div>
      
      <div class="quote-title">عرض سعر لوحة إعلانية</div>
      <div>التاريخ: ${data.date}</div>
      
      <div class="section">
        <div class="section-title">معلومات العميل</div>
        <div class="info-row"><span>الاسم:</span><span>${data.customer.name}</span></div>
        ${data.customer.company ? `<div class="info-row"><span>الشركة:</span><span>${data.customer.company}</span></div>` : ''}
        <div class="info-row"><span>الهاتف:</span><span>${data.customer.phone}</span></div>
        <div class="info-row"><span>البريد الإلكتروني:</span><span>${data.customer.email}</span></div>
      </div>
      
      <div class="section">
        <div class="section-title">تفاصيل اللوحة</div>
        <div class="info-row"><span>المقاس:</span><span>${data.billboard.size}</span></div>
        <div class="info-row"><span>المستوى:</span><span>${data.billboard.level}</span></div>
        <div class="info-row"><span>البلدية:</span><span>${data.billboard.municipality}</span></div>
        <div class="info-row"><span>نوع العميل:</span><span>${
          data.billboard.customerType === 'individuals' ? 'فرد' :
          data.billboard.customerType === 'companies' ? 'شركة' : 'مسوق'
        }</span></div>
        <div class="info-row"><span>نوع التسعير:</span><span>${data.pricing.mode === 'daily' ? 'يومي' : 'باقة'}</span></div>
        ${data.pricing.days ? `<div class="info-row"><span>عدد الأيام:</span><span>${data.pricing.days} يوم</span></div>` : ''}
        ${data.pricing.package ? `<div class="info-row"><span>مدة الباقة:</span><span>${data.pricing.package} يوم</span></div>` : ''}
      </div>
      
      <div class="section">
        <div class="section-title">تفصيل الأسعار</div>
        <div class="breakdown">
          ${data.pricing.calculation.breakdown.map((item: string) => `<div>${item}</div>`).join('')}
        </div>
      </div>
      
      <div class="total">
        المبلغ الإجمالي: ${formatPrice(data.pricing.calculation.finalPrice)}
      </div>
      
      <div class="footer">
        <p>شكراً لثقتكم في الفارس الذهبي للدعاية والإعلان</p>
        <p>العرض صالح لمدة 30 يوماً من تاريخ الإصدار</p>
      </div>
    </body>
    </html>
    `
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-green-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Calculator className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">حاسبة التسعير المبسطة</h1>
                <p className="text-sm opacity-90">احسب أسعار اللوحا�� الإعلانية بسهولة</p>
              </div>
            </div>
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
              className="bg-white/20 border-white/30 text-white hover:bg-white/30"
            >
              إغلاق
            </Button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Panel - Inputs */}
            <div className="space-y-6">
              {/* Pricing Mode Selection */}
              <Card className="p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  نوع التسعير
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => setPricingMode('daily')}
                    className={`p-4 h-auto ${
                      pricingMode === 'daily'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <div className="text-center">
                      <Clock className="w-6 h-6 mx-auto mb-2" />
                      <div className="font-bold">تسعير يومي</div>
                      <div className="text-xs opacity-75">حساب حسب عدد الأيام</div>
                    </div>
                  </Button>
                  <Button
                    onClick={() => setPricingMode('package')}
                    className={`p-4 h-auto ${
                      pricingMode === 'package'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <div className="text-center">
                      <Building2 className="w-6 h-6 mx-auto mb-2" />
                      <div className="font-bold">باقة</div>
                      <div className="text-xs opacity-75">أسعار الباقات الثابتة</div>
                    </div>
                  </Button>
                </div>
              </Card>

              {/* Billboard Specifications */}
              <Card className="p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  مواصفات اللوحة
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">المقاس</label>
                    <select
                      value={selectedSize}
                      onChange={(e) => setSelectedSize(e.target.value as BillboardSize)}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    >
                      {availableSizes.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">المستوى</label>
                    <select
                      value={selectedLevel}
                      onChange={(e) => setSelectedLevel(e.target.value as PriceListType)}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    >
                      <option value="A">مستوى A (مميز)</option>
                      <option value="B">مستوى B (عادي)</option>
                    </select>
                  </div>
                </div>
              </Card>

              {/* Location and Customer */}
              <Card className="p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-orange-600" />
                  الموقع والعميل
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">البلدية</label>
                    <select
                      value={selectedMunicipality}
                      onChange={(e) => setSelectedMunicipality(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    >
                      {availableMunicipalities.map(municipality => (
                        <option key={municipality} value={municipality}>{municipality}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">نوع العميل</label>
                    <select
                      value={selectedCustomerType}
                      onChange={(e) => setSelectedCustomerType(e.target.value as CustomerType)}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    >
                      <option value="individuals">فرد</option>
                      <option value="companies">شركة</option>
                      <option value="marketers">مسوق</option>
                    </select>
                  </div>
                </div>
              </Card>

              {/* Duration */}
              <Card className="p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-600" />
                  المدة الزمنية
                </h3>
                {pricingMode === 'daily' ? (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">عدد الأيام</label>
                    <Input
                      type="number"
                      value={daysCount}
                      onChange={(e) => setDaysCount(parseInt(e.target.value) || 1)}
                      min="1"
                      className="w-full"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">نوع الباقة</label>
                    <select
                      value={packageDuration}
                      onChange={(e) => setPackageDuration(parseInt(e.target.value))}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                    >
                      <option value={30}>شهر واحد</option>
                      <option value={90}>3 أشهر</option>
                      <option value={180}>6 أشهر</option>
                      <option value={365}>سنة كاملة</option>
                    </select>
                  </div>
                )}
              </Card>

              {/* Installation */}
              <Card className="p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-red-600" />
                  التركيب
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={needInstallation}
                      onChange={(e) => setNeedInstallation(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm font-semibold">يحتاج تركيب</span>
                  </label>
                  {needInstallation && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">تكلفة التركيب (د.ل)</label>
                      <Input
                        type="number"
                        value={installationCost}
                        onChange={(e) => setInstallationCost(parseInt(e.target.value) || 0)}
                        min="0"
                        placeholder="أدخل تكلفة التركيب"
                      />
                    </div>
                  )}
                </div>
              </Card>

              {/* Customer Information */}
              <Card className="p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  معلومات العميل
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">الاسم *</label>
                    <Input
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="اسم العميل"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">الشركة</label>
                    <Input
                      value={customerInfo.company}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, company: e.target.value }))}
                      placeholder="اسم الشركة (اختياري)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">الهاتف</label>
                    <Input
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="رقم الهاتف"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">البريد الإلكتروني</label>
                    <Input
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="البريد الإلكتروني"
                    />
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Panel - Results */}
            <div className="space-y-6">
              {/* Price Calculation */}
              {calculation && (
                <Card className="p-6 bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200">
                  <h3 className="text-xl font-bold text-emerald-900 mb-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center">
                      <Calculator className="w-6 h-6 text-white" />
                    </div>
                    حساب التسعير
                  </h3>
                  
                  <div className="space-y-3 mb-6">
                    {calculation.breakdown.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-3 bg-white rounded-lg shadow-sm"
                      >
                        <span className="text-gray-700">{item.split(':')[0]}</span>
                        <span className="font-bold text-emerald-700">{item.split(':')[1]}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-gradient-to-r from-emerald-600 to-green-600 text-white p-6 rounded-xl text-center">
                    <div className="text-sm opacity-90 mb-2">السعر النهائي</div>
                    <div className="text-3xl font-black">{formatPrice(calculation.finalPrice)}</div>
                    <div className="text-sm opacity-90 mt-2">
                      السعر اليومي: {formatPrice(calculation.dailyRate)}
                    </div>
                  </div>
                </Card>
              )}

              {/* Summary */}
              <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
                <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  ملخص العرض
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>المقاس:</span>
                    <Badge variant="outline">{selectedSize}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>المستوى:</span>
                    <Badge variant="outline">مستوى {selectedLevel}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>البلدية:</span>
                    <Badge variant="outline">{selectedMunicipality}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>نوع العميل:</span>
                    <Badge variant="outline" className={
                      selectedCustomerType === 'companies' ? 'bg-green-100 text-green-800' :
                      selectedCustomerType === 'marketers' ? 'bg-blue-100 text-blue-800' :
                      'bg-purple-100 text-purple-800'
                    }>
                      {selectedCustomerType === 'individuals' ? 'فرد' :
                       selectedCustomerType === 'companies' ? 'شركة' : 'مسوق'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>نوع التسعير:</span>
                    <Badge variant="outline">{pricingMode === 'daily' ? 'يومي' : 'باقة'}</Badge>
                  </div>
                  {pricingMode === 'daily' && (
                    <div className="flex justify-between">
                      <span>عدد الأيام:</span>
                      <Badge variant="outline">{daysCount} يوم</Badge>
                    </div>
                  )}
                  {pricingMode === 'package' && (
                    <div className="flex justify-between">
                      <span>مدة الباقة:</span>
                      <Badge variant="outline">
                        {packageDuration === 30 ? 'شهر' :
                         packageDuration === 90 ? '3 أشهر' :
                         packageDuration === 180 ? '6 أشهر' : 'سنة'}
                      </Badge>
                    </div>
                  )}
                  {needInstallation && (
                    <div className="flex justify-between">
                      <span>تكلفة التركيب:</span>
                      <Badge variant="outline" className="bg-orange-100 text-orange-800">
                        {formatPrice(installationCost)}
                      </Badge>
                    </div>
                  )}
                </div>
              </Card>

              {/* Action Buttons */}
              <Card className="p-4">
                <div className="space-y-3">
                  <Button
                    onClick={generateQuote}
                    disabled={!customerInfo.name || !calculation}
                    className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white py-3"
                  >
                    <FileText className="w-5 h-5 ml-2" />
                    إنشاء عرض سعر
                  </Button>
                  <Button
                    onClick={() => {
                      const data = {
                        size: selectedSize,
                        level: selectedLevel,
                        municipality: selectedMunicipality,
                        customerType: selectedCustomerType,
                        mode: pricingMode,
                        days: pricingMode === 'daily' ? daysCount : undefined,
                        package: pricingMode === 'package' ? packageDuration : undefined,
                        calculation
                      }
                      navigator.clipboard.writeText(JSON.stringify(data, null, 2))
                      alert('تم نسخ بيانات التسعير!')
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="w-5 h-5 ml-2" />
                    نسخ البيانات
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SimplifiedPricingCalculator
