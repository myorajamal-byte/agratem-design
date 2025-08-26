import * as React from "react"
import { Check, ChevronDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

interface MultiSelectProps {
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  className?: string
  maxDisplay?: number
  dir?: "rtl" | "ltr"
  allText?: string
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "اختر عناصر...",
  className,
  maxDisplay = 2,
  dir = "rtl",
  allText = "الكل"
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (option: string) => {
    if (option === "all") {
      onChange([])
    } else {
      const newSelected = selected.includes(option)
        ? selected.filter((item) => item !== option)
        : [...selected, option]
      onChange(newSelected)
    }
  }

  const handleClear = () => {
    onChange([])
  }

  const isAllSelected = selected.length === 0

  const getDisplayText = () => {
    if (isAllSelected) {
      return allText
    }
    
    if (selected.length <= maxDisplay) {
      return selected.join("، ")
    }
    
    return `${selected.slice(0, maxDisplay).join("، ")} +${selected.length - maxDisplay}`
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "justify-between border-2 border-yellow-300 rounded-full text-gray-900 font-sans bg-white hover:bg-gray-50",
            className
          )}
          dir={dir}
        >
          <span className="truncate text-right flex-1 min-w-0">
            {getDisplayText()}
          </span>
          <div className="flex items-center gap-1 ml-2">
            {!isAllSelected && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleClear()
                }}
                className="hover:bg-gray-200 rounded-full p-1 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            )}
            <ChevronDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" dir={dir}>
        <div className="max-h-60 overflow-auto p-1">
          {/* خيار "الكل" */}
          <div
            className={cn(
              "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground font-sans",
              isAllSelected && "bg-accent text-accent-foreground"
            )}
            onClick={() => handleSelect("all")}
          >
            <Check
              className={cn(
                "ml-2 h-4 w-4",
                isAllSelected ? "opacity-100" : "opacity-0"
              )}
            />
            <span className="text-right">{allText}</span>
          </div>
          
          {/* خيارات أخرى */}
          {options.map((option) => (
            <div
              key={option}
              className={cn(
                "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground font-sans",
                selected.includes(option) && "bg-accent text-accent-foreground"
              )}
              onClick={() => handleSelect(option)}
            >
              <Check
                className={cn(
                  "ml-2 h-4 w-4",
                  selected.includes(option) ? "opacity-100" : "opacity-0"
                )}
              />
              <span className="text-right">{option}</span>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
