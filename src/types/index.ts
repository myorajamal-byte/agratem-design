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

// أنواع البيانات الخاصة بالأسعار والفواتير
export type BillboardSize = '5x13' | '4x12' | '4x10' | '3x8' | '3x6' | '3x4'

export type CustomerType = 'marketers' | 'individuals' | 'companies'

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

export interface PricingZone {
  name: string
  prices: CustomerTypePricing
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
  price: number
  duration: number
  total: number
}

export interface Quote {
  id: string
  customerInfo: {
    name: string
    email: string
    phone: string
    company?: string
  }
  items: QuoteItem[]
  subtotal: number
  tax: number
  taxRate: number
  total: number
  currency: string
  unit: string
  duration: number
  createdAt: string
  validUntil: string
}
