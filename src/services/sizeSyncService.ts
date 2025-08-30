import { newPricingService } from './newPricingService'
import { loadBillboardsFromExcel } from './billboardService'
import { sizesDatabase } from './sizesDatabase'

function isValidSize(s: string): boolean {
  return /^\d+x\d+$/.test((s || '').toString().trim())
}

export async function extractUniqueSizesFromExcel(): Promise<string[]> {
  const billboards = await loadBillboardsFromExcel()
  const sizes = new Set<string>()
  for (const b of billboards) {
    const s = (b.size || '').toString().trim()
    if (isValidSize(s)) sizes.add(s)
  }
  return Array.from(sizes).sort((a, b) => a.localeCompare(b, 'ar'))
}

export async function syncSizesWithExcel(): Promise<{ success: boolean; sizes: string[]; error?: string }> {
  try {
    // حاول أولاً القراءة مباشرة من جدول pricing (DISTINCT)
    let sizes: string[] = []
    try {
      const { sizesDatabase } = await import('./sizesDatabase')
      sizes = await sizesDatabase.getDistinctSizesFromPricing()
    } catch {}

    // إن لم توجد بيانات، استخدم ملف الإكسل كبديل
    if (!sizes || sizes.length === 0) {
      sizes = await extractUniqueSizesFromExcel()
      if (!sizes || sizes.length === 0) {
        return { success: false, sizes: [], error: 'لا توجد مقاسات في قاعدة البيانات أو ملف الإكسل' }
      }
    }

    // Save to Supabase (sizes table)
    try {
      const { sizesDatabase } = await import('./sizesDatabase')
      await sizesDatabase.saveSizes(sizes)
    } catch {}

    // Update local service list
    newPricingService.setSizes(sizes as any)

    return { success: true, sizes }
  } catch (e: any) {
    return { success: false, sizes: [], error: e?.message || 'خطأ غير معروف' }
  }
}
