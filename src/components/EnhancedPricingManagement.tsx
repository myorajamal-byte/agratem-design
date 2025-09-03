import React, { useState, useEffect } from 'react'
import {
  Database,
  Download,
  Plus,
  Trash2,
  X,
  RefreshCw,
  BarChart3,
  Search,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Users,
  Grid3X3,
  DollarSign,
  Calendar,
  Target,
  AlertTriangle,
  CheckCircle,
  Edit3,
  Save,
  HelpCircle,
  Settings,
  Upload,
  Filter,
  Eye,
  EyeOff
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { arabicPricingService, ArabicPricingRow, ArabicPricingStats } from '@/services/arabicPricingService'
import { PriceListType, CustomerType } from '@/types'
import '@/styles/enhanced-pricing-table.css'

interface EnhancedPricingManagementProps {
  onClose: () => void
}

const EnhancedPricingManagement: React.FC<EnhancedPricingManagementProps> = ({ onClose }) => {
  const [pricingData, setPricingData] = useState<ArabicPricingRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [statistics, setStatistics] = useState<ArabicPricingStats | null>(null)
  
  // فلاتر البحث والتصفية
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [selectedLevel, setSelectedLevel] = useState<string>('')
  const [selectedCustomer, setSelectedCustomer] = useState<string>('')
  
  // خيارات الفلاتر
  const [availableSizes, setAvailableSizes] = useState<string[]>([])
  const [availableCustomers, setAvailableCustomers] = useState<string[]>([])
  const [availableLevels, setAvailableLevels] = useState<PriceListType[]>([])
  
  // إعدادات العرض
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [showFilters, setShowFilters] = useState(true)
  const [sortConfig, setSortConfig] = useState<{ key: keyof ArabicPricingRow; direction: 'asc' | 'desc' } | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
  
  // تحرير الخلايا
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState<string>('')
  
  // إضافة صف جديد
  const [showAddRow, setShowAddRow] = useState(false)
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

  const showNotification = (type: 'success' | 'error', message: string) => {
    if (type === 'success') {
      setSuccess(message)
      setError('')
      setTimeout(() => setSuccess(''), 4000)
    } else {
      setError(message)
      setSuccess('')
      setTimeout(() => setError(''), 6000)
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

  const handleSort = (key: keyof ArabicPricingRow) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
      }
      return { key, direction: 'asc' }
    })
  }

  const handleCellEdit = async (rowId: number, column: keyof ArabicPricingRow, newValue: string) => {
    try {
      const numValue = parseFloat(newValue) || 0
      
      const row = pricingData.find(r => r.id === rowId)
      if (!row) return

      const size = row.المقاس
      const level = row.المستوى as PriceListType
      const customerType = row.الزبون === 'عادي' ? 'individuals' : 
                          row.الزبون === 'مسوق' ? 'marketers' : 'companies'
      
      const durationMap: Record<string, number> = {
        'يوم واحد': 1,
        'شهر واحد': 30,
        '2 أشهر': 60,
        '3 أشهر': 90,
        '6 أشهر': 180,
        'سنة كاملة': 365
      }
      
      const duration = durationMap[column as string] || 30

      const result = await arabicPricingService.updatePrice(
        size,
        level,
        customerType,
        duration,
        numValue
      )

      if (result.success) {
        showNotification('success', 'تم تحديث السعر بنجاح')
        await loadData()
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
      showNotification('success', 'تم تصدير البيانات إلى Excel بنجاح')
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
      event.target.value = ''
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

  const toggleRowExpansion = (rowId: number) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(rowId)) {
      newExpanded.delete(rowId)
    } else {
      newExpanded.add(rowId)
    }
    setExpandedRows(newExpanded)
  }

  // تطبيق الفلاتر والفرز
  const filteredAndSortedData = React.useMemo(() => {
    let filtered = [...pricingData]

    // فلتر البحث النصي
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(row =>
        row.المقاس?.toLowerCase().includes(term) ||
        row.المستوى?.toLowerCase().includes(term) ||
        row.الزبون?.toLowerCase().includes(term) ||
        Object.values(row).some(value => 
          value?.toString().toLowerCase().includes(term)
        )
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

    // الفرز
    if (sortConfig) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key]
        const bValue = b[sortConfig.key]
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
        }
        
        const aStr = String(aValue || '').toLowerCase()
        const bStr = String(bValue || '').toLowerCase()
        
        if (sortConfig.direction === 'asc') {
          return aStr.localeCompare(bStr, 'ar')
        } else {
          return bStr.localeCompare(aStr, 'ar')
        }
      })
    }

    return filtered
  }, [pricingData, searchTerm, selectedSize, selectedLevel, selectedCustomer, sortConfig])

  const priceColumns = ['يوم واحد', 'شهر واحد', '2 أشهر', '3 أشهر', '6 أشهر', 'سنة كاملة']

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[98vw] max-h-[95vh] overflow-hidden border-0">
        {/* Header المحسن */}
        <div className="p-8 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 via-purple-600/30 to-pink-600/30"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shadow-2xl backdrop-blur-sm">
                  <Database className="w-9 h-9" />
                </div>
                <div>
                  <h1 className="text-3xl font-black mb-2 bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent">
                    إدارة الأسعار العربية
                  </h1>
                  <p className="text-purple-100 text-lg font-medium">
                    نظام متطور لإدارة جدول pricing_ar من Supabase
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

        <div className="relative overflow-y-auto max-h-[calc(95vh-180px)] bg-gradient-to-br from-slate-50 to-blue-50">
          {/* Notifications */}
          {error && (
            <div className="mx-6 mt-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-lg shadow-lg">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-semibold">{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="mx-6 mt-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-lg shadow-lg">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">{success}</span>
              </div>
            </div>
          )}

          {/* Statistics Dashboard */}
          {statistics && (
            <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Card className="p-6 bg-white shadow-xl border-0 rounded-2xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-3xl font-black text-blue-600">{statistics.totalRows}</div>
                      <div className="text-sm text-blue-700 font-semibold">إجمالي الصفوف</div>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-white shadow-xl border-0 rounded-2xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Grid3X3 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-3xl font-black text-green-600">{statistics.uniqueSizes}</div>
                      <div className="text-sm text-green-700 font-semibold">عدد المقاسات</div>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-white shadow-xl border-0 rounded-2xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-3xl font-black text-purple-600">{statistics.uniqueLevels}</div>
                      <div className="text-sm text-purple-700 font-semibold">عدد المستويات</div>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-white shadow-xl border-0 rounded-2xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-3xl font-black text-orange-600">{statistics.uniqueCustomers}</div>
                      <div className="text-sm text-orange-700 font-semibold">أنواع الزبائن</div>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-white shadow-xl border-0 rounded-2xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-black text-emerald-600">
                        {statistics.averageMonthlyPrice.toLocaleString()}
                      </div>
                      <div className="text-sm text-emerald-700 font-semibold">متوسط الأسعار</div>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-white shadow-xl border-0 rounded-2xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-lg font-black text-pink-600">
                        {statistics.priceRange.min.toLocaleString()} - {statistics.priceRange.max.toLocaleString()}
                      </div>
                      <div className="text-sm text-pink-700 font-semibold">نطاق الأسعار</div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Controls & Filters */}
          <div className="p-6 space-y-6">
            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => setShowAddRow(true)}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  إضافة صف جديد
                </Button>

                <Button
                  onClick={loadData}
                  disabled={loading}
                  variant="outline"
                  className="text-blue-600 border-blue-300 hover:bg-blue-50 px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <RefreshCw className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  تحديث البيانات
                </Button>

                <Button
                  onClick={handleExport}
                  variant="outline"
                  className="text-emerald-600 border-emerald-300 hover:bg-emerald-50 px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <Download className="w-5 h-5 mr-2" />
                  تصدير إلى Excel
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
                    className="text-purple-600 border-purple-300 hover:bg-purple-50 px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    استيراد Excel
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={() => setShowFilters(!showFilters)}
                  variant="outline"
                  className="text-gray-600 border-gray-300 hover:bg-gray-50 px-6 py-4 rounded-2xl"
                >
                  <Filter className="w-5 h-5 mr-2" />
                  {showFilters ? 'إخفاء الفلاتر' : 'إظهار الفلاتر'}
                </Button>

                <div className="flex items-center gap-2 bg-white rounded-2xl p-2 shadow-lg border border-gray-200">
                  <Button
                    onClick={() => setViewMode('table')}
                    variant={viewMode === 'table' ? 'default' : 'ghost'}
                    size="sm"
                    className={`rounded-xl ${viewMode === 'table' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-600'}`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => setViewMode('cards')}
                    variant={viewMode === 'cards' ? 'default' : 'ghost'}
                    size="sm"
                    className={`rounded-xl ${viewMode === 'cards' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-600'}`}
                  >
                    <BarChart3 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="text-sm text-gray-600 bg-white px-4 py-3 rounded-2xl shadow-lg border border-gray-200">
                  <span className="font-semibold">عرض:</span>
                  <Badge className="ml-2 bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full">
                    {filteredAndSortedData.length} من {pricingData.length} صف
                  </Badge>
                </div>
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <Card className="p-6 bg-white shadow-xl border-0 rounded-2xl">
                <div className="flex items-center gap-2 mb-6">
                  <Search className="w-6 h-6 text-indigo-600" />
                  <h3 className="font-bold text-gray-900 text-xl">البحث والتصفية المتقدمة</h3>
                  {(searchTerm || selectedSize || selectedLevel || selectedCustomer) && (
                    <Button
                      onClick={clearFilters}
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-300 hover:bg-red-50 rounded-xl"
                    >
                      مسح الفلاتر
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">البحث النصي</label>
                    <div className="relative">
                      <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        placeholder="ابحث في جميع الأعمدة..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pr-12 bg-white border-2 border-gray-200 focus:border-indigo-500 rounded-xl py-3 text-base shadow-lg"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">المقاس</label>
                    <select
                      value={selectedSize}
                      onChange={(e) => setSelectedSize(e.target.value)}
                      className="w-full p-3 border-2 border-gray-200 rounded-xl bg-white focus:border-indigo-500 shadow-lg text-base"
                    >
                      <option value="">جميع المقاسات</option>
                      {availableSizes.map(size => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">المستوى</label>
                    <select
                      value={selectedLevel}
                      onChange={(e) => setSelectedLevel(e.target.value)}
                      className="w-full p-3 border-2 border-gray-200 rounded-xl bg-white focus:border-indigo-500 shadow-lg text-base"
                    >
                      <option value="">جميع المستويات</option>
                      {availableLevels.map(level => (
                        <option key={level} value={level}>مستوى {level}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">نوع الزبون</label>
                    <select
                      value={selectedCustomer}
                      onChange={(e) => setSelectedCustomer(e.target.value)}
                      className="w-full p-3 border-2 border-gray-200 rounded-xl bg-white focus:border-indigo-500 shadow-lg text-base"
                    >
                      <option value="">جميع أنواع الزبائن</option>
                      {availableCustomers.map(customer => (
                        <option key={customer} value={customer}>{customer}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </Card>
            )}

            {/* Data Display */}
            {viewMode === 'table' ? (
              /* Enhanced Table View */
              <Card className="overflow-hidden border-0 shadow-2xl rounded-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse bg-white">
                    <thead>
                      <tr className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
                        <th className="border border-white/20 p-4 text-center font-bold min-w-[120px]">
                          <button
                            onClick={() => handleSort('المقاس')}
                            className="flex items-center justify-center gap-2 w-full hover:bg-white/10 px-3 py-2 rounded-lg transition-all"
                          >
                            <Grid3X3 className="w-4 h-4" />
                            المقاس
                            {sortConfig?.key === 'المقاس' && (
                              <span className="text-lg">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </button>
                        </th>

                        <th className="border border-white/20 p-4 text-center font-bold min-w-[100px]">
                          <button
                            onClick={() => handleSort('المستوى')}
                            className="flex items-center justify-center gap-2 w-full hover:bg-white/10 px-3 py-2 rounded-lg transition-all"
                          >
                            <Target className="w-4 h-4" />
                            المستوى
                            {sortConfig?.key === 'المستوى' && (
                              <span className="text-lg">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </button>
                        </th>

                        <th className="border border-white/20 p-4 text-center font-bold min-w-[120px]">
                          <button
                            onClick={() => handleSort('الزبون')}
                            className="flex items-center justify-center gap-2 w-full hover:bg-white/10 px-3 py-2 rounded-lg transition-all"
                          >
                            <Users className="w-4 h-4" />
                            نوع الزبون
                            {sortConfig?.key === 'الزبون' && (
                              <span className="text-lg">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </button>
                        </th>

                        {priceColumns.map(column => (
                          <th key={column} className="border border-white/20 p-4 text-center font-bold min-w-[140px]">
                            <button
                              onClick={() => handleSort(column as keyof ArabicPricingRow)}
                              className="flex items-center justify-center gap-2 w-full hover:bg-white/10 px-3 py-2 rounded-lg transition-all"
                            >
                              <Calendar className="w-4 h-4" />
                              {column}
                              {sortConfig?.key === column && (
                                <span className="text-lg">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                              )}
                            </button>
                          </th>
                        ))}
                        
                        <th className="border border-white/20 p-4 text-center font-bold min-w-[120px]">
                          <div className="flex items-center justify-center gap-2">
                            <Settings className="w-4 h-4" />
                            الإجراءات
                          </div>
                        </th>
                      </tr>
                    </thead>
                    
                    <tbody>
                      {filteredAndSortedData.map((row, index) => (
                        <tr key={row.id || index} className={`hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                          <td className="border border-gray-200 p-4 text-center font-bold text-indigo-900 bg-gradient-to-br from-indigo-50 to-indigo-100">
                            <div className="text-lg font-black">{row.المقاس}</div>
                          </td>

                          <td className="border border-gray-200 p-4 text-center">
                            <Badge className={`px-4 py-2 rounded-full font-bold text-sm ${
                              row.المستوى === 'A' 
                                ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg' 
                                : 'bg-gradient-to-r from-blue-400 to-blue-500 text-white shadow-lg'
                            }`}>
                              مستوى {row.المستوى}
                            </Badge>
                          </td>

                          <td className="border border-gray-200 p-4 text-center">
                            <Badge className={`px-4 py-2 rounded-full font-bold text-sm ${
                              row.الزبون === 'شركات' ? 'bg-gradient-to-r from-purple-400 to-purple-500 text-white shadow-lg' :
                              row.الزبون === 'مسوق' ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white shadow-lg' :
                              'bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-lg'
                            }`}>
                              {row.الزبون}
                            </Badge>
                          </td>

                          {priceColumns.map(column => {
                            const cellKey = `${row.id}-${column}`
                            const value = row[column as keyof ArabicPricingRow]
                            const isEditing = editingCell === cellKey
                            
                            return (
                              <td key={column} className="border border-gray-200 p-3 text-center">
                                {isEditing ? (
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="number"
                                      value={editingValue}
                                      onChange={(e) => setEditingValue(e.target.value)}
                                      className="w-28 text-center text-sm font-bold border-2 border-indigo-300 rounded-lg"
                                      autoFocus
                                      onKeyPress={(e) => {
                                        if (e.key === 'Enter') saveEdit()
                                        if (e.key === 'Escape') cancelEdit()
                                      }}
                                    />
                                    <Button onClick={saveEdit} size="sm" className="p-2 bg-green-600 text-white rounded-lg shadow-lg">
                                      <Save className="w-3 h-3" />
                                    </Button>
                                    <Button onClick={cancelEdit} size="sm" variant="outline" className="p-2 rounded-lg">
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <div
                                    className="cursor-pointer hover:bg-gradient-to-br hover:from-indigo-100 hover:to-purple-100 p-3 rounded-xl transition-all duration-200 hover:shadow-lg group"
                                    onClick={() => startEdit(row.id!, column as keyof ArabicPricingRow)}
                                    title={`تحرير ${column}`}
                                  >
                                    <div className="flex items-center justify-center gap-2">
                                      <span className="font-bold text-gray-800 text-base">
                                        {typeof value === 'number' ? value.toLocaleString() : (value || '0')}
                                      </span>
                                      <Edit3 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">د.ل</div>
                                  </div>
                                )}
                              </td>
                            )
                          })}
                          
                          <td className="border border-gray-200 p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                onClick={() => toggleRowExpansion(row.id!)}
                                variant="outline"
                                size="sm"
                                className="text-blue-600 border-blue-300 hover:bg-blue-50 rounded-lg"
                              >
                                {expandedRows.has(row.id!) ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                              </Button>
                              <Button
                                onClick={() => handleDeleteRow(row.id!)}
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-300 hover:bg-red-50 rounded-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            ) : (
              /* Enhanced Cards View */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredAndSortedData.map((row, index) => (
                  <Card key={row.id || index} className="p-6 bg-white shadow-xl border-0 rounded-2xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                            {row.المقاس}
                          </div>
                          <div>
                            <Badge className={`px-3 py-1 rounded-full font-bold ${
                              row.المستوى === 'A' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {row.المستوى}
                            </Badge>
                          </div>
                        </div>
                        <Badge className={`px-3 py-1 rounded-full font-bold ${
                          row.الزبون === 'شركات' ? 'bg-purple-100 text-purple-800' :
                          row.الزبون === 'مسوق' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {row.الزبون}
                        </Badge>
                      </div>

                      {/* Prices Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        {priceColumns.map(column => {
                          const value = row[column as keyof ArabicPricingRow]
                          return (
                            <div key={column} className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-xl border border-gray-200">
                              <div className="text-xs text-gray-600 font-semibold mb-1">{column}</div>
                              <div className="text-lg font-bold text-gray-800">
                                {typeof value === 'number' ? value.toLocaleString() : '0'}
                              </div>
                              <div className="text-xs text-gray-500">د.ل</div>
                            </div>
                          )
                        })}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t border-gray-200">
                        <Button
                          onClick={() => toggleRowExpansion(row.id!)}
                          variant="outline"
                          size="sm"
                          className="flex-1 text-blue-600 border-blue-300 hover:bg-blue-50 rounded-xl"
                        >
                          {expandedRows.has(row.id!) ? <Eye className="w-4 h-4 mr-1" /> : <EyeOff className="w-4 h-4 mr-1" />}
                          {expandedRows.has(row.id!) ? 'إخفاء' : 'عرض'}
                        </Button>
                        <Button
                          onClick={() => handleDeleteRow(row.id!)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-300 hover:bg-red-50 rounded-xl"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Empty State */}
            {filteredAndSortedData.length === 0 && !loading && (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Database className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-600 mb-4">لا توجد بيانات</h3>
                <p className="text-gray-500 mb-6 text-lg">
                  {pricingData.length === 0 ? 'لم يتم تحميل أي بيانات من جدول pricing_ar' : 'لا توجد نتائج تطابق الفلاتر المحددة'}
                </p>
                {pricingData.length === 0 && (
                  <Button
                    onClick={loadData}
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-4 rounded-2xl shadow-lg"
                  >
                    <RefreshCw className="w-5 h-5 mr-2" />
                    إعادة تحميل البيانات
                  </Button>
                )}
              </div>
            )}

            {/* Loading Overlay */}
            {loading && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="text-center p-8 bg-white rounded-2xl shadow-2xl border-0">
                  <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-6 animate-spin"></div>
                  <p className="text-gray-700 font-bold text-lg">جاري تحميل البيانات...</p>
                  <p className="text-sm text-gray-500 mt-2">يرجى الانتظار</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Add Row Modal */}
        {showAddRow && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-60">
            <Card className="w-full max-w-3xl p-8 max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border-0">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 text-gray-900">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                إضافة صف جديد
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">المقاس</label>
                  <Input
                    value={newRow.size}
                    onChange={(e) => setNewRow(prev => ({ ...prev, size: e.target.value }))}
                    placeholder="مثال: 13x5"
                    className="bg-white border-2 border-gray-200 rounded-xl py-3 text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">المستوى</label>
                  <select
                    value={newRow.level}
                    onChange={(e) => setNewRow(prev => ({ ...prev, level: e.target.value as PriceListType }))}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl bg-white text-base"
                  >
                    <option value="A">مستوى A</option>
                    <option value="B">مستوى B</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">نوع الزبون</label>
                  <select
                    value={newRow.customer}
                    onChange={(e) => setNewRow(prev => ({ ...prev, customer: e.target.value }))}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl bg-white text-base"
                  >
                    <option value="عادي">عادي</option>
                    <option value="مسوق">مسوق</option>
                    <option value="شركات">شركات</option>
                    <option value="المدينة">المدينة</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
                {priceColumns.map(column => (
                  <div key={column}>
                    <label className="block text-sm font-bold text-gray-700 mb-3">{column}</label>
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
                      className="bg-white border-2 border-gray-200 rounded-xl py-3 text-base text-center font-bold"
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={handleAddRow}
                  disabled={!newRow.size || !newRow.customer}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-4 rounded-2xl shadow-lg font-bold text-lg"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  إضافة الصف
                </Button>
                <Button
                  onClick={() => setShowAddRow(false)}
                  variant="outline"
                  className="flex-1 py-4 rounded-2xl border-2 border-gray-300 hover:bg-gray-50 font-bold text-lg"
                >
                  إلغاء
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default EnhancedPricingManagement