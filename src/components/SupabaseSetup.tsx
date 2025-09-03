import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Database, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Wrench,
  Eye,
  EyeOff
} from 'lucide-react'
import { setupSupabaseTables, testSupabaseConnection } from '@/utils/setupSupabaseTables'
import { supabase } from '@/supabaseClient'

interface SupabaseSetupProps {
  onClose: () => void
}

const SupabaseSetup: React.FC<SupabaseSetupProps> = ({ onClose }) => {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [connectionStatus, setConnectionStatus] = useState<any>(null)
  const [showEnvVars, setShowEnvVars] = useState(false)

  const handleSetup = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const setupResult = await setupSupabaseTables()
      setResult(setupResult)
    } catch (error: any) {
      setResult({ success: false, error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleTestConnection = async () => {
    setLoading(true)
    setConnectionStatus(null)
    
    try {
      const testResult = await testSupabaseConnection()
      setConnectionStatus(testResult)
    } catch (error: any) {
      setConnectionStatus({ connected: false, error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Database className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">إعداد قاعدة البيانات</h1>
                <p className="text-sm opacity-90">فحص وإنشاء الجداول المطلوبة في Supabase</p>
              </div>
            </div>
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
              className="bg-white/20 border-white/30 text-white hover:bg-white/30"
            >
              إغلاق
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* حالة الاتصال */}
          <Card className="p-4">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Database className="w-5 h-5" />
              حالة الاتصال بـ Supabase
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>رابط المشروع:</span>
                <Badge className={supabaseUrl ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {supabaseUrl ? 'متوفر' : 'غير متوفر'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span>مفتاح API:</span>
                <Badge className={supabaseKey ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {supabaseKey ? 'متوفر' : 'غير متوفر'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span>Supabase Client:</span>
                <Badge className={supabase ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {supabase ? 'مُهيأ' : 'غير مُهيأ'}
                </Badge>
              </div>

              {/* عرض متغيرات البيئة */}
              <div className="mt-4">
                <Button
                  onClick={() => setShowEnvVars(!showEnvVars)}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  {showEnvVars ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                  {showEnvVars ? 'إخفاء' : 'عرض'} تفاصيل الاتصال
                </Button>
                
                {showEnvVars && (
                  <div className="mt-3 p-3 bg-gray-100 rounded-lg font-mono text-sm">
                    <div className="mb-2">
                      <strong>VITE_SUPABASE_URL:</strong>
                      <div className="break-all text-gray-600">
                        {supabaseUrl || 'غير متوفر'}
                      </div>
                    </div>
                    <div>
                      <strong>VITE_SUPABASE_ANON_KEY:</strong>
                      <div className="break-all text-gray-600">
                        {supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'غير متوفر'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* اختبار الاتصال */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">اختبار الاتصال</h3>
              <Button
                onClick={handleTestConnection}
                disabled={loading || !supabase}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                اختبار الاتصال
              </Button>
            </div>

            {connectionStatus && (
              <div className={`p-3 rounded-lg ${
                connectionStatus.connected 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {connectionStatus.connected ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  )}
                  <span className={`font-semibold ${
                    connectionStatus.connected ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {connectionStatus.connected ? 'متصل بنجاح' : 'فشل الاتصال'}
                  </span>
                </div>
                
                {connectionStatus.message && (
                  <p className="text-sm text-gray-700 mb-1">{connectionStatus.message}</p>
                )}
                
                {connectionStatus.error && (
                  <p className="text-sm text-red-600 mb-1">خطأ: {connectionStatus.error}</p>
                )}
                
                {connectionStatus.details && (
                  <p className="text-sm text-gray-600">{connectionStatus.details}</p>
                )}

                {connectionStatus.rowCount !== undefined && (
                  <p className="text-sm text-gray-600">
                    عدد الصفوف في جدول pricing_ar: {connectionStatus.rowCount}
                  </p>
                )}
              </div>
            )}
          </Card>

          {/* إعداد الجداول */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg">إعداد الجداول</h3>
                <p className="text-sm text-gray-600">إنشاء جداول pricing_ar و users إذا لم تكن موجودة</p>
              </div>
              <Button
                onClick={handleSetup}
                disabled={loading || !supabase}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Wrench className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                إعداد الجداول
              </Button>
            </div>

            {result && (
              <div className={`p-3 rounded-lg ${
                result.success 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  )}
                  <span className={`font-semibold ${
                    result.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {result.success ? 'تم الإعداد بنجاح' : 'فشل في الإعداد'}
                  </span>
                </div>
                
                {result.error && (
                  <p className="text-sm text-red-600">خطأ: {result.error}</p>
                )}
              </div>
            )}
          </Card>

          {/* إرشادات */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <h4 className="font-bold text-blue-900 mb-2">إرشادات مهمة:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• تأكد من أن رابط Supabase ومفتاح API صحيحان</li>
              <li>• يجب أن يكون المشروع في Supabase مُفعل ومتاح</li>
              <li>• تأكد من صلاحيات الوصول للجداول في Supabase</li>
              <li>• إذا فشل الإعداد، تحقق من إعدادات RLS في Supabase</li>
            </ul>
          </Card>

          {!supabase && (
            <Card className="p-4 bg-yellow-50 border-yellow-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <span className="font-semibold text-yellow-800">تحذير</span>
              </div>
              <p className="text-sm text-yellow-700">
                Supabase غير مُهيأ. يرجى التأكد من إعداد متغيرات البيئة VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY.
              </p>
            </Card>
          )}
        </div>
      </Card>
    </div>
  )
}

export default SupabaseSetup
