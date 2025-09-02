import React, { useMemo, useState } from 'react'
import { X, Tags, Layers, Calendar, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { pricingService } from '@/services/pricingService'
import { PackageDuration, PriceList, PriceListType, CustomerType, BillboardSize } from '@/types'

interface PricingExplorerProps {
  isOpen: boolean
  onClose: () => void
}

const CATEGORY_LABEL: Record<CustomerType, string> = {
  marketers: 'مسوق',
  individuals: 'عادي',
  companies: 'شركات',
}

const LEVEL_LABEL: Record<PriceListType, string> = {
  A: 'مستوى A',
  B: 'مستوى B',
}

export default function PricingExplorer({ isOpen, onClose }: PricingExplorerProps) {
  const pricing: PriceList = pricingService.getPricing()
  const zones = Object.keys(pricing.zones || {})
  const packages = pricingService.getPackages()

  const [mode, setMode] = useState<'category' | 'level'>('category')
  const [category, setCategory] = useState<CustomerType>('individuals')
  const [level, setLevel] = useState<PriceListType>('A')
  const [zone, setZone] = useState<string>(zones[0] || '')
  const [duration, setDuration] = useState<PackageDuration | null>(packages[0] || null)
  const [zoneQuery, setZoneQuery] = useState('')

  const currency = pricing.currency || 'د.ل'

  const filteredZones = useMemo(() => {
    if (!zoneQuery.trim()) return zones
    const q = zoneQuery.trim().toLowerCase()
    return zones.filter(z => z.toLowerCase().includes(q))
  }, [zoneQuery, zones])

  const sizes: BillboardSize[] = useMemo(() => {
    if (!zone || !pricing.zones[zone]) return []
    const z = pricing.zones[zone]
    if (mode === 'category') {
      return Object.keys((z.prices?.[category] || {}))
    }
    const dKey = duration ? String(Math.min(Math.max(duration.value, 1), 12)) as '1'|'3'|'6'|'12' : '1'
    const ab = (z.abPrices as any)?.[level] as any
    const byDuration = (ab?.[dKey] || ab || {})
    return Object.keys(byDuration || {})
  }, [pricing, zone, mode, category, level, duration]) as BillboardSize[]

  const getPrice = (size: BillboardSize): number => {
    if (!zone || !pricing.zones[zone]) return 0
    const z = pricing.zones[zone]
    if (mode === 'category') {
      return z.prices?.[category]?.[size] || 0
    }
    const dKey = duration ? (duration.value === 12 ? '12' : duration.value === 6 ? '6' : duration.value === 3 ? '3' : '1') : '1'
    const ab = (z.abPrices as any)?.[level] as any
    const byDuration = (ab?.[dKey] || ab || {})
    return byDuration?.[size] || 0
  }

  const discounted = (base: number): { perMonth: number; total: number; discount: number } => {
    if (!duration) return { perMonth: base, total: base, discount: 0 }
    const { finalPrice, discount } = pricingService.calculatePriceWithDiscount(base, duration)
    return { perMonth: finalPrice, total: finalPrice * duration.value, discount }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] overflow-hidden" onClick={(e) => e.stopPropagation()} dir="rtl">
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black">
          <div className="flex items-center gap-3">
            <Tags className="w-5 h-5" />
            <h2 className="text-xl font-black">قائمة الأسعار الحديثة</h2>
          </div>
          <Button variant="outline" size="sm" onClick={onClose} className="bg-white/20 text-black border-black/20 hover:bg-white/40">
            <X className="w-4 h-4 ml-1" /> إغلاق
          </Button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(92vh-64px)]">
          {/* Navigation controls */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-white border rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <Layers className="w-4 h-4 text-gray-700" />
                <span className="text-sm font-bold text-gray-800">طريقة العرض</span>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setMode('category')} className={`flex-1 ${mode==='category' ? 'bg-yellow-500 text-black' : ''}`}>حسب الفئة</Button>
                <Button onClick={() => setMode('level')} className={`flex-1 ${mode==='level' ? 'bg-yellow-500 text-black' : ''}`}>مستويات A/B</Button>
              </div>
            </div>

            <div className="bg-white border rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-gray-700" />
                <span className="text-sm font-bold text-gray-800">المدة</span>
              </div>
              <Select value={duration ? String(duration.value) : ''} onValueChange={(v) => {
                const d = packages.find(p => String(p.value) === v) || null
                setDuration(d)
              }} dir="rtl">
                <SelectTrigger className="w-full text-right">
                  <SelectValue placeholder="اختر المدة" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {packages.length === 0 && <SelectItem value="1">شهر واحد</SelectItem>}
                  {packages.map((p) => (
                    <SelectItem key={p.value} value={String(p.value)}>{p.label}{p.discount ? ` - خصم ${p.discount}%` : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tabs */}
          {mode === 'category' ? (
            <div className="flex flex-wrap gap-2">
              {(Object.keys(CATEGORY_LABEL) as Array<CustomerType>).map((c) => (
                <button key={c} onClick={() => setCategory(c)} className={`px-4 py-2 rounded-full border text-sm font-bold ${category===c ? 'bg-yellow-500 text-black border-yellow-600' : 'bg-white border-gray-300 text-gray-800'} `}>
                  {CATEGORY_LABEL[c]}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(Object.keys(LEVEL_LABEL) as Array<PriceListType>).map((l) => (
                <button key={l} onClick={() => setLevel(l)} className={`px-4 py-2 rounded-full border text-sm font-bold ${level===l ? 'bg-yellow-500 text-black border-yellow-600' : 'bg-white border-gray-300 text-gray-800'} `}>
                  {LEVEL_LABEL[l]}
                </button>
              ))}
            </div>
          )}

          {/* Zone selector */}
          <div className="bg-white border rounded-xl p-3">
            <div className="flex items-center gap-2 mb-3">
              <Search className="w-4 h-4 text-gray-700" />
              <span className="text-sm font-bold text-gray-800">اختيار المنطقة/البلدية</span>
            </div>
            <div className="flex flex-col md:flex-row gap-3">
              <input value={zoneQuery} onChange={(e)=>setZoneQuery(e.target.value)} placeholder="ابحث عن منطقة" className="flex-1 border rounded-lg p-2 text-right" dir="rtl" />
              <Select value={zone} onValueChange={setZone} dir="rtl">
                <SelectTrigger className="w-full md:w-80 text-right">
                  <SelectValue placeholder="اختر المنطقة" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {filteredZones.map((z)=> (
                    <SelectItem key={z} value={z}>{z}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Pricing grid */}
          <div className="bg-white border rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="text-right">
                <h3 className="text-lg font-black text-gray-900">{zone || 'المنطقة'}</h3>
                <p className="text-sm text-gray-600">العملة: {currency}</p>
              </div>
              <div className="flex items-center gap-2">
                {mode === 'category' ? (
                  <Badge className="bg-blue-100 text-blue-800 border border-blue-200">{CATEGORY_LABEL[category]}</Badge>
                ) : (
                  <Badge className="bg-green-100 text-green-800 border border-green-200">{LEVEL_LABEL[level]}</Badge>
                )}
                {duration && (
                  <Badge className="bg-amber-100 text-amber-800 border border-amber-200">{duration.label}</Badge>
                )}
              </div>
            </div>

            {sizes.length === 0 ? (
              <div className="text-center text-gray-600 py-8">لا توجد أسعار متاحة لهذه الإعدادات</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {sizes.map((s) => {
                  const base = getPrice(s)
                  const d = discounted(base)
                  return (
                    <div key={s} className="rounded-xl border p-3 shadow-sm hover:shadow-md transition bg-gradient-to-br from-amber-50 to-yellow-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">المقاس</span>
                        <Badge className="bg-yellow-500 text-black">{s}</Badge>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="text-base text-gray-700">السعر الأساسي</div>
                        <div className="text-xl font-black text-gray-900">{base.toLocaleString()} {currency}</div>
                        {duration && (
                          <div className="mt-2">
                            <div className="text-sm text-gray-700">بعد الخصم</div>
                            <div className="flex items-baseline gap-2 justify-end">
                              <span className="text-lg font-bold text-green-800">{d.perMonth.toLocaleString()} {currency} / شهر</span>
                              {d.discount > 0 && (
                                <span className="text-xs bg-red-100 text-red-800 rounded-full px-2 py-0.5 font-bold">خصم {d.discount}%</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">الإجمالي: {d.total.toLocaleString()} {currency}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
