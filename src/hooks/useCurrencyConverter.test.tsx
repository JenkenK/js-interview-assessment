import { act, waitFor } from '@testing-library/react'
import { http } from 'msw'

import { apiError, convertUrl, currenciesUrl } from '@/test/handlers'
import { server } from '@/test/server'
import { renderHookWithQueryClient } from '@/test/test-utils'

import { useCurrencyConverter } from './useCurrencyConverter'

describe('useCurrencyConverter', () => {
  it('reports a currencies failure first, and retries every failed query', async () => {
    server.use(
      http.get(currenciesUrl, () => apiError(503)),
      http.get(convertUrl, () => apiError(503)),
    )
    const { result } = renderHookWithQueryClient(() => useCurrencyConverter())
    await waitFor(() =>
      expect(result.current).toMatchObject({
        failure: { title: "Couldn't load currencies" },
        isConverting: false,
      }),
    )

    server.resetHandlers()
    act(() => result.current.failure?.retry())

    await waitFor(() => expect(result.current.failure).toBeNull())
    expect(result.current.conversion).toMatchObject({ value: 0.9 })
  })

  it('offers each side every currency except the other side’s', async () => {
    const { result } = renderHookWithQueryClient(() => useCurrencyConverter())

    await waitFor(() => expect(result.current.currencyStatus).toBe('ready'))

    const codes = (currencies: { code: string }[]) =>
      currencies.map(({ code }) => code)
    expect(codes(result.current.fromCurrencies)).toEqual(['GBP', 'JPY', 'USD'])
    expect(codes(result.current.toCurrencies)).toEqual(['EUR', 'GBP', 'JPY'])
  })
})
