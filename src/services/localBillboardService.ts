import { Billboard } from '@/types'

// بيانات تجريبية محلية للوحات الإعلانية
const LOCAL_BILLBOARDS: Billboard[] = [
  {
    id: '1',
    name: 'لوحة مدخل مصراتة الشرقي',
    location: 'شارع طرابلس الرئيسي',
    municipality: 'مصراتة',
    city: 'مصراتة',
    area: 'مصراتة',
    size: '5x13',
    level: 'A',
    status: 'متاح',
    expiryDate: null,
    coordinates: '32.3745,15.0919',
    imageUrl: 'https://lh3.googleusercontent.com/d/13yTnaEWp2tFSxCmg8AuXH1e9QvPNMYWq',
    gpsLink: 'https://maps.google.com/?q=32.3745,15.0919',
    priceCategory: 'A'
  },
  {
    id: '2',
    name: 'لوحة وسط البلد',
    location: 'ميدان الشهداء',
    municipality: 'مصراتة',
    city: 'مصراتة',
    area: 'مصراتة',
    size: '4x12',
    level: 'A',
    status: 'محجوز',
    expiryDate: '2024-12-15',
    coordinates: '32.3745,15.0919',
    imageUrl: 'https://lh3.googleusercontent.com/d/13yTnaEWp2tFSxCmg8AuXH1e9QvPNMYWq',
    gpsLink: 'https://maps.google.com/?q=32.3745,15.0919',
    contractNumber: 'C-001',
    clientName: 'شركة الإعلانات المتطورة',
    advertisementType: 'إعلان تجاري',
    priceCategory: 'A'
  },
  {
    id: '3',
    name: 'لوحة طريق المطار',
    location: 'طريق المطار الدولي',
    municipality: 'مصراتة',
    city: 'مصراتة',
    area: 'مصراتة',
    size: '4x10',
    level: 'B',
    status: 'قريباً',
    expiryDate: '2024-09-30',
    coordinates: '32.3745,15.0919',
    imageUrl: 'https://lh3.googleusercontent.com/d/13yTnaEWp2tFSxCmg8AuXH1e9QvPNMYWq',
    gpsLink: 'https://maps.google.com/?q=32.3745,15.0919',
    contractNumber: 'C-002',
    clientName: 'مؤسسة النجم الذهبي',
    advertisementType: 'إعلان خدمي',
    priceCategory: 'B'
  },
  {
    id: '4',
    name: 'لوحة شارع قرطاجنة',
    location: 'شارع قرطاجنة التجاري',
    municipality: 'أبو سليم',
    city: 'طرابلس',
    area: 'أبو سليم',
    size: '3x8',
    level: 'A',
    status: 'متاح',
    expiryDate: null,
    coordinates: '32.7767,13.1857',
    imageUrl: 'https://lh3.googleusercontent.com/d/13yTnaEWp2tFSxCmg8AuXH1e9QvPNMYWq',
    gpsLink: 'https://maps.google.com/?q=32.7767,13.1857',
    priceCategory: 'A'
  },
  {
    id: '5',
    name: 'لوحة دوار العجيلات',
    location: 'دوار العجيلات الرئيسي',
    municipality: 'أبو سليم',
    city: 'طرابلس',
    area: 'أبو سليم',
    size: '3x6',
    level: 'B',
    status: 'متاح',
    expiryDate: null,
    coordinates: '32.7767,13.1857',
    imageUrl: 'https://lh3.googleusercontent.com/d/13yTnaEWp2tFSxCmg8AuXH1e9QvPNMYWq',
    gpsLink: 'https://maps.google.com/?q=32.7767,13.1857',
    priceCategory: 'B'
  },
  {
    id: '6',
    name: 'لوحة شارع الجمهورية',
    location: 'شارع الجمهورية الرئيسي',
    municipality: 'شركات',
    city: 'طرابلس',
    area: 'الشط',
    size: '5x13',
    level: 'A',
    status: 'محجوز',
    expiryDate: '2024-11-20',
    coordinates: '32.8872,13.1913',
    imageUrl: 'https://lh3.googleusercontent.com/d/13yTnaEWp2tFSxCmg8AuXH1e9QvPNMYWq',
    gpsLink: 'https://maps.google.com/?q=32.8872,13.1913',
    contractNumber: 'C-003',
    clientName: 'شركة التسويق الحديث',
    advertisementType: 'إعلان تجاري',
    priceCategory: 'A'
  },
  {
    id: '7',
    name: 'لوحة طريق السواني',
    location: 'طريق السواني السريع',
    municipality: 'شركات',
    city: 'طرابلس',
    area: 'الشط',
    size: '4x12',
    level: 'A',
    status: 'متاح',
    expiryDate: null,
    coordinates: '32.8872,13.1913',
    imageUrl: 'https://lh3.googleusercontent.com/d/13yTnaEWp2tFSxCmg8AuXH1e9QvPNMYWq',
    gpsLink: 'https://maps.google.com/?q=32.8872,13.1913',
    priceCategory: 'A'
  },
  {
    id: '8',
    name: 'لوحة منطقة إجرامات',
    location: 'شارع إجرامات الرئيسي',
    municipality: 'إجرامات',
    city: 'إجرامات',
    area: 'إجرامات',
    size: '3x4',
    level: 'B',
    status: 'متاح',
    expiryDate: null,
    coordinates: '32.9033,13.1964',
    imageUrl: 'https://lh3.googleusercontent.com/d/13yTnaEWp2tFSxCmg8AuXH1e9QvPNMYWq',
    gpsLink: 'https://maps.google.com/?q=32.9033,13.1964',
    priceCategory: 'B'
  },
  {
    id: '9',
    name: 'لوحة مدخل زليتن',
    location: 'مدخل مدينة زليتن',
    municipality: 'زليتن',
    city: 'زليتن',
    area: 'زليتن',
    size: '4x10',
    level: 'A',
    status: 'متاح',
    expiryDate: null,
    coordinates: '32.4673,14.5687',
    imageUrl: 'https://lh3.googleusercontent.com/d/13yTnaEWp2tFSxCmg8AuXH1e9QvPNMYWq',
    gpsLink: 'https://maps.google.com/?q=32.4673,14.5687',
    priceCategory: 'A'
  },
  {
    id: '10',
    name: 'لوحة بنغازي المركزية',
    location: 'شارع جمال عبد الناصر',
    municipality: 'بنغازي',
    city: 'بنغازي',
    area: 'بنغازي',
    size: '5x13',
    level: 'A',
    status: 'محجوز',
    expiryDate: '2024-10-15',
    coordinates: '32.1167,20.0667',
    imageUrl: 'https://lh3.googleusercontent.com/d/13yTnaEWp2tFSxCmg8AuXH1e9QvPNMYWq',
    gpsLink: 'https://maps.google.com/?q=32.1167,20.0667',
    contractNumber: 'C-004',
    clientName: 'مكتب الإعلان الشرقي',
    advertisementType: 'إعلان ثقافي',
    priceCategory: 'A'
  }
]

/**
 * خدمة البيانات المحلية للوحات الإعلانية
 * بديل موثوق عن Google Sheets
 */
class LocalBillboardService {
  private readonly STORAGE_KEY = 'al-fares-billboards-local'

  constructor() {
    this.initializeLocalData()
  }

  /**
   * تهيئة البيانات المحلية
   */
  private initializeLocalData() {
    if (!localStorage.getItem(this.STORAGE_KEY)) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(LOCAL_BILLBOARDS))
    }
  }

  /**
   * الحصول على جميع اللوحات
   */
  getBillboards(): Promise<Billboard[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const data = localStorage.getItem(this.STORAGE_KEY)
          const billboards = data ? JSON.parse(data) : LOCAL_BILLBOARDS
          resolve(billboards)
        } catch (error) {
          console.error('خطأ في تحميل البيانات المحلية:', error)
          resolve(LOCAL_BILLBOARDS)
        }
      }, 100) // محاكاة وقت التحميل
    })
  }

  /**
   * إضافة لوحة جديدة
   */
  addBillboard(billboard: Omit<Billboard, 'id'>): Billboard {
    const newBillboard: Billboard = {
      ...billboard,
      id: Date.now().toString()
    }

    const billboards = this.getBillboardsSync()
    billboards.push(newBillboard)
    this.saveBillboards(billboards)

    return newBillboard
  }

  /**
   * تحديث لوحة موجودة
   */
  updateBillboard(id: string, updates: Partial<Billboard>): boolean {
    const billboards = this.getBillboardsSync()
    const index = billboards.findIndex(b => b.id === id)

    if (index === -1) return false

    billboards[index] = { ...billboards[index], ...updates }
    this.saveBillboards(billboards)
    return true
  }

  /**
   * حذف لوحة
   */
  deleteBillboard(id: string): boolean {
    const billboards = this.getBillboardsSync()
    const index = billboards.findIndex(b => b.id === id)

    if (index === -1) return false

    billboards.splice(index, 1)
    this.saveBillboards(billboards)
    return true
  }

  /**
   * البحث في اللوحات
   */
  searchBillboards(query: string): Billboard[] {
    const billboards = this.getBillboardsSync()
    const searchTerm = query.toLowerCase().trim()

    if (!searchTerm) return billboards

    return billboards.filter(billboard =>
      billboard.name.toLowerCase().includes(searchTerm) ||
      billboard.location.toLowerCase().includes(searchTerm) ||
      billboard.municipality.toLowerCase().includes(searchTerm) ||
      billboard.area.toLowerCase().includes(searchTerm) ||
      billboard.size.toLowerCase().includes(searchTerm) ||
      billboard.clientName?.toLowerCase().includes(searchTerm) ||
      billboard.contractNumber?.toLowerCase().includes(searchTerm)
    )
  }

  /**
   * فلترة اللوحات
   */
  filterBillboards(filters: {
    municipalities?: string[]
    sizes?: string[]
    statuses?: string[]
    clientName?: string
  }): Billboard[] {
    const billboards = this.getBillboardsSync()

    return billboards.filter(billboard => {
      // فلتر البلديات
      if (filters.municipalities && filters.municipalities.length > 0) {
        if (!filters.municipalities.includes(billboard.municipality)) {
          return false
        }
      }

      // فلتر المقاسات
      if (filters.sizes && filters.sizes.length > 0) {
        if (!filters.sizes.includes(billboard.size)) {
          return false
        }
      }

      // فلتر الحالات
      if (filters.statuses && filters.statuses.length > 0) {
        if (!filters.statuses.includes(billboard.status)) {
          return false
        }
      }

      // فلتر اسم العميل
      if (filters.clientName) {
        const clientFilter = filters.clientName.toLowerCase()
        if (!billboard.clientName?.toLowerCase().includes(clientFilter)) {
          return false
        }
      }

      return true
    })
  }

  /**
   * الحصول على البيانات بشكل متزامن
   */
  private getBillboardsSync(): Billboard[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY)
      return data ? JSON.parse(data) : LOCAL_BILLBOARDS
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error)
      return LOCAL_BILLBOARDS
    }
  }

  /**
   * حفظ البيانات
   */
  private saveBillboards(billboards: Billboard[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(billboards))
    } catch (error) {
      console.error('خطأ في حفظ البيانات:', error)
    }
  }

  /**
   * إعادة تعيين البيانات للافتراضية
   */
  resetToDefault(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(LOCAL_BILLBOARDS))
  }

  /**
   * الحصول على إحصائيات
   */
  getStats(): {
    total: number
    available: number
    booked: number
    expiringSoon: number
    byMunicipality: Record<string, number>
    bySize: Record<string, number>
  } {
    const billboards = this.getBillboardsSync()
    const today = new Date()
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)

    const stats = {
      total: billboards.length,
      available: 0,
      booked: 0,
      expiringSoon: 0,
      byMunicipality: {} as Record<string, number>,
      bySize: {} as Record<string, number>
    }

    billboards.forEach(billboard => {
      // إحصائيات الحالة
      if (billboard.status === 'متاح') stats.available++
      if (billboard.status === 'محجوز') stats.booked++

      // اللوحات التي تنتهي قريباً
      if (billboard.expiryDate) {
        const expiryDate = new Date(billboard.expiryDate)
        if (expiryDate <= thirtyDaysFromNow && expiryDate >= today) {
          stats.expiringSoon++
        }
      }

      // إحصائيات البلديات
      stats.byMunicipality[billboard.municipality] = 
        (stats.byMunicipality[billboard.municipality] || 0) + 1

      // إحصائيات المقاسات
      stats.bySize[billboard.size] = 
        (stats.bySize[billboard.size] || 0) + 1
    })

    return stats
  }
}

// إنشاء نسخة مفردة من الخدمة
export const localBillboardService = new LocalBillboardService()

// تصدير الدالة المحسنة لتحميل اللوحات
export const loadBillboardsFromLocal = () => localBillboardService.getBillboards()
