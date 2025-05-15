"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { format, parse } from "date-fns"
import { Label } from "@/components/ui/label"

interface DatePickerProps {
  id: string
  label: string
  value: string | null
  onChange: (date: string | null) => void
  required?: boolean
  disabled?: boolean
  maxDate?: string
  minDate?: string
  className?: string
}

export function DatePicker({
  id,
  label,
  value,
  onChange,
  required = false,
  disabled = false,
  maxDate,
  minDate,
  className,
}: DatePickerProps) {
  // Convertir el valor ISO a formato YYYY-MM-DD para el input
  const [inputValue, setInputValue] = useState("")

  useEffect(() => {
    if (value) {
      try {
        const date = new Date(value)
        if (!isNaN(date.getTime())) {
          setInputValue(format(date, "yyyy-MM-dd"))
        }
      } catch (error) {
        console.error("Error formatting date:", error)
      }
    } else {
      setInputValue("")
    }
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)

    if (newValue) {
      try {
        // Convertir de YYYY-MM-DD a ISO
        const date = parse(newValue, "yyyy-MM-dd", new Date())
        onChange(date.toISOString())
      } catch (error) {
        console.error("Error parsing date:", error)
      }
    } else {
      onChange(null)
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={id}>{label}</Label>
      <input
        type="date"
        id={id}
        value={inputValue}
        onChange={handleChange}
        required={required}
        disabled={disabled}
        max={maxDate}
        min={minDate}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  )
}
