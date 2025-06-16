import toast from 'react-hot-toast'

export const notifications = {
  // Mensajes de éxito
  success: {
    save: (item: string) => toast.success(`✅ ${item} guardado correctamente`, {
      duration: 3000,
    }),
    
    update: (item: string) => toast.success(`📝 ${item} actualizado exitosamente`, {
      duration: 3000,
    }),

    delete: (item: string) => toast.success(`🗑️ ${item} eliminado correctamente`, {
      duration: 3000,
    }),

    upload: (fileName: string) => toast.success(`📎 "${fileName}" subido correctamente`, {
      duration: 3000,
    }),

    restore: () => toast.success('📋 Datos anteriores restaurados automáticamente', {
      duration: 3000,
    }),

    autoSave: () => toast.success('💾 Cambios guardados automáticamente', {
      duration: 2000,
      style: { fontSize: '13px' }
    }),
  },

  // Mensajes de error
  error: {
    save: (item: string, details?: string) => toast.error(
      `❌ Error al guardar ${item}${details ? `: ${details}` : ''}`, {
        duration: 5000,
      }
    ),

    load: (item: string, details?: string) => toast.error(
      `📂 Error al cargar ${item}${details ? `: ${details}` : ''}`, {
        duration: 5000,
      }
    ),

    delete: (item: string, details?: string) => toast.error(
      `🗑️ Error al eliminar ${item}${details ? `: ${details}` : ''}`, {
        duration: 5000,
      }
    ),

    upload: (fileName?: string, details?: string) => toast.error(
      `📎 Error al subir ${fileName || 'archivo'}${details ? `: ${details}` : ''}`, {
        duration: 5000,
      }
    ),

    validation: (message: string) => toast.error(`⚠️ ${message}`, {
      duration: 4000,
    }),    network: () => toast.error('🌐 Error de conexión. Verifica tu internet e intenta nuevamente', {
      duration: 5000,
    }),

    generic: (message: string) => toast.error(`❌ ${message}`, {
      duration: 4000,
    }),
  },

  // Mensajes informativos
  info: {
    loading: (action: string) => toast.loading(`⏳ ${action}...`, {
      duration: 0, // Will be dismissed manually
    }),

    autoSaving: () => toast.loading('💾 Guardando cambios...', {
      duration: 1000,
    }),

    uploading: (fileName: string) => toast.loading(`📤 Subiendo "${fileName}"...`, {
      duration: 0,
    }),

    processing: (action: string) => toast.loading(`⚙️ ${action}...`, {
      duration: 0,
    }),
  },
  // Mensajes de advertencia
  warning: {
    unsavedChanges: () => toast('⚠️ Tienes cambios sin guardar. ¿Seguro que quieres salir?', {
      duration: 4000,
      icon: '⚠️',
    }),

    maxSize: (maxSize: string) => toast.error(`📏 El archivo es demasiado grande. Tamaño máximo: ${maxSize}`, {
      duration: 4000,
    }),

    fileType: (allowedTypes: string) => toast.error(`📄 Tipo de archivo no permitido. Formatos aceptados: ${allowedTypes}`, {
      duration: 4000,
    }),

    requiredFields: () => toast.error('📝 Por favor completa todos los campos obligatorios', {
      duration: 4000,
    }),

    duplicateEntry: (item: string) => toast.error(`🔄 Ya existe un registro de ${item} similar`, {
      duration: 4000,
    }),
  },

  // Utilidades
  dismiss: (toastId?: string) => {
    if (toastId) {
      toast.dismiss(toastId)
    } else {
      toast.dismiss()
    }
  },
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    }
  ) => {
    return toast.promise(promise, {
      loading: `⏳ ${messages.loading}...`,
      success: (data) => `✅ ${typeof messages.success === 'function' ? messages.success(data) : messages.success}`,
      error: (error) => `❌ ${typeof messages.error === 'function' ? messages.error(error) : messages.error}`,
    })
  },
}

// Mensajes específicos por formulario
export const formMessages = {
  personalInfo: {
    save: () => notifications.success.save('Información personal'),
    error: (details?: string) => notifications.error.save('información personal', details),
    loading: () => notifications.info.loading('Guardando información personal'),
  },
  
  education: {
    save: () => notifications.success.save('Información educativa'),
    error: (details?: string) => notifications.error.save('información educativa', details),
    loading: () => notifications.info.loading('Guardando información educativa'),
    duplicate: () => notifications.warning.duplicateEntry('educación'),
  },

  experience: {
    save: () => notifications.success.save('Experiencia laboral'),
    error: (details?: string) => notifications.error.save('experiencia laboral', details),
    loading: () => notifications.info.loading('Guardando experiencia laboral'),
    duplicate: () => notifications.warning.duplicateEntry('experiencia laboral'),
  },

  languages: {
    save: () => notifications.success.save('Información de idiomas'),
    error: (details?: string) => notifications.error.save('información de idiomas', details),
    loading: () => notifications.info.loading('Guardando información de idiomas'),
    duplicate: () => notifications.warning.duplicateEntry('idioma'),
  },
}
