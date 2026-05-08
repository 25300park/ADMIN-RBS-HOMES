'use client'

import { 
  QueryClient, 
  QueryClientProvider as TanstackQueryClientProvider 
} from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
})

export function QueryProvider({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <TanstackQueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools />
    </TanstackQueryClientProvider>
  )
}