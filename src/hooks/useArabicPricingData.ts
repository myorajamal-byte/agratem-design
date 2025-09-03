import { useCallback, useEffect, useMemo, useState } from 'react'
import { arabicPricingService, ArabicPricingRow } from '@/services/arabicPricingService'

export type CustomerType = 'مسوق' | 'شركة' | 'شركات' | 'فرد' | 'المدينة' | 'عادي'
export type LevelType = 'A' | 'B' | 'C' | 'D'
export type SizeType = string
export type DurationKey = 'one_day' | 'one_month' | 'two_months' | 'three_months' | 'six_months' | 'full_year'

export interface PriceRow {
  id: string
  size: SizeType
  level: LevelType
  customer: CustomerType
  prices: {
    one_day: number
    one_month: number
    two_months: number
    three_months: number
    six_months: number
    full_year: number
  }
}

const mapArabicRowToPriceRow = (r: ArabicPricingRow): PriceRow => ({
  id: String(r.id ?? `${r.المقاس}-${r.المستوى}-${r.الزبون}`),
  size: r.المقاس,
  level: (r.المستوى as LevelType) || 'A',
  customer: (r.الزبون as CustomerType) || 'عادي',
  prices: {
    one_day: typeof r['يوم واحد'] === 'number' ? r['يوم واحد']! : 0,
    one_month: typeof r['شهر واحد'] === 'number' ? r['شهر واحد']! : 0,
    two_months: typeof r['2 أشهر'] === 'number' ? r['2 أشهر']! : 0,
    three_months: typeof r['3 أشهر'] === 'number' ? r['3 أشهر']! : 0,
    six_months: typeof r['6 أشهر'] === 'number' ? r['6 أشهر']! : 0,
    full_year: typeof r['سنة كاملة'] === 'number' ? r['سنة كاملة']! : 0,
  },
})

const durationKeyToDays: Record<DurationKey, number> = {
  one_day: 1,
  one_month: 30,
  two_months: 60,
  three_months: 90,
  six_months: 180,
  full_year: 365,
}

const arabicToEnglishCustomer = (c: CustomerType): 'marketers' | 'individuals' | 'companies' => {
  if (c === 'مسوق') return 'marketers'
  if (c === 'عادي' || c === 'فرد') return 'individuals'
  return 'companies' // شركة/شركات/المدينة
}

export function useArabicPricingData() {
  const [rows, setRows] = useState<PriceRow[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  const fetchPricing = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await arabicPricingService.getAllPricingData()
      setRows(data.map(mapArabicRowToPriceRow))
    } catch (e: any) {
      setError(e?.message || 'تعذر جلب البيانات')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPricing()
  }, [fetchPricing])

  const createRow = useCallback(async (payload: Omit<PriceRow, 'id'>) => {
    const result = await arabicPricingService.addNewRow(
      payload.size,
      payload.level as any,
      arabicToEnglishCustomer(payload.customer),
      {
        'يوم واحد': payload.prices.one_day,
        'شهر واحد': payload.prices.one_month,
        '2 أشهر': payload.prices.two_months,
        '3 أشهر': payload.prices.three_months,
        '6 ��شهر': payload.prices.six_months,
        'سنة كاملة': payload.prices.full_year,
      }
    )
    if (result.success) await fetchPricing()
    return result
  }, [fetchPricing])

  const updateCell = useCallback(async (row: PriceRow, key: DurationKey, value: number) => {
    const res = await arabicPricingService.updatePrice(
      row.size,
      row.level as any,
      arabicToEnglishCustomer(row.customer),
      durationKeyToDays[key],
      value
    )
    if (res.success) await fetchPricing()
    return res
  }, [fetchPricing])

  const deleteRow = useCallback(async (id: string) => {
    const numericId = Number(id)
    const res = await arabicPricingService.deleteRow(numericId)
    if (res.success) await fetchPricing()
    return res
  }, [fetchPricing])

  const stats = useMemo(() => {
    const total = rows.length
    const sizes = new Set(rows.map(r => r.size)).size
    const levels = new Set(rows.map(r => r.level)).size
    const customers = new Set(rows.map(r => r.customer)).size
    const allPrices = rows.flatMap(r => Object.values(r.prices))
    const monthly = rows.map(r => r.prices.one_month).filter(n => typeof n === 'number') as number[]
    const average = monthly.length ? Math.round(monthly.reduce((a,b)=>a+b,0)/monthly.length) : 0
    const range = allPrices.length ? { min: Math.min(...allPrices), max: Math.max(...allPrices) } : { min: 0, max: 0 }
    return { total, sizes, levels, customers, average, range }
  }, [rows])

  const filters = useMemo(() => {
    return {
      sizes: Array.from(new Set(rows.map(r => r.size))).sort(),
      levels: Array.from(new Set(rows.map(r => r.level))).sort(),
      customers: Array.from(new Set(rows.map(r => r.customer))).sort(),
    }
  }, [rows])

  return { rows, loading, error, setError, fetchPricing, createRow, updateCell, deleteRow, stats, filters }
}
