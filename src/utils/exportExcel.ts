import type { PriceRow } from '@/hooks/useArabicPricingData'

export async function exportToExcel(rows: PriceRow[], fileName = 'arabic-pricing.xlsx') {
  if (!rows || rows.length === 0) return
  const XLSX = await import('xlsx')

  const header = [
    'المقاس',
    'المستوى',
    'نوع الزبون',
    'يوم واحد',
    'شهر واحد',
    '2 أشهر',
    '3 أشهر',
    '6 أشهر',
    'سنة كاملة',
  ]

  const body = rows.map(r => [
    r.size,
    r.level,
    r.customer,
    r.prices.one_day,
    r.prices.one_month,
    r.prices.two_months,
    r.prices.three_months,
    r.prices.six_months,
    r.prices.full_year,
  ])

  const ws = XLSX.utils.aoa_to_sheet([header, ...body])
  ws['!cols'] = [
    { width: 10 },
    { width: 8 },
    { width: 14 },
    { width: 10 },
    { width: 10 },
    { width: 10 },
    { width: 10 },
    { width: 10 },
    { width: 12 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'الأسعار')
  XLSX.writeFile(wb, fileName)
}
