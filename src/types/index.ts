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
