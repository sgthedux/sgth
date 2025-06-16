// Tipos para las reglas de validación
export interface ValidationRule {
  validate: (value: string) => boolean
  message: string
}

// Reglas de validación
export const validationRules = {
  required: {
    validate: (value: string) => value.trim().length > 0,
    message: "Este campo es obligatorio",
  },

  email: {
    validate: (value: string) => {
      if (!value) return true // Opcional si no es required
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(value)
    },
    message: "Ingrese un correo electrónico válido",
  },

  phone: {
    validate: (value: string) => {
      if (!value) return true // Opcional si no es required
      const phoneRegex = /^[\d\s\-$$$$+]{7,15}$/
      return phoneRegex.test(value)
    },
    message: "Ingrese un número de teléfono válido",
  },

  name: {
    validate: (value: string) => {
      if (!value) return true // Opcional si no es required
      const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/
      return nameRegex.test(value)
    },
    message: "Solo se permiten letras y espacios",
  },

  text: {
    validate: (value: string) => {
      if (!value) return true // Opcional si no es required
      const textRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\d.,\-#]+$/
      return textRegex.test(value)
    },
    message: "Contiene caracteres no permitidos",
  },

  identification: {
    validate: (value: string) => {
      if (!value) return true // Opcional si no es required
      const idRegex = /^[a-zA-Z0-9-]+$/
      return idRegex.test(value)
    },
    message: "Solo se permiten letras, números y guiones",
  },

  alphanumeric: {
    validate: (value: string) => {
      if (!value) return true // Opcional si no es required
      const alphanumericRegex = /^[a-zA-Z0-9\s]+$/
      return alphanumericRegex.test(value)
    },
    message: "Solo se permiten letras y números",
  },

  numbers: {
    validate: (value: string) => {
      if (!value) return true // Opcional si no es required
      const numbersRegex = /^[0-9]+$/
      return numbersRegex.test(value)
    },
    message: "Solo se permiten números",
  },
}

// Función para validar un campo
export const validateField = (value: string, rules: ValidationRule[]): string | null => {
  for (const rule of rules) {
    if (!rule.validate(value)) {
      return rule.message
    }
  }
  return null
}

// Sanitizadores
export const sanitizers = {
  name: (value: string) => value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ""),
  text: (value: string) => value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s\d.,\-#]/g, ""),
  identification: (value: string) => value.replace(/[^a-zA-Z0-9-]/g, ""),
  alphanumeric: (value: string) => value.replace(/[^a-zA-Z0-9\s]/g, ""),
  numbers: (value: string) => value.replace(/[^0-9]/g, ""),
  email: (value: string) => value.replace(/[^a-zA-Z0-9@.\-_]/g, ""),
  phone: (value: string) => value.replace(/[^0-9\s\-$$$$+]/g, ""),
}
