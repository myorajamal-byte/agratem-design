import { User, LoginCredentials, Permission } from '@/types'

// صلاحيات النظام
const PERMISSIONS: Permission[] = [
  {
    id: '1',
    name: 'view_billboards',
    description: 'عرض اللوحات الإعلانية'
  },
  {
    id: '2',
    name: 'manage_users',
    description: 'إدارة المستخدمين'
  },
  {
    id: '3',
    name: 'admin_access',
    description: 'صلاحيات الإدارة الكاملة'
  }
]

// المستخدمون الافتراضيون
const DEFAULT_USERS: User[] = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@alfaresaldahabi.com',
    role: 'admin',
    permissions: PERMISSIONS, // جميع الصلاحيات
    createdAt: new Date().toISOString(),
    isActive: true
  }
]

// كلمات المرور (في بيئة الإنتاج يجب تشفيرها)
const USER_PASSWORDS: Record<string, string> = {
  'admin': 'aukg-123'
}

class AuthService {
  private readonly STORAGE_KEY = 'al-fares-auth'
  private readonly USERS_KEY = 'al-fares-users'
  private readonly PASSWORDS_KEY = 'al-fares-passwords'

  constructor() {
    this.initializeDefaultData()
  }

  private initializeDefaultData() {
    // إنشاء البيانات الافتراضية إذا لم تكن موجودة
    if (!localStorage.getItem(this.USERS_KEY)) {
      localStorage.setItem(this.USERS_KEY, JSON.stringify(DEFAULT_USERS))
    }
    if (!localStorage.getItem(this.PASSWORDS_KEY)) {
      localStorage.setItem(this.PASSWORDS_KEY, JSON.stringify(USER_PASSWORDS))
    }
  }

  async login(credentials: LoginCredentials): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const users = this.getUsers()
      const passwords = this.getPasswords()

      const user = users.find(u => u.username === credentials.username && u.isActive)
      
      if (!user) {
        return { success: false, error: 'اسم المستخدم غير صحيح' }
      }

      const storedPassword = passwords[user.username]
      if (storedPassword !== credentials.password) {
        return { success: false, error: 'كلمة المرور غير صحيحة' }
      }

      // تحديث آخر تسجيل دخول
      user.lastLogin = new Date().toISOString()
      this.updateUser(user)

      // حفظ حالة تسجيل الدخول
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user))
      
      return { success: true, user }
    } catch (error) {
      console.error('خطأ في تسجيل الدخول:', error)
      return { success: false, error: 'حدث خطأ في تسجيل الدخول' }
    }
  }

  logout(): void {
    localStorage.removeItem(this.STORAGE_KEY)
  }

  getCurrentUser(): User | null {
    try {
      const userData = localStorage.getItem(this.STORAGE_KEY)
      if (!userData) return null
      
      const user = JSON.parse(userData) as User
      // التحقق من أن المستخدم لا يزال نشطاً
      const users = this.getUsers()
      const currentUser = users.find(u => u.id === user.id)
      
      return currentUser && currentUser.isActive ? currentUser : null
    } catch {
      return null
    }
  }

  getUsers(): User[] {
    try {
      const usersData = localStorage.getItem(this.USERS_KEY)
      return usersData ? JSON.parse(usersData) : DEFAULT_USERS
    } catch {
      return DEFAULT_USERS
    }
  }

  getPasswords(): Record<string, string> {
    try {
      const passwordsData = localStorage.getItem(this.PASSWORDS_KEY)
      return passwordsData ? JSON.parse(passwordsData) : USER_PASSWORDS
    } catch {
      return USER_PASSWORDS
    }
  }

  addUser(userData: Omit<User, 'id' | 'createdAt'>, password: string): { success: boolean; error?: string } {
    try {
      const users = this.getUsers()
      const passwords = this.getPasswords()

      // التحقق من عدم وجود اسم المستخدم
      if (users.some(u => u.username === userData.username)) {
        return { success: false, error: 'اسم المستخدم موجود بالفعل' }
      }

      // التحقق من عدم وجود البريد الإلكتروني
      if (users.some(u => u.email === userData.email)) {
        return { success: false, error: 'البريد الإلكتروني موجود بالفعل' }
      }

      const newUser: User = {
        ...userData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      }

      users.push(newUser)
      passwords[newUser.username] = password

      localStorage.setItem(this.USERS_KEY, JSON.stringify(users))
      localStorage.setItem(this.PASSWORDS_KEY, JSON.stringify(passwords))

      return { success: true }
    } catch (error) {
      console.error('خطأ في إضافة المستخدم:', error)
      return { success: false, error: 'حدث خطأ في إضافة المستخدم' }
    }
  }

  updateUser(updatedUser: User): { success: boolean; error?: string } {
    try {
      const users = this.getUsers()
      const userIndex = users.findIndex(u => u.id === updatedUser.id)
      
      if (userIndex === -1) {
        return { success: false, error: 'المستخدم غير موجود' }
      }

      users[userIndex] = updatedUser
      localStorage.setItem(this.USERS_KEY, JSON.stringify(users))

      // تحديث المستخدم الحالي إذا كان هو نفسه
      const currentUser = this.getCurrentUser()
      if (currentUser && currentUser.id === updatedUser.id) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedUser))
      }

      return { success: true }
    } catch (error) {
      console.error('خطأ في تحديث المستخدم:', error)
      return { success: false, error: 'حدث خطأ في تحديث المستخدم' }
    }
  }

  updatePassword(username: string, newPassword: string): { success: boolean; error?: string } {
    try {
      const passwords = this.getPasswords()
      passwords[username] = newPassword
      localStorage.setItem(this.PASSWORDS_KEY, JSON.stringify(passwords))
      return { success: true }
    } catch (error) {
      console.error('خطأ في تحديث كلمة المرور:', error)
      return { success: false, error: 'حدث خطأ في تحديث كلمة المرور' }
    }
  }

  deleteUser(userId: string): { success: boolean; error?: string } {
    try {
      const users = this.getUsers()
      const passwords = this.getPasswords()
      
      const userToDelete = users.find(u => u.id === userId)
      if (!userToDelete) {
        return { success: false, error: 'المستخدم غير موجود' }
      }

      // منع حذف المستخدم الإداري الأساسي
      if (userToDelete.username === 'admin') {
        return { success: false, error: 'لا يمكن حذف المستخدم الإداري الأساسي' }
      }

      const updatedUsers = users.filter(u => u.id !== userId)
      delete passwords[userToDelete.username]

      localStorage.setItem(this.USERS_KEY, JSON.stringify(updatedUsers))
      localStorage.setItem(this.PASSWORDS_KEY, JSON.stringify(passwords))

      return { success: true }
    } catch (error) {
      console.error('خطأ في حذف المستخدم:', error)
      return { success: false, error: 'حدث خطأ في حذف المستخدم' }
    }
  }

  getPermissions(): Permission[] {
    return PERMISSIONS
  }

  hasPermission(user: User | null, permissionName: string): boolean {
    if (!user) return false
    return user.permissions.some(p => p.name === permissionName)
  }
}

export const authService = new AuthService()
