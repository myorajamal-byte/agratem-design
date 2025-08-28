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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">
              إدارة النظام الديناميكي للتسعير
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* تفعيل/إلغاء تفعيل النظام */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-800">
                  النظام الديناميكي للتسعير
                </h3>
                <p className="text-blue-600 text-sm mt-1">
                  يقرأ المنطقة السعرية تلقائياً من بيانات اللوحة (حقل البلدية)
                </p>
              </div>
              <button
                onClick={handleToggleDynamicPricing}
                className={`px-4 py-2 rounded-lg font-medium ${
                  isDynamicEnabled
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                }`}
              >
                {isDynamicEnabled ? 'مفعل' : 'غير مفعل'}
              </button>
            </div>
          </div>

          {isDynamicEnabled && (
            <>
              {/* الإحصائيات */}
              {statistics && (
                <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-800">إجمالي البلديات</h4>
                    <p className="text-2xl font-bold text-green-600">
                      {statistics.totalMunicipalities}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800">متوسط المعامل</h4>
                    <p className="text-2xl font-bold text-blue-600">
                      {statistics.averageMultiplier}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-800">نطاق الأسعار ({statistics.sampleSize})</h4>
                    <p className="text-sm text-purple-600">
                      {statistics.priceRange.min.price} - {statistics.priceRange.max.price} د.ل
                    </p>
                  </div>
                </div>
              )}

              {/* أدوات الإدارة */}
              <div className="mb-6 flex flex-wrap gap-4">
                <input
                  type="text"
                  placeholder="البحث في البلديات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 min-w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={() => setShowAddMunicipality(true)}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  إضافة بلدية
                </button>
                <button
                  onClick={handleExportData}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  تصدير البيانات
                </button>
              </div>

              {/* قائمة البلديات */}
              <div className="bg-white border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b">
                  <div className="grid grid-cols-6 gap-4 font-semibold text-gray-700">
                    <div>البلدية</div>
                    <div>المنطقة</div>
                    <div>المدينة</div>
                    <div>المعامل</div>
                    <div>سعر العينة (4x12)</div>
                    <div>الإجراءات</div>
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {filteredMunicipalities.map((municipality) => (
                    <div key={municipality.id} className="px-4 py-3 border-b hover:bg-gray-50">
                      <div className="grid grid-cols-6 gap-4 items-center">
                        <div className="font-medium">{municipality.name}</div>
                        <div className="text-gray-600">{municipality.region || '-'}</div>
                        <div className="text-gray-600">{municipality.city || '-'}</div>
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
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                          />
                        </div>
                        <div className="font-semibold text-green-600">
                          {municipality.samplePrice} د.ل
                        </div>
                        <div>
                          <button
                            onClick={() => {
                              if (confirm(`هل تريد حذف البلدية "${municipality.name}"؟`)) {
                                municipalityService.deleteMunicipality(municipality.id)
                                loadData()
                              }
                            }}
                            className="text-red-500 hover:text-red-700 text-sm"
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