import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import LoginPage from './LoginPage'

interface ProtectedRouteProps {
  children: React.ReactNode
  requirePermission?: string
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requirePermission 
}) => {
  const { isAuthenticated, user, isLoading } = useAuth()

  // إظهار شاشة التحميل أثناء التحقق من المصادقة
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-full flex items-center justify-center shadow-2xl ring-4 ring-yellow-400/30 animate-pulse mb-4">
              <img src="/logo-symbol.svg" alt="رمز الشركة" className="w-16 h-16 object-contain" />
            </div>
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">جاري التحقق من المصادقة...</h2>
          <p className="text-lg font-semibold text-gray-700">يرجى الانتظار</p>
        </div>
      </div>
    )
  }

  // إذا لم يكن مسجل الدخول، إظهار صفحة تسجيل الدخول
  if (!isAuthenticated || !user) {
    return <LoginPage />
  }

  // التحقق من الصلاحية المطلوبة
  if (requirePermission && !user.permissions.some(p => p.name === requirePermission)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-4">غير مصرح لك</h2>
          <p className="text-lg text-gray-600 mb-6">
            عذراً، لا تملك الصلاحية للوصول إلى هذه الصفحة
          </p>
          <p className="text-sm text-gray-500">
            يرجى التواصل مع المدير للحصول على الصلاحيات المطلوبة
          </p>
        </div>
      </div>
    )
  }

  // إذا كان كل شيء صحيح، إظهار المحتوى
  return <>{children}</>
}

export default ProtectedRoute
