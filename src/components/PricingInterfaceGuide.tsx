import React from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { 
  X, 
  BarChart3, 
  Search, 
  Grid3X3, 
  Target, 
  Users, 
  TrendingUp, 
  DollarSign,
  Database,
  RefreshCw,
  Plus,
  Download,
  Edit3,
  Trash2,
  Calendar,
  ChevronDown,
  Filter
} from 'lucide-react'

interface PricingInterfaceGuideProps {
  onClose: () => void
}

const PricingInterfaceGuide: React.FC<PricingInterfaceGuideProps> = ({ onClose }) => {
  const features = [
    {
      title: 'شريط الإحصائيات العلوي',
      icon: BarChart3,
      color: 'blue',
      description: 'عرض الإحصائيات الأساسية بشكل منظم',
      items: [
        'إجمالي الصفوف مع أيقونة الرسم البياني',
        'عدد المقاسات مع أيقونة الشبكة',
        'عدد المستويات مع أيقونة الهدف',
        'أنواع الزبائن مع أيقونة المستخدمين',
        'متوسط الأسعار مع أيقونة الاتجاه الصاعد',
        'نطاق الأسعار مع أيقونة الدولار'
      ]
    },
    {
      title: 'نظام البحث والتصفية المتقدم',
      icon: Search,
      color: 'green',
      description: 'فلاتر ذكية وبحث شامل',
      items: [
        'بحث نصي شامل في جميع الأعمدة',
        'قائمة منسدلة للمقاسات',
        'قائمة منسدلة للمستويات (A/B)',
        'قائمة منسدلة لأنواع الزبائن',
        'زر مسح الفلاتر السريع',
        'عداد النتائج المفلترة'
      ]
    },
    {
      title: 'الجدول المحسن مع الأعمدة المثبتة',
      icon: Grid3X3,
      color: 'purple',
      description: 'جدول متقدم مع إمكانيات تفاعلية',
      items: [
        'أعمدة ثابتة للمعلومات الأساسية (المقاس، المستوى، الزبون)',
        'أعمدة الأسعار قابلة للطي والفتح',
        'فرز تفاعلي لجميع الأعمدة',
        'تحرير الخلايا بالنقر المباشر',
        'تأثيرات بصرية عند التمرير',
        'أشرطة تمرير مخصصة وسلسة'
      ]
    },
    {
      title: 'إدارة البيانات السريعة',
      icon: Database,
      color: 'orange',
      description: 'عمليات البيانات الأساسية',
      items: [
        'إضافة صفوف جديدة بواجهة منبثقة',
        'حذف الصفوف مع تأكيد الأمان',
        'تحديث البيانات من قاعدة البيانات',
        'تصدير حصري إلى Excel',
        'لا يوجد استيراد ملفات (فقط من قاعدة البيانات)',
        'تنبيهات فورية للعمليات'
      ]
    },
    {
      title: 'واجهة سهلة الاستخدام',
      icon: Target,
      color: 'emerald',
      description: 'تصميم مُحسن للإنتاجية',
      items: [
        'ألوان وأيقونات ثابتة ومتناسقة',
        'رسوم متحركة سلسة',
        'استجابة فورية للتفاعلات',
        'دعم الشاشات الصغيرة والكبيرة',
        'إرشادات واضحة لكل عنصر',
        'تنظيم منطقي للعناصر'
      ]
    }
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Target className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">دليل الواجهة المحسنة</h1>
                <p className="text-sm opacity-90">إدارة الأسعار العربية - الميزات الجديدة</p>
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

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {/* Introduction */}
            <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
              <h2 className="text-xl font-bold text-blue-900 mb-3">مرحباً بك في الواجهة المحسنة!</h2>
              <p className="text-blue-800 leading-relaxed">
                تم إعادة تصميم واجهة إدارة الأسعار العربية لتكون أكثر وضوحاً وسهولة في الاستخدام. 
                تتضمن الواجهة الجديدة جميع الميزات التي طلبتها مع تحسينات إضافية لتجربة مستخدم أفضل.
              </p>
            </Card>

            {/* Features Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <Card 
                    key={index} 
                    className={`p-6 border-2 border-${feature.color}-200 bg-${feature.color}-50 hover:shadow-lg transition-all duration-300`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 bg-${feature.color}-600 rounded-full flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className={`text-lg font-bold text-${feature.color}-900 mb-2`}>
                          {feature.title}
                        </h3>
                        <p className={`text-sm text-${feature.color}-700 mb-3`}>
                          {feature.description}
                        </p>
                        <ul className={`space-y-1 text-sm text-${feature.color}-800`}>
                          {feature.items.map((item, itemIndex) => (
                            <li key={itemIndex} className="flex items-start gap-2">
                              <span className={`w-1.5 h-1.5 bg-${feature.color}-600 rounded-full mt-2 flex-shrink-0`}></span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>

            {/* Quick Tips */}
            <Card className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200">
              <h3 className="text-lg font-bold text-yellow-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                نصائح سريعة للاستخدام الأمثل
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <Edit3 className="w-4 h-4" />
                    <span className="font-medium">تحرير السريع:</span>
                  </div>
                  <p className="text-sm text-yellow-700 pr-6">
                    انقر مباشرة على أي سعر لتحريره. ستظهر أيقونة القلم عند التمرير.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <ChevronDown className="w-4 h-4" />
                    <span className="font-medium">طي الأعمدة:</span>
                  </div>
                  <p className="text-sm text-yellow-700 pr-6">
                    انقر على "الأسعار حسب المدة" لطي أو فتح أعمدة الأسعار.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <Filter className="w-4 h-4" />
                    <span className="font-medium">البحث الذكي:</span>
                  </div>
                  <p className="text-sm text-yellow-700 pr-6">
                    استخدم مربع البحث للبحث في جميع الأعمدة، أو الفلاتر للتصفية المحددة.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <RefreshCw className="w-4 h-4" />
                    <span className="font-medium">التحديث الآمن:</span>
                  </div>
                  <p className="text-sm text-yellow-700 pr-6">
                    استخدم "تحديث البيانات" للحصول على آخر التحديثات من قاعدة البيانات.
                  </p>
                </div>
              </div>
            </Card>

            {/* Call to Action */}
            <div className="text-center">
              <Button
                onClick={onClose}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3 text-lg font-bold"
              >
                بدء الاستخدام الآن
              </Button>
              <p className="text-sm text-gray-600 mt-2">
                جرب الميزات الجديدة واستمتع بتجربة محسنة!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PricingInterfaceGuide
