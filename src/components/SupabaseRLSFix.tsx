import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw,
  Code,
  Copy
} from 'lucide-react'
import { supabase } from '@/supabaseClient'

const SupabaseRLSFix: React.FC = () => {
  const [testing, setTesting] = useState(false)
  const [fixing, setFixing] = useState(false)
  const [results, setResults] = useState<any>(null)

  const testRLSPolicies = async () => {
    setTesting(true)
    const testResults: any = {
      pricing_ar: { canRead: false, canWrite: false, error: null },
      users: { canRead: false, canWrite: false, error: null }
    }

    try {
      if (!supabase) {
        setResults({ error: 'Supabase غير متاح' })
        setTesting(false)
        return
      }

      // اختبار قراءة pricing_ar
      try {
        const { data, error } = await supabase
          .from('pricing_ar')
          .select('*')
          .limit(1)
        
        testResults.pricing_ar.canRead = !error
        if (error) testResults.pricing_ar.error = error.message
      } catch (error: any) {
        testResults.pricing_ar.error = error.message
      }

      // اختبار كتابة pricing_ar
      try {
        const testData = {
          "المقاس": "test",
          "المستوى": "A",
          "الزبون": "test",
          "شهر واحد": 1000,
          billboard_size: "test",
          customer_type: "individuals",
          ab_type: "A",
          currency: "د.ل"
        }

        const { error } = await supabase
          .from('pricing_ar')
          .insert([testData])

        if (!error) {
          testResults.pricing_ar.canWrite = true
          // حذف البيانات التجريبية
          await supabase
            .from('pricing_ar')
            .delete()
            .eq('المقاس', 'test')
        } else {
          testResults.pricing_ar.error = error.message
        }
      } catch (error: any) {
        testResults.pricing_ar.writeError = error.message
      }

      // اختبار قراءة users
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .limit(1)
        
        testResults.users.canRead = !error
        if (error) testResults.users.error = error.message
      } catch (error: any) {
        testResults.users.error = error.message
      }

      // اختبار كتابة users
      try {
        const testUser = {
          username: 'test_user',
          email: 'test@test.com',
          role: 'user',
          permissions: [],
          is_active: true,
          password: 'test'
        }

        const { error } = await supabase
          .from('users')
          .insert([testUser])

        if (!error) {
          testResults.users.canWrite = true
          // حذف المستخدم التجريبي
          await supabase
            .from('users')
            .delete()
            .eq('username', 'test_user')
        } else {
          testResults.users.writeError = error.message
        }
      } catch (error: any) {
        testResults.users.writeError = error.message
      }

    } catch (error: any) {
      testResults.error = error.message
    }

    setResults(testResults)
    setTesting(false)
  }

  const disableRLS = async () => {
    setFixing(true)
    
    try {
      if (!supabase) {
        alert('Supabase غير متاح')
        return
      }

      // محاولة تعطيل RLS للجداول
      const tables = ['pricing_ar', 'users']
      const errors = []

      for (const table of tables) {
        try {
          // محاولة تعطيل RLS
          const { error } = await supabase.rpc('disable_rls', { table_name: table })
          if (error) {
            errors.push(`${table}: ${error.message}`)
          }
        } catch (error: any) {
          errors.push(`${table}: ${error.message}`)
        }
      }

      if (errors.length > 0) {
        alert(`تم إنجاز العملية مع بعض الأخطاء:\n${errors.join('\n')}`)
      } else {
        alert('تم تعطيل RLS للجداول بنجاح')
      }

      // إعادة اختبار الصلاحيات
      await testRLSPolicies()

    } catch (error: any) {
      alert(`خطأ في تعطيل RLS: ${error.message}`)
    } finally {
      setFixing(false)
    }
  }

  const copySQL = (sql: string) => {
    navigator.clipboard.writeText(sql)
    alert('تم نسخ الكود إلى الحافظة')
  }

  const sqlCommands = {
    disableRLS: `-- تعطيل RLS للجداول
ALTER TABLE pricing_ar DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;`,
    
    enablePublicAccess: `-- السماح بالوصول العام للجداول
GRANT ALL ON pricing_ar TO anon;
GRANT ALL ON users TO anon;
GRANT ALL ON pricing_ar TO authenticated;
GRANT ALL ON users TO authenticated;`,

    createPolicies: `-- إنشاء سياسات RLS مفتوحة
CREATE POLICY "Enable all access for pricing_ar" ON pricing_ar
FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for users" ON users  
FOR ALL USING (true) WITH CHECK (true);`
  }

  return (
    <Card className="p-4 mb-4 border-2 border-orange-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-orange-600" />
          <h3 className="font-bold">فحص وإصلاح صلاحيات Supabase</h3>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={testRLSPolicies}
            disabled={testing}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${testing ? 'animate-spin' : ''}`} />
            اختبار الصلاحيات
          </Button>
          <Button
            onClick={disableRLS}
            disabled={fixing || !supabase}
            size="sm"
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Shield className={`w-4 h-4 mr-1 ${fixing ? 'animate-spin' : ''}`} />
            إصلاح الصلاحيات
          </Button>
        </div>
      </div>

      {results && (
        <div className="space-y-4">
          {/* نتائج الاختبار */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-3">
              <h4 className="font-semibold mb-2">جدول pricing_ar</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">القراءة:</span>
                  <Badge className={results.pricing_ar.canRead ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {results.pricing_ar.canRead ? 'مسموح' : 'مرفوض'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">الكتابة:</span>
                  <Badge className={results.pricing_ar.canWrite ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {results.pricing_ar.canWrite ? 'مسموح' : 'مرفوض'}
                  </Badge>
                </div>
                {results.pricing_ar.error && (
                  <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                    {results.pricing_ar.error}
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-3">
              <h4 className="font-semibold mb-2">جدول users</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">القراءة:</span>
                  <Badge className={results.users.canRead ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {results.users.canRead ? 'مسموح' : 'مرفوض'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">الكتابة:</span>
                  <Badge className={results.users.canWrite ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {results.users.canWrite ? 'مسموح' : 'مرفوض'}
                  </Badge>
                </div>
                {results.users.error && (
                  <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                    {results.users.error}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* إرشادات الإصلاح اليدوي */}
          {(!results.pricing_ar.canRead || !results.pricing_ar.canWrite || 
            !results.users.canRead || !results.users.canWrite) && (
            <div className="mt-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Code className="w-4 h-4" />
                أوامر SQL للإصلاح اليدوي
              </h4>
              
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">1. تعطيل RLS:</span>
                    <Button
                      onClick={() => copySQL(sqlCommands.disableRLS)}
                      size="sm"
                      variant="outline"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      نسخ
                    </Button>
                  </div>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                    {sqlCommands.disableRLS}
                  </pre>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">2. منح الصلاحيات:</span>
                    <Button
                      onClick={() => copySQL(sqlCommands.enablePublicAccess)}
                      size="sm"
                      variant="outline"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      نسخ
                    </Button>
                  </div>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                    {sqlCommands.enablePublicAccess}
                  </pre>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">3. إنشاء سياسات مفتوحة (اختياري):</span>
                    <Button
                      onClick={() => copySQL(sqlCommands.createPolicies)}
                      size="sm"
                      variant="outline"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      نسخ
                    </Button>
                  </div>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                    {sqlCommands.createPolicies}
                  </pre>
                </div>
              </div>

              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm text-blue-800">
                  <strong>طريقة التطبيق:</strong>
                  <ol className="mt-1 space-y-1">
                    <li>1. اذهب إلى Supabase Dashboard</li>
                    <li>2. افتح SQL Editor</li>
                    <li>3. انسخ والصق الأوامر أعلاه</li>
                    <li>4. شغل الأوامر واحداً تلو الآخر</li>
                    <li>5. أعد اختبار الصلاحيات</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* حالة نجاح */}
          {results.pricing_ar.canRead && results.pricing_ar.canWrite && 
           results.users.canRead && results.users.canWrite && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-green-800">جميع الصلاحيات تعمل بشكل صحيح!</span>
              </div>
              <div className="text-sm text-green-700 mt-1">
                يمكنك الآن استخدام إدارة الأسعار العربية بدون مشاكل
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

export default SupabaseRLSFix
