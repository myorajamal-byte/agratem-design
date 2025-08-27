import React, { useState, useEffect } from 'react'
import {
  FileText,
  Calculator,
  DollarSign,
  User,
  Mail,
  Phone,
  Building,
  Calendar,
  Printer,
  X,
  Save,
  Send,
  MapPin,
  Wrench,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Billboard, BillboardSize, Quote, CustomerType, PackageDuration } from '@/types'
import { newPricingService } from '@/services/newPricingService'
import { installationPricingService } from '@/services/installationPricingService'

interface QuoteDialogProps {
  isOpen: boolean
  onClose: () => void
  selectedBillboards: Set<string>
  billboards: Billboard[]
}

const QuoteDialog: React.FC<QuoteDialogProps> = ({
  isOpen,
  onClose,
  selectedBillboards,
  billboards
}) => {
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    type: 'individuals' as CustomerType
  })
  const [selectedPackage, setSelectedPackage] = useState<PackageDuration | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [generatedQuote, setGeneratedQuote] = useState<Quote | null>(null)

  // متغيرات التواريخ الجديدة
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [duration, setDuration] = useState(1) // بالأشهر
  const [includeInstallation, setIncludeInstallation] = useState(false)

  const packages = newPricingService.getPackages()
  const customerTypes = newPricingService.getCustomerTypes()
  const installationPricing = installationPricingService.getInstallationPricing()

  if (!isOpen) return null

  const selectedBillboardsData = billboards.filter(b => selectedBillboards.has(b.id))

  // حساب تاريخ النهاية
  const calculateEndDate = (startDateStr: string, durationMonths: number) => {
    const start = new Date(startDateStr)
    const end = new Date(start)
    end.setMonth(end.getMonth() + durationMonths)
    return end.toISOString().split('T')[0]
  }

  const endDate = calculateEndDate(startDate, duration)

  // الحصول على سعر التركيب للوحة
  const getInstallationPrice = (billboard: Billboard) => {
    if (!includeInstallation) return 0

    const zone = newPricingService.determinePricingZone(billboard.municipality, billboard.area)
    const installationZone = installationPricing.zones[zone] || installationPricing.zones['مصراتة']
    const basePrice = installationZone.prices[billboard.size as BillboardSize] || 0
    return Math.round(basePrice * installationZone.multiplier)
  }

  // تهيئة الباقة الافتراضية
  React.useEffect(() => {
    if (packages.length > 0 && !selectedPackage) {
      setSelectedPackage(packages[0])
    }
  }, [packages, selectedPackage])

  // حساب التفاص��ل المالية المحسنة
  const calculateQuoteDetails = () => {
    if (!selectedPackage) return { items: [], subtotal: 0, totalDiscount: 0, installationTotal: 0, tax: 0, total: 0 }

    const items = selectedBillboardsData.map(billboard => {
      const zone = newPricingService.determinePricingZone(billboard.municipality, billboard.area)
      const priceList = newPricingService.determinePriceListFromBillboard(billboard)

      // Get the duration-adjusted price using custom duration
      const finalPrice = newPricingService.getBillboardPriceABWithDuration(billboard.size as BillboardSize, zone, priceList, duration)

      // Calculate what the base price would have been without duration discount
      const basePrice = selectedPackage.discount > 0
        ? Math.round(finalPrice / (1 - selectedPackage.discount / 100))
        : finalPrice

      // حساب سعر التركيب
      const installationPrice = getInstallationPrice(billboard)

      return {
        billboard,
        zone,
        priceList,
        basePrice,
        finalPrice,
        installationPrice,
        discount: selectedPackage.discount,
        monthlyTotal: finalPrice,
        installationTotal: installationPrice,
        total: (finalPrice * duration) + installationPrice
      }
    })

    const subtotal = items.reduce((sum, item) => sum + (item.basePrice * duration), 0)
    const totalDiscount = items.reduce((sum, item) => sum + ((item.basePrice - item.finalPrice) * duration), 0)
    const installationTotal = items.reduce((sum, item) => sum + item.installationPrice, 0)
    const tax = 0 // ي��كن إضافة نسبة ضريبة هنا
    const total = subtotal - totalDiscount + installationTotal + tax

    return { items, subtotal, totalDiscount, installationTotal, tax, total }
  }

  const quoteDetails = calculateQuoteDetails()
  const pricing = newPricingService.getPricing()

  const generateQuote = () => {
    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone || !selectedPackage) {
      setError('يرجى ملء جميع الحقول المطلوبة واختيار باقة')
      return
    }

    setLoading(true)

    try {
      // إنشاء باقة مخصصة بالمدة المحددة
      const customPackage: PackageDuration = {
        value: duration,
        unit: duration === 1 ? 'month' : 'months',
        label: `${duration} ${duration === 1 ? 'شهر' : 'أشهر'}`,
        discount: selectedPackage.discount
      }

      const quote = newPricingService.generateQuote(
        customerInfo,
        selectedBillboardsData.map(billboard => ({
          id: billboard.id,
          name: billboard.name,
          location: billboard.location,
          municipality: billboard.municipality,
          area: billboard.area,
          size: billboard.size as BillboardSize,
          status: billboard.status,
          imageUrl: billboard.imageUrl,
          level: billboard.level,
          priceCategory: billboard.priceCategory
        })),
        customPackage
      )

      setGeneratedQuote(quote)
      setError('')
    } catch (error) {
      setError('حدث خطأ في إنشاء الفاتورة')
      console.error('خطأ في ��نشاء الفاتورة:', error)
    } finally {
      setLoading(false)
    }
  }

  const printQuote = () => {
    if (generatedQuote) {
      newPricingService.printQuote(generatedQuote)
    }
  }

  const resetForm = () => {
    setCustomerInfo({
      name: '',
      email: '',
      phone: '',
      company: '',
      type: 'individuals'
    })
    setSelectedPackage(packages[0] || null)
    setGeneratedQuote(null)
    setError('')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* رأس النافذة */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black">إنشاء فاتورة عرض سعر</h1>
                <p className="text-sm opacity-80">
                  {selectedBillboards.size} لوحة إعلانية مختارة
                </p>
              </div>
            </div>
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
              className="bg-white/20 border-white/30 text-white hover:bg-white/30"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md mb-6">
              <p className="text-red-700 font-semibold">{error}</p>
            </div>
          )}

          {!generatedQuote ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* معلومات العميل */}
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <User className="w-6 h-6 text-green-600" />
                  معلومات العميل
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      اسم العميل *
                    </label>
                    <Input
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="أدخل اسم العميل"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      البريد الإلكتروني *
                    </label>
                    <Input
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="أدخل البريد الإلكتروني"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      رقم الهاتف *
                    </label>
                    <Input
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="أدخل رقم الهاتف"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      اسم الشركة (اختياري)
                    </label>
                    <Input
                      value={customerInfo.company}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, company: e.target.value }))}
                      placeholder="أدخل اسم الشركة"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      نوع الزبون *
                    </label>
                    <select
                      value={customerInfo.type}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, type: e.target.value as CustomerType }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      {customerTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      الباقة الزمنية *
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {packages.map(pkg => (
                        <label key={pkg.value} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="radio"
                            name="package"
                            checked={selectedPackage?.value === pkg.value}
                            onChange={() => setSelectedPackage(pkg)}
                            className="w-4 h-4 text-blue-600"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold">{pkg.label}</span>
                              {pkg.discount > 0 && (
                                <Badge className="bg-green-100 text-green-800">
                                  خصم {pkg.discount}%
                                </Badge>
                              )}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              {/* تفاصيل اللوحات والأسعار */}
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Calculator className="w-6 h-6 text-green-600" />
                  تفاصيل العرض
                </h2>

                <div className="space-y-4">
                  {/* خيارات الفترة والتركيب */}
                  <div className="bg-amber-50 p-4 rounded-lg border-2 border-amber-200 mb-4">
                    <h3 className="font-bold text-amber-900 mb-3 flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      تفاصيل المدة والتركيب
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">تاريخ البداية</label>
                        <Input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">المدة (شهر)</label>
                        <Input
                          type="number"
                          min="1"
                          max="24"
                          value={duration}
                          onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">تاريخ النهاية</label>
                        <Input
                          type="date"
                          value={endDate}
                          readOnly
                          className="w-full bg-gray-100"
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={includeInstallation}
                          onChange={(e) => setIncludeInstallation(e.target.checked)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm font-semibold">تضمين أسعار التركيب</span>
                      </label>
                    </div>
                  </div>

                  {/* ملخص اللوحات المحسن */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-bold text-blue-900 mb-2">اللوحات المختارة ({selectedBillboards.size})</h3>
                    <div className="grid gap-3 max-h-60 overflow-y-auto">
                      {quoteDetails.items.map(({ billboard, zone, priceList, basePrice, finalPrice, installationPrice, discount, monthlyTotal, total }, index) => (
                        <div key={billboard.id} className="bg-white p-4 rounded-lg border shadow-sm">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h4 className="font-bold text-sm mb-1">{billboard.name}</h4>
                              <p className="text-xs text-gray-600 mb-2">{billboard.location}</p>

                              {/* معلومات اللوحة التفصيلية */}
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="flex items-center gap-1">
                                  <span className="font-semibold">المقاس:</span>
                                  <Badge variant="outline" className="text-xs">{billboard.size}</Badge>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  <span className="font-semibold">المنطقة:</span>
                                  <Badge variant="outline" className="text-xs">{zone}</Badge>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="font-semibold">التصنيف:</span>
                                  <Badge className={`text-xs ${priceList === 'A' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                    قائمة {priceList}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="font-semibold">البلدية:</span>
                                  <span className="text-gray-700">{billboard.municipality}</span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right min-w-[120px]">
                              {/* الأسعار */}
                              <div className="space-y-1">
                                {discount > 0 ? (
                                  <>
                                    <p className="text-xs text-gray-500 line-through">
                                      {basePrice.toLocaleString()} {pricing.currency}/شهر
                                    </p>
                                    <p className="text-sm font-bold text-green-700">
                                      {finalPrice.toLocaleString()} {pricing.currency}/شهر
                                    </p>
                                    <Badge className="bg-green-100 text-green-800 text-xs">
                                      خصم {discount}%
                                    </Badge>
                                  </>
                                ) : (
                                  <p className="text-sm font-bold text-green-700">
                                    {finalPrice.toLocaleString()} {pricing.currency}/شهر
                                  </p>
                                )}

                                {includeInstallation && installationPrice > 0 && (
                                  <div className="flex items-center gap-1 text-xs text-orange-600">
                                    <Wrench className="w-3 h-3" />
                                    <span>تركيب: {installationPrice.toLocaleString()} {pricing.currency}</span>
                                  </div>
                                )}

                                <div className="border-t pt-1 mt-2">
                                  <p className="text-sm font-bold text-blue-700">
                                    الإجمالي: {total.toLocaleString()} {pricing.currency}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    لمدة {duration} {duration === 1 ? 'شهر' : 'أشهر'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* الملخص المالي المحسن */}
                  <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                    <h3 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      الملخص المالي
                    </h3>

                    <div className="space-y-3">
                      {/* معلومات أساسية */}
                      <div className="bg-white p-3 rounded-lg">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex justify-between">
                            <span>عدد اللوحات:</span>
                            <span className="font-bold">{selectedBillboards.size} لوحة</span>
                          </div>
                          <div className="flex justify-between">
                            <span>مدة الإعلان:</span>
                            <span className="font-bold">{duration} {duration === 1 ? 'شهر' : 'أشهر'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>تاريخ البداية:</span>
                            <span className="font-bold">{new Date(startDate).toLocaleDateString('ar-SA')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>تاريخ النهاية:</span>
                            <span className="font-bold">{new Date(endDate).toLocaleDateString('ar-SA')}</span>
                          </div>
                        </div>
                      </div>

                      {/* التفاصيل المالية */}
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>إجمالي الإعلانات:</span>
                          <span className="font-bold">{(quoteDetails.subtotal - quoteDetails.totalDiscount).toLocaleString()} {pricing.currency}</span>
                        </div>

                        {quoteDetails.totalDiscount > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>إجمالي الخصومات:</span>
                            <span className="font-bold">- {quoteDetails.totalDiscount.toLocaleString()} {pricing.currency}</span>
                          </div>
                        )}

                        {includeInstallation && quoteDetails.installationTotal > 0 && (
                          <div className="flex justify-between text-orange-600">
                            <div className="flex items-center gap-1">
                              <Wrench className="w-4 h-4" />
                              <span>إجمالي التركيب:</span>
                            </div>
                            <span className="font-bold">{quoteDetails.installationTotal.toLocaleString()} {pricing.currency}</span>
                          </div>
                        )}

                        {quoteDetails.tax > 0 && (
                          <div className="flex justify-between">
                            <span>الضريبة:</span>
                            <span className="font-bold">{quoteDetails.tax.toLocaleString()} {pricing.currency}</span>
                          </div>
                        )}

                        <div className="border-t border-green-300 pt-2">
                          <div className="flex justify-between text-lg">
                            <span className="font-bold">الإجمالي النهائي:</span>
                            <span className="font-black text-green-700 text-xl">
                              {quoteDetails.total.toLocaleString()} {pricing.currency}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            /* عرض الفاتورة المُنشأة */
            <div className="space-y-6">
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-green-900 flex items-center gap-2">
                    <FileText className="w-8 h-8" />
                    فاتورة العرض جاهزة!
                  </h2>
                  <Badge className="bg-green-600 text-white text-lg px-4 py-2">
                    {generatedQuote.id}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-bold text-green-800 mb-2">معلومات العميل</h3>
                    <div className="space-y-1 text-sm">
                      <p><strong>الاسم:</strong> {generatedQuote.customerInfo.name}</p>
                      <p><strong>البريد:</strong> {generatedQuote.customerInfo.email}</p>
                      <p><strong>الهاتف:</strong> {generatedQuote.customerInfo.phone}</p>
                      {generatedQuote.customerInfo.company && (
                        <p><strong>الشركة:</strong> {generatedQuote.customerInfo.company}</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-green-800 mb-2">تفاصيل العرض</h3>
                    <div className="space-y-1 text-sm">
                      <p><strong>تاريخ الإنشاء:</strong> {new Date(generatedQuote.createdAt).toLocaleDateString('ar-SA')}</p>
                      <p><strong>صالح حتى:</strong> {new Date(generatedQuote.validUntil).toLocaleDateString('ar-SA')}</p>
                      <p><strong>عدد اللوحات:</strong> {generatedQuote.items.length} لوحة</p>
                      <p><strong>الإجمالي:</strong> 
                        <span className="text-lg font-bold text-green-700 mr-2">
                          {generatedQuote.total.toLocaleString()} {generatedQuote.currency}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* أزرار الإجراءات */}
          <div className="flex flex-wrap gap-4 mt-8 pt-6 border-t border-gray-200">
            {!generatedQuote ? (
              <>
                <Button
                  onClick={generateQuote}
                  disabled={loading || !customerInfo.name || !customerInfo.email || !customerInfo.phone}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold px-8"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  {loading ? 'جاري الإنشاء...' : 'إنشاء الفاتورة'}
                </Button>
                <Button
                  onClick={resetForm}
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <X className="w-5 h-5 mr-2" />
                  إع��دة تعيين
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={printQuote}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8"
                >
                  <Printer className="w-5 h-5 mr-2" />
                  طباعة الفاتورة
                </Button>
                <Button
                  onClick={() => setGeneratedQuote(null)}
                  variant="outline"
                  className="border-green-300 text-green-700 hover:bg-green-50"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  إنشاء فاتورة جديدة
                </Button>
                <Button
                  onClick={resetForm}
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <X className="w-5 h-5 mr-2" />
                  إغلاق
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuoteDialog
