"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { validateField, type ValidationRule, sanitizers } from "@/lib/validations"

interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  validationRules?: ValidationRule[]
  sanitizer?: keyof typeof sanitizers
  showError?: boolean
  onValidationChange?: (isValid: boolean, error: string | null) => void
}

const ValidatedInput = React.forwardRef<HTMLInputElement, ValidatedInputProps>(
  (
    {
      className,
      label,
      validationRules = [],
      sanitizer,
      showError = true,
      onValidationChange,
      onChange,
      value,
      ...props
    },
    ref,
  ) => {
    const [error, setError] = React.useState<string | null>(null)
    const [touched, setTouched] = React.useState(false)
    const [internalValue, setInternalValue] = React.useState(value || "")

    // Memoizar la función de validación para evitar recreaciones
    const validate = React.useCallback(
      (inputValue: string) => {
        const validationError = validateField(inputValue, validationRules)
        setError(validationError)

        // Solo llamar onValidationChange si realmente cambió
        if (onValidationChange) {
          onValidationChange(!validationError, validationError)
        }

        return validationError
      },
      [validationRules, onValidationChange],
    )

    // Memoizar la función de sanitización
    const sanitize = React.useCallback(
      (inputValue: string) => {
        if (sanitizer && sanitizers[sanitizer]) {
          return sanitizers[sanitizer](inputValue)
        }
        return inputValue
      },
      [sanitizer],
    )

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let newValue = e.target.value

      // Sanitizar el valor
      newValue = sanitize(newValue)

      // Actualizar el valor interno
      setInternalValue(newValue)

      // Validar solo si el campo ha sido tocado
      if (touched) {
        validate(newValue)
      }

      // Crear un nuevo evento con el valor sanitizado
      const sanitizedEvent = {
        ...e,
        target: {
          ...e.target,
          value: newValue,
        },
      }

      if (onChange) {
        onChange(sanitizedEvent)
      }
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setTouched(true)
      validate(e.target.value)

      if (props.onBlur) {
        props.onBlur(e)
      }
    }

    // Sincronizar valor interno con prop value solo cuando cambie externamente
    React.useEffect(() => {
      if (value !== undefined && value !== internalValue) {
        setInternalValue(String(value))
      }
    }, [value]) // Removemos internalValue de las dependencias para evitar loops

    // Validar cuando el componente se monta si ya tiene valor
    React.useEffect(() => {
      if (internalValue && touched) {
        validate(internalValue)
      }
    }, [internalValue, touched, validate])

    const showErrorMessage = showError && touched && error
    const displayValue = value !== undefined ? value : internalValue

    return (
      <div className="space-y-2">
        {label && (
          <Label
            htmlFor={props.id}
            className={cn(
              "text-base font-semibold text-gray-700",
              props.required && "after:content-['*'] after:text-red-500 after:ml-1",
            )}
          >
            {label}
          </Label>
        )}
        <Input
          className={cn(
            "border-2 border-gray-300 bg-gray-50 rounded-md px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 shadow-sm transition-colors",
            showErrorMessage && "border-red-500 focus:border-red-500 focus:ring-red-200",
            className,
          )}
          ref={ref}
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          {...props}
        />
        {showErrorMessage && <p className="text-sm text-red-600 mt-1">{error}</p>}
      </div>
    )
  },
)
ValidatedInput.displayName = "ValidatedInput"

export { ValidatedInput }
