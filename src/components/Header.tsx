"use client"

/**
 * مكون رأس الصفحة - Header Component
 * يحتوي على الشعار وأزرار التنقل والإعدادات
 * يعرض معلومات المستخدم الحالي وخيارات تسجيل الخروج
 */

import { LogOut, Settings, DollarSign, Wrench, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"

interface HeaderProps {
  onOpenSettings: () => void
  onOpenPricing: () => void
  onOpenInstallationPricing: () => void
}

export default function Header({ onOpenSettings, onOpenPricing, onOpenInstallationPricing }: HeaderProps) {
  const { user, logout } = useAuth()

  return (
    <header className="bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 text-black py-6 shadow-2xl relative z-20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <img src="logo-symbol.svg" alt="رمز الشركة" className="h-16 object-contain" />
              <div className="text-right">
                <h1 className="text-3xl font-black tracking-tight leading-tight">الفــــارس الذهبــــي</h1>
                <p className="text-lg font-bold opacity-90">للدعــــــاية والإعـــلان</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* معلومات المستخدم */}
            {user && (
              <div className="text-right mr-4">
                <div className="text-sm font-bold">{user.username}</div>
                <div className="text-xs opacity-75">
                  {user.role === 'admin' ? 'مدير النظام' : 'مستخدم'}
                  {user.assignedClient && ` • ${user.assignedClient}`}
                </div>
              </div>
            )}

            {/* أزرار الإدارة للمدراء */}
            {user && (user.role === 'admin' || user.permissions?.some(p => p.name === 'admin_access')) && (
              <>
                <Button
                  onClick={onOpenPricing}
                  className="bg-gradient-to-r from-emerald-500/20 to-green-500/20 hover:from-emerald-500/30 hover:to-green-500/30 text-black border-2 border-emerald-300/50 font-bold px-6 py-3 rounded-xl shadow-lg backdrop-blur-sm"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  إدارة الأسعار العربية
                </Button>
              </>
            )}

            {/* زر إدارة المستخدمين */}
            {user && (user.role === 'admin' || user.permissions?.some(p => p.name === 'manage_users' || p.name === 'admin_access')) && (
              <Button
                onClick={onOpenSettings}
                className="bg-white/20 hover:bg-white/30 text-black border border-white/30 font-bold"
              >
                <Users className="w-4 h-4 mr-2" />
                المستخدمون
              </Button>
            )}

            {/* زر تسجيل الخروج */}
            <Button
              onClick={logout}
              className="bg-red-500 hover:bg-red-600 text-white font-bold"
            >
              <LogOut className="w-4 h-4 mr-2" />
              خروج
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}