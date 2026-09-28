import { type QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  render,
  renderHook,
  type RenderHookOptions,
  type RenderOptions,
} from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'

import { createQueryClient } from '@/lib/queryClient'

export const createTestQueryClient = () =>
  createQueryClient({ retry: false, gcTime: Infinity })

const withQueryClient =
  (queryClient: QueryClient) =>
  ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

export const renderWithQueryClient = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => {
  const queryClient = createTestQueryClient()

  return {
    queryClient,
    ...render(ui, { wrapper: withQueryClient(queryClient), ...options }),
  }
}

export const renderHookWithQueryClient = <Result, Props>(
  hook: (props: Props) => Result,
  {
    queryClient = createTestQueryClient(),
    ...options
  }: Omit<RenderHookOptions<Props>, 'wrapper'> & {
    queryClient?: QueryClient
  } = {},
) => ({
  queryClient,
  ...renderHook(hook, { wrapper: withQueryClient(queryClient), ...options }),
})
