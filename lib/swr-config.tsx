import type { ReactNode, FC } from "react"
import { SWRConfig } from "swr"

const SWRProvider: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <SWRConfig
      value={{
        dedupingInterval: 300000,
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        errorRetryCount: 3,
        errorRetryInterval: 5000,
        onErrorRetry: (error: any, key: string, config: any, revalidate: any, { retryCount }: { retryCount: number }) => {
          if (error.status === 429) {
            setTimeout(() => revalidate({ retryCount }), 10000 * (retryCount + 1))
            return
          }
          if (retryCount >= 3) return
          setTimeout(() => revalidate({ retryCount }), 5000 * (retryCount + 1))
        },
      }}
    >
      {children}
    </SWRConfig>
  )
}

export default SWRProvider
export { SWRProvider }
