import { supabase } from '@/supabaseClient'
import { BillboardSize, CustomerType, PriceListType } from '@/types'

export interface ArabicPricingRow {
  id?: number
  المقاس: string
  المستوى: string
  الزبون: string
  'شهر واحد'?: number | null
  '2 أشهر'?: number | null
  '3 أشهر'?: number | null
  '6 أشهر'?: number | null
  'سنة كاملة'?: number | null
  'يوم واحد'?: number | null
  zone_name?: string
  billboard_size?: string
  customer_type?: string
  ab_type?: string
  package_duration?: number | null
  package_discount?: number | null
  price?: number
  currency?: string
  created_at?: string
}

export interface ArabicPricingStats {
  totalRows: number
  uniqueSizes: number
  uniqueCustomers: number
  uniqueLevels: number
  averageMonthlyPrice: number
  priceRange: { min: number, max: number }
}

/**
 * خدمة إدارة الأسعار العربية من جدول pricing_ar في Supabase
 */
class ArabicPricingService {
  private readonly CACHE_KEY = 'arabic_pricing_cache'
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 دقائق

  /**
   * تحويل نوع الزبون من العربية للإنجليزية
   */
  private mapCustomerTypeToEnglish(arabicType: string): CustomerType {
    const mapping: Record<string, CustomerType> = {
      'عادي': 'individuals',
      'مسوق': 'marketers', 
      'شركات': 'companies',
      'المدينة': 'companies' // افتراض أن المدينة = شركات
    }
    return mapping[arabicType] || 'individuals'
  }

  /**
   * تحويل نوع الزبون من الإنجليزية للعربية
   */
  private mapCustomerTypeToArabic(englishType: CustomerType): string {
    const mapping: Record<CustomerType, string> = {
      'individuals': 'عادي',
      'marketers': 'مسوق',
      'companies': 'شركات'
    }
    return mapping[englishType] || 'عادي'
  }

  /**
   * تحويل اسم العمود للمدة
   */
  private mapDurationToColumn(duration: number): keyof ArabicPricingRow {
    const mapping: Record<number, keyof ArabicPricingRow> = {
      1: 'يوم واحد',
      30: 'شهر واحد',
      60: '2 أشهر',
      90: '3 أشهر',
      180: '6 أشهر',
      365: 'سنة كاملة'
    }
    return mapping[duration] || 'شهر واحد'
  }

  /**
   * تحويل اسم العمود للمدة بالأيام
   */
  private mapColumnToDuration(column: string): number {
    const mapping: Record<string, number> = {
      'يوم واحد': 1,
      'شهر واحد': 30,
      '2 أشهر': 60,
      '3 أشهر': 90,
      '6 أشهر': 180,
      'سنة كاملة': 365
    }
    return mapping[column] || 30
  }

  /**
   * الحصول على جميع البيانات من جدول pricing_ar
   */
  async getAllPricingData(): Promise<ArabicPricingRow[]> {
    try {
      // محاولة الحصول من Cache أولاً
      const cached = this.getCachedData()
      if (cached) return cached

      if (!supabase) {
        console.warn('Supabase غير متاح، استخدام البيانات المحلية')
        return this.getFallbackData()
      }

      const { data, error } = await supabase
        .from('pricing_ar')
        .select('*')
        .order('id', { ascending: true })

      if (error) {
        console.error('خطأ في تحميل البيانات من Supabase:', error)
        return this.getFallbackData()
      }

      const rows = (data || []) as ArabicPricingRow[]
      
      // حفظ في Cache
      this.setCachedData(rows)
      
      console.log(`✅ تم تحميل ${rows.length} صف من جدول pricing_ar`)
      return rows

    } catch (error) {
      console.error('خطأ في الحصول على البيانات:', error)
      return this.getFallbackData()
    }
  }

  /**
   * الحصول على سعر محدد
   */
  async getPrice(
    size: string, 
    level: PriceListType, 
    customerType: CustomerType, 
    duration: number
  ): Promise<number> {
    try {
      const rows = await this.getAllPricingData()
      const arabicCustomer = this.mapCustomerTypeToArabic(customerType)
      const column = this.mapDurationToColumn(duration)

      const row = rows.find(r => 
        r.المقاس === size && 
        r.المستوى === level && 
        r.الزبون === arabicCustomer
      )

      if (!row) return 0

      const price = row[column]
      return typeof price === 'number' ? price : 0

    } catch (error) {
      console.error('خطأ في الحصول على السعر:', error)
      return 0
    }
  }

  /**
   * تحديث سعر محدد
   */
  async updatePrice(
    size: string,
    level: PriceListType,
    customerType: CustomerType,
    duration: number,
    newPrice: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!supabase) {
        return { success: false, error: 'Supabase غير متاح' }
      }

      const arabicCustomer = this.mapCustomerTypeToArabic(customerType)
      const column = this.mapDurationToColumn(duration)

      // البحث عن الصف الموجود
      const { data: existingRows, error: selectError } = await supabase
        .from('pricing_ar')
        .select('*')
        .eq('المقاس', size)
        .eq('المستوى', level)
        .eq('الزبون', arabicCustomer)

      if (selectError) {
        return { success: false, error: selectError.message }
      }

      if (existingRows && existingRows.length > 0) {
        // تحديث الصف الموجود
        const { error: updateError } = await supabase
          .from('pricing_ar')
          .update({
            [column]: newPrice,
            price: newPrice,
            billboard_size: size,
            customer_type: this.mapCustomerTypeToEnglish(arabicCustomer),
            ab_type: level,
            currency: 'د.ل'
          })
          .eq('id', existingRows[0].id)

        if (updateError) {
          return { success: false, error: updateError.message }
        }
      } else {
        // إنشاء صف جديد
        const newRow: Partial<ArabicPricingRow> = {
          المقاس: size,
          المستوى: level,
          الزبون: arabicCustomer,
          [column]: newPrice,
          zone_name: '',
          billboard_size: size,
          customer_type: this.mapCustomerTypeToEnglish(arabicCustomer),
          ab_type: level,
          price: newPrice,
          currency: 'د.ل'
        }

        const { error: insertError } = await supabase
          .from('pricing_ar')
          .insert([newRow])

        if (insertError) {
          return { success: false, error: insertError.message }
        }
      }

      // مسح Cache لإجبار إعادة التحميل
      this.clearCache()
      
      return { success: true }

    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  /**
   * الحصول على جميع المقاسات المتاحة
   */
  async getAvailableSizes(): Promise<string[]> {
    try {
      const rows = await this.getAllPricingData()
      const sizes = [...new Set(rows.map(r => r.المقاس).filter(Boolean))]
      return sizes.sort()
    } catch {
      return ['13x5', '12x4', '10x4', '8x3', '6x3', '4x3']
    }
  }

  /**
   * الحصول على جميع أنواع الزبائن المتاحة
   */
  async getAvailableCustomerTypes(): Promise<string[]> {
    try {
      const rows = await this.getAllPricingData()
      const types = [...new Set(rows.map(r => r.الزبون).filter(Boolean))]
      return types.sort()
    } catch {
      return ['عادي', 'مسوق', 'شركات', 'المدينة']
    }
  }

  /**
   * الحصول على جميع المستويات المتاحة
   */
  async getAvailableLevels(): Promise<PriceListType[]> {
    try {
      const rows = await this.getAllPricingData()
      const levels = [...new Set(rows.map(r => r.المستوى).filter(Boolean))]
      return levels.filter(l => ['A', 'B'].includes(l)) as PriceListType[]
    } catch {
      return ['A', 'B']
    }
  }

  /**
   * الحصول على إحصائيات الأسعار
   */
  async getStatistics(): Promise<ArabicPricingStats> {
    try {
      const rows = await this.getAllPricingData()
      
      if (rows.length === 0) {
        return {
          totalRows: 0,
          uniqueSizes: 0,
          uniqueCustomers: 0,
          uniqueLevels: 0,
          averageMonthlyPrice: 0,
          priceRange: { min: 0, max: 0 }
        }
      }

      const sizes = new Set(rows.map(r => r.المقاس).filter(Boolean))
      const customers = new Set(rows.map(r => r.الزبون).filter(Boolean))
      const levels = new Set(rows.map(r => r.المستوى).filter(Boolean))

      // حساب متوسط الأسعار الشهرية
      const monthlyPrices = rows
        .map(r => r['شهر واحد'])
        .filter(p => typeof p === 'number' && p > 0) as number[]

      const averageMonthlyPrice = monthlyPrices.length > 0 
        ? Math.round(monthlyPrices.reduce((a, b) => a + b, 0) / monthlyPrices.length)
        : 0

      const allPrices = rows.flatMap(r => [
        r['شهر واحد'], r['2 أشهر'], r['3 أشهر'], 
        r['6 أشهر'], r['سنة كاملة'], r['يوم واحد']
      ]).filter(p => typeof p === 'number' && p > 0) as number[]

      const priceRange = allPrices.length > 0 
        ? { min: Math.min(...allPrices), max: Math.max(...allPrices) }
        : { min: 0, max: 0 }

      return {
        totalRows: rows.length,
        uniqueSizes: sizes.size,
        uniqueCustomers: customers.size,
        uniqueLevels: levels.size,
        averageMonthlyPrice,
        priceRange
      }

    } catch (error) {
      console.error('خطأ في حساب الإحصائيات:', error)
      return {
        totalRows: 0,
        uniqueSizes: 0,
        uniqueCustomers: 0,
        uniqueLevels: 0,
        averageMonthlyPrice: 0,
        priceRange: { min: 0, max: 0 }
      }
    }
  }

  /**
   * إضافة صف جديد
   */
  async addNewRow(
    size: string,
    level: PriceListType,
    customerType: CustomerType,
    prices: Partial<Record<keyof ArabicPricingRow, number>>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!supabase) {
        return { success: false, error: 'Supabase غير متاح' }
      }

      const arabicCustomer = this.mapCustomerTypeToArabic(customerType)

      const newRow: Partial<ArabicPricingRow> = {
        المقاس: size,
        المستوى: level,
        الزبون: arabicCustomer,
        zone_name: '',
        billboard_size: size,
        customer_type: this.mapCustomerTypeToEnglish(arabicCustomer),
        ab_type: level,
        currency: 'د.ل',
        ...prices
      }

      const { error } = await supabase
        .from('pricing_ar')
        .insert([newRow])

      if (error) {
        return { success: false, error: error.message }
      }

      this.clearCache()
      return { success: true }

    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  /**
   * حذف صف
   */
  async deleteRow(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      if (!supabase) {
        return { success: false, error: 'Supabase غير متاح' }
      }

      const { error } = await supabase
        .from('pricing_ar')
        .delete()
        .eq('id', id)

      if (error) {
        return { success: false, error: error.message }
      }

      this.clearCache()
      return { success: true }

    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  /**
   * تصدير البيانات إلى Excel
   */
  async exportToExcel(): Promise<void> {
    try {
      const rows = await this.getAllPricingData()
      
      if (rows.length === 0) {
        alert('لا توجد بيانات للتصدير')
        return
      }

      // إعداد البيانات للتصدير
      const exportData = [
        ['المقاس', 'المستوى', 'الزبون', 'شهر واحد', '2 أشهر', '3 أشهر', '6 أشهر', 'سنة كاملة', 'يوم واحد'],
        ...rows.map(row => [
          row.المقاس || '',
          row.المستوى || '',
          row.الزبون || '',
          row['شهر واحد'] || 0,
          row['2 أشهر'] || 0,
          row['3 أشهر'] || 0,
          row['6 أشهر'] || 0,
          row['سنة كاملة'] || 0,
          row['يوم واحد'] || 0
        ])
      ]

      // استخدام مكتبة XLSX
      const XLSX = await import('xlsx')
      const worksheet = XLSX.utils.aoa_to_sheet(exportData)
      const workbook = XLSX.utils.book_new()

      // تنسيق الأعمدة
      worksheet['!cols'] = [
        { width: 12 }, // المقاس
        { width: 10 }, // المستوى
        { width: 12 }, // الزبون
        { width: 12 }, // شهر واحد
        { width: 12 }, // 2 أشهر
        { width: 12 }, // 3 أشهر
        { width: 12 }, // 6 أشهر
        { width: 15 }, // سنة كاملة
        { width: 12 }  // يوم واحد
      ]

      XLSX.utils.book_append_sheet(workbook, worksheet, 'الأسعار العربية')
      XLSX.writeFile(workbook, `pricing_ar_${new Date().toISOString().split('T')[0]}.xlsx`)

    } catch (error) {
      console.error('خطأ في التصدير:', error)
      alert('حدث خطأ في تصدير البيانات')
    }
  }

  /**
   * استيراد البيانات من Excel
   */
  async importFromExcel(file: File): Promise<{ success: boolean; imported: number; errors: string[] }> {
    try {
      if (!supabase) {
        return { success: false, imported: 0, errors: ['Supabase غير متاح'] }
      }

      const XLSX = await import('xlsx')
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

      const errors: string[] = []
      const rowsToInsert: Partial<ArabicPricingRow>[] = []

      // تخطي الصف الأول (العناوين)
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i]
        
        if (!row[0] || !row[1] || !row[2]) {
          errors.push(`الصف ${i + 1}: بيانات ناقصة`)
          continue
        }

        const newRow: Partial<ArabicPricingRow> = {
          المقاس: row[0]?.toString().trim(),
          المستوى: row[1]?.toString().trim(),
          الزبون: row[2]?.toString().trim(),
          'شهر واحد': this.parseNumber(row[3]),
          '2 أشهر': this.parseNumber(row[4]),
          '3 أشهر': this.parseNumber(row[5]),
          '6 أشهر': this.parseNumber(row[6]),
          'سنة كاملة': this.parseNumber(row[7]),
          'يوم واحد': this.parseNumber(row[8]),
          billboard_size: row[0]?.toString().trim(),
          customer_type: this.mapCustomerTypeToEnglish(row[2]?.toString().trim()),
          ab_type: row[1]?.toString().trim(),
          currency: 'د.ل'
        }

        rowsToInsert.push(newRow)
      }

      if (rowsToInsert.length === 0) {
        return { success: false, imported: 0, errors: ['لا توجد بيانات صحيحة للاستيراد'] }
      }

      // حذف البيانات الموجودة وإدراج الجديدة
      await supabase.from('pricing_ar').delete().neq('id', -1)
      
      const { error: insertError } = await supabase
        .from('pricing_ar')
        .insert(rowsToInsert)

      if (insertError) {
        return { success: false, imported: 0, errors: [insertError.message] }
      }

      this.clearCache()
      return { success: true, imported: rowsToInsert.length, errors }

    } catch (error: any) {
      return { success: false, imported: 0, errors: [error.message] }
    }
  }

  /**
   * مزامنة البيانات مع النظام المحلي
   */
  async syncWithLocalPricing(): Promise<{ success: boolean; synced: number; errors: string[] }> {
    try {
      const rows = await this.getAllPricingData()
      const { newPricingService } = await import('@/services/newPricingService')
      const pricing = newPricingService.getPricing()

      let synced = 0
      const errors: string[] = []

      // مزامنة كل صف مع النظام المحلي
      for (const row of rows) {
        try {
          const size = row.المقاس as BillboardSize
          const level = row.المستوى as PriceListType
          const customerType = this.mapCustomerTypeToEnglish(row.الزبون)

          // تحديث الأسعار في النظام المحلي
          const durations = [
            { key: 'شهر واحد', duration: 1 },
            { key: '3 أشهر', duration: 3 },
            { key: '6 أشهر', duration: 6 },
            { key: 'سنة كاملة', duration: 12 }
          ]

          durations.forEach(({ key, duration }) => {
            const price = row[key as keyof ArabicPricingRow]
            if (typeof price === 'number' && price > 0) {
              // تحديث في النظام المحلي
              Object.keys(pricing.zones).forEach(zoneName => {
                const zone = pricing.zones[zoneName]
                if (!zone.abPrices) zone.abPrices = { A: { '1': {}, '3': {}, '6': {}, '12': {} }, B: { '1': {}, '3': {}, '6': {}, '12': {} } }
                if (!zone.abPrices[level]) zone.abPrices[level] = { '1': {}, '3': {}, '6': {}, '12': {} }
                if (!zone.abPrices[level][duration.toString()]) zone.abPrices[level][duration.toString()] = {}
                zone.abPrices[level][duration.toString()][size] = price
              })
            }
          })

          synced++
        } catch (error: any) {
          errors.push(`خطأ في مزامنة ${row.المقاس} ${row.المستوى} ${row.الزبون}: ${error.message}`)
        }
      }

      // حفظ التحديثات
      newPricingService.updatePricing(pricing)

      return { success: true, synced, errors }

    } catch (error: any) {
      return { success: false, synced: 0, errors: [error.message] }
    }
  }

  /**
   * مساعدات Cache
   */
  private getCachedData(): ArabicPricingRow[] | null {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY)
      if (!cached) return null

      const { data, timestamp } = JSON.parse(cached)
      const now = Date.now()

      if (now - timestamp > this.CACHE_DURATION) {
        this.clearCache()
        return null
      }

      return data
    } catch {
      return null
    }
  }

  private setCachedData(data: ArabicPricingRow[]): void {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      }
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData))
    } catch {
      // تجاهل أخطاء Cache
    }
  }

  private clearCache(): void {
    try {
      localStorage.removeItem(this.CACHE_KEY)
    } catch {
      // تجاهل أخطاء Cache
    }
  }

  /**
   * بيانات احتياطية في حالة عدم توفر Supabase
   */
  private getFallbackData(): ArabicPricingRow[] {
    return [
      {
        id: 1,
        المقاس: '13x5',
        المستوى: 'A',
        الزبون: 'عادي',
        'شهر واحد': 24000,
        '3 أشهر': 28800,
        '6 أشهر': 36800,
        'سنة كاملة': 58000,
        'يوم واحد': 10
      },
      {
        id: 2,
        المقاس: '12x4',
        المستوى: 'A',
        الزبون: 'عادي',
        'شهر واحد': 21100,
        '3 أشهر': 25000,
        '6 أشهر': 35000,
        'سنة كاملة': 55000,
        'يوم واحد': 10
      }
    ]
  }

  /**
   * تحويل النص إلى رقم
   */
  private parseNumber(value: any): number | null {
    if (value === null || value === undefined || value === '') return null
    const num = Number(value)
    return isNaN(num) ? null : num
  }
}

export const arabicPricingService = new ArabicPricingService()