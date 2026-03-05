"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  value?: Date | null
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  compact?: boolean
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
  compact = false,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal",
            !value && "text-muted-foreground",
            compact ? "h-7 px-2 text-xs gap-1.5" : "h-9 px-3 text-sm gap-2",
            className
          )}
        >
          <CalendarIcon
            className={cn(
              "text-muted-foreground shrink-0",
              compact ? "h-3 w-3" : "h-3.5 w-3.5"
            )}
          />
          {value ? (
            format(value, "MMM d, yyyy")
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value ?? undefined}
          onSelect={(date) => {
            onChange?.(date)
            setOpen(false)
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}
