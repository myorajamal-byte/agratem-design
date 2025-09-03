import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Database, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw,
  Settings,
  Plus
} from 'lucide-react'
import { supabase } from '@/supabaseClient'

const QuickSupabaseTest: React.FC = () => {
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    testConnection()
  }, [])

  const testConnection = async () => {
    setTesting(true)
    const testResults: any = {
      supabaseClient: !!supabase,
      envVars: {
        url: !!import.meta.env.VITE_SUPABASE_URL,
        key: !!import.meta.env.VITE_SUPABASE_ANON_KEY
      },
      pricing_ar: null,
      users: null,
      error: null
    }

    try {
      if (supabase) {
        // اختبار جدول pricing_ar
        try {
          const { data: pricingData, error: pricingError } = await supabase
            .from('pricing_ar')
            .select('count', { count: 'exact', head: true })
          
          if (pricingError) {
            testResults.pricing_ar = { exists: false, error: pricingError.message }
          } else {
            testResults.pricing_ar = { exists: true, count: pricingData?.length || 0 }
          }
        } catch (error: any) {
          testResults.pricing_ar = { exists: false, error: error.message }
        }

        // اختبار جدول users
        try {
          const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('count', { count: 'exact', head: true })
          
          if (usersError) {
            testResults.users = { exists: false, error: usersError.message }
          } else {
            testResults.users = { exists: true, count: usersData?.length || 0 }
          }
        } catch (error: any) {
          testResults.users = { exists: false, error: error.message }
        }
      }
    } catch (error: any) {
      testResults.error = error.message
    }

    setResults(testResults)
    setTesting(false)
  }

  const createTables = async () => {
    setCreating(true)
    
    try {
      if (!supabase) {
        alert('Supabase غير متاح')
        return
      }

      // إنشاء جدول pricing_ar
      try {
        const sampleData = [
          {
            "المقاس": "13x5",
            "المستوى": "A", 
            "الزبون": "عادي",
            "شهر واحد": 24000,
            "3 أشهر": 22000,
            "6 أشهر": 20000,
            "سنة كاملة": 18000,
            billboard_size: "13x5",
            customer_type: "individuals",
            ab_type: "A",
            currency: "د.ل"
          },
          {
            "المقاس": "12x4",
            "المستوى": "A",
            "الزبون": "عادي", 
            "شهر واحد": 21000,
            "3 أشهر": 19000,
            "6 أشهر": 17000,
            "سنة كاملة": 15000,
            billboard_size: "12x4",
            customer_type: "individuals",
            ab_type: "A",
            currency: "د.ل"
          }
        ]

        const { error: insertError } = await supabase
          .from('pricing_ar')
          .insert(sampleData)

        if (insertError) {
          console.log('خطأ في إدراج البيانات:', insertError.message)
        } else {
          console.log('✅ تم إنشاء جدول pricing_ar وإدراج البيانات')
        }
      } catch (error: any) {
        console.warn('⚠️ خطأ في إنشاء جدول pricing_ar:', error.message)
      }

      // إنشاء مستخدم إداري في جدول users
      try {
        const adminUser = {
          username: 'admin',
          email: 'admin@alfaresaldahabi.com',
          role: 'admin',
          permissions: [
            { id: '1', name: 'view_billboards', description: 'عرض اللوحات الإعلانية' },
            { id: '2', name: 'manage_users', description: 'إدارة المستخدمين' },
            { id: '3', name: 'admin_access', description: 'صلاحيات الإدارة الكاملة' }
          ],
          is_active: true,
          password: 'aukg-123'
        }

        const { error: userError } = await supabase
          .from('users')
          .insert([adminUser])

        if (userError) {
          console.log('خطأ في إنشاء المستخدم الإداري:', userError.message)
        } else {
          console.log('✅ تم إنشاء المستخدم الإداري')
        }
      } catch (error: any) {
        console.warn('⚠️ خطأ في إنشاء المستخدم:', error.message)
      }

      alert('تم محاولة إنشاء الجداول. تحقق من النتائج.')
      await testConnection()

    } catch (error: any) {
      alert(`خطأ في إنشاء الجداول: ${error.message}`)
    } finally {
      setCreating(false)
    }
  }

  return (
    <Card className="p-4 mb-4 border-2 border-blue-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold">اختبار سريع لـ Supabase</h3>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={testConnection}
            disabled={testing}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${testing ? 'animate-spin' : ''}`} />
            اختبار
          </Button>
          <Button
            onClick={createTables}
            disabled={creating || !supabase}
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className={`w-4 h-4 mr-1 ${creating ? 'animate-spin' : ''}`} />
            إنشاء الجداول
          </Button>
        </div>
      </div>

      {results && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Supabase Client:</span>
              <Badge className={results.supabaseClient ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {results.supabaseClient ? 'متوفر' : 'غير متوفر'}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">متغيرات البيئة:</span>
              <Badge className={results.envVars.url && results.envVars.key ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {results.envVars.url && results.envVars.key ? 'محددة' : 'ناقصة'}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">جدول pricing_ar:</span>
              <Badge className={results.pricing_ar?.exists ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {results.pricing_ar?.exists ? `موجود (${results.pricing_ar.count || 0})` : 'غير موجود'}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">جدول users:</span>
              <Badge className={results.users?.exists ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {results.users?.exists ? `موجود (${results.users.count || 0})` : 'غير موجود'}
              </Badge>
            </div>
          </div>

          {/* عرض الأخطاء */}
          {(results.pricing_ar?.error || results.users?.error || results.error) && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-semibold text-red-800 mb-2">أخطاء:</h4>
              <div className="text-sm text-red-700 space-y-1">
                {results.error && <div>• خطأ عام: {results.error}</div>}
                {results.pricing_ar?.error && <div>• pricing_ar: {results.pricing_ar.error}</div>}
                {results.users?.error && <div>• users: {results.users.error}</div>}
              </div>
            </div>
          )}

          {/* حالة الاتصال الناجح */}
          {results.supabaseClient && results.envVars.url && results.envVars.key && 
           results.pricing_ar?.exists && results.users?.exists && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-green-800">كل شيء يعمل بشكل صحيح!</span>
              </div>
              <div className="text-sm text-green-700 mt-1">
                Supabase متصل وجميع الجداول متوفرة
              </div>
            </div>
          )}

          {/* إرشادات الإصلاح */}
          {(!results.supabaseClient || !results.envVars.url || !results.envVars.key) && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <span className="font-semibold text-yellow-800">إعداد مطلوب</span>
              </div>
              <div className="text-sm text-yellow-700">
                تأكد من تعيين متغيرات البيئة VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

export default QuickSupabaseTest
