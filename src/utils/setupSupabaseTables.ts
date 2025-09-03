import { supabase } from '@/supabaseClient'

/**
 * فحص وإنشاء الجداول المطلوبة في Supabase
 */
export async function setupSupabaseTables() {
  if (!supabase) {
    console.error('⚠️ Supabase غير متاح')
    return { success: false, error: 'Supabase غير متاح' }
  }

  try {
    console.log('🔄 فحص وإنشاء الجداول المطلوبة في Supabase...')

    // فحص وإنشاء جدول pricing_ar
    await createPricingArTable()
    
    // فحص وإنشاء جدول users إذا لم يكن موجوداً
    await createUsersTable()

    console.log('✅ تم فحص وإنشاء الجداول بنجاح')
    return { success: true }

  } catch (error: any) {
    console.error('❌ خطأ في إنشاء الجداول:', error)
    return { success: false, error: error.message }
  }
}

/**
 * إنشاء جدول pricing_ar
 */
async function createPricingArTable() {
  try {
    // فحص وجود الجدول
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'pricing_ar')

    if (tablesError) {
      console.log('⚠️ لا يمكن فحص الجداول، سنحاول إنشاء الجدول مباشرة')
    }

    // محاولة إنشاء الجدول
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS pricing_ar (
        id SERIAL PRIMARY KEY,
        "المقاس" TEXT NOT NULL,
        "المستوى" TEXT NOT NULL,
        "الزبون" TEXT NOT NULL,
        "شهر واحد" INTEGER DEFAULT 0,
        "2 أشهر" INTEGER DEFAULT 0,
        "3 أشهر" INTEGER DEFAULT 0,
        "6 أشهر" INTEGER DEFAULT 0,
        "سنة كاملة" INTEGER DEFAULT 0,
        "يوم واحد" INTEGER DEFAULT 0,
        zone_name TEXT DEFAULT '',
        billboard_size TEXT,
        customer_type TEXT,
        ab_type TEXT,
        package_duration INTEGER,
        package_discount INTEGER,
        price INTEGER,
        currency TEXT DEFAULT 'د.ل',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE("المقاس", "المستوى", "الزبون")
      );
    `

    const { error: createError } = await supabase.rpc('exec_sql', { 
      sql: createTableSQL 
    })

    if (createError) {
      console.log('⚠️ لا يمكن إنشاء الجدول باستخدام RPC، سنحاول إدراج بيانات تجريبية...')
      
      // محاولة إدراج بيانات تجريبية لإنشاء الجدول تلقائياً
      await insertSampleData()
    } else {
      console.log('✅ تم إنشاء جدول pricing_ar بنجاح')
    }

    // إدراج بيانات افتراضية إذا كان الجدول فارغاً
    const { data: existingData, error: selectError } = await supabase
      .from('pricing_ar')
      .select('id')
      .limit(1)

    if (!selectError && (!existingData || existingData.length === 0)) {
      await insertSampleData()
    }

  } catch (error: any) {
    console.warn('⚠️ خطأ في إنشاء جدول pricing_ar:', error.message)
    throw error
  }
}

/**
 * إنشاء جدول users
 */
async function createUsersTable() {
  try {
    const createUsersSQL = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        permissions JSONB DEFAULT '[]',
        assigned_client TEXT,
        pricing_category TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        password TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    const { error: createError } = await supabase.rpc('exec_sql', { 
      sql: createUsersSQL 
    })

    if (createError) {
      console.log('⚠️ لا يمكن إنشاء جدول users باستخدام RPC')
    } else {
      console.log('✅ تم فحص/إنشاء جدول users')
    }

    // إدراج المستخدم الإداري الافتراضي
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('id')
      .eq('username', 'admin')
      .single()

    if (!adminUser && adminError) {
      const { error: insertAdminError } = await supabase
        .from('users')
        .insert([{
          username: 'admin',
          email: 'admin@alfaresaldahabi.com',
          role: 'admin',
          permissions: [
            { id: '1', name: 'view_billboards', description: 'عرض اللوحات الإعلانية' },
            { id: '2', name: 'manage_users', description: 'إدارة المستخدمين' },
            { id: '3', name: 'admin_access', description: 'صلاحيات الإدار�� الكاملة' }
          ],
          is_active: true,
          password: 'aukg-123'
        }])

      if (!insertAdminError) {
        console.log('✅ تم إنشاء المستخدم الإداري الافتراضي')
      }
    }

  } catch (error: any) {
    console.warn('⚠️ خطأ في إنشاء جدول users:', error.message)
  }
}

/**
 * إدراج بيانات تجريبية في جدول pricing_ar
 */
async function insertSampleData() {
  try {
    const sampleData = [
      {
        "المقاس": "13x5",
        "المستوى": "A",
        "الزبون": "عادي",
        "شهر واحد": 24000,
        "2 أشهر": 23000,
        "3 أشهر": 22000,
        "6 أشهر": 21000,
        "سنة كاملة": 20000,
        "يوم واحد": 800,
        billboard_size: "13x5",
        customer_type: "individuals",
        ab_type: "A",
        price: 24000,
        currency: "د.ل"
      },
      {
        "المقاس": "13x5",
        "المستوى": "A",
        "الزبون": "مسوق",
        "شهر واحد": 22000,
        "2 أشهر": 21000,
        "3 أشهر": 20000,
        "6 أشهر": 19000,
        "سنة كاملة": 18000,
        "يوم واحد": 750,
        billboard_size: "13x5",
        customer_type: "marketers",
        ab_type: "A",
        price: 22000,
        currency: "د.ل"
      },
      {
        "المقاس": "13x5",
        "المستوى": "A",
        "الزبون": "شركات",
        "شهر واحد": 20000,
        "2 أشهر": 19000,
        "3 أشهر": 18000,
        "6 أشهر": 17000,
        "سنة كاملة": 16000,
        "يوم واحد": 700,
        billboard_size: "13x5",
        customer_type: "companies",
        ab_type: "A",
        price: 20000,
        currency: "د.ل"
      },
      {
        "المقاس": "12x4",
        "المستوى": "A",
        "الزبون": "عادي",
        "شهر واحد": 21000,
        "2 أشهر": 20000,
        "3 أشهر": 19000,
        "6 أشهر": 18000,
        "سنة كاملة": 17000,
        "يوم واحد": 700,
        billboard_size: "12x4",
        customer_type: "individuals",
        ab_type: "A",
        price: 21000,
        currency: "د.ل"
      },
      {
        "المقاس": "12x4",
        "المستوى": "B",
        "الزبون": "عادي",
        "شهر واحد": 18000,
        "2 أشهر": 17000,
        "3 أشهر": 16000,
        "6 أشهر": 15000,
        "سنة كاملة": 14000,
        "يوم واحد": 600,
        billboard_size: "12x4",
        customer_type: "individuals",
        ab_type: "B",
        price: 18000,
        currency: "د.ل"
      },
      {
        "المقاس": "10x4",
        "المستوى": "A",
        "الزبون": "عادي",
        "شهر واحد": 18000,
        "2 أشهر": 17000,
        "3 أشهر": 16000,
        "6 أشهر": 15000,
        "سنة كاملة": 14000,
        "يوم واحد": 600,
        billboard_size: "10x4",
        customer_type: "individuals",
        ab_type: "A",
        price: 18000,
        currency: "د.ل"
      }
    ]

    const { error: insertError } = await supabase
      .from('pricing_ar')
      .insert(sampleData)

    if (insertError) {
      console.warn('⚠️ خطأ في إدراج البيانات التجريبية:', insertError.message)
    } else {
      console.log('✅ تم إدراج البيانات التجريبية في جدول pricing_ar')
    }

  } catch (error: any) {
    console.warn('⚠️ خطأ في إدراج البيانات التجريبية:', error.message)
  }
}

/**
 * فحص اتصال Supabase
 */
export async function testSupabaseConnection() {
  if (!supabase) {
    return { connected: false, error: 'Supabase client غير متاح' }
  }

  try {
    // اختبار بسيط للاتصال
    const { data, error } = await supabase
      .from('pricing_ar')
      .select('count', { count: 'exact', head: true })

    if (error) {
      return { 
        connected: false, 
        error: error.message,
        details: 'فشل في الوصول لجدول pricing_ar' 
      }
    }

    return { 
      connected: true, 
      rowCount: data?.length || 0,
      message: 'الاتصال بـ Supabase يعمل بنجاح' 
    }

  } catch (error: any) {
    return { 
      connected: false, 
      error: error.message,
      details: 'خطأ في اختبار الاتصال' 
    }
  }
}
