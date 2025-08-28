import React, { useState, useEffect } from 'react'
import { dynamicPricingService } from '@/services/dynamicPricingService'
import { pricingService } from '@/services/pricingService'
import { municipalityService, Municipality } from '@/services/municipalityService'

interface DynamicPricingManagementProps {
  onClose: () => void
}

const DynamicPricingManagement: React.FC<DynamicPricingManagementProps> = ({ onClose }) => {
  const [isDynamicEnabled, setIsDynamicEnabled] = useState(false)
  const [municipalities, setMunicipalities] = useState<Array<Municipality & { samplePrice: number }>>([])
  const [statistics, setStatistics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddMunicipality, setShowAddMunicipality] = useState(false)
  const [newMunicipality, setNewMunicipality] = useState({
    name: '',
    multiplier: 1.0,
    region: '',
    city: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setLoading(true)
    try {
      const enabled = pricingService.isDynamicPricingEnabled()
      setIsDynamicEnabled(enabled)

      const municipalitiesData = dynamicPricingService.getMunicipalitiesWithPricing()
      setMunicipalities(municipalitiesData)

      if (enabled) {
        const stats = dynamicPricingService.getPricingStatistics()
        setStatistics(stats)
      }
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleDynamicPricing = () => {
    if (isDynamicEnabled) {
      pricingService.disableDynamicPricing()
      setIsDynamicEnabled(false)
    } else {
      pricingService.enableDynamicPricing()
      setIsDynamicEnabled(true)
      loadData()
    }
  }

  const handleAddMunicipality = () => {
    if (!newMunicipality.name.trim()) {
      alert('يرجى إدخال اسم البلدية')
      return
    }

    const result = dynamicPricingService.addMunicipalityWithPricing({
      name: newMunicipality.name.trim(),
      multiplier: newMunicipality.multiplier,
      region: newMunicipality.region.trim() || undefined,
      city: newMunicipality.city.trim() || undefined
    })

    if (result) {
      setNewMunicipality({ name: '', multiplier: 1.0, region: '', city: '' })
      setShowAddMunicipality(false)
      loadData()
      alert('تم إضافة البلدية بنجاح')
    } else {
      alert('فشل في إضافة البلدية - قد تكون موجودة مسبقاً')
    }
  }

  const handleUpdateMultiplier = (municipalityId: string, newMultiplier: number) => {
    const success = dynamicPricingService.updateMunicipalityPricing(municipalityId, {
      multiplier: newMultiplier
    })

    if (success) {
      loadData()
      alert('تم تحديث معامل البلدية بنجاح')
    } else {
      alert('فشل في تحديث معامل البلدية')
    }
  }

  const handleExportData = () => {
    try {
      dynamicPricingService.exportMunicipalitiesWithPricing()
      alert('تم تصدير البيانات بنجاح')
    } catch (error) {
      alert('فشل في تصدير البيانات')
    }
  }

  const filteredMunicipalities = municipalities.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.region && m.region.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (m.city && m.city.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="text-center">جاري التحميل...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden border-0">
        <div className="p-8 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 via-purple-600/30 to-pink-600/30"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shadow-2xl backdrop-blur-sm">
                  <TrendingUp className="w-9 h-9" />
                </div>
                <div>
                  <h2 className="text-3xl font-black mb-2 bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent">
                    النظام الديناميكي للتسعير
                  </h2>
                  <p className="text-purple-100 text-lg font-medium">
                    إدارة ذكية لأسعار البلديات والمعاملات
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all duration-200 backdrop-blur-sm shadow-lg hover:shadow-xl"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-8 overflow-y-auto max-h-[calc(95vh-180px)] bg-gradient-to-br from-slate-50 to-blue-50">
          {/* تفعيل/إلغاء تفعيل النظام */}
          <div className="mb-8 p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border border-blue-200 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-blue-900 flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Settings className="w-5 h-5 text-white" />
                  </div>
                  حالة النظام الديناميكي
                </h3>
                <p className="text-blue-700 text-sm leading-relaxed bg-white/60 px-4 py-2 rounded-lg backdrop-blur-sm">
                  نظام ذكي يقرأ المنطقة السعرية تلقائياً من بيانات اللوحة (حقل البلدية)
                </p>
              </div>
              <button
                onClick={handleToggleDynamicPricing}
                className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                  isDynamicEnabled
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
                    : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white hover:from-gray-500 hover:to-gray-600'
                }`}
              >
                {isDynamicEnabled ? '✅ مفعل' : '❌ غير مفعل'}
              </button>
            </div>
          </div>

          {isDynamicEnabled && (
            <>
              {/* الإحصائيات */}
              {statistics && (
                <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 p-6 rounded-2xl border border-emerald-200 shadow-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                      <h4 className="font-bold text-emerald-800 text-lg">إجمالي البلديات</h4>
                    </div>
                    <p className="text-4xl font-black text-emerald-700">
                      {statistics.totalMunicipalities}
                    </p>
                    <p className="text-emerald-600 text-sm mt-2">بلدية مسجلة</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 rounded-2xl border border-blue-200 shadow-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                      <h4 className="font-bold text-blue-800 text-lg">متوسط المعامل</h4>
                    </div>
                    <p className="text-4xl font-black text-blue-700">
                      {statistics.averageMultiplier}
                    </p>
                    <p className="text-blue-600 text-sm mt-2">معامل متوسط</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 p-6 rounded-2xl border border-purple-200 shadow-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-white" />
                      </div>
                      <h4 className="font-bold text-purple-800 text-lg">نطاق الأسعار</h4>
                    </div>
                    <p className="text-lg font-black text-purple-700">
                      {statistics.priceRange.min.price} - {statistics.priceRange.max.price}
                    </p>
                    <p className="text-purple-600 text-sm mt-2">دينار ليبي ({statistics.sampleSize})</p>
                  </div>
                </div>
              )}

              {/* أدوات الإدارة */}
              <div className="mb-8 flex flex-wrap gap-4">
                <div className="flex-1 min-w-64 relative">
                  <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="ابحث في البلديات والمناطق..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-6 py-4 pr-12 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-lg hover:shadow-xl transition-all font-medium text-lg"
                  />
                </div>
                <button
                  onClick={() => setShowAddMunicipality(true)}
                  className="px-6 py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-2xl hover:from-emerald-600 hover:to-green-700 transition-all duration-200 font-bold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  إضافة بلدية
                </button>
                <button
                  onClick={handleExportData}
                  className="px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 font-bold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  تصدير البيانات
                </button>
              </div>

              {/* قائمة البلديات */}
              <div className="bg-white border-0 rounded-2xl overflow-hidden shadow-2xl">
                <div className="bg-gradient-to-r from-slate-700 via-gray-700 to-zinc-700 px-6 py-4 border-b">
                  <div className="grid grid-cols-6 gap-4 font-bold text-white">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      <span>البلدية</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>المنطقة</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>المدينة</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      <span>المعامل</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      <span>سعر عينة (4x12)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      <span>الإجراءات</span>
                    </div>
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto bg-gradient-to-br from-slate-50 to-gray-50">
                  {filteredMunicipalities.map((municipality, index) => (
                    <div key={municipality.id} className={`px-6 py-4 border-b border-slate-200/60 transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50 hover:via-indigo-50 hover:to-purple-50 hover:shadow-lg ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/80'}`}>
                      <div className="grid grid-cols-6 gap-4 items-center">
                        <div className="font-bold text-gray-900">{municipality.name}</div>
                        <div className="text-gray-600 font-medium">{municipality.region || 'غير محدد'}</div>
                        <div className="text-gray-600 font-medium">{municipality.city || 'غير محدد'}</div>
                        <div>
                          <input
                            type="number"
                            step="0.1"
                            min="0.1"
                            max="10"
                            value={municipality.multiplier}
                            onChange={(e) => {
                              const newValue = parseFloat(e.target.value)
                              if (!isNaN(newValue) && newValue > 0) {
                                handleUpdateMultiplier(municipality.id, newValue)
                              }
                            }}
                            className="w-24 px-3 py-2 border-2 border-blue-200 rounded-xl text-center font-bold text-lg bg-gradient-to-br from-white to-blue-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 shadow-lg hover:shadow-xl transition-all"
                          />
                        </div>
                        <div className="font-black text-emerald-700 text-lg">
                          {municipality.samplePrice.toLocaleString()} د.ل
                        </div>
                        <div>
                          <button
                            onClick={() => {
                              if (confirm(`هل تريد حذف البلدية "${municipality.name}"؟`)) {
                                municipalityService.deleteMunicipality(municipality.id)
                                loadData()
                              }
                            }}
                            className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl hover:from-red-600 hover:to-pink-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                          >
                            حذف
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* نافذة إضافة بلدية */}
        {showAddMunicipality && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">إضافة بلدية جديدة</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    اسم البلدية *
                  </label>
                  <input
                    type="text"
                    value={newMunicipality.name}
                    onChange={(e) => setNewMunicipality(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="مثال: حي الأندلس"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    معامل الضرب *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="10"
                    value={newMunicipality.multiplier}
                    onChange={(e) => setNewMunicipality(prev => ({ 
                      ...prev, 
                      multiplier: parseFloat(e.target.value) || 1.0 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    المنطقة
                  </label>
                  <input
                    type="text"
                    value={newMunicipality.region}
                    onChange={(e) => setNewMunicipality(prev => ({ ...prev, region: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="مثال: مصراتة"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    المدينة
                  </label>
                  <input
                    type="text"
                    value={newMunicipality.city}
                    onChange={(e) => setNewMunicipality(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="مثال: مصراتة"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleAddMunicipality}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  إضافة
                </button>
                <button
                  onClick={() => {
                    setShowAddMunicipality(false)
                    setNewMunicipality({ name: '', multiplier: 1.0, region: '', city: '' })
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DynamicPricingManagement
