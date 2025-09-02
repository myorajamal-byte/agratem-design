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
  Settings
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/contexts/AuthContext'
import { authService } from '@/services/authService'
import { clientService } from '@/services/clientService'
import { loadBillboardsFromExcel } from '@/services/billboardService'
import { customerCategoryService } from '@/services/customerCategoryService'
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
  const [customerCategories, setCustomerCategories] = useState<{ id: 'companies' | 'individuals' | 'marketers'; label: string }[]>([])
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
      const cats = await customerCategoryService.getCategories()
      setCustomerCategories(cats)
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

                  {/* اختيار فئة الأسعار */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                      فئة الأسعار التي ستظهر للمستخدم
                    </label>
                    <Select
                      value={newUser.pricingCategory}
                      onValueChange={(val) => setNewUser(prev => ({ ...prev, pricingCategory: val as any }))}
                      searchable
                    >
                      <SelectTrigger className="h-11" />
                      <SelectContent>
                        {customerCategories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                        ))}
                        <div className="py-1 border-t border-yellow-100 my-1" />
                        <SelectItem value="A">قائمة أسعار A</SelectItem>
                        <SelectItem value="B">قائمة أسعار B</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      تحدد هذه الفئة الأسعار التي ستظهر للمستخدم عند عرض اللوحات الإعلانية
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
                          <Select value={newUser.assignedClient} onValueChange={(val)=> setNewUser(prev => ({ ...prev, assignedClient: val }))} searchable>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="اختر زبون..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">الكل</SelectItem>
                              {clients.map((client) => (
                                <SelectItem key={client.name} value={client.name}>
                                  {client.name} ({client.contractsCount} لوحة)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-gray-500 mt-1">
                            هذا المستخدم سي��ى اللوحات الخاصة بالزبون المحدد + جميع اللوحات المتاحة
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
            <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white shadow-2xl border border-gray-200">
              <div className="p-6 bg-white">
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
                      className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white"
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

                      {/* اختيار فئة الأسعار من Supabase */}
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">
                          فئة الأسعار التي ستظهر للمستخدم
                        </label>
                        <Select
                          value={editingUser.pricingCategory || ''}
                          onValueChange={(val) => setEditingUser(prev => prev ? ({ ...prev, pricingCategory: val as any }) : null)}
                          searchable
                        >
                          <SelectTrigger className="h-11" />
                          <SelectContent>
                            {customerCategories.map(cat => (
                              <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                            ))}
                            <div className="py-1 border-t border-yellow-100 my-1" />
                            <SelectItem value="A">قائمة أسعار A</SelectItem>
                            <SelectItem value="B">قائمة أسعار B</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* اختيار الزبون المخصص */}
                      {editingUser.permissions.some(p => p.name === 'view_specific_client') && (
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">
                            الزبون المخصص
                          </label>
                          <Select value={editingUser.assignedClient || ''} onValueChange={(val)=> setEditingUser(prev => prev ? ({ ...prev, assignedClient: val || undefined }) : null)} searchable>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="اختر زبون..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">الكل</SelectItem>
                              {clients.map((client) => (
                                <SelectItem key={client.name} value={client.name}>
                                  {client.name} ({client.contractsCount} لوحة)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-gray-500 mt-1">
                            هذا المستخدم يرى اللوحات الخاصة بالزبون المحدد + جميع اللوحات المتاحة
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
            <Card className="w-full max-w-md bg-white shadow-2xl border border-gray-200">
              <div className="p-6 bg-white">
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
