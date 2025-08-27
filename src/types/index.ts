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
export type BillboardSize = '5x13' | '4x12' | '4x10' | '3x8' | '3x6' | '3x4'

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

// نظام قوائم الأسعار A و B
export interface ABPricing {
  A: Record<BillboardSize, number> // قائمة الأسعار A
  B: Record<BillboardSize, number> // قائمة الأسعار B
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
