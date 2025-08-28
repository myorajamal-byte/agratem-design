import React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock } from "lucide-react"
import { PackageDuration } from "@/types"
import { pricingService } from "@/services/pricingService"

interface PricingDurationSelectorProps {
  selectedDuration: PackageDuration | null
  onDurationChange: (duration: PackageDuration) => void
  className?: string
}

export default function PricingDurationSelector({ 
  selectedDuration, 
  onDurationChange, 
  className = "" 
}: PricingDurationSelectorProps) {
  const packages = pricingService.getPackages()

  const handleDurationChange = (value: string) => {
    const selectedPackage = packages.find(pkg => pkg.value.toString() === value)
    if (selectedPackage) {
      onDurationChange(selectedPackage)
    }
  }

  return (
    <div className={`${className}`} dir="rtl">
      <label className="block text-sm font-bold text-gray-700 mb-2 text-right">
        <Calendar className="w-4 h-4 inline-block ml-2" />
        اختر مدة الإيجار
      </label>
      <Select 
        value={selectedDuration?.value.toString() || ""} 
        onValueChange={handleDurationChange}
        dir="rtl"
      >
        <SelectTrigger className="w-full text-right border-2 border-emerald-300 focus:border-emerald-500 rounded-xl py-3 text-base shadow-lg font-sans bg-white">
          <SelectValue placeholder="اختر المدة الزمنية" />
        </SelectTrigger>
        <SelectContent className="bg-white border-2 border-emerald-200 rounded-xl shadow-xl" dir="rtl">
          {packages.map((pkg) => (
            <SelectItem 
              key={pkg.value} 
              value={pkg.value.toString()}
              className="text-right px-4 py-3 hover:bg-emerald-50 cursor-pointer font-sans"
              dir="rtl"
            >
              <div className="flex items-center justify-between w-full" dir="rtl">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-gray-900">{pkg.label}</span>
                </div>
                {pkg.discount > 0 && (
                  <div className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-bold">
                    خصم {pkg.discount}%
                  </div>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {selectedDuration && selectedDuration.discount > 0 && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg text-center">
          <p className="text-sm text-green-800 font-bold">
            🎉 ستوفر {selectedDuration.discount}% مع باقة "{selectedDuration.label}"!
          </p>
        </div>
      )}
    </div>
  )
}
