import React, { useState } from 'react'
import { 
  BookOpen, 
  Calculator, 
  DollarSign, 
  Clock, 
  MapPin, 
  Users, 
  Building2, 
  Wrench,
  FileText,
  CheckCircle,
  ArrowRight,
  PlayCircle,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface PricingSystemGuideProps {
  onClose: () => void
}

const PricingSystemGuide: React.FC<PricingSystemGuideProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'daily' | 'package' | 'calculator' | 'examples'>('overview')

  const tabs = [
    { id: 'overview', label: 'نظرة عامة', icon: BookOpen },
    { id: 'daily', label: 'التسعير اليومي', icon: Clock },
    { id: 'package', label: 'تسعير الباقات', icon: Building2 },
    { id: 'calculator', label: 'الحاسبة المبسطة', icon: Calculator },
    { id: 'examples', label: 'أمثلة عملية', icon: PlayCircle }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">نظام تسعير اللوحات الإعلانية</h2>
              <p className="text-gray-600">نظام شامل ومتطور لحساب أسعار اللوحات الإعلانية وإصدار عروض الأسعار والفواتير</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4 border-2 border-blue-200 bg-blue-50">
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="w-6 h-6 text-blue-600" />
                  <h3 className="font-bold text-blue-900">التسعير اليومي</h3>
                </div>
                <p className="text-sm text-blue-700 mb-3">للحجوزات قصيرة المدى والمرونة في التحكم بعدد الأيام</p>
                <div className="space-y-1 text-xs text-blue-600">
                  <div>• حساب حسب عدد الأيام</div>
                  <div>• سعر مختلف لكل فئة عملاء</div>
                  <div>• إضافة تكلفة التركيب</div>
                </div>
              </Card>

              <Card className="p-4 border-2 border-green-200 bg-green-50">
                <div className="flex items-center gap-3 mb-3">
                  <Building2 className="w-6 h-6 text-green-600" />
                  <h3 className="font-bold text-green-900">تسعير الباقات</h3>
                </div>
                <p className="text-sm text-green-700 mb-3">للحجوزات طويلة المدى مع خصومات مُدمجة</p>
                <div className="space-y-1 text-xs text-green-600">
                  <div>• باقات ثابتة (شهر، 3 أشهر، 6 أشهر، سنة)</div>
                  <div>• خصومات تلقائية للمدد الطويلة</div>
                  <div>• تكلفة التركيب مُدمجة</div>
                </div>
              </Card>

              <Card className="p-4 border-2 border-purple-200 bg-purple-50">
                <div className="flex items-center gap-3 mb-3">
                  <MapPin className="w-6 h-6 text-purple-600" />
                  <h3 className="font-bold text-purple-900">معاملات البلديات</h3>
                </div>
                <p className="text-sm text-purple-700 mb-3">أسعار مختلفة حسب موقع اللوحة والبلدية</p>
                <div className="space-y-1 text-xs text-purple-600">
                  <div>• معامل ضرب لكل بلدية</div>
                  <div>• تحديث تلقائي من ملف الإكسل</div>
                  <div>• مزامنة المناطق الجديدة</div>
                </div>
              </Card>

              <Card className="p-4 border-2 border-orange-200 bg-orange-50">
                <div className="flex items-center gap-3 mb-3">
                  <Users className="w-6 h-6 text-orange-600" />
                  <h3 className="font-bold text-orange-900">فئات العملاء</h3>
                </div>
                <p className="text-sm text-orange-700 mb-3">أسعار مخصصة حسب نوع العميل</p>
                <div className="space-y-1 text-xs text-orange-600">
                  <div>• أفراد: السعر الأساسي</div>
                  <div>• شركات: علاوة 15%</div>
                  <div>• مسوقين: خصم 15%</div>
                </div>
              </Card>
            </div>

            <Card className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300">
              <div className="flex items-center gap-3 mb-3">
                <Calculator className="w-6 h-6 text-amber-600" />
                <h3 className="font-bold text-amber-900">الحاسبة المبسطة - الأداة الرئيسية</h3>
              </div>
              <p className="text-sm text-amber-700 mb-3">
                أداة سهلة الاستخدام لحساب الأسعار بسرعة وإنشاء عروض الأسعار الاحترافية
              </p>
              <div className="flex items-center gap-2">
                <Badge className="bg-amber-200 text-amber-800">سهل الاستخدام</Badge>
                <Badge className="bg-amber-200 text-amber-800">إنشاء عروض فورية</Badge>
                <Badge className="bg-amber-200 text-amber-800">حساب تلقائي</Badge>
              </div>
            </Card>
          </div>
        )

      case 'daily':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">التسعير اليومي</h2>
              <p className="text-gray-600">للحجوزات المرنة وقصيرة المدى</p>
            </div>

            <Card className="p-4 bg-blue-50 border-2 border-blue-200">
              <h3 className="font-bold text-blue-900 mb-3">معادلة التسعير اليومي:</h3>
              <div className="bg-white p-4 rounded-lg border-2 border-blue-300 text-center">
                <div className="text-lg font-mono text-blue-900">
                  السعر النهائي = (السعر الأساسي × معامل البلدية × عدد الأيام) + تكلفة التركيب
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <ArrowRight className="w-4 h-4" />
                  المدخلات المطلوبة:
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-600" />
                    <span>مقاس اللوحة (5x13، 4x12، إلخ)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-gray-600">A/B</Badge>
                    <span>المستوى (A مميز، B عادي)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-600" />
                    <span>البلدية (مع معامل الضرب)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-600" />
                    <span>نوع العميل (فرد/شركة/مسوق)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-600" />
                    <span>عدد الأيام</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-gray-600" />
                    <span>تكلفة التركيب (اختياري)</span>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  مثال عملي:
                </h4>
                <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1">
                  <div>📏 المقاس: 5x13</div>
                  <div>🏷️ المستوى: A</div>
                  <div>📍 البلدية: مصراتة (معامل 1.0)</div>
                  <div>👤 العميل: فرد</div>
                  <div>📅 المدة: 30 يوم</div>
                  <div>🔧 التركيب: 500 د.ل</div>
                  <hr className="my-2" />
                  <div className="font-bold text-blue-600">
                    الحساب: (3500 × 1.0 × 30) + 500 = 105,500 د.ل
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-4 bg-green-50 border-2 border-green-200">
              <h4 className="font-bold text-green-900 mb-2">متى تستخدم التسعير اليومي؟</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="text-green-700">✅ حملات قصيرة المدى</div>
                <div className="text-green-700">✅ عروض موسمية</div>
                <div className="text-green-700">✅ مرونة في التحكم بالمدة</div>
              </div>
            </Card>
          </div>
        )

      case 'package':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">تسعير الباقات</h2>
              <p className="text-gray-600">للحجوزات طويلة المدى مع خصومات تلقائية</p>
            </div>

            <Card className="p-4 bg-green-50 border-2 border-green-200">
              <h3 className="font-bold text-green-900 mb-3">معادلة تسعير الباقات:</h3>
              <div className="bg-white p-4 rounded-lg border-2 border-green-300 text-center">
                <div className="text-lg font-mono text-green-900">
                  السعر النهائي = سعر الباقة × معامل البلدية - خصم العميل
                </div>
                <div className="text-sm text-green-700 mt-2">(تكلفة التركيب مُدمجة تلقائياً)</div>
              </div>
            </Card>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { duration: 'شهر واحد', days: 30, discount: 0, color: 'blue' },
                { duration: '3 أشهر', days: 90, discount: 5, color: 'green' },
                { duration: '6 أشهر', days: 180, discount: 10, color: 'orange' },
                { duration: 'سنة كاملة', days: 365, discount: 20, color: 'purple' }
              ].map((pkg, index) => (
                <Card key={index} className={`p-3 border-2 border-${pkg.color}-200 bg-${pkg.color}-50`}>
                  <div className={`text-center text-${pkg.color}-900`}>
                    <div className="font-bold text-lg">{pkg.duration}</div>
                    <div className="text-sm">{pkg.days} يوم</div>
                    {pkg.discount > 0 && (
                      <Badge className={`bg-${pkg.color}-200 text-${pkg.color}-800 mt-2`}>
                        خصم {pkg.discount}%
                      </Badge>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <ArrowRight className="w-4 h-4" />
                  المدخلات المطلوبة:
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-600" />
                    <span>نوع الباقة (شهر/3أشهر/6أشهر/سنة)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-600" />
                    <span>مقاس اللوحة + المستوى</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-600" />
                    <span>البلدية (معامل ضرب)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-600" />
                    <span>نوع العميل (فرد/شركة/مسوق)</span>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  مثال - باقة 6 أشهر:
                </h4>
                <div className="bg-gray-50 p-3 rounded-lg text-sm space-y-1">
                  <div>📏 المقاس: 4x12</div>
                  <div>🏷️ المستوى: B</div>
                  <div>📍 البلدية: بنغازي (معامل 1.2)</div>
                  <div>👤 العميل: شركة</div>
                  <div>📦 الباقة: 6 أشهر (خصم 10%)</div>
                  <hr className="my-2" />
                  <div className="space-y-1">
                    <div>السعر الأساسي: 3800 د.ل</div>
                    <div>بعد معامل البلدية: 4560 د.ل</div>
                    <div>خصم الباقة (10%): -456 د.ل</div>
                    <div className="font-bold text-green-600">النهائي: 4104 د.ل</div>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-4 bg-purple-50 border-2 border-purple-200">
              <h4 className="font-bold text-purple-900 mb-2">مزايا تسعير الباقات:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-purple-700">
                <div>💰 خصومات تلقائية للمدد الطويلة</div>
                <div>🔧 تكلفة التركيب مُدمجة</div>
                <div>📊 أسعار ثابتة ومحددة مسبقاً</div>
              </div>
            </Card>
          </div>
        )

      case 'calculator':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calculator className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">الحاسبة المبسطة</h2>
              <p className="text-gray-600">أداة سهلة وسريعة لحساب الأسعار وإنشاء العروض</p>
            </div>

            <Card className="p-6 bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200">
              <h3 className="font-bold text-emerald-900 mb-4 text-center">✨ لماذا تستخدم الحاسبة المبسطة؟</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-emerald-800 font-semibold">واجهة بسيطة ومفهومة</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-emerald-800 font-semibold">حساب تلقائي فوري</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-emerald-800 font-semibold">إنشاء عروض أسعار احترافية</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-emerald-800 font-semibold">تفصيل كامل للحسابات</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-emerald-800 font-semibold">طباعة مباشرة للعروض</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-emerald-800 font-semibold">حفظ معلومات العملاء</span>
                  </div>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4 text-center border-2 border-blue-200 bg-blue-50">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold text-lg">1</span>
                </div>
                <h4 className="font-bold text-blue-900 mb-2">اختر النوع</h4>
                <p className="text-sm text-blue-700">حدد نوع التسعير (يومي أو باقة)</p>
              </Card>

              <Card className="p-4 text-center border-2 border-green-200 bg-green-50">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold text-lg">2</span>
                </div>
                <h4 className="font-bold text-green-900 mb-2">املأ البيانات</h4>
                <p className="text-sm text-green-700">أدخل مواصفات اللوحة ومعلومات العميل</p>
              </Card>

              <Card className="p-4 text-center border-2 border-purple-200 bg-purple-50">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold text-lg">3</span>
                </div>
                <h4 className="font-bold text-purple-900 mb-2">احصل على العرض</h4>
                <p className="text-sm text-purple-700">شاهد السعر النهائي وأنشئ عرض السعر</p>
              </Card>
            </div>

            <Card className="p-4 bg-yellow-50 border-2 border-yellow-300">
              <h4 className="font-bold text-yellow-900 mb-3 flex items-center gap-2">
                <PlayCircle className="w-5 h-5" />
                كيفية الوصول للحاسبة:
              </h4>
              <div className="space-y-2 text-sm text-yellow-800">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-yellow-600 text-white rounded-full flex items-center justify-center text-xs">1</span>
                  <span>في الصفحة الرئيسية، ابحث عن قسم "إدارة الأسعار"</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-yellow-600 text-white rounded-full flex items-center justify-center text-xs">2</span>
                  <span>اضغط على زر "حاسبة التسعير المبسطة" (باللون الأخضر)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-yellow-600 text-white rounded-full flex items-center justify-center text-xs">3</span>
                  <span>ستفتح نافذة الحاسبة الذكية</span>
                </div>
              </div>
            </Card>
          </div>
        )

      case 'examples':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <PlayCircle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">أمثلة عملية</h2>
              <p className="text-gray-600">حالات استخدام حقيقية لنظام التسعير</p>
            </div>

            <div className="space-y-6">
              {/* Example 1 - Daily */}
              <Card className="p-6 border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-blue-900">مثال 1: تسعير يومي - حملة قصيرة</h3>
                    <p className="text-sm text-blue-700">شركة تريد حملة إعلانية لمدة أسبوعين</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2">المدخلات:</h4>
                    <div className="space-y-1 text-sm text-blue-700">
                      <div>📏 المقاس: 5x13</div>
                      <div>🏷️ المستوى: A</div>
                      <div>📍 البلدية: طرابلس (معامل 1.0)</div>
                      <div>🏢 العميل: شركة</div>
                      <div>📅 المدة: 14 يوم</div>
                      <div>🔧 التركيب: 800 د.ل</div>
                    </div>
                  </div>
                  <div className="bg-blue-100 p-4 rounded-lg border border-blue-300">
                    <h4 className="font-semibold text-blue-900 mb-2">الحساب:</h4>
                    <div className="space-y-1 text-sm text-blue-800">
                      <div>السعر اليومي للشركات: 4000 د.ل</div>
                      <div>إجمالي 14 يوم: 56,000 د.ل</div>
                      <div>تكلفة التركيب: 800 د.ل</div>
                      <div className="border-t border-blue-400 pt-1 font-bold">
                        النهائي: 56,800 د.ل
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Example 2 - Package */}
              <Card className="p-6 border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-green-900">مثال 2: باقة 6 أشهر - حملة طويلة المدى</h3>
                    <p className="text-sm text-green-700">مسوق يريد باقة طويلة مع خصم</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-900 mb-2">المدخلات:</h4>
                    <div className="space-y-1 text-sm text-green-700">
                      <div>📏 المقاس: 4x10</div>
                      <div>🏷️ المستوى: B</div>
                      <div>📍 البلدية: زليتن (معامل 0.8)</div>
                      <div>👨‍💼 العميل: مسوق</div>
                      <div>📦 الباقة: 6 أشهر</div>
                      <div>🔧 التركيب: مُدمج</div>
                    </div>
                  </div>
                  <div className="bg-green-100 p-4 rounded-lg border border-green-300">
                    <h4 className="font-semibold text-green-900 mb-2">الحساب:</h4>
                    <div className="space-y-1 text-sm text-green-800">
                      <div>سعر الباقة الأساسي: 3200 د.ل</div>
                      <div>بعد معامل البلدية: 2560 د.ل</div>
                      <div>خصم الباقة (10%): -256 د.ل</div>
                      <div>خصم المسوقين (15%): -346 د.ل</div>
                      <div className="border-t border-green-400 pt-1 font-bold">
                        النهائي: 1,958 د.ل
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Example 3 - Complex */}
              <Card className="p-6 border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                    <Calculator className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-purple-900">مثال 3: حالة معقدة - مقارنة الخيارات</h3>
                    <p className="text-sm text-purple-700">عميل يريد مقارنة بين التسعير اليومي والباقة</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-purple-200">
                    <h4 className="font-semibold text-purple-900 mb-2">خيار 1: تسعير يومي (90 يوم)</h4>
                    <div className="space-y-1 text-sm text-purple-700">
                      <div>السعر اليومي: 3500 د.ل</div>
                      <div>90 يوم: 315,000 د.ل</div>
                      <div>التركيب: 600 د.ل</div>
                      <div className="font-bold">المجموع: 315,600 د.ل</div>
                    </div>
                  </div>
                  <div className="bg-purple-100 p-4 rounded-lg border border-purple-300">
                    <h4 className="font-semibold text-purple-900 mb-2">خيار 2: باقة 3 أشهر</h4>
                    <div className="space-y-1 text-sm text-purple-800">
                      <div>سعر الباقة: 280,000 د.ل</div>
                      <div>خصم الباقة (5%): -14,000 د.ل</div>
                      <div>التركيب: مُدمج</div>
                      <div className="font-bold text-green-600">المجموع: 266,000 د.ل</div>
                      <div className="text-xs text-green-600">💰 توفير: 49,600 د.ل</div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-green-100 rounded-lg border border-green-300">
                  <p className="text-sm text-green-800 text-center font-semibold">
                    ✅ في هذه الحالة، باقة 3 أشهر أوفر بكثير من التسعير اليومي
                  </p>
                </div>
              </Card>
            </div>

            <Card className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300">
              <h4 className="font-bold text-amber-900 mb-3 text-center">💡 نصائح للحصول على أفضل سعر:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-amber-800">
                <div className="text-center">
                  <div className="font-semibold">للحملات الطويلة</div>
                  <div>استخدم الباقات للحصول على خصومات</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">للمسوقين</div>
                  <div>خصم 15% تلقائي على جميع الأسعار</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">للمناطق البعيدة</div>
                  <div>معاملات أقل = أسعار أوفر</div>
                </div>
              </div>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <BookOpen className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">دليل نظام التسعير</h1>
                <p className="text-sm opacity-90">تعلم كيفية استخدام النظام بكفاءة</p>
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

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-b-2 border-indigo-500 text-indigo-600 bg-white'
                      : 'text-gray-600 hover:text-indigo-600 hover:bg-white/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-180px)]">
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}

export default PricingSystemGuide
