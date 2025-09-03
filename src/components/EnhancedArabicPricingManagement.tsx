import React, { useState, useEffect, useMemo } from 'react'
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
  HelpCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { arabicPricingService, ArabicPricingRow, ArabicPricingStats } from '@/services/arabicPricingService'
import { PriceListType, CustomerType } from '@/types'
import '@/styles/enhanced-pricing-table.css'
import PricingInterfaceGuide from './PricingInterfaceGuide'

interface EnhancedArabicPricingManagementProps {
  onClose: () => void
}

const EnhancedArabicPricingManagement: React.FC<EnhancedArabicPricingManagementProps> = ({ onClose }) => {
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
  
  // إعدادات الجدول
  const [sortConfig, setSortConfig] = useState<{ key: keyof ArabicPricingRow; direction: 'asc' | 'desc' } | null>(null)
  const [expandedPriceColumns, setExpandedPriceColumns] = useState(true)
  const [showFiltersPanel, setShowFiltersPanel] = useState(false)

  // تحرير الخلايا
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState<string>('')
  
  // إضافة صف جديد
  const [showAddRow, setShowAddRow] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
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

  // تطبيق الفلاتر والفرز
  const filteredAndSortedData = useMemo(() => {
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
        showNotification('error', result.error || 'ف��ل في تحديث السعر')
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

  const priceColumns = ['يوم واحد', 'شهر واحد', '2 أشهر', '3 أشهر', '6 أشهر', 'سنة كاملة']

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-[95vw] max-h-[95vh] overflow-hidden">
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

        <div className="relative overflow-y-auto max-h-[calc(95vh-120px)]">
          {/* Notifications */}
          {error && (
            <div className="notification-enter-active mx-6 mt-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-semibold">{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="notification-enter-active mx-6 mt-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-lg">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">{success}</span>
              </div>
            </div>
          )}

          {/* Statistics Bar */}
          {statistics && (
            <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="stats-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <Card className="stats-card p-4 bg-white shadow-md border-l-4 border-blue-500">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <BarChart3 className="stats-icon w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{statistics.totalRows}</div>
                      <div className="text-sm text-blue-700 font-medium">إجمالي الصفوف</div>
                    </div>
                  </div>
                </Card>

                <Card className="stats-card p-4 bg-white shadow-md border-l-4 border-green-500">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Grid3X3 className="stats-icon w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{statistics.uniqueSizes}</div>
                      <div className="text-sm text-green-700 font-medium">عدد المقاسات</div>
                    </div>
                  </div>
                </Card>

                <Card className="stats-card p-4 bg-white shadow-md border-l-4 border-purple-500">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <Target className="stats-icon w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">{statistics.uniqueLevels}</div>
                      <div className="text-sm text-purple-700 font-medium">عدد المستويات</div>
                    </div>
                  </div>
                </Card>

                <Card className="stats-card p-4 bg-white shadow-md border-l-4 border-orange-500">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <Users className="stats-icon w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600">{statistics.uniqueCustomers}</div>
                      <div className="text-sm text-orange-700 font-medium">أنواع الزبائن</div>
                    </div>
                  </div>
                </Card>

                <Card className="stats-card p-4 bg-white shadow-md border-l-4 border-emerald-500">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="stats-icon w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-emerald-600">
                        {statistics.averageMonthlyPrice.toLocaleString()}
                      </div>
                      <div className="text-sm text-emerald-700 font-medium">متوسط الأسعار</div>
                    </div>
                  </div>
                </Card>

                <Card className="stats-card p-4 bg-white shadow-md border-l-4 border-pink-500">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                      <DollarSign className="stats-icon w-5 h-5 text-pink-600" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-pink-600">
                        {statistics.priceRange.min.toLocaleString()} - {statistics.priceRange.max.toLocaleString()}
                      </div>
                      <div className="text-sm text-pink-700 font-medium">نطاق الأسعار</div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Controls & Filters */}
          <div className="p-6 space-y-6">
            {/* Advanced Filters */}
            <Card className="p-6 bg-gray-50 border-2 border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <Search className="w-5 h-5 text-gray-600" />
                <h3 className="font-bold text-gray-900">البحث والتصفية</h3>
                {(searchTerm || selectedSize || selectedLevel || selectedCustomer) && (
                  <Button
                    onClick={clearFilters}
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    مسح الفلاتر
                  </Button>
                )}
              </div>
              
              <div className="filter-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">البحث النصي</label>
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="اب��ث في جميع الأعمدة..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-10 bg-white border-gray-300 focus:border-indigo-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">المقاس</label>
                  <select
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(e.target.value)}
                    className="filter-dropdown w-full p-3 rounded-lg bg-white"
                  >
                    <option value="">جميع المقاسات</option>
                    {availableSizes.map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">المستوى</label>
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="filter-dropdown w-full p-3 rounded-lg bg-white"
                  >
                    <option value="">جميع المستويات</option>
                    {availableLevels.map(level => (
                      <option key={level} value={level}>مستوى {level}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">نوع الزبون</label>
                  <select
                    value={selectedCustomer}
                    onChange={(e) => setSelectedCustomer(e.target.value)}
                    className="filter-dropdown w-full p-3 rounded-lg bg-white"
                  >
                    <option value="">جميع أنواع الزبائن</option>
                    {availableCustomers.map(customer => (
                      <option key={customer} value={customer}>{customer}</option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>

            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-2">
              <div className="text-sm text-gray-600 bg-gray-100 px-4 py-2 rounded-lg">
                <span className="font-semibold">عرض:</span>
                <Badge className="ml-2 bg-indigo-100 text-indigo-800">
                  {filteredAndSortedData.length} من {pricingData.length} صف
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => setShowAddRow(true)}
                  className="action-button bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  إضافة صف جديد
                </Button>

                <Button
                  onClick={loadData}
                  disabled={loading}
                  variant="outline"
                  className="action-button text-blue-600 border-blue-300 hover:bg-blue-50 px-6 py-3"
                >
                  <RefreshCw className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  تحديث البيانات
                </Button>

                <Button
                  onClick={handleExport}
                  variant="outline"
                  className="action-button text-emerald-600 border-emerald-300 hover:bg-emerald-50 px-6 py-3"
                >
                  <Download className="w-5 h-5 mr-2" />
                  تصدير Excel
                </Button>
              </div>
            </div>

            {/* Enhanced Data Table */}
            <Card className="overflow-hidden border-2 border-gray-200">
              <div className="pricing-table-container">
                <table className="pricing-table">
                  <thead>
                    <tr className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                      {/* Fixed Basic Columns */}
                      <th className="sticky right-0 z-30 min-w-[140px]">
                        <button
                          onClick={() => handleSort('المقاس')}
                          className="sort-button"
                        >
                          المقاس
                          {sortConfig?.key === 'المقاس' && (
                            sortConfig.direction === 'asc' ? '↑' : '↓'
                          )}
                        </button>
                      </th>

                      <th className="sticky right-[140px] z-30 min-w-[120px]">
                        <button
                          onClick={() => handleSort('المستوى')}
                          className="sort-button"
                        >
                          المستوى
                          {sortConfig?.key === 'المستوى' && (
                            sortConfig.direction === 'asc' ? '↑' : '↓'
                          )}
                        </button>
                      </th>

                      <th className="sticky right-[260px] z-30 min-w-[140px]">
                        <button
                          onClick={() => handleSort('الزبون')}
                          className="sort-button"
                        >
                          نوع الزبون
                          {sortConfig?.key === 'الزبون' && (
                            sortConfig.direction === 'asc' ? '↑' : '↓'
                          )}
                        </button>
                      </th>

                      {/* Price Columns Group */}
                      <th className="price-columns-header" colSpan={expandedPriceColumns ? priceColumns.length : 0}>
                        <button
                          onClick={() => setExpandedPriceColumns(!expandedPriceColumns)}
                          className="sort-button"
                        >
                          <Calendar className="w-4 h-4" />
                          الأسعار حسب المدة
                          {expandedPriceColumns ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      
                      {!expandedPriceColumns && (
                        <>
                          {priceColumns.map(column => (
                            <th key={column} className="border border-white/20 p-4 text-center font-bold min-w-[120px]">
                              <button
                                onClick={() => handleSort(column as keyof ArabicPricingRow)}
                                className="flex items-center justify-center gap-1 w-full hover:bg-white/10 px-2 py-1 rounded text-xs"
                              >
                                {column}
                                {sortConfig?.key === column && (
                                  sortConfig.direction === 'asc' ? '↑' : '↓'
                                )}
                              </button>
                            </th>
                          ))}
                        </>
                      )}
                      
                      <th className="border border-white/20 p-4 text-center font-bold min-w-[100px]">الإجراءات</th>
                    </tr>
                    
                    {/* Price Sub-headers when expanded */}
                    {expandedPriceColumns && (
                      <tr className="price-columns-subheader text-white">
                        <th className="sticky-right-0"></th>
                        <th className="sticky-right-120"></th>
                        <th className="sticky-right-220"></th>
                        {priceColumns.map(column => (
                          <th key={column} className="border border-white/20 p-2 text-center font-medium text-sm min-w-[120px]">
                            <button
                              onClick={() => handleSort(column as keyof ArabicPricingRow)}
                              className="flex items-center justify-center gap-1 w-full hover:bg-white/10 px-1 py-1 rounded"
                            >
                              {column}
                              {sortConfig?.key === column && (
                                sortConfig.direction === 'asc' ? '↑' : '↓'
                              )}
                            </button>
                          </th>
                        ))}
                        <th className="border border-white/20"></th>
                      </tr>
                    )}
                  </thead>
                  
                  <tbody>
                    {filteredAndSortedData.map((row, index) => (
                      <tr key={row.id || index} className={`hover:bg-indigo-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        {/* Fixed Basic Columns */}
                        <td className="sticky-right-0 font-bold text-indigo-900">
                          {row.المقاس}
                        </td>

                        <td className="sticky-right-120">
                          <span className={`${row.المستوى === 'A' ? 'level-badge-a' : 'level-badge-b'}`}>
                            {row.المستوى}
                          </span>
                        </td>

                        <td className="sticky-right-220">
                          <span className={`${
                            row.الزبون === 'شركات' ? 'customer-badge-companies' :
                            row.الزبون === 'مسوق' ? 'customer-badge-marketers' :
                            'customer-badge-individuals'
                          }`}>
                            {row.الزبون}
                          </span>
                        </td>

                        {/* Price Columns */}
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
                                    className="w-24 text-center text-sm"
                                    autoFocus
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') saveEdit()
                                      if (e.key === 'Escape') cancelEdit()
                                    }}
                                  />
                                  <Button onClick={saveEdit} size="sm" className="p-1 bg-green-600 text-white">
                                    <Save className="w-3 h-3" />
                                  </Button>
                                  <Button onClick={cancelEdit} size="sm" variant="outline" className="p-1">
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              ) : (
                                <div
                                  className="editable-cell"
                                  onClick={() => startEdit(row.id!, column as keyof ArabicPricingRow)}
                                  title={`تحرير ${column}`}
                                >
                                  <div className="flex items-center justify-center gap-1">
                                    <span className="font-semibold text-gray-800">
                                      {typeof value === 'number' ? value.toLocaleString() : (value || '0')}
                                    </span>
                                    <Edit3 className="w-3 h-3 text-gray-400 edit-icon" />
                                  </div>
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
            {filteredAndSortedData.length === 0 && !loading && (
              <div className="text-center py-12">
                <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">لا توجد بيانات</h3>
                <p className="text-gray-500 mb-4">
                  {pricingData.length === 0 ? 'لم يتم تحميل أي بيانات من جدول pricing_ar' : 'لا توجد نتائج تطابق الفلاتر المحددة'}
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

            {/* Loading Overlay */}
            {loading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="text-center p-8 bg-white rounded-xl shadow-lg border border-gray-200">
                  <div className="loading-spinner w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-700 font-medium">جاري تحميل البيانات...</p>
                  <p className="text-sm text-gray-500 mt-2">يرجى الانتظار</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Add Row Modal */}
        {showAddRow && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
            <Card className="w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Plus className="w-6 h-6 text-green-600" />
                إضافة صف جديد
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">المقاس</label>
                  <Input
                    value={newRow.size}
                    onChange={(e) => setNewRow(prev => ({ ...prev, size: e.target.value }))}
                    placeholder="مثال: 13x5"
                    className="bg-white border-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">المستوى</label>
                  <select
                    value={newRow.level}
                    onChange={(e) => setNewRow(prev => ({ ...prev, level: e.target.value as PriceListType }))}
                    className="w-full p-3 border border-gray-300 rounded-lg bg-white"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">نوع الزبون</label>
                  <select
                    value={newRow.customer}
                    onChange={(e) => setNewRow(prev => ({ ...prev, customer: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg bg-white"
                  >
                    <option value="عادي">عادي</option>
                    <option value="��سوق">مسوق</option>
                    <option value="شركات">شركات</option>
                    <option value="المدينة">المدينة</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {priceColumns.map(column => (
                  <div key={column}>
                    <label className="block text-sm font-bold text-gray-700 mb-2">{column}</label>
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
                      className="bg-white border-gray-300"
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleAddRow}
                  disabled={!newRow.size || !newRow.customer}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  إضافة الصف
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

        {/* Interface Guide */}
        {showGuide && (
          <PricingInterfaceGuide onClose={() => setShowGuide(false)} />
        )}
      </div>
    </div>
  )
}

export default EnhancedArabicPricingManagement
