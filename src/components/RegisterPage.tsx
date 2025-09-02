import React, { useState } from 'react'
import { Eye, EyeOff, UserPlus, Mail, Lock, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { authService } from '@/services/authService'
import type { Permission, User } from '@/types'

const DEFAULT_PERMISSION: Permission = { id: '1', name: 'view_billboards', description: 'عرض اللوحات الإعلانية' }

const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!username.trim() || !email.trim() || !password.trim() || !confirm.trim()) {
      setError('يرجى تعبئة جميع الحقول')
      return
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError('يرجى إدخال بريد إلكتروني صحيح')
      return
    }
    if (password.length < 6) {
      setError('كلمة المرور يجب ألا تقل عن 6 أحرف')
      return
    }
    if (password !== confirm) {
      setError('كلمتا المرور غير متطابقتين')
      return
    }

    setIsLoading(true)
    try {
      const newUser: Omit<User, 'id' | 'createdAt'> = {
        username: username.trim(),
        email: email.trim(),
        role: 'user',
        permissions: [DEFAULT_PERMISSION],
        isActive: true,
        assignedClient: undefined,
        pricingCategory: undefined,
        lastLogin: undefined,
      }
      const result = await authService.addUser(newUser, password)
      if (result.success) {
        setSuccess('تم إنشاء الحساب بنجاح! يمكنك تسجيل الدخول الآن')
        setTimeout(() => {
          const url = new URL(window.location.href)
          url.searchParams.delete('register')
          window.location.href = url.toString()
        }, 1200)
      } else {
        setError(result.error || 'فشل إنشاء الحساب')
      }
    } catch (e: any) {
      setError(e?.message || 'حدث خطأ أثناء إنشاء الحساب')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 flex items-center justify-center p-4">
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none z-0">
        <img src="/logo-symbol.svg" alt="رمز الشركة" className="w-[800px] h-[800px] object-contain" />
      </div>

      <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl border-2 border-yellow-200 relative z-10">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-full flex items-center justify-center shadow-lg ring-4 ring-yellow-400/30">
                <img src="/logo-symbol.svg" alt="رمز الشركة" className="w-12 h-12 object-contain" />
              </div>
            </div>
            <h1 className="text-3xl font-black text-gray-900 mb-2">إنشاء حساب</h1>
            <p className="text-gray-600 font-semibold">سيتم منحك صلاحية عرض اللوحات المتاحة فقط</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">اسم المستخدم</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <UserPlus className="h-5 w-5 text-gray-400" />
                </div>
                <Input value={username} onChange={(e)=>setUsername(e.target.value)} placeholder="أدخل اسم المستخدم" className="pr-10" disabled={isLoading} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">البريد الإلكتروني</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <Input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="name@example.com" type="email" className="pr-10" disabled={isLoading} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">كلمة المرور</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <Input value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="••••••" type={showPassword? 'text':'password'} className="pr-10 pl-10" disabled={isLoading} />
                <button type="button" className="absolute inset-y-0 left-0 pl-3 flex items-center" onClick={()=>setShowPassword(!showPassword)} disabled={isLoading}>
                  {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">تأكيد كلمة المرور</label>
              <Input value={confirm} onChange={(e)=>setConfirm(e.target.value)} placeholder="تأكيد كلمة المرور" type={showPassword? 'text':'password'} disabled={isLoading} />
            </div>

            {error && (<div className="bg-red-50 border-l-4 border-red-400 p-3 rounded-md text-sm text-red-700 font-semibold">{error}</div>)}
            {success && (<div className="bg-green-50 border-l-4 border-green-400 p-3 rounded-md text-sm text-green-700 font-semibold">{success}</div>)}

            <Button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-black py-3 px-4 rounded-lg shadow-lg">
              {isLoading ? 'جاري إنشاء الحساب...' : '��نشاء حساب'}
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-700">
            <span>لديك حساب؟</span>
            <button className="text-yellow-700 font-bold hover:underline inline-flex items-center gap-1" onClick={()=>{ const url=new URL(window.location.href); url.searchParams.delete('register'); window.location.href=url.toString(); }}>
              تسجيل الدخول <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default RegisterPage
