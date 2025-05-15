"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"
import { es } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  const [year, setYear] = React.useState(props.defaultMonth?.getFullYear() || new Date().getFullYear())
  const [month, setMonth] = React.useState(props.defaultMonth?.getMonth() || new Date().getMonth())

  // Generar años para el selector (100 años atrás desde el actual)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i)

  // Actualizar el mes mostrado cuando cambia el año o mes seleccionado
  React.useEffect(() => {
    if (props.onMonthChange) {
      props.onMonthChange(new Date(year, month))
    }
  }, [year, month, props.onMonthChange])

  return (
    <DayPicker
      locale={es}
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "hidden", // Ocultar la etiqueta original
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(buttonVariants({ variant: "ghost" }), "h-9 w-9 p-0 font-normal aria-selected:opacity-100"),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        Caption: ({ displayMonth }) => {
          const monthName = displayMonth.toLocaleString("es", { month: "long" })
          const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1)

          return (
            <div className="flex justify-center items-center gap-2 py-2">
              <div className="flex-1">
                <Select value={year.toString()} onValueChange={(value) => setYear(Number.parseInt(value))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={year.toString()} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {years.map((y) => (
                      <SelectItem key={y} value={y.toString()}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Select value={month.toString()} onValueChange={(value) => setMonth(Number.parseInt(value))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={capitalizedMonth} />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => {
                      const monthDate = new Date(2000, i, 1)
                      const monthName = monthDate.toLocaleString("es", { month: "long" })
                      const capitalizedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1)
                      return (
                        <SelectItem key={i} value={i.toString()}>
                          {capitalizedMonthName}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
