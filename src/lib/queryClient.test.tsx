import { waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'

import { useCurrencies } from '@/hooks/useCurrencies'
import { apiError, currenciesUrl } from '@/test/handlers'
import { server } from '@/test/server'
import { renderHookWithQueryClient } from '@/test/test-utils'

import { createQueryClient } from './queryClient'

const countCurrencyRequests = () => {
  let count = 0
  server.events.on('request:start', ({ request }) => {
    if (new URL(request.url).pathname === currenciesUrl) count += 1
  })
  return () => count
}

afterEach(() => server.events.removeAllListeners())

describe('queryClient retry policy', () => {
  it.each([
    ['a server error', 3, () => apiError(503)],
    ['a network failure', 3, () => HttpResponse.error()],
    ['a rejected API key', 1, () => apiError(401)],
    ['a rate limit', 1, () => apiError(429)],
  ])('gives up on %s after %i attempt(s)', async (_, attempts, resolver) => {
    server.use(http.get(currenciesUrl, resolver))
    const getRequestCount = countCurrencyRequests()

    const { result } = renderHookWithQueryClient(() => useCurrencies(), {
      queryClient: createQueryClient({ retryDelay: 0, gcTime: Infinity }),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(getRequestCount()).toBe(attempts)
  })
})

describe('queryClient error logging', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  const failWithRejectedApiKey = async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    server.use(http.get(currenciesUrl, () => apiError(401)))
    const { result } = renderHookWithQueryClient(() => useCurrencies())
    await waitFor(() => expect(result.current.isError).toBe(true))
    return consoleError
  }

  it('logs the full error for developers on the dev server', async () => {
    vi.stubEnv('MODE', 'development')

    const consoleError = await failWithRejectedApiKey()

    expect(consoleError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringMatching(/CURRENCYBEACON_API_KEY/),
      }),
    )
  })

  it('stays silent in production', async () => {
    vi.stubEnv('MODE', 'production')

    const consoleError = await failWithRejectedApiKey()

    expect(consoleError).not.toHaveBeenCalled()
  })
})
