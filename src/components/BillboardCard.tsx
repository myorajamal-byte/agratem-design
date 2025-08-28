import { MapPin, Eye, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Billboard, BillboardSize, PackageDuration } from "@/types"
import { pricingService } from "@/services/pricingService"
import { newPricingService } from "@/services/newPricingService"
import { installationPricingService } from "@/services/installationPricingService"

interface BillboardCardProps {
  billboard: Billboard
  isSelected: boolean
  onToggleSelection: (billboardId: string) => void
  onViewImage: (imageUrl: string) => void
  showPricing?: boolean // عرض الأسعار للأدمن
  selectedDuration?: PackageDuration | null // المدة المحددة للتسعير
}

export default function BillboardCard({ billboard, isSelected, onToggleSelection, onViewImage, showPricing = false, selectedDuration = null }: BillboardCardProps) {
  // حساب الأيام المتبقية للانتهاء
  const getDaysRemaining = () => {
    if (!billboard.expiryDate) return null

    const today = new Date()
    const expiryDate = new Date(billboard.expiryDate)
    today.setHours(0, 0, 0, 0)
    expiryDate.setHours(0, 0, 0, 0)

    const diffTime = expiryDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return diffDays > 0 ? diffDays : 0
  }

  // حساب السعر والمنطقة السعرية
  const getPricingInfo = () => {
    if (!showPricing) {
      return null
    }

    try {
      // تحديد المنطقة السعرية
      const zone = newPricingService.determinePricingZone(billboard.municipality) || pricingService.determinePricingZone(billboard.municipality)

      // تحديد قائمة الأسعار (A أو B) من مستوى اللوحة
      const priceList = newPricingService.determinePriceListFromBillboard(billboard)

      // حساب السعر الشهري باستخدام النظام الجديد
      let monthlyPrice = newPricingService.getBillboardPriceABWithDuration(
        billboard.size as BillboardSize,
        zone,
        priceList,
        1, // شهر واحد
        billboard.municipality
      )

      // إذا لم يجد سعر في النظام الجديد، استخدم النظام القديم
      if (monthlyPrice === 0) {
        pricingService.addPricingZoneForMunicipality(billboard.municipality)
        monthlyPrice = pricingService.getBillboardPriceAB(
          billboard.size as BillboardSize,
          zone,
          priceList,
          billboard.municipality
        )

        // إذا لم يجد في A/B، جرب النظام التقليدي
        if (monthlyPrice === 0) {
          monthlyPrice = pricingService.getBillboardPrice(
            billboard.size as BillboardSize,
            zone,
            'companies',
            billboard.municipality
          )
        }
      }

      // إذا لم يجد أي سعر، استخدم أسعار افتراضية
      if (monthlyPrice === 0) {
        const defaultPrices: Record<string, number> = {
          '5x13': 4000,
          '4x12': 3200,
          '4x10': 2500,
          '3x8': 1700,
          '3x6': 1200,
          '3x4': 900
        }
        monthlyPrice = defaultPrices[billboard.size] || 1000
      }

      // حساب سعر التركيب
      const installationZone = installationPricingService.determineInstallationZone(
        billboard.municipality,
        billboard.area
      )
      const installationPrice = installationPricingService.getInstallationPrice(
        billboard.size as BillboardSize,
        installationZone
      )

      const pricing = newPricingService.getPricing()

      // تطبيق حساب الخصم بناءً على المدة المحددة
      let finalPrice = monthlyPrice
      let totalPrice = monthlyPrice
      let discount = 0
      let durationLabel = 'شهرياً'

      if (selectedDuration) {
        const priceCalc = pricingService.calculatePriceWithDiscount(monthlyPrice, selectedDuration)
        finalPrice = priceCalc.finalPrice
        totalPrice = priceCalc.finalPrice * selectedDuration.value
        discount = priceCalc.discount
        durationLabel = selectedDuration.label
      }

      return {
        zone,
        priceList,
        monthlyPrice,
        finalPrice,
        totalPrice,
        discount,
        installationPrice,
        installationZone,
        currency: pricing.currency || 'د.ل',
        unit: durationLabel
      }
    } catch (error) {
      console.error('خطأ في حساب السعر:', error)
      return {
        zone: billboard.municipality,
        priceList: 'A',
        monthlyPrice: 0,
        finalPrice: 0,
        totalPrice: 0,
        discount: 0,
        installationPrice: 0,
        installationZone: 'المنطقة الأساسية',
        currency: 'د.ل',
        unit: selectedDuration?.label || 'شهرياً'
      }
    }
  }

  const daysRemaining = getDaysRemaining()
  const pricingInfo = getPricingInfo()

  return (
    <Card
      className={`overflow-hidden hover:shadow-2xl transition-all duration-500 border-2 bg-white/80 backdrop-blur-sm ${
        isSelected 
          ? "border-green-500 shadow-green-200 shadow-lg" 
          : "hover:border-yellow-400 hover:-mt-1"
      }`}
    >
      <div className="relative">
        <div className="absolute top-2 left-2 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelection(billboard.id)}
            className="w-5 h-5 text-green-600 bg-white border-2 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
          />
        </div>

        <img
          src={billboard.imageUrl || "/roadside-billboard.png"}
          alt={billboard.name}
          className="w-full h-40 object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "https://lh3.googleusercontent.com/d/13yTnaEWp2tFSxCmg8AuXH1e9QvPNMYWq";
          }}
        />
        <Badge className="absolute top-4 right-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold text-lg px-4 py-2 rounded-full shadow-lg">
          {billboard.size}
        </Badge>
        <Button
          size="sm"
          className="absolute top-4 left-12 bg-black/80 hover:bg-black text-white rounded-full px-4 py-2 shadow-lg font-sans"
          onClick={() => onViewImage(billboard.imageUrl)}
          dir="rtl"
          style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'}}
        >
          <Eye className="w-4 h-4" />
          <span dir="rtl">عرض</span>
        </Button>
      </div>

      <CardContent className="p-4" dir="rtl">
        <div className="text-right space-y-4">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="text-2xl font-black text-gray-900 leading-tight tracking-tight font-sans" dir="rtl">{billboard.name}</h3>
          </div>

          <div className="space-y-2">
            <div className="flex items-start text-gray-700" dir="rtl">
              <MapPin className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5 ml-2" />
              <div className="text-right flex-1">
                <p className="text-lg font-black leading-snug text-gray-800 font-sans" dir="rtl">{billboard.location}</p>
                <p className="text-base text-gray-700 mt-1 font-bold font-sans" dir="rtl">{billboard.area}</p>
              </div>
            </div>
          </div>

          {/* بيانات العميل - Client Information */}
          {billboard.contractNumber && billboard.contractNumber.trim() !== '' && (
            <div className="space-y-2 border-t border-gray-200 pt-3" dir="rtl">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="text-sm font-bold text-blue-800 mb-2 text-right font-sans" dir="rtl">بيانات الحجز</h4>
                <div className="space-y-1 text-right">
                  <div className="flex" dir="rtl" style={{justifyContent: 'space-between'}}>
                    <span className="text-sm text-blue-900 font-bold font-sans">{billboard.contractNumber}</span>
                    <span className="text-sm text-blue-700 font-semibold font-sans">:رقم العقد</span>
                  </div>
                  {billboard.clientName && billboard.clientName.trim() !== '' ? (
                    <div className="flex" dir="rtl" style={{justifyContent: 'space-between'}}>
                      <span className="text-sm text-blue-900 font-bold font-sans">{billboard.clientName}</span>
                      <span className="text-sm text-blue-700 font-semibold font-sans">:العميل</span>
                    </div>
                  ) : (
                    <div className="flex" dir="rtl" style={{justifyContent: 'space-between'}}>
                      <span className="text-sm text-gray-500 font-bold font-sans">غير محدد</span>
                      <span className="text-sm text-blue-700 font-semibold font-sans">:العميل</span>
                    </div>
                  )}
                  {billboard.advertisementType && (
                    <div className="flex" dir="rtl" style={{justifyContent: 'space-between'}}>
                      <span className="text-sm text-blue-900 font-bold font-sans">{billboard.advertisementType}</span>
                      <span className="text-sm text-blue-700 font-semibold font-sans">:نوع الإعلان</span>
                    </div>
                  )}
                  {billboard.expiryDate && (
                    <div className="flex" dir="rtl" style={{justifyContent: 'space-between'}}>
                      <span className="text-sm text-blue-900 font-bold font-sans">{billboard.expiryDate}</span>
                      <span className="text-sm text-blue-700 font-semibold font-sans">:تاريخ الانتهاء</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 py-2" dir="rtl" style={{justifyContent: 'space-between'}}>
            <Badge className="bg-yellow-50 text-yellow-800 border border-yellow-200 px-3 py-1.5 rounded-full font-black text-sm font-sans" dir="rtl">
              {billboard.municipality}
            </Badge>
            <div className="flex flex-col items-end gap-1">
              <Badge
                className={`border px-3 py-1.5 rounded-full font-black text-sm font-sans ${
                  billboard.status === "متاح"
                    ? "bg-green-50 text-green-800 border-green-200"
                    : billboard.status === "قريباً"
                      ? "bg-red-50 text-red-800 border-red-200"
                      : billboard.status === "محجوز"
                        ? "bg-orange-50 text-orange-800 border-orange-200"
                        : "bg-gray-50 text-gray-800 border-gray-200"
                }`}
                dir="rtl"
              >
                {billboard.status}
              </Badge>
              {/* عرض عداد الأيام المتبقية للحالة "قريباً" */}
              {billboard.status === "قريباً" && daysRemaining !== null && (
                <div className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full border border-red-200 font-bold font-sans" dir="rtl">
                  {daysRemaining === 0 ? (
                    <span>ينتهي اليوم</span>
                  ) : daysRemaining === 1 ? (
                    <span>يوم واحد متبقي</span>
                  ) : daysRemaining === 2 ? (
                    <span>يومان متبقيان</span>
                  ) : daysRemaining <= 10 ? (
                    <span>{daysRemaining} أيام متبقية</span>
                  ) : (
                    <span>{daysRemaining} يوماً متبقياً</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* معلومات الأسعار للأدمن */}
          {showPricing && pricingInfo && (
            <div className="border-t border-gray-200 pt-3" dir="rtl">
              <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-2 border-emerald-200 rounded-xl p-4 shadow-lg">
                <h4 className="text-lg font-black text-emerald-800 mb-3 text-right font-sans flex items-center gap-3" dir="rtl">
                  <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  معلومات التسعير الشاملة
                </h4>

                <div className="space-y-3 text-right">
                  {/* المنطقة ومستوى اللوحة */}
                  <div className="bg-white/70 rounded-lg p-3 border border-emerald-100">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex" dir="rtl" style={{justifyContent: 'space-between'}}>
                        <span className="text-sm text-emerald-900 font-bold font-sans">{pricingInfo.zone}</span>
                        <span className="text-xs text-emerald-700 font-semibold font-sans">:المنطقة</span>
                      </div>
                      <div className="flex" dir="rtl" style={{justifyContent: 'space-between'}}>
                        <span className="text-sm text-emerald-900 font-bold font-sans bg-emerald-100 px-2 py-1 rounded-full">
                          مستوى {pricingInfo.priceList}
                        </span>
                        <span className="text-xs text-emerald-700 font-semibold font-sans">:التصنيف</span>
                      </div>
                    </div>
                  </div>

                  {/* السعر الأساسي */}
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-3 border border-blue-200">
                    <div className="flex" dir="rtl" style={{justifyContent: 'space-between'}}>
                      <span className="text-xl text-blue-900 font-black font-sans">
                        {pricingInfo.monthlyPrice.toLocaleString()} {pricingInfo.currency}
                      </span>
                      <div className="text-right">
                        <span className="text-sm text-blue-700 font-semibold font-sans block">:السعر الشهري الأساسي</span>
                        <span className="text-xs text-blue-600 font-medium font-sans">{billboard.size}</span>
                      </div>
                    </div>
                  </div>

                  {/* السعر مع المدة المحددة */}
                  {selectedDuration && pricingInfo.discount > 0 && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
                      <div className="space-y-2">
                        <div className="flex" dir="rtl" style={{justifyContent: 'space-between'}}>
                          <span className="text-lg text-green-900 font-bold font-sans">
                            {pricingInfo.finalPrice.toLocaleString()} {pricingInfo.currency}
                          </span>
                          <div className="text-right">
                            <span className="text-sm text-green-700 font-semibold font-sans block">:السعر بعد الخصم</span>
                            <span className="text-xs text-green-600 font-medium font-sans">شهرياً</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 justify-end" dir="rtl">
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-bold">
                            خصم {pricingInfo.discount}%
                          </span>
                          <span className="text-xs text-gray-600">({pricingInfo.unit})</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* الإجمالي للمدة المحددة */}
                  {selectedDuration && (
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-3 border-2 border-indigo-200">
                      <div className="flex" dir="rtl" style={{justifyContent: 'space-between'}}>
                        <span className="text-xl text-indigo-900 font-black font-sans">
                          {pricingInfo.totalPrice.toLocaleString()} {pricingInfo.currency}
                        </span>
                        <div className="text-right">
                          <span className="text-sm text-indigo-700 font-bold font-sans block">:الإجمالي</span>
                          <span className="text-xs text-indigo-600 font-medium font-sans">{pricingInfo.unit}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* سعر التركيب */}
                  {pricingInfo.installationPrice > 0 && (
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-3 border border-amber-200">
                      <div className="flex" dir="rtl" style={{justifyContent: 'space-between'}}>
                        <span className="text-lg text-amber-900 font-bold font-sans">
                          {pricingInfo.installationPrice.toLocaleString()} {pricingInfo.currency}
                        </span>
                        <div className="text-right">
                          <span className="text-sm text-amber-700 font-semibold font-sans block">:سعر التركيب</span>
                          <span className="text-xs text-amber-600 font-medium font-sans">{pricingInfo.installationZone}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* الإجمالي النهائي (مع التركيب) */}
                  {pricingInfo.installationPrice > 0 && (
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 border-2 border-purple-200">
                      <div className="flex" dir="rtl" style={{justifyContent: 'space-between'}}>
                        <span className="text-xl text-purple-900 font-black font-sans">
                          {((selectedDuration ? pricingInfo.totalPrice : pricingInfo.monthlyPrice) + pricingInfo.installationPrice).toLocaleString()} {pricingInfo.currency}
                        </span>
                        <span className="text-sm text-purple-700 font-bold font-sans">
                          :الإجمالي النهائي ({selectedDuration ? pricingInfo.unit : 'شهر'} + تركيب)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="pt-1">
            <Button
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-black py-3 rounded-xl shadow-lg transform hover:scale-[1.02] transition-all duration-300 text-base font-sans"
              onClick={() => window.open(billboard.gpsLink, "_blank")}
              dir="rtl"
              style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}
            >
              <MapPin className="w-4 h-4" />
              <span dir="rtl">عرض الموقع على الخريطة</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
