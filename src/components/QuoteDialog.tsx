import React, { useState } from 'react'
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
  Send
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Billboard, BillboardSize, Quote } from '@/types'
import { pricingService } from '@/services/pricingService'

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
    company: ''
  })
  const [duration, setDuration] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [generatedQuote, setGeneratedQuote] = useState<Quote | null>(null)

  if (!isOpen) return null

  const selectedBillboardsData = billboards.filter(b => selectedBillboards.has(b.id))

  // حساب التفاصيل المالية
  const calculateQuoteDetails = () => {
    const items = selectedBillboardsData.map(billboard => {
      const zone = pricingService.determinePricingZone(billboard.municipality, billboard.area)
      const price = pricingService.getBillboardPrice(billboard.size as BillboardSize, zone)
      
      return {
        billboard,
        zone,
        price,
        total: price * duration
      }
    })

    const subtotal = items.reduce((sum, item) => sum + item.total, 0)
    const tax = 0 // يمكن إضافة نسبة ضريبة هنا
    const total = subtotal + tax

    return { items, subtotal, tax, total }
  }

  const quoteDetails = calculateQuoteDetails()
  const pricing = pricingService.getPricing()

  const generateQuote = () => {
    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      setError('يرجى ملء جميع الحقول المطلوبة')
      return
    }

    setLoading(true)
    
    try {
      const quote = pricingService.generateQuote(
        customerInfo,
        selectedBillboardsData.map(billboard => ({
          id: billboard.id,
          name: billboard.name,
          location: billboard.location,
          municipality: billboard.municipality,
          area: billboard.area,
          size: billboard.size as BillboardSize,
          status: billboard.status,
          imageUrl: billboard.imageUrl
        })),
        duration
      )

      setGeneratedQuote(quote)
      setError('')
    } catch (error) {
      setError('حدث خطأ في إنشاء الفاتورة')
      console.error('خطأ في إنشاء الفاتورة:', error)
    } finally {
      setLoading(false)
    }
  }

  const printQuote = () => {
    if (generatedQuote) {
      pricingService.printQuote(generatedQuote)
    }
  }

  const resetForm = () => {
    setCustomerInfo({
      name: '',
      email: '',
      phone: '',
      company: ''
    })
    setDuration(1)
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
                      مدة الإعلان (بالأشهر)
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="12"
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                      className="w-full"
                    />
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
                  {/* ملخص اللوحات */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-bold text-blue-900 mb-2">اللوحات المختارة</h3>
                    <div className="grid gap-2 max-h-60 overflow-y-auto">
                      {quoteDetails.items.map(({ billboard, zone, price, total }, index) => (
                        <div key={billboard.id} className="bg-white p-3 rounded border">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h4 className="font-bold text-sm">{billboard.name}</h4>
                              <p className="text-xs text-gray-600">{billboard.location}</p>
                              <div className="flex gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">{billboard.size}</Badge>
                                <Badge variant="outline" className="text-xs">{zone}</Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-green-700">
                                {price.toLocaleString()} {pricing.currency}
                              </p>
                              <p className="text-xs text-gray-500">{pricing.unit}</p>
                              <p className="text-sm font-bold text-blue-700">
                                الإجمالي: {total.toLocaleString()} {pricing.currency}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* الملخص المالي */}
                  <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                    <h3 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      الملخص المالي
                    </h3>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>عدد اللوحات:</span>
                        <span className="font-bold">{selectedBillboards.size} لوحة</span>
                      </div>
                      <div className="flex justify-between">
                        <span>مدة الإعلان:</span>
                        <span className="font-bold">{duration} {duration === 1 ? 'شهر' : 'أشهر'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>المجموع الفرعي:</span>
                        <span className="font-bold">{quoteDetails.subtotal.toLocaleString()} {pricing.currency}</span>
                      </div>
                      {quoteDetails.tax > 0 && (
                        <div className="flex justify-between">
                          <span>الضريبة:</span>
                          <span className="font-bold">{quoteDetails.tax.toLocaleString()} {pricing.currency}</span>
                        </div>
                      )}
                      <div className="border-t border-green-300 pt-2">
                        <div className="flex justify-between text-lg">
                          <span className="font-bold">الإجمالي النهائي:</span>
                          <span className="font-black text-green-700">
                            {quoteDetails.total.toLocaleString()} {pricing.currency}
                          </span>
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
                  إعادة تعيين
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
