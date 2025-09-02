import React, { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { pricingService } from '@/services/pricingService'
import { BillboardSize, PackageDuration, PriceList, PriceListType } from '@/types'
import { Layers, Tags, Calendar } from 'lucide-react'

interface PricingShowcaseProps {
  selectedDuration: PackageDuration | null
  onDurationChange: (duration: PackageDuration) => void
}

const DEFAULT_PACKAGES: PackageDuration[] = [
  { value: 1, unit: 'month', label: 'شهر واحد', discount: 0 },
  { value: 3, unit: 'months', label: '3 أشهر', discount: 5 },
  { value: 6, unit: 'months', label: '6 أشهر', discount: 10 },
  { value: 12, unit: 'year', label: 'سنة كاملة', discount: 15 },
]


const LEVEL_LABEL: Record<PriceListType, string> = { A: 'مستوى A', B: 'مستوى B' }

export default function PricingShowcase({ selectedDuration, onDurationChange }: PricingShowcaseProps) {
  const pricing: PriceList = pricingService.getPricing()
  const currency = pricing.currency || 'د.ل'
  const zones = Object.keys(pricing.zones || {})
  const packages = (pricingService.getPackages() || []).length ? pricingService.getPackages() : DEFAULT_PACKAGES

  const [mode, setMode] = useState<'category' | 'level'>('category')
  const [activeLevel, setActiveLevel] = useState<PriceListType>('A')
  const [activeCategory, setActiveCategory] = useState<string>('')
  const [activeZone, setActiveZone] = useState<string>(zones[0] || '')

  const availableCategories: string[] = useMemo(() => {
    const zoneObj = activeZone ? pricing.zones[activeZone] : undefined
    if (!zoneObj) return []
    const keys = Object.keys(zoneObj.prices || {})
    return keys.slice(0, 7)
  }, [pricing, activeZone])

  // Initialize active category when zone changes
  if (!activeCategory && availableCategories.length > 0) {
    setTimeout(() => setActiveCategory(availableCategories[0]), 0)
  }

  const sizes: BillboardSize[] = useMemo(() => {
    if (!activeZone || !pricing.zones[activeZone]) return []
    const z = pricing.zones[activeZone]
    if (mode === 'category') {
      return Object.keys((z.prices?.[activeCategory] || {}))
    }
    const dKey = selectedDuration ? (selectedDuration.value === 12 ? '12' : selectedDuration.value === 6 ? '6' : selectedDuration.value === 3 ? '3' : '1') : '1'
    const ab = (z.abPrices as any)?.[activeLevel] as any
    const byDuration = (ab?.[dKey] || ab || {})
    return Object.keys(byDuration || {})
  }, [pricing, activeZone, mode, activeCategory, activeLevel, selectedDuration]) as BillboardSize[]

  const getBasePrice = (size: BillboardSize): number => {
    if (!activeZone || !pricing.zones[activeZone]) return 0
    const z = pricing.zones[activeZone]
    if (mode === 'category') {
      return (z.prices as any)?.[activeCategory]?.[size] || 0
    }
    const dKey = selectedDuration ? (selectedDuration.value === 12 ? '12' : selectedDuration.value === 6 ? '6' : selectedDuration.value === 3 ? '3' : '1') : '1'
    const ab = (z.abPrices as any)?.[activeLevel] as any
    const byDuration = (ab?.[dKey] || ab || {})
    return byDuration?.[size] || 0
  }

  const discountCalc = (base: number) => {
    if (!selectedDuration) return { perMonth: base, total: base, discount: 0 }
    const { finalPrice, discount } = pricingService.calculatePriceWithDiscount(base, selectedDuration)
    return { perMonth: finalPrice, total: finalPrice * selectedDuration.value, discount }
  }

  if (!zones.length) return null

  return (
    <section className="bg-white rounded-2xl shadow-lg border-2 border-yellow-200 p-4 mb-6" dir="rtl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Tags className="w-5 h-5 text-yellow-600" />
          <h3 className="text-lg font-black text-gray-900">قائمة الأسعار الحديثة</h3>
        </div>
        <div className="text-xs text-gray-600">العملة: {currency}</div>
      </div>

      {/* Mode selector */}
      <div className="grid gap-3 md:grid-cols-3">
        <div className="bg-white border rounded-xl p-2">
          <div className="flex items-center gap-2 mb-2"><Layers className="w-4 h-4 text-gray-700" /><span className="text-sm font-bold">طريقة العرض</span></div>
          <div className="flex gap-2">
            <Button onClick={() => setMode('category')} className={`flex-1 ${mode==='category' ? 'bg-yellow-500 text-black' : ''}`}>حسب الفئة</Button>
            <Button onClick={() => setMode('level')} className={`flex-1 ${mode==='level' ? 'bg-yellow-500 text-black' : ''}`}>مستويات A/B</Button>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-2">
          <div className="flex items-center gap-2 mb-2"><Calendar className="w-4 h-4 text-gray-700" /><span className="text-sm font-bold">المدة</span></div>
          <div className="flex flex-wrap gap-2">
            {(packages || DEFAULT_PACKAGES).map((p) => (
              <button key={p.value} className={`px-3 py-1.5 rounded-full border text-sm font-bold ${selectedDuration?.value===p.value ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-white text-gray-800 border-emerald-200'}`} onClick={() => onDurationChange(p)}>
                {p.label}{p.discount? ` - خصم ${p.discount}%`: ''}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white border rounded-xl p-2">
          <div className="text-sm font-bold mb-2">المنطقة/البلدية</div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
            {zones.map((z) => (
              <button key={z} onClick={() => setActiveZone(z)} className={`whitespace-nowrap px-3 py-1.5 rounded-full border text-sm font-bold ${activeZone===z ? 'bg-yellow-500 text-black border-yellow-600' : 'bg-white text-gray-800 border-gray-300'}`}>
                {z}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary controls: category/level tabs */}
      <div className="mt-3">
        {mode === 'category' ? (
          <div className="flex flex-wrap gap-2">
            {availableCategories.map((c) => (
              <button key={c} onClick={() => setActiveCategory(c)} className={`px-4 py-2 rounded-full border text-sm font-bold ${activeCategory===c ? 'bg-yellow-500 text-black border-yellow-600' : 'bg-white border-gray-300 text-gray-800'}`}>
                {c}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(['A','B'] as PriceListType[]).map((l) => (
              <button key={l} onClick={() => setActiveLevel(l)} className={`px-4 py-2 rounded-full border text-sm font-bold ${activeLevel===l ? 'bg-yellow-500 text-black border-yellow-600' : 'bg-white border-gray-300 text-gray-800'}`}>
                {LEVEL_LABEL[l]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Pricing grid */}
      <div className="bg-white border rounded-2xl p-3 mt-3">
        <div className="flex items-center justify-between mb-3">
          <div className="text-right">
            <h4 className="text-base font-black text-gray-900">{activeZone}</h4>
            <p className="text-xs text-gray-600">{mode==='category' ? activeCategory : LEVEL_LABEL[activeLevel]}</p>
          </div>
          {selectedDuration && (
            <Badge className="bg-amber-100 text-amber-800 border border-amber-200">{selectedDuration.label}</Badge>
          )}
        </div>

        {sizes.length === 0 ? (
          <div className="text-center text-gray-600 py-8">لا توجد أسعار متاحة للإعدادات الحالية</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {sizes.map((s) => {
              const base = getBasePrice(s)
              const d = discountCalc(base)
              return (
                <div key={s} className="rounded-xl border p-3 shadow-sm hover:shadow-md transition bg-gradient-to-br from-amber-50 to-yellow-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-600">المقاس</span>
                    <Badge className="bg-yellow-500 text-black">{s}</Badge>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="text-sm text-gray-700">السعر الأساسي</div>
                    <div className="text-lg font-black text-gray-900">{base.toLocaleString()} {currency}</div>
                    {selectedDuration && (
                      <div className="mt-1">
                        <div className="text-sm text-gray-700">بعد الخصم</div>
                        <div className="flex items-baseline gap-2 justify-end">
                          <span className="text-base font-bold text-green-800">{d.perMonth.toLocaleString()} {currency} / شهر</span>
                          {d.discount > 0 && (
                            <span className="text-[11px] bg-red-100 text-red-800 rounded-full px-2 py-0.5 font-bold">خصم {d.discount}%</span>
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
    </section>
  )
}
