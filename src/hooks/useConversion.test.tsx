import { waitFor } from '@testing-library/react'
import { delay, http } from 'msw'

import type { ConversionParams } from '@/api/currency-beacon/endpoints'
import { convertUrl } from '@/test/handlers'
import { server } from '@/test/server'
import { renderHookWithQueryClient } from '@/test/test-utils'

import { useConversion } from './useConversion'

const USD_TO_EUR: ConversionParams = { from: 'USD', to: 'EUR', amount: 1 }

const renderConversion = (initialProps: ConversionParams | null) =>
  renderHookWithQueryClient(
    (params: ConversionParams | null) => useConversion(params),
    { initialProps },
  )

afterEach(() => vi.restoreAllMocks())

describe('useConversion', () => {
  it("doesn't fetch without valid params", () => {
    const { result } = renderConversion(null)

    expect(result.current).toMatchObject({
      isPending: true,
      fetchStatus: 'idle',
    })
  })

  it('keeps the previous result while a new amount for the same pair loads', async () => {
    const { result, rerender } = renderConversion(USD_TO_EUR)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    rerender({ ...USD_TO_EUR, amount: 2 })

    expect(result.current).toMatchObject({
      isPlaceholderData: true,
      data: { amount: 1 },
    })
    await waitFor(() =>
      expect(result.current.data).toMatchObject({ amount: 2 }),
    )
  })

  it('drops the previous result when the currency pair changes', async () => {
    const { result, rerender } = renderConversion(USD_TO_EUR)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    rerender({ ...USD_TO_EUR, to: 'GBP' })

    expect(result.current).toMatchObject({ isPending: true, data: undefined })
    await waitFor(() =>
      expect(result.current.data).toMatchObject({ to: 'GBP' }),
    )
  })

  it('aborts the outdated request when the params change', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    // The first response never arrives, so its request is still in flight.
    server.use(http.get(convertUrl, () => delay('infinite'), { once: true }))
    const { result, rerender } = renderConversion(USD_TO_EUR)
    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1))
    const firstSignal = fetchSpy.mock.calls[0]?.[1]?.signal

    rerender({ ...USD_TO_EUR, amount: 2 })

    await waitFor(() => expect(firstSignal?.aborted).toBe(true))
    await waitFor(() =>
      expect(result.current.data).toMatchObject({ amount: 2 }),
    )
  })
})
