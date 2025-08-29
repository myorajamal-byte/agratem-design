import React, { useState } from 'react'
import { X, User, Phone, Mail, Building, Calendar, DollarSign, ShoppingCart, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import PricingDurationSelector from './PricingDurationSelector'
import { Billboard, PackageDuration, CustomerType } from '@/types'
import { pricingService } from '@/services/pricingService'

interface BookingModeProps {
  isOpen: boolean
  onClose: () => void
  selectedBillboards: Set<string>
  billboards: Billboard[]
  onDateChange: (billboardId: string, date: string) => void
}

interface ClientInfo {
  name: string
  email: string
  phone: string
  company: string
  customerType: CustomerType
}

interface BookingSummary {
  totalPrice: number
  sizeCounts: Record<string, number>
  discountAmount: number
  finalTotal: number
}

export default function BookingMode({ 
  isOpen, 
  onClose, 
  selectedBillboards, 
  billboards,
  onDateChange 
}: BookingModeProps) {
  const [clientInfo, setClientInfo] = useState<ClientInfo>({
    name: '',
    email: '',
    phone: '',
    company: '',
    customerType: 'individuals'
  })
  
  const [selectedDuration, setSelectedDuration] = useState<PackageDuration | null>(null)
  const [billboardDates, setBillboardDates] = useState<Record<string, string>>({})
  const [globalStartDate, setGlobalStartDate] = useState<string>('')
  const [globalEndDate, setGlobalEndDate] = useState<string>('')
  const [rentalMode, setRentalMode] = useState<'daily' | 'package'>('package')

  if (!isOpen) return null

  const selectedBillboardsData = billboards.filter(b => selectedBillboards.has(b.id))

  // حساب ملخص الحجز
  const calculateBookingSummary = (): BookingSummary => {
    let totalPrice = 0
    const sizeCounts: Record<string, number> = {}
    
    selectedBillboardsData.forEach(billboard => {
      // عد المقاسات
      sizeCounts[billboard.size] = (sizeCounts[billboard.size] || 0) + 1

      const zone = pricingService.determinePricingZone(billboard.municipality, billboard.area)
      const basePrice = pricingService.getBillboardPrice(
        billboard.size as any,
        zone,
        clientInfo.customerType,
        billboard.municipality
      )

      if (rentalMode === 'package' && selectedDuration) {
        const priceCalc = pricingService.calculatePriceWithDiscount(basePrice, selectedDuration)
        totalPrice += priceCalc.finalPrice * selectedDuration.value
      }
      if (rentalMode === 'daily' && daysCount > 0) {
        totalPrice += basePrice * daysCount
      }
    })

    const discountAmount = rentalMode === 'package' && selectedDuration && selectedDuration.discount > 0
      ? (totalPrice * selectedDuration.discount) / (100 - selectedDuration.discount)
      : 0

    return {
      totalPrice: totalPrice + discountAmount,
      sizeCounts,
      discountAmount,
      finalTotal: totalPrice
    }
  }

  const bookingSummary = calculateBookingSummary()
  const daysCount = (() => {
    if (rentalMode !== 'daily' || !globalStartDate || !globalEndDate) return 0
    const start = new Date(globalStartDate)
    const end = new Date(globalEndDate)
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    return Math.max(diff, 0)
  })()

  const handleDateChange = (billboardId: string, date: string) => {
    setBillboardDates(prev => ({
      ...prev,
      [billboardId]: date
    }))
    onDateChange(billboardId, date)
  }

  const applyGlobalDate = (date: string) => {
    setGlobalStartDate(date)
    const updates: Record<string, string> = {}
    selectedBillboardsData.forEach(b => {
      updates[b.id] = date
    })
    setBillboardDates(prev => ({ ...prev, ...updates }))
    selectedBillboardsData.forEach(b => onDateChange(b.id, date))
  }

  const handleCreateBooking = () => {
    if (!selectedDuration || !clientInfo.name || !clientInfo.email) {
      alert('يرجى ملء جميع البيانات المطلوبة')
      return
    }

    // إنشاء عرض سعر
    const quote = pricingService.generateQuote(
      clientInfo,
      selectedBillboardsData,
      selectedDuration
    )

    // طباعة فاتورة العرض
    pricingService.printQuote(quote)
  }

  return (
    <div className="fixed inset-0 z-50 flex pointer-events-none">
      {/* الشريط الجانبي الأيمن */}
      <div className="w-96 bg-white shadow-2xl border-l-4 border-emerald-500 overflow-y-auto pointer-events-auto">
        <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-4 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShoppingCart className="w-6 h-6" />
              وضع الحجز
            </h2>
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
              className="bg-white/20 border-white/30 text-white hover:bg-white/30"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* اختيار نظام الإيجار */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-emerald-700">
                <Calendar className="w-5 h-5" />
                نظام الإيجار
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2" dir="rtl">
                <Button
                  variant={rentalMode === 'package' ? 'default' : 'outline'}
                  className={rentalMode === 'package' ? 'bg-emerald-600 text-white' : ''}
                  onClick={() => setRentalMode('package')}
                >
                  باقات
                </Button>
                <Button
                  variant={rentalMode === 'daily' ? 'default' : 'outline'}
                  className={rentalMode === 'daily' ? 'bg-emerald-600 text-white' : ''}
                  onClick={() => setRentalMode('daily')}
                >
                  يومي
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* تواريخ موحدة عند النظام اليومي */}
          {rentalMode === 'daily' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-emerald-700">
                  <Calendar className="w-5 ه-5" />
                  تاريخ البداية والنهاية (موحد)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">تاريخ البداية</label>
                  <Input
                    type="date"
                    value={globalStartDate}
                    onChange={(e) => applyGlobalDate(e.target.value)}
                    className="text-right"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">تاريخ النهاية</label>
                  <Input
                    type="date"
                    value={globalEndDate}
                    onChange={(e) => setGlobalEndDate(e.target.value)}
                    className="text-right"
                    min={globalStartDate || new Date().toISOString().split('T')[0]}
                  />
                </div>
                {daysCount > 0 && (
                  <p className="text-xs text-gray-600">المدة: {daysCount} يوم</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* معلومات العميل */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-emerald-700">
                <User className="w-5 h-5" />
                بيانات العميل
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">الاسم الكامل *</label>
                <Input
                  value={clientInfo.name}
                  onChange={(e) => setClientInfo(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="أدخل اسم العميل"
                  className="text-right"
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">البريد الإلكتروني *</label>
                <Input
                  type="email"
                  value={clientInfo.email}
                  onChange={(e) => setClientInfo(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="example@email.com"
                  className="text-right"
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">رقم الهاتف</label>
                <Input
                  value={clientInfo.phone}
                  onChange={(e) => setClientInfo(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="رقم الهاتف"
                  className="text-right"
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">الشركة</label>
                <Input
                  value={clientInfo.company}
                  onChange={(e) => setClientInfo(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="اسم الشركة (اختياري)"
                  className="text-right"
                  dir="rtl"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">نوع العميل</label>
                <select
                  value={clientInfo.customerType}
                  onChange={(e) => setClientInfo(prev => ({ ...prev, customerType: e.target.value as CustomerType }))}
                  className="w-full p-2 border-2 border-gray-300 rounded-lg text-right focus:border-emerald-500"
                  dir="rtl"
                >
                  <option value="individuals">عاديين</option>
                  <option value="marketers">مسوقين</option>
                  <option value="companies">شركات</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* اختيار المدة للباقات */}
          {rentalMode === 'package' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-emerald-700">
                  <Calendar className="w-5 h-5" />
                  مدة الإيجار
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PricingDurationSelector
                  selectedDuration={selectedDuration}
                  onDurationChange={setSelectedDuration}
                />
              </CardContent>
            </Card>
          )}

          {/* اللوحات المحددة */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-emerald-700">
                <FileText className="w-5 h-5" />
                اللوحات المحددة ({selectedBillboards.size})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-60 overflow-y-auto">
              {selectedBillboardsData.map((billboard) => (
                <div key={billboard.id} className="bg-gray-50 rounded-lg p-3 border">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-sm text-gray-900 truncate">{billboard.name}</h4>
                    <Badge className="bg-yellow-100 text-yellow-800">{billboard.size}</Badge>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{billboard.location}</p>
                  
                  {rentalMode === 'package' && (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">تاريخ البداية (اختياري)</label>
                      <Input
                        type="date"
                        value={billboardDates[billboard.id] || ''}
                        onChange={(e) => handleDateChange(billboard.id, e.target.value)}
                        className="text-right text-xs"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* ملخص التكلفة */}
          {((rentalMode === 'package' && selectedDuration) || (rentalMode === 'daily' && daysCount > 0)) && (
            <Card className="border-2 border-emerald-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-emerald-700">
                  <DollarSign className="w-5 h-5" />
                  ملخص التكلفة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* عدد كل مقاس */}
                <div className="bg-blue-50 rounded-lg p-3">
                  <h4 className="font-bold text-sm text-blue-800 mb-2">عدد اللوحات حسب المقاس</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(bookingSummary.sizeCounts).map(([size, count]) => (
                      <div key={size} className="flex justify-between">
                        <span className="text-sm font-bold">{count}</span>
                        <span className="text-sm text-gray-600">{size}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* التكلفة */}
                <div className="space-y-2">
                  {bookingSummary.discountAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 line-through">
                        {bookingSummary.totalPrice.toLocaleString()} د.ل
                      </span>
                      <span className="text-gray-600">السعر الأصلي:</span>
                    </div>
                  )}
                  
                  {bookingSummary.discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-red-600">
                      <span className="font-bold">
                        -{bookingSummary.discountAmount.toLocaleString()} د.ل
                      </span>
                      <span>الخصم ({selectedDuration.discount}%):</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-lg font-bold text-emerald-800 border-t pt-2">
                    <span>{bookingSummary.finalTotal.toLocaleString()} د.ل</span>
                    <span>الإجمالي:</span>
                  </div>
                  
                  {rentalMode === 'package' && selectedDuration && (
                    <p className="text-xs text-gray-500 text-center">
                      لمدة {selectedDuration.label}
                    </p>
                  )}
                  {rentalMode === 'daily' && daysCount > 0 && (
                    <p className="text-xs text-gray-500 text-center">
                      لعدد {daysCount} يوم
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* أزرار العمل */}
          <div className="space-y-3">
            <Button
              onClick={handleCreateBooking}
              className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white py-3 text-base font-bold"
              disabled={(rentalMode === 'package' && !selectedDuration) || (rentalMode === 'daily' && daysCount <= 0) || !clientInfo.name || !clientInfo.email}
            >
              <FileText className="w-5 h-5 mr-2" />
              إنشاء فاتورة العرض
            </Button>
            
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full border-2 border-gray-300 hover:bg-gray-50 py-3"
            >
              إلغاء وإغلاق
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
