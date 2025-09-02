import { supabase } from '@/supabaseClient'
import { arabicPricingService } from './arabicPricingService'
import { newPricingService } from './newPricingService'
import { PriceList, BillboardSize, PriceListType, CustomerType } from '@/types'

/**
 * خدمة مزامنة البيانات بين Supabase والنظام المحلي
 */
class SupabaseSyncService {
  
  /**
   * مزامنة الأسعار من جدول pricing_ar إلى النظام المحلي
   */
  async syncArabicPricingToLocal(): Promise<{
    success: boolean
    syncedRows: number
    errors: string[]
  }> {
    try {
      if (!supabase) {
        return {
          success: false,
          syncedRows: 0,
          errors: ['Supabase غير متاح']
        }
      }

      console.log('🔄 بدء مزامنة الأسعار العربية مع النظام المحلي...')

      // تحميل البيانات من جدول pricing_ar
      const arabicData = await arabicPricingService.getAllPricingData()
      
      if (arabicData.length === 0) {
        return {
          success: false,
          syncedRows: 0,
          errors: ['لا توجد بيانات في جدول pricing_ar']
        }
      }

      // الحصول على النظام المحلي
      const localPricing = newPricingService.getPricing()
      const updatedPricing: PriceList = JSON.parse(JSON.stringify(localPricing))

      let syncedRows = 0
      const errors: string[] = []

      // معالجة كل صف من البيانات العربية
      for (const row of arabicData) {
        try {
          const size = row.المقاس as BillboardSize
          const level = row.المستوى as PriceListType
          const arabicCustomer = row.الزبون

          // تحويل نوع الزبون للإنجليزية
          const customerType: CustomerType = 
            arabicCustomer === 'مسوق' ? 'marketers' :
            arabicCustomer === 'شركات' ? 'companies' :
            'individuals'

          // إنشاء منطقة افتراضية إذا لم تكن موجودة
          const defaultZone = 'مصراتة'
          if (!updatedPricing.zones[defaultZone]) {
            updatedPricing.zones[defaultZone] = {
              name: defaultZone,
              prices: {
                marketers: {},
                individuals: {},
                companies: {}
              },
              abPrices: {
                A: { '1': {}, '3': {}, '6': {}, '12': {} },
                B: { '1': {}, '3': {}, '6': {}, '12': {} }
              }
            }
          }

          const zone = updatedPricing.zones[defaultZone]

          // مزامنة الأسعار حسب المدة
          const durationMapping = [
            { arabic: 'شهر واحد', duration: '1' },
            { arabic: '3 أشهر', duration: '3' },
            { arabic: '6 أشهر', duration: '6' },
            { arabic: 'سنة كاملة', duration: '12' }
          ]

          durationMapping.forEach(({ arabic, duration }) => {
            const price = row[arabic as keyof typeof row]
            if (typeof price === 'number' && price > 0) {
              // تحديث في نظام A/B
              if (!zone.abPrices[level][duration]) {
                zone.abPrices[level][duration] = {}
              }
              zone.abPrices[level][duration][size] = price

              // تحديث في النظام التقليدي أيضاً (للمدة الشهرية فقط)
              if (duration === '1') {
                if (!zone.prices[customerType]) {
                  zone.prices[customerType] = {}
                }
                zone.prices[customerType][size] = price
              }
            }
          })

          syncedRows++

        } catch (error: any) {
          errors.push(`خطأ في معالجة الصف ${row.id}: ${error.message}`)
        }
      }

      // حفظ التحديثات في النظام المحلي
      const saveResult = newPricingService.updatePricing(updatedPricing)
      
      if (!saveResult.success) {
        errors.push(`فشل في حفظ البيانات المحلية: ${saveResult.error}`)
      }

      console.log(`✅ تم مزامنة ${syncedRows} صف من جدول pricing_ar`)

      return {
        success: saveResult.success,
        syncedRows,
        errors
      }

    } catch (error: any) {
      console.error('❌ خطأ في مزامنة الأسعار العربية:', error)
      return {
        success: false,
        syncedRows: 0,
        errors: [error.message]
      }
    }
  }

  /**
   * مزامنة الأسعار من النظام المحلي إلى جدول pricing_ar
   */
  async syncLocalPricingToArabic(): Promise<{
    success: boolean
    syncedRows: number
    errors: string[]
  }> {
    try {
      if (!supabase) {
        return {
          success: false,
          syncedRows: 0,
          errors: ['Supabase غير متاح']
        }
      }

      console.log('🔄 بدء مزامنة النظام المحلي مع جدول pricing_ar...')

      const localPricing = newPricingService.getPricing()
      const sizes = newPricingService.sizes
      const customerTypes: CustomerType[] = ['individuals', 'marketers', 'companies']
      const levels: PriceListType[] = ['A', 'B']

      let syncedRows = 0
      const errors: string[] = []

      // حذف البيانات الموجودة في جدول pricing_ar
      await supabase.from('pricing_ar').delete().neq('id', -1)

      // إنشاء صفوف جديدة من النظام المحلي
      for (const zoneName of Object.keys(localPricing.zones)) {
        const zone = localPricing.zones[zoneName]

        for (const size of sizes) {
          for (const level of levels) {
            for (const customerType of customerTypes) {
              try {
                // تحويل نوع الزبون للعربية
                const arabicCustomer = 
                  customerType === 'marketers' ? 'مسوق' :
                  customerType === 'companies' ? 'شركات' :
                  'عادي'

                // جمع الأسعار من المدد المختلفة
                const prices = {
                  'شهر واحد': zone.abPrices?.[level]?.['1']?.[size] || zone.prices?.[customerType]?.[size] || 0,
                  '3 أشهر': zone.abPrices?.[level]?.['3']?.[size] || 0,
                  '6 أشهر': zone.abPrices?.[level]?.['6']?.[size] || 0,
                  'سنة كاملة': zone.abPrices?.[level]?.['12']?.[size] || 0,
                  'يوم واحد': Math.round((zone.abPrices?.[level]?.['1']?.[size] || 0) / 30) || 0
                }

                // إضافة الصف إذا كان له أسعار
                if (Object.values(prices).some(p => p > 0)) {
                  const result = await arabicPricingService.addNewRow(
                    size,
                    level,
                    customerType,
                    prices
                  )

                  if (result.success) {
                    syncedRows++
                  } else {
                    errors.push(`فشل في إضافة ${size} ${level} ${arabicCustomer}: ${result.error}`)
                  }
                }

              } catch (error: any) {
                errors.push(`خطأ في معالجة ${size} ${level} ${customerType}: ${error.message}`)
              }
            }
          }
        }
      }

      console.log(`✅ تم مزامنة ${syncedRows} صف إلى جدول pricing_ar`)

      return {
        success: true,
        syncedRows,
        errors
      }

    } catch (error: any) {
      console.error('❌ خطأ في مزامنة النظام المحلي:', error)
      return {
        success: false,
        syncedRows: 0,
        errors: [error.message]
      }
    }
  }

  /**
   * مزامنة ثنائية الاتجاه
   */
  async bidirectionalSync(): Promise<{
    success: boolean
    arabicToLocal: number
    localToArabic: number
    errors: string[]
  }> {
    try {
      console.log('🔄 بدء المزامنة ثنائية الاتجاه...')

      // أولاً: مزامنة من العربي للمحلي
      const arabicToLocalResult = await this.syncArabicPricingToLocal()
      
      // ثانياً: مزامنة من المحلي للعربي
      const localToArabicResult = await this.syncLocalPricingToArabic()

      const allErrors = [
        ...arabicToLocalResult.errors,
        ...localToArabicResult.errors
      ]

      console.log('✅ انتهت المزامنة ثنائية الاتجاه')

      return {
        success: arabicToLocalResult.success && localToArabicResult.success,
        arabicToLocal: arabicToLocalResult.syncedRows,
        localToArabic: localToArabicResult.syncedRows,
        errors: allErrors
      }

    } catch (error: any) {
      console.error('❌ خطأ في المزامنة ثنائية الاتجاه:', error)
      return {
        success: false,
        arabicToLocal: 0,
        localToArabic: 0,
        errors: [error.message]
      }
    }
  }

  /**
   * فحص حالة الاتصال مع Supabase
   */
  async checkSupabaseConnection(): Promise<{
    connected: boolean
    tableExists: boolean
    rowCount: number
    error?: string
  }> {
    try {
      if (!supabase) {
        return {
          connected: false,
          tableExists: false,
          rowCount: 0,
          error: 'Supabase غير مكون'
        }
      }

      // فحص الاتصال والجدول
      const { data, error, count } = await supabase
        .from('pricing_ar')
        .select('*', { count: 'exact', head: true })

      if (error) {
        return {
          connected: true,
          tableExists: false,
          rowCount: 0,
          error: error.message
        }
      }

      return {
        connected: true,
        tableExists: true,
        rowCount: count || 0
      }

    } catch (error: any) {
      return {
        connected: false,
        tableExists: false,
        rowCount: 0,
        error: error.message
      }
    }
  }
}

export const supabaseSyncService = new SupabaseSyncService()