import React, { useState, useEffect } from 'react'
import {
  Users,
  UserPlus,
  Edit3,
  Trash2,
  Shield,
  Eye,
  EyeOff,
  X,
  Save,
  Key,
  Mail,
  User,
  Lock,
  Settings,
  Database,
  RefreshCw,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/AuthContext'
import { authService } from '@/services/authService'
import { clientService } from '@/services/clientService'
import { loadBillboardsFromExcel } from '@/services/billboardService'
import { User as UserType, Permission, Client, Billboard } from '@/types'
import { formatGregorianDate } from '@/lib/dateUtils'

interface SystemSettingsProps {
  onClose: () => void
}

const SystemSettings: React.FC<SystemSettingsProps> = ({ onClose }) => {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<UserType[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [billboards, setBillboards] = useState<Billboard[]>([])
  const [showAddUser, setShowAddUser] = useState(false)
  const [editingUser, setEditingUser] = useState<UserType | null>(null)
  const [showPasswordDialog, setShowPasswordDialog] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // نموذج إضافة مستخدم جديد
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    role: 'user' as 'admin' | 'user',
    permissions: [] as Permission[],
    assignedClient: '',
    pricingCategory: 'individuals' as 'A' | 'B' | 'companies' | 'individuals' | 'marketers',
    password: '',
    isActive: true
  })

  // نموذج تغيير كلمة المرور
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
    showPassword: false
  })

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // إعدادات قاعدة البيانات
  const [dbSettings, setDbSettings] = useState({
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
    supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    showKey: false,
    testingConnection: false,
    connectionStatus: null as any
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const fetchedUsers = await authService.fetchUsers()
    setUsers(fetchedUsers.length ? fetchedUsers : authService.getUsers())
    setPermissions(authService.getPermissions())

    try {
      const billboardData = await loadBillboardsFromExcel()
      setBillboards(billboardData)
      const clientsData = clientService.getClientsFromBillboards(billboardData)
      setClients(clientsData)
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error)
    }
  }

  const resetForms = () => {
    setNewUser({
      username: '',
      email: '',
      role: 'user',
      permissions: [],
      assignedClient: '',
      pricingCategory: 'individuals',
      password: '',
      isActive: true
    })
    setPasswordForm({
      newPassword: '',
      confirmPassword: '',
      showPassword: false
    })
    setError('')
    setSuccess('')
  }

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.email || !newUser.password) {
      setError('يرجى ملء جميع الحقول المطلوبة')
      return
    }

    if (newUser.password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      return
    }

    setLoading(true)
    const result = await authService.addUser({
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      permissions: newUser.role === 'admin' ? permissions : newUser.permissions,
      assignedClient: newUser.assignedClient || undefined,
      pricingCategory: newUser.pricingCategory,
      isActive: newUser.isActive
    }, newUser.password)

    if (result.success) {
      setSuccess('تم إضافة المستخدم بنجاح')
      setShowAddUser(false)
      resetForms()
      loadData()
    } else {
      setError(result.error || 'حدث خطأ في إضافة المستخدم')
    }
    setLoading(false)
  }

  const handleUpdateUser = async () => {
    if (!editingUser) return

    setLoading(true)
    const result = await authService.updateUser(editingUser)

    if (result.success) {
      setSuccess('تم تحديث المستخدم بنجاح')
      setEditingUser(null)
      loadData()
    } else {
      setError(result.error || 'حدث خطأ في تحديث المستخدم')
    }
    setLoading(false)
  }

  const handleUpdatePassword = async (username: string) => {
    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      setError('يرجى ملء جميع حقول كلمة المرور')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('كلمات المرور غير متطابقة')
      return
    }

    if (passwordForm.newPassword.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      return
    }

    setLoading(true)
    const result = await authService.updatePassword(username, passwordForm.newPassword)

    if (result.success) {
      setSuccess('تم تحديث كلمة المرور بنجاح')
      setShowPasswordDialog(null)
      resetForms()
    } else {
      setError(result.error || 'حدث خطأ في تحديث كلمة المرور')
    }
    setLoading(false)
  }

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return

    setLoading(true)
    const result = await authService.deleteUser(userId)

    if (result.success) {
      setSuccess('تم حذف المستخدم بنجاح')
      loadData()
    } else {
      setError(result.error || 'حدث خطأ في حذف المستخدم')
    }
    setLoading(false)
  }

  const togglePermission = (permission: Permission) => {
    if (showAddUser) {
      setNewUser(prev => ({
        ...prev,
        permissions: prev.permissions.some(p => p.id === permission.id)
          ? prev.permissions.filter(p => p.id !== permission.id)
          : [...prev.permissions, permission]
      }))
    } else if (editingUser) {
      setEditingUser(prev => prev ? ({
        ...prev,
        permissions: prev.permissions.some(p => p.id === permission.id)
          ? prev.permissions.filter(p => p.id !== permission.id)
          : [...prev.permissions, permission]
      }) : null)
    }
  }

  // حفظ إعدا��ات قاعدة البيانات
  const handleSaveDbSettings = async () => {
    setLoading(true)
    try {
      if (!dbSettings.supabaseUrl || !dbSettings.supabaseKey) {
        setError('يرجى ملء جميع حقول قاعدة البيانات')
        setLoading(false)
        return
      }

      // محاولة اختبار الاتصال أولاً
      const testResult = await testDatabaseConnection()
      if (!testResult.success) {
        setError(`فشل في الاتصال بقاعدة البيانات: ${testResult.error}`)
        setLoading(false)
        return
      }

      // إعداد متغيرات البيئة باستخدام window.parent.postMessage
      // للتواصل مع DevServerControl
      const envUpdates = [
        { key: 'VITE_SUPABASE_URL', value: dbSettings.supabaseUrl },
        { key: 'VITE_SUPABASE_ANON_KEY', value: dbSettings.supabaseKey }
      ]

      for (const envVar of envUpdates) {
        try {
          // محاولة استخدام window.parent للوصول لـ DevServerControl
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({
              type: 'SET_ENV_VARIABLE',
              key: envVar.key,
              value: envVar.value
            }, '*')
          }
        } catch (e) {
          console.warn('فشل في تحديث متغير البيئة عبر postMessage:', e)
        }
      }

      // حفظ في localStorage كنسخة احتياطية
      localStorage.setItem('supabase_url', dbSettings.supabaseUrl)
      localStorage.setItem('supabase_key', dbSettings.supabaseKey)

      setSuccess('تم حفظ إعدادات قاعدة البيانات بنجاح! قد تحتاج إلى إعادة تحميل الصفحة لتفعيل التغييرات.')

      // محاولة إعادة تحميل الصفحة بعد ثانيتين
      setTimeout(() => {
        if (window.confirm('هل تريد إعادة تحميل الصفحة الآن لتفعيل التغييرات؟')) {
          window.location.reload()
        }
      }, 2000)

    } catch (error: any) {
      setError(`خطأ في حفظ الإعدادات: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // اختبار الاتصال بقاعدة البيانات
  const testDatabaseConnection = async () => {
    setDbSettings(prev => ({ ...prev, testingConnection: true, connectionStatus: null }))

    try {
      // محاولة إنشاء عميل Supabase مؤقت للاختبار
      const { createClient } = await import('@supabase/supabase-js')
      const tempClient = createClient(dbSettings.supabaseUrl, dbSettings.supabaseKey)

      // اختبار بسيط للاتصال
      const { error } = await tempClient
        .from('pricing_ar')
        .select('count', { count: 'exact', head: true })
        .limit(1)

      if (error && !error.message.includes('relation "pricing_ar" does not exist')) {
        throw new Error(error.message)
      }

      setDbSettings(prev => ({
        ...prev,
        testingConnection: false,
        connectionStatus: { success: true, message: 'الاتصال بقاعدة البيانات ناجح' }
      }))

      return { success: true }

    } catch (error: any) {
      setDbSettings(prev => ({
        ...prev,
        testingConnection: false,
        connectionStatus: { success: false, error: error.message }
      }))

      return { success: false, error: error.message }
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* رأس النافذة */}
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-6 text-black">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black">إعدادات النظام</h1>
                <p className="text-sm opacity-80">إدارة المستخدمين والصلاحيات</p>
              </div>
            </div>
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
              className="bg-white/20 border-white/30 text-black hover:bg-white/30"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* إعدادات قاعدة البيانات */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
              <Database className="w-6 h-6 text-blue-600" />
              إعدادات قاعدة البيانات (Supabase)
            </h2>

            <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* إعدادات الاتصال */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      رابط مشروع Supabase
                    </label>
                    <Input
                      type="url"
                      value={dbSettings.supabaseUrl}
                      onChange={(e) => setDbSettings(prev => ({ ...prev, supabaseUrl: e.target.value }))}
                      placeholder="https://your-project.supabase.co"
                      className="bg-white border-blue-300 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      يمكنك العثور على هذا الرابط في لوحة تحكم Supabase
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      مفتاح API (anon key)
                    </label>
                    <div className="relative">
                      <Input
                        type={dbSettings.showKey ? 'text' : 'password'}
                        value={dbSettings.supabaseKey}
                        onChange={(e) => setDbSettings(prev => ({ ...prev, supabaseKey: e.target.value }))}
                        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                        className="bg-white border-blue-300 focus:border-blue-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setDbSettings(prev => ({ ...prev, showKey: !prev.showKey }))}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {dbSettings.showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      المفتاح العام (anon key) من إعدادات API في Supabase
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={testDatabaseConnection}
                      disabled={dbSettings.testingConnection || !dbSettings.supabaseUrl || !dbSettings.supabaseKey}
                      variant="outline"
                      className="text-blue-600 border-blue-300 hover:bg-blue-50"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${dbSettings.testingConnection ? 'animate-spin' : ''}`} />
                      اختبار الاتصال
                    </Button>

                    <Button
                      onClick={handleSaveDbSettings}
                      disabled={loading || !dbSettings.supabaseUrl || !dbSettings.supabaseKey}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      حفظ الإعدادات
                    </Button>
                  </div>
                </div>

                {/* حالة الاتصال */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-gray-700 mb-3">حالة قاعدة البيانات الحالية</h4>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                        <span className="text-sm font-medium">رابط المشروع:</span>
                        <div className="flex items-center gap-2">
                          {import.meta.env.VITE_SUPABASE_URL ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="text-xs text-green-600">متصل</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                              <span className="text-xs text-red-600">غير محدد</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                        <span className="text-sm font-medium">مفتاح API:</span>
                        <div className="flex items-center gap-2">
                          {import.meta.env.VITE_SUPABASE_ANON_KEY ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="text-xs text-green-600">متوفر</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                              <span className="text-xs text-red-600">غير محدد</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* نتيجة اختبار الاتصال */}
                      {dbSettings.connectionStatus && (
                        <div className={`p-3 rounded-lg border ${
                          dbSettings.connectionStatus.success
                            ? 'bg-green-50 border-green-200'
                            : 'bg-red-50 border-red-200'
                        }`}>
                          <div className="flex items-center gap-2 mb-1">
                            {dbSettings.connectionStatus.success ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-red-600" />
                            )}
                            <span className={`text-sm font-medium ${
                              dbSettings.connectionStatus.success
                                ? 'text-green-800'
                                : 'text-red-800'
                            }`}>
                              {dbSettings.connectionStatus.success ? 'نجح الاختبار' : 'فشل الاختبار'}
                            </span>
                          </div>
                          <p className={`text-xs ${
                            dbSettings.connectionStatus.success
                              ? 'text-green-700'
                              : 'text-red-700'
                          }`}>
                            {dbSettings.connectionStatus.message || dbSettings.connectionStatus.error}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* إرشادات */}
                  <div className="bg-white p-4 rounded-lg border border-blue-200">
                    <h5 className="font-bold text-blue-800 mb-2">كيفية الحصول على البيانات:</h5>
                    <ol className="text-xs text-blue-700 space-y-1">
                      <li>1. اذهب إلى <a href="https://supabase.com" target="_blank" className="underline">supabase.com</a></li>
                      <li>2. ادخل إلى مشروعك أو أنشئ مشروع جديد</li>
                      <li>3. من الشريط الجانبي اختر "Settings" ثم "API"</li>
                      <li>4. انسخ "Project URL" و "anon public" key</li>
                      <li>5. الصقهما في الحقول أعلاه واضغط "حفظ الإعدادات"</li>
                    </ol>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* رسائل النجاح والخطأ */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md mb-6">
              <p className="text-red-700 font-semibold">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-md mb-6">
              <p className="text-green-700 font-semibold">{success}</p>
            </div>
          )}

          {/* إضافة مستخدم جديد */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-6 h-6 text-yellow-600" />
                إدارة المستخدمين
              </h2>
              <Button
                onClick={() => setShowAddUser(true)}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                إضافة مستخدم جديد
              </Button>
            </div>

            {/* قائمة المستخدمين */}
            <div className="grid gap-4">
              {users.map((user) => (
                <Card key={user.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-yellow-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg">{user.username}</h3>
                          <Badge 
                            variant={user.role === 'admin' ? 'default' : 'secondary'}
                            className={user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}
                          >
                            {user.role === 'admin' ? 'مدير' : 'مستخدم'}
                          </Badge>
                          <Badge 
                            variant={user.isActive ? 'default' : 'secondary'}
                            className={user.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                          >
                            {user.isActive ? 'نشط' : 'معطل'}
                          </Badge>
                        </div>
                        <p className="text-gray-600">{user.email}</p>
                        <p className="text-sm text-gray-500">
                          الصلاحيات: {user.permissions.map(p => p.description).join(', ') || 'لا توجد ��لاحيات'}
                        </p>
                        {user.assignedClient && (
                          <p className="text-sm text-blue-600 font-semibold">
                            الزبون المخصص: {user.assignedClient}
                          </p>
                        )}
                        {user.lastLogin && (
                          <p className="text-xs text-gray-400">
                            آخر دخول: {formatGregorianDate(user.lastLogin)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => setEditingUser(user)}
                        variant="outline"
                        size="sm"
                        className="text-blue-600 border-blue-300 hover:bg-blue-50"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => setShowPasswordDialog(user.username)}
                        variant="outline"
                        size="sm"
                        className="text-orange-600 border-orange-300 hover:bg-orange-50"
                      >
                        <Key className="w-4 h-4" />
                      </Button>
                      {user.username !== 'admin' && (
                        <Button
                          onClick={() => handleDeleteUser(user.id)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                          disabled={loading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* نافذة إضافة مستخدم */}
        {showAddUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
            <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white">
              <div className="p-6 bg-white">
                <h3 className="text-xl font-bold mb-4 text-gray-900">إضافة مستخدم جديد</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      اسم المستخدم
                    </label>
                    <Input
                      value={newUser.username}
                      onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="أدخل اسم المستخدم"
                      className="bg-white border border-gray-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      البريد الإلكتروني
                    </label>
                    <Input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="أدخل البريد الإلكتروني"
                      className="bg-white border border-gray-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      كلمة المرور
                    </label>
                    <Input
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="أدخل كلمة المرور"
                      className="bg-white border border-gray-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      الدور
                    </label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value as 'admin' | 'user' }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
                    >
                      <option value="user">مستخدم</option>
                      <option value="admin">مدير</option>
                    </select>
                  </div>

                  {/* اختيار نوع الزبون لعرض الأسعار */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      نوع الزبون الذي ستظهر أسعاره للمستخدم
                    </label>
                    <select
                      value={newUser.pricingCategory}
                      onChange={(e) => setNewUser(prev => ({ ...prev, pricingCategory: e.target.value as 'companies' | 'individuals' | 'marketers' }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
                    >
                      <option value="individuals">عادي</option>
                      <option value="marketers">مسوق</option>
                      <option value="companies">شركات</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      سيعرض النظام الأسعار الخاصة بنوع الزبون المحدد لهذا المستخدم.
                    </p>
                  </div>

                  {newUser.role !== 'admin' && (
                    <>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          الصلاحيات
                        </label>
                        <div className="space-y-2">
                          {permissions.map((permission) => (
                            <label key={permission.id} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={newUser.permissions.some(p => p.id === permission.id)}
                                onChange={() => togglePermission(permission)}
                              />
                              <span className="text-sm">{permission.description}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* اختيار الزبون المخصص */}
                      {newUser.permissions.some(p => p.name === 'view_specific_client') && (
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">
                            الزبون المخصص
                          </label>
                          <select
                            value={newUser.assignedClient}
                            onChange={(e) => setNewUser(prev => ({ ...prev, assignedClient: e.target.value }))}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
                          >
                            <option value="">اختر زبون...</option>
                            {clients.map((client) => (
                              <option key={client.name} value={client.name}>
                                {client.name} ({client.contractsCount} عقد)
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-1">
                            هذا المستخدم سيرى العقود الخاصة بالزبون المحدد + جميع اللوحات المتاحة
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="flex gap-2 mt-6">
                  <Button
                    onClick={handleAddUser}
                    disabled={loading}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    حفظ
                  </Button>
                  <Button
                    onClick={() => {
                      setShowAddUser(false)
                      resetForms()
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* نافذة تعديل مستخدم */}
        {editingUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
            <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-xl font-bold mb-4">تعديل المستخدم</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      اسم المستخدم
                    </label>
                    <Input
                      value={editingUser.username}
                      onChange={(e) => setEditingUser(prev => prev ? ({ ...prev, username: e.target.value }) : null)}
                      disabled={editingUser.username === 'admin'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      البريد الإلكتروني
                    </label>
                    <Input
                      type="email"
                      value={editingUser.email}
                      onChange={(e) => setEditingUser(prev => prev ? ({ ...prev, email: e.target.value }) : null)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      الدور
                    </label>
                    <select
                      value={editingUser.role}
                      onChange={(e) => setEditingUser(prev => prev ? ({ ...prev, role: e.target.value as 'admin' | 'user' }) : null)}
                      disabled={editingUser.username === 'admin'}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="user">مستخدم</option>
                      <option value="admin">مدير</option>
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editingUser.isActive}
                        onChange={(e) => setEditingUser(prev => prev ? ({ ...prev, isActive: e.target.checked }) : null)}
                        disabled={editingUser.username === 'admin'}
                      />
                      <span className="text-sm font-bold">المستخدم نشط</span>
                    </label>
                  </div>

                  {editingUser.role !== 'admin' && (
                    <>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                          الصلاحيات
                        </label>
                        <div className="space-y-2">
                          {permissions.map((permission) => (
                            <label key={permission.id} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={editingUser.permissions.some(p => p.id === permission.id)}
                                onChange={() => togglePermission(permission)}
                              />
                              <span className="text-sm">{permission.description}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* اختيار الزبون المخصص */}
                      {editingUser.permissions.some(p => p.name === 'view_specific_client') && (
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">
                            الزبون المخصص
                          </label>
                          <select
                            value={editingUser.assignedClient || ''}
                            onChange={(e) => setEditingUser(prev => prev ? ({ ...prev, assignedClient: e.target.value || undefined }) : null)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                          >
                            <option value="">اختر زبون...</option>
                            {clients.map((client) => (
                              <option key={client.name} value={client.name}>
                                {client.name} ({client.contractsCount} عقد)
                              </option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-500 mt-1">
                            هذا المستخدم يرى العقود الخاصة بالزبون المحدد + جميع اللوحات المتاحة
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="flex gap-2 mt-6">
                  <Button
                    onClick={handleUpdateUser}
                    disabled={loading}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    حفظ التغييرات
                  </Button>
                  <Button
                    onClick={() => {
                      setEditingUser(null)
                      resetForms()
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* نافذة تغيير كلمة المرور */}
        {showPasswordDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
            <Card className="w-full max-w-md">
              <div className="p-6">
                <h3 className="text-xl font-bold mb-4">تغيير كلمة المرور</h3>
                <p className="text-gray-600 mb-4">المستخدم: {showPasswordDialog}</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      كلمة المرور الجديدة
                    </label>
                    <div className="relative">
                      <Input
                        type={passwordForm.showPassword ? 'text' : 'password'}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="أدخل كلمة المرور الجديدة"
                      />
                      <button
                        type="button"
                        onClick={() => setPasswordForm(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2"
                      >
                        {passwordForm.showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      تأكيد كلمة المرور
                    </label>
                    <Input
                      type={passwordForm.showPassword ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="أعد إدخال كلمة المرور"
                    />
                  </div>
                </div>

                <div className="flex gap-2 mt-6">
                  <Button
                    onClick={() => handleUpdatePassword(showPasswordDialog)}
                    disabled={loading}
                    className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    تحديث كلمة المرور
                  </Button>
                  <Button
                    onClick={() => {
                      setShowPasswordDialog(null)
                      resetForms()
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default SystemSettings
