/**
 * مكتبة التعامل مع التواريخ
 * تضمن استخدام التقويم الميلادي (الجرجوري) بدلاً من الهجري
 */

/**
 * تنسيق التاريخ بالتقويم الميلادي مع اللغة العربية
 * @param date التاريخ (Date object أو string)
 * @param options خيارات التنسيق الإضافية
 * @returns التاريخ منسق بالميلادي العربي
 */
export const formatGregorianDate = (
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  // التأ��د من صحة التاريخ
  if (isNaN(dateObj.getTime())) {
    return 'تاريخ غير صحيح'
  }

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...options
  }

  // فرض استخدام التقويم الميلادي (الجرجوري)
  return new Intl.DateTimeFormat('ar-SA-u-ca-gregory', defaultOptions).format(dateObj)
}

/**
 * تنسيق التاريخ بصيغة مختصرة (يوم/شهر/سنة)
 * @param date التاريخ
 * @returns التاريخ منسق بصيغة مختصرة
 */
export const formatShortDate = (date: Date | string): string => {
  return formatGregorianDate(date, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

/**
 * تنسيق التاريخ بصيغة طويلة (يوم الأسبوع، يوم شهر سنة)
 * @param date التاريخ
 * @returns التاريخ منسق بصيغة طويلة
 */
export const formatLongDate = (date: Date | string): string => {
  return formatGregorianDate(date, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * تنسيق التاريخ والوقت
 * @param date التاريخ
 * @returns التاريخ والوقت منسق
 */
export const formatDateTime = (date: Date | string): string => {
  return formatGregorianDate(date, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

/**
 * تنسيق الوقت فقط
 * @param date التاريخ
 * @returns الوقت منسق
 */
export const formatTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(dateObj.getTime())) {
    return 'وقت غير صحيح'
  }

  return new Intl.DateTimeFormat('ar-SA-u-ca-gregory', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(dateObj)
}

/**
 * تنسيق التاريخ للطباعة والفواتير
 * @param date التاريخ
 * @returns التاريخ منسق للطباعة
 */
export const formatDateForPrint = (date: Date | string): string => {
  return formatGregorianDate(date, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * حساب الفرق بين تاريخين بالأيام
 * @param date1 التاريخ الأول
 * @param date2 التاريخ الثاني
 * @returns الفرق بالأيام
 */
export const getDaysDifference = (date1: Date | string, date2: Date | string): number => {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2
  
  const diffTime = Math.abs(d2.getTime() - d1.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * إضافة أيام إلى تاريخ
 * @param date التاريخ الأساسي
 * @param days عدد الأيام المراد إضافتها
 * @returns التاريخ الجديد
 */
export const addDays = (date: Date | string, days: number): Date => {
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date)
  dateObj.setDate(dateObj.getDate() + days)
  return dateObj
}

/**
 * إضافة أشهر إلى تاريخ
 * @param date التاريخ الأساسي
 * @param months عدد الأشهر المراد إضافتها
 * @returns التاريخ الجديد
 */
export const addMonths = (date: Date | string, months: number): Date => {
  const dateObj = typeof date === 'string' ? new Date(date) : new Date(date)
  dateObj.setMonth(dateObj.getMonth() + months)
  return dateObj
}

/**
 * الحصول على تاريخ اليوم بصيغة ISO (YYYY-MM-DD)
 * @returns تاريخ اليوم
 */
export const getTodayISO = (): string => {
  return new Date().toISOString().split('T')[0]
}

/**
 * التحقق من صحة التاريخ
 * @param date التاريخ المراد التحقق منه
 * @returns true إذا كان التاريخ صحيح
 */
export const isValidDate = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return !isNaN(dateObj.getTime())
}

/**
 * تحويل تاريخ من صيغة ISO إلى نص عربي
 * @param isoDate التاريخ بصيغة ISO
 * @returns التاريخ بالعربية
 */
export const isoToArabicDate = (isoDate: string): string => {
  if (!isoDate) return ''
  return formatShortDate(isoDate)
}

/**
 * تنسيق مدة انتهاء الصلاحية
 * @param expiryDate تاريخ انتهاء الصلاحية
 * @returns نص يصف حالة الانتهاء
 */
export const formatExpiryStatus = (expiryDate: Date | string): {
  text: string
  color: 'green' | 'yellow' | 'red' | 'gray'
  daysRemaining: number
} => {
  if (!expiryDate) {
    return { text: 'غير محدد', color: 'gray', daysRemaining: 0 }
  }

  const today = new Date()
  const expiry = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate
  const daysRemaining = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (daysRemaining < 0) {
    return { text: `منتهي منذ ${Math.abs(daysRemaining)} يوم`, color: 'red', daysRemaining }
  } else if (daysRemaining === 0) {
    return { text: 'ينتهي اليوم', color: 'red', daysRemaining }
  } else if (daysRemaining <= 7) {
    return { text: `${daysRemaining} يوم متبقي`, color: 'red', daysRemaining }
  } else if (daysRemaining <= 30) {
    return { text: `${daysRemaining} يوم متبقي`, color: 'yellow', daysRemaining }
  } else {
    return { text: `${daysRemaining} يوم متبقي`, color: 'green', daysRemaining }
  }
}
