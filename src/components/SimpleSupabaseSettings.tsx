import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { 
  Database, 
  Save, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  Eye,
  EyeOff,
  X
} from 'lucide-react'

interface SimpleSupabaseSettingsProps {
  onClose: () => void
}

const SimpleSupabaseSettings: React.FC<SimpleSupabaseSettingsProps> = ({ onClose }) => {
  const [settings, setSettings] = useState({
    url: import.meta.env.VITE_SUPABASE_URL || '',
    key: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    showKey: false
  })
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' })
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    setStatus({ type: null, message: '' })

    if (!settings.url || !settings.key) {
      setStatus({ type: 'error', message: 'يرجى ملء جميع الحقول' })
      setLoading(false)
      return
    }

    try {
      // اختبار الاتصال أولاً
      const { createClient } = await import('@supabase/supabase-js')
      const testClient = createClient(settings.url, settings.key)
      
      const { error } = await testClient.from('pricing_ar').select('count', { count: 'exact', head: true }).limit(1)
      
      if (error && !error.message.includes('relation "pricing_ar" does not exist')) {
        throw new Error(error.message)
      }

      // حفظ الإعدادات
      localStorage.setItem('supabase_settings', JSON.stringify(settings))
      
      setStatus({ 
        type: 'success', 
        message: 'تم حفظ الإعدادات بنجاح! اضغط على "إعادة تحميل" لتطبيق التغييرات.' 
      })

    } catch (error: any) {
      setStatus({ 
        type: 'error', 
        message: `فش�� في الاتصال: ${error.message}` 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReload = () => {
    // إرسال رسالة للنافذة الأب لتحديث متغيرات البيئة
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'UPDATE_SUPABASE_ENV',
        url: settings.url,
        key: settings.key
      }, '*')
    }
    
    setTimeout(() => {
      window.location.reload()
    }, 500)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">إعدادات Supabase</h1>
                <p className="text-sm opacity-90">تكوين قاعدة البيانات</p>
              </div>
            </div>
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
              className="bg-white/20 border-white/30 text-white hover:bg-white/30"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* رسائل النجاح والخطأ */}
          {status.type && (
            <div className={`p-4 rounded-lg border ${
              status.type === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center gap-2">
                {status.type === 'success' ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
                <span className="font-medium">{status.message}</span>
              </div>
            </div>
          )}

          {/* الحالة الحالية */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium">رابط المشروع:</span>
                {import.meta.env.VITE_SUPABASE_URL ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">متصل</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-red-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">غير محدد</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium">مفتاح API:</span>
                {import.meta.env.VITE_SUPABASE_ANON_KEY ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">متوفر</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-red-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">غير محدد</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* نم��ذج الإعدادات */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                رابط مشروع Supabase
              </label>
              <Input
                type="url"
                value={settings.url}
                onChange={(e) => setSettings(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://your-project.supabase.co"
                className="bg-white"
              />
              <p className="text-xs text-gray-600 mt-1">
                يمكنك العثور على هذا الرابط في لوحة تحكم Supabase → Settings → API
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                مفتاح API (anon key)
              </label>
              <div className="relative">
                <Input
                  type={settings.showKey ? 'text' : 'password'}
                  value={settings.key}
                  onChange={(e) => setSettings(prev => ({ ...prev, key: e.target.value }))}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="bg-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setSettings(prev => ({ ...prev, showKey: !prev.showKey }))}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {settings.showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                المفتاح العام (anon public key) من إعدادات API في Supabase
              </p>
            </div>
          </div>

          {/* إرشادات سريعة */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-bold text-blue-800 mb-2">البيانات المطلوبة من لوحة تحكم Supabase:</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>Project URL:</strong> https://azgnulqrbxuxhltkcptm.supabase.co</p>
              <p><strong>anon public key:</strong> eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</p>
            </div>
          </div>

          {/* أزرار العمل */}
          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              disabled={loading || !settings.url || !settings.key}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Save className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'جاري الحفظ...' : 'حفظ واختبار'}
            </Button>

            {status.type === 'success' && (
              <Button
                onClick={handleReload}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                إعادة تحميل الصفحة
              </Button>
            )}

            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              إلغاء
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default SimpleSupabaseSettings
