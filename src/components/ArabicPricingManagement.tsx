import React, { useState, useEffect } from 'react'
import {
  Database,
  Save,
  Download,
  Upload,
  Plus,
  Trash2,
  Edit3,
  X,
  RefreshCw,
  BarChart3,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle,
  Search,
  Filter,
  Settings
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { arabicPricingService, ArabicPricingRow, ArabicPricingStats } from '@/services/arabicPricingService'
import { PriceListType, CustomerType } from '@/types'
import SupabaseSetup from './SupabaseSetup'
import QuickSupabaseTest from './QuickSupabaseTest'
import SupabaseRLSFix from './SupabaseRLSFix'

interface ArabicPricingManagementProps {
  onClose: () => void
}

const ArabicPricingManagement: React.FC<ArabicPricingManagementProps> = ({ onClose }) => {
  const [pricingData, setPricingData] = useState<ArabicPricingRow[]>([])
  const [filteredData, setFilteredData] = useState<ArabicPricingRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [statistics, setStatistics] = useState<ArabicPricingStats | null>(null)
  
  // فلاتر البحث
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [selectedLevel, setSelectedLevel] = useState<string>('')
  const [selectedCustomer, setSelectedCustomer] = useState<string>('')
  
  // خيارات الفلاتر
  const [availableSizes, setAvailableSizes] = useState<string[]>([])
  const [availableCustomers, setAvailableCustomers] = useState<string[]>([])
  const [availableLevels, setAvailableLevels] = useState<PriceListType[]>([])
  
  // تحرير الخلايا
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState<string>('')
  
  // إضافة صف جديد
  const [showAddRow, setShowAddRow] = useState(false)
  const [showSupabaseSetup, setShowSupabaseSetup] = useState(false)
  const [newRow, setNewRow] = useState({
    size: '',
    level: 'A' as PriceListType,
    customer: 'عادي',
    prices: {
      'شهر واحد': 0,
      '2 أشهر': 0,
      '3 أشهر': 0,
      '6 أشهر': 0,
      'سنة كاملة': 0,
      'يوم واحد': 0
    }
  })

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [pricingData, searchTerm, selectedSize, selectedLevel, selectedCustomer])

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

  const loadData = async () => {
    setLoading(true)
    try {
      const [data, stats, sizes, customers, levels] = await Promise.all([
        arabicPricingService.getAllPricingData(),
        arabicPricingService.getStatistics(),
        arabicPricingService.getAvailableSizes(),
        arabicPricingService.getAvailableCustomerTypes(),
        arabicPricingService.getAvailableLevels()
      ])

      setPricingData(data)
      setStatistics(stats)
      setAvailableSizes(sizes)
      setAvailableCustomers(customers)
      setAvailableLevels(levels)

    } catch (error: any) {
      showNotification('error', `خطأ في تحميل البيانات: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...pricingData]

    // فلتر البحث النصي
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(row =>
        row.المقاس?.toLowerCase().includes(term) ||
        row.المستوى?.toLowerCase().includes(term) ||
        row.الزبون?.toLowerCase().includes(term)
      )
    }

    // فلاتر محددة
    if (selectedSize) {
      filtered = filtered.filter(row => row.المقاس === selectedSize)
    }
    if (selectedLevel) {
      filtered = filtered.filter(row => row.المستوى === selectedLevel)
    }
    if (selectedCustomer) {
      filtered = filtered.filter(row => row.الزبون === selectedCustomer)
    }

    setFilteredData(filtered)
  }

  const handleCellEdit = async (rowId: number, column: keyof ArabicPricingRow, newValue: string) => {
    try {
      const numValue = parseFloat(newValue) || 0
      
      // العثور على الصف
      const row = pricingData.find(r => r.id === rowId)
      if (!row) return

      // تحديد المعاملات للتحديث
      const size = row.المقاس
      const level = row.المستوى as PriceListType
      const customerType = row.الزبون === 'عادي' ? 'individuals' : 
                          row.الزبون === 'مسوق' ? 'marketers' : 'companies'
      
      // تحديد المدة من اسم العمود
      const durationMap: Record<string, number> = {
        'يوم واحد': 1,
        'شهر واحد': 30,
        '2 أشهر': 60,
        '3 أشهر': 90,
        '6 أشهر': 180,
        'سنة كاملة': 365
      }
      
      const duration = durationMap[column as string] || 30

      // تحديث في Supabase
      const result = await arabicPricingService.updatePrice(
        size,
        level,
        customerType,
        duration,
        numValue
      )

      if (result.success) {
        showNotification('success', 'تم تحديث السعر بنجاح')
        await loadData() // إعادة تحميل البيانات
      } else {
        showNotification('error', result.error || 'فشل في تحديث السعر')
      }

    } catch (error: any) {
      showNotification('error', `خطأ في التحديث: ${error.message}`)
    }
  }

  const handleAddRow = async () => {
    try {
      if (!newRow.size || !newRow.customer) {
        showNotification('error', 'يرجى ملء المقاس ونوع الزبون')
        return
      }

      const customerType = newRow.customer === 'عادي' ? 'individuals' : 
                          newRow.customer === 'مسوق' ? 'marketers' : 'companies'

      const result = await arabicPricingService.addNewRow(
        newRow.size,
        newRow.level,
        customerType,
        newRow.prices
      )

      if (result.success) {
        showNotification('success', 'تم إضافة الصف بنجاح')
        setShowAddRow(false)
        setNewRow({
          size: '',
          level: 'A',
          customer: 'عادي',
          prices: {
            'شهر واحد': 0,
            '2 أشهر': 0,
            '3 أشهر': 0,
            '6 أشهر': 0,
            'سنة كاملة': 0,
            'يوم واحد': 0
          }
        })
        await loadData()
      } else {
        showNotification('error', result.error || 'فشل في إضافة الصف')
      }

    } catch (error: any) {
      showNotification('error', `خطأ في الإضافة: ${error.message}`)
    }
  }

  const handleDeleteRow = async (rowId: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الصف؟')) return

    try {
      const result = await arabicPricingService.deleteRow(rowId)
      
      if (result.success) {
        showNotification('success', 'تم حذف الصف بنجاح')
        await loadData()
      } else {
        showNotification('error', result.error || 'فشل في حذف الصف')
      }

    } catch (error: any) {
      showNotification('error', `خطأ في الحذف: ${error.message}`)
    }
  }

  const handleExport = async () => {
    try {
      await arabicPricingService.exportToExcel()
      showNotification('success', 'تم تصدير البيانات بنجاح')
    } catch (error: any) {
      showNotification('error', `خطأ في التصدير: ${error.message}`)
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setLoading(true)
      const result = await arabicPricingService.importFromExcel(file)
      
      if (result.success) {
        showNotification('success', `تم استيراد ${result.imported} صف بنجاح`)
        await loadData()
      } else {
        showNotification('error', `فشل الاستيراد: ${result.errors.join(', ')}`)
      }

    } catch (error: any) {
      showNotification('error', `خطأ في الاستيراد: ${error.message}`)
    } finally {
      setLoading(false)
      // إعادة تعيين input
      event.target.value = ''
    }
  }

  const handleSyncWithLocal = async () => {
    if (!window.confirm('هل تريد مزامنة البيانات مع النظام المحلي؟ سيتم تحديث الأسعار ��لمحلية.')) return

    try {
      setLoading(true)
      const result = await arabicPricingService.syncWithLocalPricing()
      
      if (result.success) {
        showNotification('success', `تم مزامنة ${result.synced} سعر مع النظام المحلي`)
      } else {
        showNotification('error', `فشل في المزامنة: ${result.errors.join(', ')}`)
      }

    } catch (error: any) {
      showNotification('error', `خطأ في المزامنة: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (rowId: number, column: keyof ArabicPricingRow) => {
    const row = pricingData.find(r => r.id === rowId)
    if (!row) return

    const cellKey = `${rowId}-${column}`
    setEditingCell(cellKey)
    setEditingValue(String(row[column] || ''))
  }

  const saveEdit = async () => {
    if (!editingCell) return

    const [rowIdStr, column] = editingCell.split('-')
    const rowId = parseInt(rowIdStr)

    await handleCellEdit(rowId, column as keyof ArabicPricingRow, editingValue)
    setEditingCell(null)
    setEditingValue('')
  }

  const cancelEdit = () => {
    setEditingCell(null)
    setEditingValue('')
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedSize('')
    setSelectedLevel('')
    setSelectedCustomer('')
  }

  const priceColumns = ['شهر واحد', '2 أشهر', '3 أشهر', '6 أشهر', 'سنة كاملة', 'يوم واحد']

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Database className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">إدارة الأسعار العربية</h1>
                <p className="text-sm opacity-90">جدول pricing_ar من Supabase</p>
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

        <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
          {/* اختبار سريع لـ Supabase */}
          <QuickSupabaseTest />

          {/* إصلاح صلاحيات Supabase */}
          <SupabaseRLSFix />

          {/* Notifications */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-semibold">{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-lg">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">{success}</span>
              </div>
            </div>
          )}

          {/* Statistics Cards */}
          {statistics && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
              <Card className="p-4 bg-blue-50 border-blue-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{statistics.totalRows}</div>
                  <div className="text-sm text-blue-700">إجمالي الصفوف</div>
                </div>
              </Card>
              <Card className="p-4 bg-green-50 border-green-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{statistics.uniqueSizes}</div>
                  <div className="text-sm text-green-700">مقاسات مختلفة</div>
                </div>
              </Card>
              <Card className="p-4 bg-purple-50 border-purple-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{statistics.uniqueCustomers}</div>
                  <div className="text-sm text-purple-700">أنواع زبائن</div>
                </div>
              </Card>
              <Card className="p-4 bg-orange-50 border-orange-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{statistics.uniqueLevels}</div>
                  <div className="text-sm text-orange-700">مستويات</div>
                </div>
              </Card>
              <Card className="p-4 bg-emerald-50 border-emerald-200">
                <div className="text-center">
                  <div className="text-lg font-bold text-emerald-600">
                    {statistics.averageMonthlyPrice.toLocaleString()}
                  </div>
                  <div className="text-sm text-emerald-700">متوسط شهري</div>
                </div>
              </Card>
              <Card className="p-4 bg-pink-50 border-pink-200">
                <div className="text-center">
                  <div className="text-sm font-bold text-pink-600">
                    {statistics.priceRange.min.toLocaleString()} - {statistics.priceRange.max.toLocaleString()}
                  </div>
                  <div className="text-sm text-pink-700">نطاق الأسعار</div>
                </div>
              </Card>
            </div>
          )}

          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <Button
                onClick={loadData}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                تحديث البي��نات
              </Button>
              <Button
                onClick={() => setShowAddRow(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                إضافة صف
              </Button>
              <Button
                onClick={handleExport}
                variant="outline"
                className="text-emerald-600 border-emerald-300"
              >
                <Download className="w-4 h-4 mr-2" />
                تصدير Excel
              </Button>
              <div>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImport}
                  className="hidden"
                  id="import-excel"
                />
                <Button
                  onClick={() => document.getElementById('import-excel')?.click()}
                  variant="outline"
                  className="text-blue-600 border-blue-300"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  استيراد Excel
                </Button>
              </div>
              <Button
                onClick={handleSyncWithLocal}
                variant="outline"
                className="text-purple-600 border-purple-300"
                disabled={loading}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                ��زامنة مع النظام المحلي
              </Button>
              <Button
                onClick={() => setShowSupabaseSetup(true)}
                variant="outline"
                className="text-indigo-600 border-indigo-300"
              >
                <Settings className="w-4 h-4 mr-2" />
                إعداد قاعدة البيانات
              </Button>
              <div className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
                <span className="font-semibold">الاتصال:</span>
                <Badge className="ml-2 bg-green-100 text-green-800">
                  Supabase متصل
                </Badge>
              </div>
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-6 p-4 bg-gray-50">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <h3 className="font-bold text-gray-900">فلاتر البحث</h3>
              {(searchTerm || selectedSize || selectedLevel || selectedCustomer) && (
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-300"
                >
                  مسح الفلاتر
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="البحث في البيانات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
              
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="">جميع المقاسات</option>
                {availableSizes.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>

              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="">جميع المستويات</option>
                {availableLevels.map(level => (
                  <option key={level} value={level}>مستوى {level}</option>
                ))}
              </select>

              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="">جميع الزبائن</option>
                {availableCustomers.map(customer => (
                  <option key={customer} value={customer}>{customer}</option>
                ))}
              </select>
            </div>
          </Card>

          {/* Data Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                    <th className="border border-white/20 p-3 text-center font-bold">المقاس</th>
                    <th className="border border-white/20 p-3 text-center font-bold">المستوى</th>
                    <th className="border border-white/20 p-3 text-center font-bold">الزبون</th>
                    {priceColumns.map(column => (
                      <th key={column} className="border border-white/20 p-3 text-center font-bold min-w-[100px]">
                        {column}
                      </th>
                    ))}
                    <th className="border border-white/20 p-3 text-center font-bold">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((row, index) => (
                    <tr key={row.id || index} className={`hover:bg-indigo-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="border border-gray-200 p-3 text-center font-bold text-indigo-900 bg-indigo-100">
                        {row.المقاس}
                      </td>
                      <td className="border border-gray-200 p-3 text-center">
                        <Badge className={`${row.المستوى === 'A' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                          {row.المستوى}
                        </Badge>
                      </td>
                      <td className="border border-gray-200 p-3 text-center">
                        <Badge className={`${
                          row.الزبون === 'شركات' ? 'bg-purple-100 text-purple-800' :
                          row.الزبون === 'مسوق' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {row.الزبون}
                        </Badge>
                      </td>
                      {priceColumns.map(column => {
                        const cellKey = `${row.id}-${column}`
                        const value = row[column as keyof ArabicPricingRow]
                        const isEditing = editingCell === cellKey
                        
                        return (
                          <td key={column} className="border border-gray-200 p-2 text-center">
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  value={editingValue}
                                  onChange={(e) => setEditingValue(e.target.value)}
                                  className="w-20 text-center text-sm"
                                  autoFocus
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') saveEdit()
                                    if (e.key === 'Escape') cancelEdit()
                                  }}
                                />
                                <Button onClick={saveEdit} size="sm" className="p-1 bg-green-600 text-white">
                                  <CheckCircle className="w-3 h-3" />
                                </Button>
                                <Button onClick={cancelEdit} size="sm" variant="outline" className="p-1">
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <div
                                className="cursor-pointer hover:bg-indigo-100 p-2 rounded transition-colors"
                                onClick={() => startEdit(row.id!, column as keyof ArabicPricingRow)}
                                title={`تحرير ${column}`}
                              >
                                <span className="font-semibold text-gray-800">
                                  {typeof value === 'number' ? value.toLocaleString() : (value || '0')}
                                </span>
                                <div className="text-xs text-gray-500">د.ل</div>
                              </div>
                            )}
                          </td>
                        )
                      })}
                      <td className="border border-gray-200 p-3 text-center">
                        <Button
                          onClick={() => handleDeleteRow(row.id!)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Empty State */}
          {filteredData.length === 0 && !loading && (
            <div className="text-center py-12">
              <FileSpreadsheet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">لا توجد بيانات</h3>
              <p className="text-gray-500 mb-4">
                {pricingData.length === 0 ? 'لم يتم تحميل أي بيانات من جدول pricing_ar' : 'لا توجد نتائج ��طابق الفلاتر المحددة'}
              </p>
              {pricingData.length === 0 && (
                <Button
                  onClick={loadData}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  إعادة تحميل البيانات
                </Button>
              )}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">جاري تحميل البيانات...</p>
            </div>
          )}
        </div>

        {/* Add Row Modal */}
        {showAddRow && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
            <Card className="w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4">إضافة صف جديد</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">المقاس</label>
                  <Input
                    value={newRow.size}
                    onChange={(e) => setNewRow(prev => ({ ...prev, size: e.target.value }))}
                    placeholder="مثال: 13x5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">المستوى</label>
                  <select
                    value={newRow.level}
                    onChange={(e) => setNewRow(prev => ({ ...prev, level: e.target.value as PriceListType }))}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">نوع الزبون</label>
                  <select
                    value={newRow.customer}
                    onChange={(e) => setNewRow(prev => ({ ...prev, customer: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="عادي">عادي</option>
                    <option value="مسوق">مسوق</option>
                    <option value="شركات">شركات</option>
                    <option value="المدينة">المدينة</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {priceColumns.map(column => (
                  <div key={column}>
                    <label className="block text-sm font-bold text-gray-700 mb-1">{column}</label>
                    <Input
                      type="number"
                      value={newRow.prices[column as keyof typeof newRow.prices]}
                      onChange={(e) => setNewRow(prev => ({
                        ...prev,
                        prices: {
                          ...prev.prices,
                          [column]: parseInt(e.target.value) || 0
                        }
                      }))}
                      placeholder="0"
                      min="0"
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleAddRow}
                  disabled={!newRow.size || !newRow.customer}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  إضافة
                </Button>
                <Button
                  onClick={() => setShowAddRow(false)}
                  variant="outline"
                  className="flex-1"
                >
                  إلغاء
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* نافذة إعداد Supabase */}
        {showSupabaseSetup && (
          <SupabaseSetup onClose={() => setShowSupabaseSetup(false)} />
        )}
      </div>
    </div>
  )
}

export default ArabicPricingManagement
