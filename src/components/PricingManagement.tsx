import React, { useState, useEffect } from 'react'
import {
  DollarSign,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Edit3,
  X,
  Calculator,
  Settings
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { pricingService } from '@/services/pricingService'
import { PriceList, BillboardSize, CustomerType } from '@/types'
import DynamicPricingManagement from './DynamicPricingManagement'

interface PricingManagementProps {
  onClose: () => void
}

const PricingManagement: React.FC<PricingManagementProps> = ({ onClose }) => {
  const [pricing, setPricing] = useState<PriceList | null>(null)
  const [editingZone, setEditingZone] = useState<string | null>(null)
  const [newZoneName, setNewZoneName] = useState('')
  const [showAddZone, setShowAddZone] = useState(false)
  const [activeCustomerType, setActiveCustomerType] = useState<CustomerType>('individuals')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showDynamicPricing, setShowDynamicPricing] = useState(false)

  const sizes: BillboardSize[] = ['5x13', '4x12', '4x10', '3x8', '3x6', '3x4']
  const customerTypes = pricingService.getCustomerTypes()

  useEffect(() => {
    loadPricing()
  }, [])

  const loadPricing = () => {
    const currentPricing = pricingService.getPricing()
    setPricing(currentPricing)
  }

  const updatePrice = (zone: string, customerType: CustomerType, size: BillboardSize, newPrice: number) => {
    if (!pricing) return

    const updatedPricing = {
      ...pricing,
      zones: {
        ...pricing.zones,
        [zone]: {
          ...pricing.zones[zone],
          prices: {
            ...pricing.zones[zone].prices,
            [customerType]: {
              ...pricing.zones[zone].prices[customerType],
              [size]: newPrice
            }
          }
        }
      }
    }

    setPricing(updatedPricing)
  }

  const addNewZone = () => {
    if (!pricing || !newZoneName.trim()) return

    const defaultPrices = {
      marketers: {
        '5x13': 3000,
        '4x12': 2400,
        '4x10': 1900,
        '3x8': 1300,
        '3x6': 900,
        '3x4': 700
      } as Record<BillboardSize, number>,
      individuals: {
        '5x13': 3500,
        '4x12': 2800,
        '4x10': 2200,
        '3x8': 1500,
        '3x6': 1000,
        '3x4': 800
      } as Record<BillboardSize, number>,
      companies: {
        '5x13': 4000,
        '4x12': 3200,
        '4x10': 2500,
        '3x8': 1700,
        '3x6': 1200,
        '3x4': 900
      } as Record<BillboardSize, number>
    }

    const updatedPricing = {
      ...pricing,
      zones: {
        ...pricing.zones,
        [newZoneName]: {
          name: newZoneName,
          prices: defaultPrices
        }
      }
    }

    setPricing(updatedPricing)
    setNewZoneName('')
    setShowAddZone(false)
    setSuccess(`تم إضافة المنطقة "${newZoneName}" بنجاح`)
  }

  const deleteZone = (zoneName: string) => {
    if (!pricing) return

    if (Object.keys(pricing.zones).length <= 1) {
      setError('لا يمكن حذف آخر منطقة سعرية')
      return
    }

    if (!window.confirm(`هل أنت متأكد من حذف منطقة "${zoneName}"؟`)) return

    const { [zoneName]: deleted, ...remainingZones } = pricing.zones

    const updatedPricing = {
      ...pricing,
      zones: remainingZones
    }

    setPricing(updatedPricing)
    setSuccess(`تم حذف المنطقة "${zoneName}" بنجاح`)
  }

  const savePricing = async () => {
    if (!pricing) return

    setLoading(true)
    const result = pricingService.updatePricing(pricing)

    if (result.success) {
      setSuccess('تم حفظ الأسعار بنجاح')
    } else {
      setError(result.error || 'حدث خطأ في حفظ الأسعار')
    }
    setLoading(false)
  }

  const resetPricing = () => {
    if (window.confirm('هل أنت متأكد من إعادة تعيين جميع الأسعار للقيم الافتراضية؟')) {
      loadPricing()
      setSuccess('تم إعادة ��عيين الأسعار للقيم الافتراضية')
    }
  }

  if (!pricing) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8">
          <div className="text-center">جاري تحميل البيانات...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
        {/* رأس النافذة */}
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-6 text-black">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black">إدارة قائمة الأسعار</h1>
                <p className="text-sm opacity-80">تحديد أسعار اللوحات الإعلانية حسب المناطق والمقاسات</p>
              </div>
            </div>
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
              className="bg-white/20 border-white/30 text-black hover:bg-white/30"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* رسائل النجاح والخطأ */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md mb-6">
              <p className="text-red-700 font-semibold">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-md mb-6">
              <p className="text-green-700 font-semibold">{success}</p>
            </div>
          )}

          {/* أزرار التحكم */}
          <div className="flex flex-wrap gap-4 mb-6">
            <Button
              onClick={savePricing}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white font-bold"
            >
              <Save className="w-5 h-5 mr-2" />
              حفظ الأسعار
            </Button>
            <Button
              onClick={resetPricing}
              variant="outline"
              className="border-blue-500 text-blue-600 hover:bg-blue-50"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              إعادة تعيين
            </Button>
            <Button
              onClick={() => setShowAddZone(true)}
              variant="outline"
              className="border-yellow-500 text-yellow-600 hover:bg-yellow-50"
            >
              <Plus className="w-5 h-5 mr-2" />
              إضافة منطقة جديدة
            </Button>
            <Button
              onClick={() => setShowDynamicPricing(true)}
              variant="outline"
              className="border-purple-500 text-purple-600 hover:bg-purple-50"
            >
              <Settings className="w-5 h-5 mr-2" />
              النظام الديناميكي
            </Button>
          </div>

          {/* معلومات العملة */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                العملة
              </label>
              <Input
                value={pricing.currency}
                onChange={(e) => setPricing({ ...pricing, currency: e.target.value })}
                placeholder="د.ل"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                الباقات المتوفرة
              </label>
              <div className="text-sm text-gray-600">
                {pricing.packages?.map(pkg => pkg.label).join(' • ') || 'لا توجد باقات'}
              </div>
            </div>
          </div>

          {/* تبويبات فئات الزبائن */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">اختر فئة الزبون</h3>
            <div className="flex flex-wrap gap-2">
              {customerTypes.map((type) => (
                <Button
                  key={type.value}
                  onClick={() => setActiveCustomerType(type.value)}
                  className={`px-6 py-2 rounded-full font-bold transition-all ${
                    activeCustomerType === type.value
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type.label}
                </Button>
              ))}
            </div>
          </div>

          {/* جدول الأسعار */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-yellow-400 to-yellow-500">
                    <th className="border border-yellow-600 p-4 text-right font-black text-black">
                      المنطقة
                    </th>
                    {sizes.map(size => (
                      <th key={size} className="border border-yellow-600 p-4 text-center font-black text-black">
                        {size}
                      </th>
                    ))}
                    <th className="border border-yellow-600 p-4 text-center font-black text-black">
                      الإجر��ءات
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(pricing.zones).map(([zoneName, zone]) => (
                    <tr key={zoneName} className="hover:bg-yellow-50">
                      <td className="border border-gray-300 p-4 font-bold text-gray-900 bg-yellow-100">
                        {editingZone === zoneName ? (
                          <Input
                            value={zone.name}
                            onChange={(e) => {
                              const updatedPricing = {
                                ...pricing,
                                zones: {
                                  ...pricing.zones,
                                  [zoneName]: {
                                    ...zone,
                                    name: e.target.value
                                  }
                                }
                              }
                              setPricing(updatedPricing)
                            }}
                            onBlur={() => setEditingZone(null)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                setEditingZone(null)
                              }
                            }}
                            autoFocus
                          />
                        ) : (
                          <div className="flex items-center justify-between">
                            <span>{zone.name}</span>
                            <Button
                              onClick={() => setEditingZone(zoneName)}
                              variant="ghost"
                              size="sm"
                              className="ml-2"
                            >
                              <Edit3 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </td>
                      {sizes.map(size => (
                        <td key={size} className="border border-gray-300 p-2">
                          <Input
                            type="number"
                            value={zone.prices[activeCustomerType][size]}
                            onChange={(e) => updatePrice(zoneName, activeCustomerType, size, parseInt(e.target.value) || 0)}
                            className="text-center font-bold text-green-700"
                            min="0"
                          />
                        </td>
                      ))}
                      <td className="border border-gray-300 p-4 text-center">
                        <Button
                          onClick={() => deleteZone(zoneName)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                          disabled={Object.keys(pricing.zones).length <= 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* إحصائيات سريعة */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="text-center">
                <Calculator className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <div className="text-2xl font-black text-blue-900">
                  {Object.keys(pricing.zones).length}
                </div>
                <div className="text-sm text-blue-700 font-semibold">مناطق سعرية</div>
              </div>
            </Card>
            <Card className="p-4 bg-green-50 border-green-200">
              <div className="text-center">
                <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <div className="text-2xl font-black text-green-900">
                  {Math.min(...Object.values(pricing.zones).flatMap(zone => Object.values(zone.prices[activeCustomerType])))}
                </div>
                <div className="text-sm text-green-700 font-semibold">أقل سعر</div>
              </div>
            </Card>
            <Card className="p-4 bg-orange-50 border-orange-200">
              <div className="text-center">
                <DollarSign className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                <div className="text-2xl font-black text-orange-900">
                  {Math.max(...Object.values(pricing.zones).flatMap(zone => Object.values(zone.prices[activeCustomerType])))}
                </div>
                <div className="text-sm text-orange-700 font-semibold">أعلى سعر</div>
              </div>
            </Card>
            <Card className="p-4 bg-purple-50 border-purple-200">
              <div className="text-center">
                <Calculator className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <div className="text-2xl font-black text-purple-900">
                  {Math.round(Object.values(pricing.zones).flatMap(zone => Object.values(zone.prices[activeCustomerType])).reduce((a, b) => a + b, 0) / Object.values(pricing.zones).flatMap(zone => Object.values(zone.prices[activeCustomerType])).length)}
                </div>
                <div className="text-sm text-purple-700 font-semibold">متوسط السعر</div>
              </div>
            </Card>
          </div>

          {/* عرض نوع الزبون المختار */}
          <div className="mt-4 text-center">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full">
              <span className="font-bold">الأسعار المعروضة حالياً:</span>
              <span className="font-black">{customerTypes.find(t => t.value === activeCustomerType)?.label}</span>
            </div>
          </div>
        </div>

        {/* نافذة إضافة منطقة جديدة */}
        {showAddZone && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
            <Card className="w-full max-w-md p-6">
              <h3 className="text-xl font-bold mb-4">إضافة منطقة سعرية جديدة</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">
                    اسم المنطقة
                  </label>
                  <Input
                    value={newZoneName}
                    onChange={(e) => setNewZoneName(e.target.value)}
                    placeholder="أدخل اسم المنطقة"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addNewZone()
                      }
                    }}
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <Button
                  onClick={addNewZone}
                  disabled={!newZoneName.trim()}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  إضافة
                </Button>
                <Button
                  onClick={() => {
                    setShowAddZone(false)
                    setNewZoneName('')
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  إلغاء
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* نافذة النظام الديناميكي */}
        {showDynamicPricing && (
          <DynamicPricingManagement
            onClose={() => {
              setShowDynamicPricing(false)
              loadPricing() // إعادة تحميل الأسعار في حالة تغيير النظام
            }}
          />
        )}
      </div>
    </div>
  )
}

export default PricingManagement
