import React, { useState, useEffect } from 'react'
import {
  DollarSign,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Edit3,
  X,
  Calculator,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Database,
  Layers,
  Settings,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { pricingService } from '@/services/pricingService'
import { newPricingService } from '@/services/newPricingService'
import { PriceList, BillboardSize, PriceListType, CustomerType } from '@/types'
import ABPricingManagement from './ABPricingManagement'
import ModernPricingManagement from './ModernPricingManagement'
import EnhancedArabicPricingManagement from './EnhancedArabicPricingManagement'
import DynamicPricingManagement from './DynamicPricingManagement'

interface EnhancedPricingManagementProps {
  onClose: () => void
}

const EnhancedPricingManagement: React.FC<EnhancedPricingManagementProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'traditional' | 'ab' | 'modern' | 'arabic' | 'dynamic'>('overview')
  const [pricing, setPricing] = useState<PriceList | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [syncStatus, setSyncStatus] = useState<{
    needsSync: boolean
    missingZones: string[]
    isChecking: boolean
  }>({
    needsSync: false,
    missingZones: [],
    isChecking: false
  })

  useEffect(() => {
    loadPricing()
    checkSyncStatus()
  }, [])

  const loadPricing = () => {
    const currentPricing = pricingService.getPricing()
    setPricing(currentPricing)
  }

  const checkSyncStatus = async () => {
    setSyncStatus(prev => ({ ...prev, isChecking: true }))
    try {
      const syncCheck = await newPricingService.checkNeedForSync()
      setSyncStatus({
        needsSync: syncCheck.missingZones.length > 0,
        missingZones: syncCheck.missingZones,
        isChecking: false
      })
    } catch (error) {
      console.error('خطأ في فحص حالة المزامنة:', error)
      setSyncStatus(prev => ({ ...prev, isChecking: false }))
    }
  }

  const handleSync = async () => {
    setLoading(true)
    try {
      const result = await newPricingService.syncWithExcelData()
      if (result.success) {
        setSuccess(`تم إنشاء ${result.newZonesCreated.length} منطقة سعرية جديدة`)
        loadPricing()
        checkSyncStatus()
      } else {
        setError(`فشل في المزامنة: ${result.errors.join(', ')}`)
      }
    } catch (error: any) {
      setError(`خطأ في المزامنة: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const showNotification = (type: 'success' | 'error', message: string) => {
    if (type === 'success') {
      setSuccess(message)
      setError('')
      setTimeout(() => setSuccess(''), 3000)
    } else {
      setError(message)
      setSuccess('')
      setTimeout(() => setError(''), 5000)
    }
  }

  const tabs = [
    { id: 'overview', label: 'نظرة ع��مة', icon: Calculator, color: 'indigo' },
    { id: 'arabic', label: 'الأسعار العربية (Supabase)', icon: Database, color: 'purple' },
    { id: 'ab', label: 'قوائم A & B', icon: Layers, color: 'blue' },
    { id: 'modern', label: 'النظام الحديث', icon: TrendingUp, color: 'green' },
    { id: 'dynamic', label: 'النظام الديناميكي', icon: Settings, color: 'orange' }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'arabic':
        return <EnhancedArabicPricingManagement onClose={() => setActiveTab('overview')} />
      case 'ab':
        return <ABPricingManagement onClose={() => setActiveTab('overview')} />
      case 'modern':
        return <ModernPricingManagement onClose={() => setActiveTab('overview')} />
      case 'dynamic':
        return <DynamicPricingManagement onClose={() => setActiveTab('overview')} />
      default:
        return (
          <div className="space-y-6">
            {/* Sync Status */}
            {syncStatus.needsSync && (
              <Card className="p-4 bg-orange-50 border-2 border-orange-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <RefreshCw className="w-6 h-6 text-orange-600" />
                    <div>
                      <h3 className="font-bold text-orange-900">مناطق جديدة مكتشفة</h3>
                      <p className="text-sm text-orange-700">
                        تم العثور على {syncStatus.missingZones.length} منطقة جديدة في ملف الإكسل
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleSync}
                    disabled={loading}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    مزامنة الآن
                  </Button>
                </div>
                {syncStatus.missingZones.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {syncStatus.missingZones.map(zone => (
                      <Badge key={zone} variant="outline" className="bg-orange-100 text-orange-800">
                        {zone}
                      </Badge>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* Notifications */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg">
                <p className="text-red-700 font-semibold">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-lg">
                <p className="text-green-700 font-semibold">{success}</p>
              </div>
            )}

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {tabs.slice(1).map((tab) => {
                const Icon = tab.icon
                return (
                  <Card
                    key={tab.id}
                    className={`p-6 cursor-pointer transition-all hover:shadow-lg border-2 border-${tab.color}-200 bg-${tab.color}-50 hover:bg-${tab.color}-100`}
                    onClick={() => setActiveTab(tab.id as any)}
                  >
                    <div className="text-center">
                      <div className={`w-16 h-16 bg-${tab.color}-600 rounded-full flex items-center justify-center mx-auto mb-4`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className={`text-lg font-bold text-${tab.color}-900 mb-2`}>
                        {tab.label}
                      </h3>
                      <p className={`text-sm text-${tab.color}-700`}>
                        {tab.id === 'arabic' && 'إدارة جدول pricing_ar من Supabase'}
                        {tab.id === 'ab' && 'نظام القوائم المزدوجة A & B'}
                        {tab.id === 'modern' && 'النظام الحديث المتطور'}
                        {tab.id === 'dynamic' && 'التسعير الديناميكي حسب البلدية'}
                      </p>
                    </div>
                  </Card>
                )
              })}
            </div>

            {/* System Statistics */}
            {pricing && (
              <Card className="p-6 bg-gradient-to-r from-gray-50 to-slate-50">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Calculator className="w-6 h-6 text-gray-600" />
                  إحصائيات النظام
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-white rounded-lg border">
                    <div className="text-2xl font-bold text-blue-600">
                      {Object.keys(pricing.zones).length}
                    </div>
                    <div className="text-sm text-blue-700">مناطق سعرية</div>
                  </div>
                  
                  <div className="text-center p-4 bg-white rounded-lg border">
                    <div className="text-2xl font-bold text-green-600">
                      {pricing.packages?.length || 0}
                    </div>
                    <div className="text-sm text-green-700">باقات زمنية</div>
                  </div>
                  
                  <div className="text-center p-4 bg-white rounded-lg border">
                    <div className="text-2xl font-bold text-purple-600">
                      {newPricingService.sizes.length}
                    </div>
                    <div className="text-sm text-purple-700">مقاسات متاحة</div>
                  </div>
                  
                  <div className="text-center p-4 bg-white rounded-lg border">
                    <div className="text-lg font-bold text-orange-600">
                      {pricing.currency}
                    </div>
                    <div className="text-sm text-orange-700">العملة</div>
                  </div>
                </div>
              </Card>
            )}

            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">إجراءات سريعة</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={() => setActiveTab('arabic')}
                  className="bg-purple-600 hover:bg-purple-700 text-white p-4 h-auto"
                >
                  <div className="text-center">
                    <Database className="w-8 h-8 mx-auto mb-2" />
                    <div className="font-bold">إدارة الأسعار العربية</div>
                    <div className="text-sm opacity-90">جدول pricing_ar من Supabase</div>
                  </div>
                </Button>
                
                <Button
                  onClick={() => setActiveTab('ab')}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-4 h-auto"
                >
                  <div className="text-center">
                    <Layers className="w-8 h-8 mx-auto mb-2" />
                    <div className="font-bold">قوائم الأسعار A & B</div>
                    <div className="text-sm opacity-90">النظام المزدوج للأسعار</div>
                  </div>
                </Button>
              </div>
            </Card>
          </div>
        )
    }
  }

  if (!pricing) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8">
          <div className="text-center">جاري تحميل البيانات...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-6 text-black">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black">النظام الشامل لإدارة الأسعار</h1>
                <p className="text-sm opacity-80">إدارة متقدمة لجميع أنواع الأسعار والقوائم</p>
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

        {/* Tabs */}
        {activeTab === 'overview' && (
          <div className="border-b border-gray-200 bg-gray-50">
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold whitespace-nowrap transition-colors ${
                      activeTab === tab.id
                        ? `border-b-2 border-${tab.color}-500 text-${tab.color}-600 bg-white`
                        : `text-gray-600 hover:text-${tab.color}-600 hover:bg-white/50`
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-180px)]">
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}

export default EnhancedPricingManagement
