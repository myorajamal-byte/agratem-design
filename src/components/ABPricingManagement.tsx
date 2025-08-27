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
  TrendingUp,
  TrendingDown,
  ArrowUpDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { pricingService } from '@/services/pricingService'
import { PriceList, BillboardSize, PriceListType } from '@/types'

interface ABPricingManagementProps {
  onClose: () => void
}

const ABPricingManagement: React.FC<ABPricingManagementProps> = ({ onClose }) => {
  const [pricing, setPricing] = useState<PriceList | null>(null)
  const [editingZone, setEditingZone] = useState<string | null>(null)
  const [newZoneName, setNewZoneName] = useState('')
  const [showAddZone, setShowAddZone] = useState(false)
  const [activePriceList, setActivePriceList] = useState<PriceListType>('A')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showComparison, setShowComparison] = useState(false)

  const sizes: BillboardSize[] = ['5x13', '4x12', '4x10', '3x8', '3x6', '3x4']
  const priceListTypes = pricingService.getPriceListTypes()

  useEffect(() => {
    loadPricing()
  }, [])

  const loadPricing = () => {
    const currentPricing = pricingService.getPricing()
    setPricing(currentPricing)
  }

  const updateABPrice = (zone: string, priceList: PriceListType, size: BillboardSize, newPrice: number) => {
    if (!pricing) return

    const updatedPricing = {
      ...pricing,
      zones: {
        ...pricing.zones,
        [zone]: {
          ...pricing.zones[zone],
          abPrices: {
            ...pricing.zones[zone].abPrices,
            [priceList]: {
              ...pricing.zones[zone].abPrices[priceList],
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

    const defaultABPrices = {
      A: {
        '5x13': 3500,
        '4x12': 2800,
        '4x10': 2200,
        '3x8': 1500,
        '3x6': 1000,
        '3x4': 800
      } as Record<BillboardSize, number>,
      B: {
        '5x13': 4500,
        '4x12': 3800,
        '4x10': 3200,
        '3x8': 2500,
        '3x6': 2000,
        '3x4': 1500
      } as Record<BillboardSize, number>
    }

    const defaultCustomerPrices = {
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
          prices: defaultCustomerPrices,
          abPrices: defaultABPrices
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
      setSuccess('تم إعادة تعيين الأسعار للقيم الافتراضية')
    }
  }

  const copyPricesFromAToB = (zoneName: string) => {
    if (!pricing) return
    
    const zone = pricing.zones[zoneName]
    if (!zone || !zone.abPrices) return

    const updatedPricing = {
      ...pricing,
      zones: {
        ...pricing.zones,
        [zoneName]: {
          ...zone,
          abPrices: {
            ...zone.abPrices,
            B: { ...zone.abPrices.A }
          }
        }
      }
    }

    setPricing(updatedPricing)
    setSuccess(`تم نسخ أسعار القائمة A إلى القائمة B للمنطقة "${zoneName}"`)
  }

  const copyPricesFromBToA = (zoneName: string) => {
    if (!pricing) return
    
    const zone = pricing.zones[zoneName]
    if (!zone || !zone.abPrices) return

    const updatedPricing = {
      ...pricing,
      zones: {
        ...pricing.zones,
        [zoneName]: {
          ...zone,
          abPrices: {
            ...zone.abPrices,
            A: { ...zone.abPrices.B }
          }
        }
      }
    }

    setPricing(updatedPricing)
    setSuccess(`تم نسخ أسعار القائمة B إلى القائمة A للمنطقة "${zoneName}"`)
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
                <h1 className="text-2xl font-black">إدارة قوائم الأسعار A & B</h1>
                <p className="text-sm opacity-80">نظام القوائم المزدوجة للأسعار المرنة</p>
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
              onClick={() => setShowComparison(!showComparison)}
              variant="outline"
              className="border-purple-500 text-purple-600 hover:bg-purple-50"
            >
              <ArrowUpDown className="w-5 h-5 mr-2" />
              {showComparison ? 'إخفاء المقارنة' : 'مقارنة الأسعار'}
            </Button>
          </div>

          {/* تبويبات قوائم الأسعار */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">اختر قائمة الأسعار</h3>
            <div className="flex flex-wrap gap-2">
              {priceListTypes.map((type) => (
                <Button
                  key={type.value}
                  onClick={() => setActivePriceList(type.value)}
                  className={`px-8 py-3 rounded-full font-bold transition-all ${
                    activePriceList === type.value
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type.label}
                </Button>
              ))}
            </div>
          </div>

          {/* عرض المقارنة */}
          {showComparison && (
            <Card className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
              <h4 className="text-lg font-bold text-purple-900 mb-4 flex items-center gap-2">
                <ArrowUpDown className="w-5 h-5" />
                مقارنة الأسعار بين القائمتين A و B
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {Object.entries(pricing.zones).map(([zoneName, zone]) => {
                  const comparison = pricingService.comparePriceListsForZone(zoneName)
                  if (!comparison) return null

                  return (
                    <div key={zoneName} className="bg-white rounded-lg p-4 border border-purple-200">
                      <h5 className="font-bold text-purple-900 mb-3">{zone.name}</h5>
                      <div className="space-y-2">
                        {comparison.sizes.map(({ size, priceA, priceB, difference, percentDifference }) => (
                          <div key={size} className="flex items-center justify-between text-sm">
                            <span className="font-semibold">{size}:</span>
                            <div className="flex items-center gap-2">
                              <span className="text-blue-600">A: {priceA.toLocaleString()}</span>
                              <span className="text-green-600">B: {priceB.toLocaleString()}</span>
                              <Badge 
                                variant={difference > 0 ? "default" : "secondary"}
                                className={`text-xs ${difference > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}
                              >
                                {difference > 0 ? '+' : ''}{percentDifference}%
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* جدول الأسعار الرئيسي */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className={`${activePriceList === 'A' ? 'bg-gradient-to-r from-blue-400 to-blue-500' : 'bg-gradient-to-r from-green-400 to-green-500'}`}>
                    <th className="border border-gray-300 p-4 text-right font-black text-white">
                      المنطقة
                    </th>
                    {sizes.map(size => (
                      <th key={size} className="border border-gray-300 p-4 text-center font-black text-white">
                        {size}
                      </th>
                    ))}
                    <th className="border border-gray-300 p-4 text-center font-black text-white">
                      الإجراءات
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
                            <div>
                              <span className="text-lg">{zone.name}</span>
                              <div className="flex gap-1 mt-1">
                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                  A: {zone.abPrices?.A?.['5x13'] || 0} د.ل
                                </Badge>
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                  B: {zone.abPrices?.B?.['5x13'] || 0} د.ل
                                </Badge>
                              </div>
                            </div>
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
                            value={zone.abPrices?.[activePriceList]?.[size] || 0}
                            onChange={(e) => updateABPrice(zoneName, activePriceList, size, parseInt(e.target.value) || 0)}
                            className={`text-center font-bold ${
                              activePriceList === 'A' ? 'text-blue-700 border-blue-300' : 'text-green-700 border-green-300'
                            }`}
                            min="0"
                          />
                        </td>
                      ))}
                      <td className="border border-gray-300 p-4 text-center">
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-1">
                            <Button
                              onClick={() => copyPricesFromAToB(zoneName)}
                              variant="outline"
                              size="sm"
                              className="text-xs text-blue-600 border-blue-300 hover:bg-blue-50"
                              title="نسخ من A إلى B"
                            >
                              A→B
                            </Button>
                            <Button
                              onClick={() => copyPricesFromBToA(zoneName)}
                              variant="outline"
                              size="sm"
                              className="text-xs text-green-600 border-green-300 hover:bg-green-50"
                              title="نسخ من B إلى A"
                            >
                              B→A
                            </Button>
                          </div>
                          <Button
                            onClick={() => deleteZone(zoneName)}
                            variant="outline"
                            size="sm"
                            className="text-xs text-red-600 border-red-300 hover:bg-red-50"
                            disabled={Object.keys(pricing.zones).length <= 1}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
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
                <TrendingDown className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <div className="text-2xl font-black text-green-900">
                  {Math.min(...Object.values(pricing.zones).flatMap(zone => 
                    zone.abPrices ? Object.values(zone.abPrices[activePriceList]) : [0]
                  ))}
                </div>
                <div className="text-sm text-green-700 font-semibold">أقل سعر - قائمة {activePriceList}</div>
              </div>
            </Card>
            <Card className="p-4 bg-orange-50 border-orange-200">
              <div className="text-center">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                <div className="text-2xl font-black text-orange-900">
                  {Math.max(...Object.values(pricing.zones).flatMap(zone => 
                    zone.abPrices ? Object.values(zone.abPrices[activePriceList]) : [0]
                  ))}
                </div>
                <div className="text-sm text-orange-700 font-semibold">أعلى سعر - قائمة {activePriceList}</div>
              </div>
            </Card>
            <Card className="p-4 bg-purple-50 border-purple-200">
              <div className="text-center">
                <DollarSign className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <div className="text-2xl font-black text-purple-900">
                  {Math.round(Object.values(pricing.zones).flatMap(zone => 
                    zone.abPrices ? Object.values(zone.abPrices[activePriceList]) : [0]
                  ).reduce((a, b) => a + b, 0) / Object.values(pricing.zones).flatMap(zone => 
                    zone.abPrices ? Object.values(zone.abPrices[activePriceList]) : [0]
                  ).length)}
                </div>
                <div className="text-sm text-purple-700 font-semibold">متوسط السعر - قائمة {activePriceList}</div>
              </div>
            </Card>
          </div>

          {/* عرض القائمة المختارة */}
          <div className="mt-4 text-center">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
              activePriceList === 'A' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
            }`}>
              <span className="font-bold">قائمة الأسعار المعروضة حالياً:</span>
              <span className="font-black">قائمة {activePriceList}</span>
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
      </div>
    </div>
  )
}

export default ABPricingManagement
