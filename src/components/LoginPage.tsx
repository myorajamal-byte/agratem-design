import React, { useState } from 'react'
import { Eye, EyeOff, LogIn, Lock, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'

interface LoginPageProps {
  onLoginSuccess?: () => void
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username.trim() || !password.trim()) {
      setError('يرجى إدخال اسم المستخدم وكلمة المرور')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const success = await login(username.trim(), password)
      if (success) {
        onLoginSuccess?.()
      } else {
        setError('اسم المستخدم أو كلمة المرور غير صحيحة')
      }
    } catch (error) {
      setError('حدث خطأ في تسجيل الدخول. يرجى المحاولة مرة أخرى')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 flex items-center justify-center p-4">
      {/* الشعار في الخلفية */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none z-0">
        <img src="/logo-symbol.svg" alt="رمز الشركة" className="w-[800px] h-[800px] object-contain" />
      </div>

      <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl border-2 border-yellow-200 relative z-10">
        <div className="p-8">
          {/* رأس الصفحة */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-full flex items-center justify-center shadow-lg ring-4 ring-yellow-400/30">
                <img src="/logo-symbol.svg" alt="رمز الشركة" className="w-12 h-12 object-contain" />
              </div>
            </div>
            <h1 className="text-3xl font-black text-gray-900 mb-2">تسجيل الدخول</h1>
            <h2 className="text-xl font-bold text-yellow-600 mb-1">الفارس الذهبي</h2>
            <p className="text-gray-600 font-semibold">للدعاية والإعلان</p>
          </div>

          {/* نموذج تسجيل الدخول */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* حقل اسم المستخدم */}
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-bold text-gray-700">
                اسم المستخدم
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="أدخل اسم المستخدم"
                  className="pr-10 border-gray-300 focus:border-yellow-500 focus:ring-yellow-500"
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* حقل كلمة المرور */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-bold text-gray-700">
                كلمة المرور
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور"
                  className="pr-10 pl-10 border-gray-300 focus:border-yellow-500 focus:ring-yellow-500"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 left-0 pl-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* رسالة الخطأ */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                <div className="flex">
                  <div className="mr-3">
                    <p className="text-sm text-red-700 font-semibold">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* زر تسجيل الدخول */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-black py-3 px-4 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
                  جاري تسجيل الدخول...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <LogIn className="w-5 h-5 mr-2" />
                  تسجيل الدخول
                </div>
              )}
            </Button>
          </form>

          {/* معلومات تسجيل الدخول للتجربة */}
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-sm font-bold text-yellow-800 mb-2">بيانات تسجيل الدخول:</h3>
            <div className="text-sm text-yellow-700 space-y-1">
              <p><span className="font-semibold">اسم المستخدم:</span> admin</p>
              <p><span className="font-semibold">كلمة المرور:</span> aukg-123</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default LoginPage
