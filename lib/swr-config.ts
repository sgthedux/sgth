import React from "react"
import { SWRConfig } from "swr"

// Configuración global de SWR
export const SWRProvider = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(
    SWRConfig,
    { value: {
        // Tiempo de revalidación: 5 minutos
        dedupingInterval: 300000,
        // Revalidar al enfocar la ventana: desactivado para reducir solicitudes
        revalidateOnFocus: false,
        // Revalidar al reconectar: activado para asegurar datos actualizados
        revalidateOnReconnect: true,
        // Reintento con backoff exponencial
        errorRetryCount: 3,
        errorRetryInterval: 5000,
        // Función para manejar errores de rate limiting
        onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
          if (error.status === 429) {
            setTimeout(() => revalidate({ retryCount }), 10000 * (retryCount + 1));
            return;
          }
          if (retryCount >= 3) return;
          setTimeout(() => revalidate({ retryCount }), 5000 * (retryCount + 1));
        },
      }
    },
    children
  )
}
