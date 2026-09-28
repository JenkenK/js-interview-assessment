import {
  type DefaultOptions,
  QueryCache,
  QueryClient,
} from '@tanstack/react-query'

import { isRetryableError } from '@/api/currency-beacon/errors'

const MAX_RETRIES = 2

export const createQueryClient = (overrides: DefaultOptions['queries'] = {}) =>
  new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        if (import.meta.env.MODE === 'development') console.error(error)
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        retry: (failureCount, error) =>
          failureCount < MAX_RETRIES && isRetryableError(error),
        refetchOnWindowFocus: false,
        ...overrides,
      },
    },
  })

export const queryClient = createQueryClient()
