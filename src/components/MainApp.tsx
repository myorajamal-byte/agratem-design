import React, { useState, useEffect } from 'react'
import {
  Search,
  MapPin,
  Grid,
  List,
  FileDown,
  Calculator,
  Settings,
  Users,
  DollarSign,
  Wrench,
  Database,
  BarChart3,
  MessageCircle,
  FileText,
  Eye,
  X,
  Plus,
  Filter,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import Header from './Header'
import Footer from './Footer'
import SearchFilters from './SearchFilters'
import BillboardCard from './BillboardCard'
import InteractiveMap from './InteractiveMap'
import EmailDialog from './EmailDialog'
import QuoteDialog from './QuoteDialog'
import SystemSettings from './SystemSettings'
import PricingDurationSelector from './PricingDurationSelector'
import SimplifiedPricingCalculator from './SimplifiedPricingCalculator'
import ArabicPricingManagement from './ArabicPricingManagement'
import EnhancedArabicPricingManagement from './EnhancedArabicPricingManagement'
import InstallationPricingManagement from './InstallationPricingManagement'
import PricingSystemStatus from './PricingSystemStatus'
import SimpleSupabaseSettings from './SimpleSupabaseSettings'
import { Billboard, PackageDuration } from '@/types'
import { loadBillboardsFromExcel } from '@/services/billboardService'
import { clientService } from '@/services/clientService'

export default function MainApp() {
  const { user } = useAuth()
  
  // State for billboards and filtering
  const [billboards, setBillboards] = useState<Billboard[]>([])
  const [filteredBillboards, setFilteredBillboards] = useState<Billboard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [contractFilter, setContractFilter] = useState('')
  const [selectedMunicipalities, setSelectedMunicipalities] = useState<string[]>([])
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [selectedAvailabilities, setSelectedAvailabilities] = useState<string[]>([])

  // UI states
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showMap, setShowMap] = useState(false)
  const [selectedBillboards, setSelectedBillboards] = useState<Set<string>>(new Set())
  const [selectedDuration, setSelectedDuration] = useState<PackageDuration | null>(null)

  // Modal states
  const [showEmailDialog, setShowEmailDialog] = useState(false)
  const [showQuoteDialog, setShowQuoteDialog] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showPricingCalculator, setShowPricingCalculator] = useState(false)
  const [showArabicPricing, setShowArabicPricing] = useState(false)
  const [showEnhancedArabicPricing, setShowEnhancedArabicPricing] = useState(false)
  const [showInstallationPricing, setShowInstallationPricing] = useState(false)
  const [showPricingSystemStatus, setShowPricingSystemStatus] = useState(false)
  const [showSupabaseSettings, setShowSupabaseSettings] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState('')

  // Customer info for email/quote
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [emailMessage, setEmailMessage] = useState('')

  // Load billboards on component mount
  useEffect(() => {
    loadBillboards()
  }, [])

  // Apply filters when dependencies change
  useEffect(() => {
    applyFilters()
  }, [
    billboards,
    searchTerm,
    contractFilter,
    selectedMunicipalities,
    selectedSizes,
    selectedAvailabilities,
    user
  ])

  const loadBillboards = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await loadBillboardsFromExcel()
      setBillboards(data)
    } catch (err: any) {
      setError('فشل في تحميل البيانات: ' + err.message)
      console.error('خطأ في تحميل اللوحات:', err)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...billboards]

    // Apply client-specific filtering
    if (user?.assignedClient) {
      filtered = clientService.filterBillboardsByClient(filtered, user.assignedClient)
    }

    // Apply contract number filter
    if (contractFilter.trim()) {
      filtered = clientService.filterBillboardsByContract(filtered, contractFilter)
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(billboard =>
        billboard.name.toLowerCase().includes(term) ||
        billboard.location.toLowerCase().includes(term) ||
        billboard.municipality.toLowerCase().includes(term) ||
        billboard.area.toLowerCase().includes(term) ||
        billboard.size.toLowerCase().includes(term) ||
        billboard.clientName?.toLowerCase().includes(term) ||
        billboard.contractNumber?.toLowerCase().includes(term)
      )
    }

    // Apply municipality filter
    if (selectedMunicipalities.length > 0) {
      filtered = filtered.filter(billboard =>
        selectedMunicipalities.includes(billboard.municipality)
      )
    }

    // Apply size filter
    if (selectedSizes.length > 0) {
      filtered = filtered.filter(billboard =>
        selectedSizes.includes(billboard.size)
      )
    }

    // Apply availability filter
    if (selectedAvailabilities.length > 0) {
      filtered = filtered.filter(billboard =>
        selectedAvailabilities.includes(billboard.status)
      )
    }

    setFilteredBillboards(filtered)
  }

  const toggleBillboardSelection = (billboardId: string) => {
    const newSelected = new Set(selectedBillboards)
    if (newSelected.has(billboardId)) {
      newSelected.delete(billboardId)
    } else {
      newSelected.add(billboardId)
    }
    setSelectedBillboards(newSelected)
  }

  const clearSelection = () => {
    setSelectedBillboards(new Set())
  }

  const selectAll = () => {
    const allIds = new Set(filteredBillboards.map(b => b.id))
    setSelectedBillboards(allIds)
  }

  const handleSendEmail = () => {
    if (selectedBillboards.size === 0) {
      alert('يرجى اختيار لوحة واحدة على الأقل')
      return
    }
    setShowEmailDialog(true)
  }

  const handleCreateQuote = () => {
    if (selectedBillboards.size === 0) {
      alert('يرجى اختيار لوحة واحدة على الأقل')
      return
    }
    setShowQuoteDialog(true)
  }

  const handleCalculatePricing = () => {
    if (selectedBillboards.size === 0) {
      alert('يرجى اختيار لوحة واحدة على الأقل')
      return
    }
    setShowPricingCalculator(true)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleViewImage = (imageUrl: string) => {
    setSelectedImage(imageUrl)
    setShowImageModal(true)
  }

  // Get unique values for filters
  const municipalities = [...new Set(billboards.map(b => b.municipality))].sort()
  const sizes = [...new Set(billboards.map(b => b.size))].sort()
  const contracts = [...new Set(billboards.map(b => b.contractNumber).filter(Boolean))].sort()

  // Check if user has admin permissions
  const isAdmin = user && (user.role === 'admin' || user.permissions?.some(p => p.name === 'admin_access'))

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50">
      <Header 
        onOpenSettings={() => setShowSettings(true)}
        onOpenPricing={() => setShowArabicPricing(true)}
        onOpenInstallationPricing={() => setShowInstallationPricing(true)}
      />

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black text-gray-900 mb-6 tracking-tight leading-tight">
            اللوحات الإعلانية المتاحة في ليبيا
          </h1>
          <p className="text-xl text-gray-700 font-semibold max-w-3xl mx-auto leading-relaxed">
            اكتشف أفضل المواقع الإعلانية في جميع أنحاء ليبيا مع خدماتنا المتميزة والأسعار التنافسية
          </p>
        </div>

        {/* Search and Filters */}
        <SearchFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          contractFilter={contractFilter}
          setContractFilter={setContractFilter}
          selectedMunicipalities={selectedMunicipalities}
          setSelectedMunicipalities={setSelectedMunicipalities}
          selectedSizes={selectedSizes}
          setSelectedSizes={setSelectedSizes}
          selectedAvailabilities={selectedAvailabilities}
          setSelectedAvailabilities={setSelectedAvailabilities}
          viewMode={viewMode}
          setViewMode={setViewMode}
          showMap={showMap}
          setShowMap={setShowMap}
          municipalities={municipalities}
          sizes={sizes}
          contracts={contracts}
          onPrint={handlePrint}
        />

        {/* Admin Tools */}
        {isAdmin && (
          <div className="mb-8">
            <Card className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200">
              <h3 className="text-xl font-bold text-indigo-900 mb-4 flex items-center gap-2">
                <Settings className="w-6 h-6" />
                أدوات الإدارة
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <Button
                  onClick={() => setShowArabicPricing(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white p-4 h-auto flex flex-col items-center gap-2"
                >
                  <DollarSign className="w-6 h-6" />
                  <span className="text-sm font-bold">الأسعار العربية</span>
                </Button>

                <Button
                  onClick={() => setShowEnhancedArabicPricing(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white p-4 h-auto flex flex-col items-center gap-2"
                >
                  <BarChart3 className="w-6 h-6" />
                  <span className="text-sm font-bold">الأسعار المحسنة</span>
                </Button>

                <Button
                  onClick={() => setShowInstallationPricing(true)}
                  className="bg-orange-600 hover:bg-orange-700 text-white p-4 h-auto flex flex-col items-center gap-2"
                >
                  <Wrench className="w-6 h-6" />
                  <span className="text-sm font-bold">أسعار التركيب</span>
                </Button>

                <Button
                  onClick={() => setShowPricingSystemStatus(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-4 h-auto flex flex-col items-center gap-2"
                >
                  <Database className="w-6 h-6" />
                  <span className="text-sm font-bold">حالة النظام</span>
                </Button>

                <Button
                  onClick={() => setShowSupabaseSettings(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 h-auto flex flex-col items-center gap-2"
                >
                  <Settings className="w-6 h-6" />
                  <span className="text-sm font-bold">إعدادات قاعدة البيانات</span>
                </Button>

                <Button
                  onClick={() => setShowSettings(true)}
                  className="bg-gray-600 hover:bg-gray-700 text-white p-4 h-auto flex flex-col items-center gap-2"
                >
                  <Users className="w-6 h-6" />
                  <span className="text-sm font-bold">إدارة المستخدمين</span>
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Pricing Duration Selector */}
        {isAdmin && (
          <div className="mb-8">
            <PricingDurationSelector
              selectedDuration={selectedDuration}
              onDurationChange={setSelectedDuration}
              className="max-w-md mx-auto"
            />
          </div>
        )}

        {/* Selected Billboards Bar */}
        {selectedBillboards.size > 0 && (
          <div className="sticky top-4 z-30 mb-8">
            <Card className="p-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-2xl border-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="font-bold text-sm">{selectedBillboards.size}</span>
                    </div>
                    <span className="font-bold text-lg">
                      {selectedBillboards.size === 1 ? 'لوحة مختارة' : 'لوحة مختارة'}
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={selectAll}
                      variant="outline"
                      size="sm"
                      className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                    >
                      اختيار الكل ({filteredBillboards.length})
                    </Button>
                    <Button
                      onClick={clearSelection}
                      variant="outline"
                      size="sm"
                      className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                    >
                      مسح الاختيار
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleCalculatePricing}
                    className="bg-white text-green-600 hover:bg-gray-100 font-bold"
                  >
                    <Calculator className="w-4 h-4 mr-2" />
                    حساب الأسعار
                  </Button>
                  
                  <Button
                    onClick={handleSendEmail}
                    className="bg-white text-green-600 hover:bg-gray-100 font-bold"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    إرسال قائمة
                  </Button>

                  <Button
                    onClick={handleCreateQuote}
                    className="bg-white text-green-600 hover:bg-gray-100 font-bold"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    إنشاء فاتورة
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Interactive Map */}
        {showMap && (
          <InteractiveMap
            billboards={filteredBillboards}
            onImageView={handleViewImage}
          />
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 font-semibold">جاري تحميل اللوحات الإعلانية...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md mb-8">
            <div className="flex items-center">
              <div className="mr-3">
                <p className="text-red-700 font-semibold">{error}</p>
                <Button
                  onClick={loadBillboards}
                  className="mt-2 bg-red-600 hover:bg-red-700 text-white"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  إعادة المحاولة
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Results Summary */}
        {!loading && !error && (
          <div className="mb-8">
            <Card className="p-4 bg-white/80 backdrop-blur-sm border-2 border-yellow-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Badge className="bg-yellow-500 text-black px-4 py-2 text-lg font-bold">
                    {filteredBillboards.length} لوحة
                  </Badge>
                  <div className="text-sm text-gray-600">
                    من إجمالي {billboards.length} لوحة متاحة
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm">متاح: {filteredBillboards.filter(b => b.status === 'متاح').length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm">قريباً: {filteredBillboards.filter(b => b.status === 'قريباً').length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span className="text-sm">محجوز: {filteredBillboards.filter(b => b.status === 'محجوز').length}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Billboards Grid/List */}
        {!loading && !error && (
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8'
              : 'space-y-6'
          }>
            {filteredBillboards.map((billboard) => (
              <BillboardCard
                key={billboard.id}
                billboard={billboard}
                isSelected={selectedBillboards.has(billboard.id)}
                onToggleSelection={toggleBillboardSelection}
                onViewImage={handleViewImage}
                showPricing={isAdmin}
                selectedDuration={selectedDuration}
                user={user}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredBillboards.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-600 mb-4">لا توجد نتائج</h3>
            <p className="text-gray-500 mb-6">
              لم يتم العثور على لوحات تطابق معايير البحث المحددة
            </p>
            <Button
              onClick={() => {
                setSearchTerm('')
                setContractFilter('')
                setSelectedMunicipalities([])
                setSelectedSizes([])
                setSelectedAvailabilities([])
              }}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
            >
              مسح جميع الفلاتر
            </Button>
          </div>
        )}
      </main>

      <Footer />

      {/* Floating Action Buttons for Database Settings */}
      <div className="fixed bottom-6 left-6 z-40">
        <Button
          onClick={() => setShowSupabaseSettings(true)}
          className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-2xl"
          title="إعدادات قاعدة البيانات"
        >
          <Database className="w-6 h-6" />
        </Button>
      </div>

      {/* Modals */}
      {showEmailDialog && (
        <EmailDialog
          isOpen={showEmailDialog}
          onClose={() => setShowEmailDialog(false)}
          selectedBillboards={selectedBillboards}
          billboards={billboards}
          customerName={customerName}
          setCustomerName={setCustomerName}
          customerEmail={customerEmail}
          setCustomerEmail={setCustomerEmail}
          customerPhone={customerPhone}
          setCustomerPhone={setCustomerPhone}
          emailMessage={emailMessage}
          setEmailMessage={setEmailMessage}
          onSend={() => {
            // Handle email sending logic here
            setShowEmailDialog(false)
          }}
        />
      )}

      {showQuoteDialog && (
        <QuoteDialog
          isOpen={showQuoteDialog}
          onClose={() => setShowQuoteDialog(false)}
          selectedBillboards={selectedBillboards}
          billboards={billboards}
        />
      )}

      {showSettings && (
        <SystemSettings onClose={() => setShowSettings(false)} />
      )}

      {showPricingCalculator && (
        <SimplifiedPricingCalculator
          onClose={() => setShowPricingCalculator(false)}
          selectedBillboards={Array.from(selectedBillboards)}
          allBillboards={billboards}
        />
      )}

      {showArabicPricing && (
        <ArabicPricingManagement onClose={() => setShowArabicPricing(false)} />
      )}

      {showEnhancedArabicPricing && (
        <EnhancedArabicPricingManagement onClose={() => setShowEnhancedArabicPricing(false)} />
      )}

      {showInstallationPricing && (
        <InstallationPricingManagement onClose={() => setShowInstallationPricing(false)} />
      )}

      {showPricingSystemStatus && (
        <PricingSystemStatus onClose={() => setShowPricingSystemStatus(false)} />
      )}

      {showSupabaseSettings && (
        <SimpleSupabaseSettings onClose={() => setShowSupabaseSettings(false)} />
      )}

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <Button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2"
            >
              <X className="w-6 h-6" />
            </Button>
            <img
              src={selectedImage}
              alt="صورة اللوحة الإعلانية"
              className="w-full h-full object-contain rounded-lg"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/roadside-billboard.png";
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}