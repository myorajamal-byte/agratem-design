export interface Billboard {
  id: string
  name: string
  location: string
  municipality: string
  city: string
  area: string
  size: string
  level: string
  status: string
  expiryDate: string | null
  coordinates: string
  imageUrl: string
  gpsLink: string
  // Client information
  contractNumber?: string
  clientName?: string
  advertisementType?: string
  // تصنيف السعر (A أو B)
  priceCategory?: PriceListType
}

export interface User {
  id: string
  username: string
  email: string
  role: 'admin' | 'user'
  permissions: Permission[]
  assignedClient?: string // اسم الزبون المخصص للمستخدم
  createdAt: string
  lastLogin?: string
  isActive: boolean
}

export interface Permission {
  id: string
  name: string
  description: string
}

export interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
  isLoading: boolean
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface Client {
  name: string
  contractsCount: number
}

export interface ClientFilter {
  assignedClient?: string
  hasClientRestriction: boolean
}

export interface ContractFilter {
  contractNumber?: string
}

// أنواع البي��نات الخاصة بالأسعار والفواتير
export type BillboardSize = string // جعلها مرنة لإضافة مقاسات جديدة

// إدارة المقاسات
export interface SizeManagement {
  sizes: BillboardSize[]
  addSize: (size: BillboardSize) => boolean
  removeSize: (size: BillboardSize) => boolean
  validateSize: (size: string) => boolean
}

export type CustomerType = 'marketers' | 'individuals' | 'companies'

export type PriceListType = 'A' | 'B'

export type PackageDuration = {
  value: number
  unit: 'month' | 'months' | 'year'
  label: string
  discount: number // نسبة الخصم
}

export interface CustomerTypePricing {
  marketers: Record<BillboardSize, number> // أسعار المسوقين
  individuals: Record<BillboardSize, number> // أسعار العاديين
  companies: Record<BillboardSize, number> // أسعار الشركات
}

// نظام قوائم الأسعار A و B مع المدد
export interface DurationPricing {
  '1': Record<BillboardSize, number> // شهر واحد
  '3': Record<BillboardSize, number> // 3 أشهر
  '6': Record<BillboardSize, number> // 6 أشهر
  '12': Record<BillboardSize, number> // سنة
}

export interface ABPricing {
  A: DurationPricing // قائمة الأسعار A لجميع المدد
  B: DurationPricing // قائمة الأسعار B لجميع المدد
}

export interface PricingZone {
  name: string
  prices: CustomerTypePricing // للنظام القديم
  abPrices: ABPricing // نظام قوائم A و B الجديد
}

export interface PriceList {
  zones: Record<string, PricingZone>
  packages: PackageDuration[]
  currency: string
}

export interface QuoteItem {
  billboardId: string
  name: string
  location: string
  size: BillboardSize
  zone: string
  basePrice: number // السعر الأساسي
  finalPrice: number // السعر النهائي بعد الخصم
  duration: number
  discount: number // نسبة الخصم
  total: number
  imageUrl?: string
}

export interface Quote {
  id: string
  customerInfo: {
    name: string
    email: string
    phone: string
    company?: string
    type: CustomerType
  }
  packageInfo: {
    duration: number
    label: string
    discount: number
  }
  items: QuoteItem[]
  subtotal: number
  totalDiscount: number
  tax: number
  taxRate: number
  total: number
  currency: string
  createdAt: string
  validUntil: string
}

// أنواع البيانات الخاصة بأسعار التركيب
export interface InstallationPriceZone {
  name: string
  prices: Record<BillboardSize, number> // أسعار التركيب حسب المقاس
  multiplier: number // معامل إضافي للمنطقة
  description?: string
}

export interface InstallationPricing {
  zones: Record<string, InstallationPriceZone>
  sizes: BillboardSize[]
  currency: string
  lastUpdated: string
}

export interface InstallationQuoteItem {
  id: string
  size: BillboardSize
  zone: string
  quantity: number
  unitPrice: number
  totalPrice: number
  description?: string
}

export interface InstallationQuote {
  id: string
  date: string
  customerInfo: {
    name: string
    email?: string
    phone?: string
    company?: string
  }
  items: InstallationQuoteItem[]
  subtotal: number
  discount: number
  discountAmount: number
  total: number
  currency: string
  notes?: string
  type: 'installation'
  status: 'draft' | 'sent' | 'approved' | 'rejected'
}
