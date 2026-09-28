import { http, HttpResponse } from 'msw'

import {
  apiError,
  convertUrl,
  currenciesUrl,
  FIXED_TIMESTAMP,
} from '@/test/handlers'
import { server } from '@/test/server'

import { fetchConversion, fetchCurrencies } from './endpoints'
import {
  getErrorMessage,
  httpError,
  invalidResponseError,
  isCurrencyApiError,
  isRetryableError,
  networkError,
  USER_ERROR_MESSAGES,
} from './errors'

describe('fetchCurrencies', () => {
  it('uses short_code, not the numeric ISO code, and sorts by code', async () => {
    const currencies = await fetchCurrencies()

    expect(currencies.map((currency) => currency.code)).toEqual([
      'EUR',
      'GBP',
      'JPY',
      'USD',
    ])
    expect(currencies[0]).toEqual({ code: 'EUR', name: 'Euro', symbol: '€' })
  })

  it('drops duplicate currency codes', async () => {
    const usd = { short_code: 'USD', name: 'US Dollar', symbol: '$' }
    server.use(
      http.get(currenciesUrl, () =>
        HttpResponse.json({ meta: { code: 200 }, response: [usd, usd] }),
      ),
    )

    await expect(fetchCurrencies()).resolves.toHaveLength(1)
  })
})

describe('fetchConversion', () => {
  it('returns the converted value', async () => {
    await expect(
      fetchConversion({ from: 'USD', to: 'GBP', amount: 100 }),
    ).resolves.toEqual({
      from: 'USD',
      to: 'GBP',
      amount: 100,
      value: 80,
      timestamp: FIXED_TIMESTAMP,
    })
  })

  it('sends the conversion parameters', async () => {
    let searchParams: URLSearchParams | undefined
    server.use(
      http.get(convertUrl, ({ request }) => {
        searchParams = new URL(request.url).searchParams
        return HttpResponse.json({
          meta: { code: 200 },
          response: { value: 1 },
        })
      }),
    )

    await fetchConversion({ from: 'EUR', to: 'JPY', amount: 12.5 })

    expect(Object.fromEntries(searchParams!)).toEqual({
      from: 'EUR',
      to: 'JPY',
      amount: '12.5',
    })
  })

  it('reads the value from the response node, not legacy top-level fields', async () => {
    server.use(
      http.get(convertUrl, () =>
        HttpResponse.json({
          meta: { code: 200 },
          response: { value: 78.42 },
          value: 999,
        }),
      ),
    )

    const conversion = await fetchConversion({
      from: 'USD',
      to: 'GBP',
      amount: 100,
    })

    expect(conversion.value).toBe(78.42)
  })
})

describe('error handling', () => {
  it.each([
    [401, /HTTP 401\. The API key was rejected.*CURRENCYBEACON_API_KEY/],
    [403, /HTTP 403\. The CurrencyBeacon plan doesn't include/],
    [429, /HTTP 429\. The CurrencyBeacon rate limit/],
    [500, /HTTP 500\.$/],
  ])('describes HTTP %i for developers', async (status, message) => {
    server.use(http.get(currenciesUrl, () => apiError(status)))

    await expect(fetchCurrencies()).rejects.toThrow(message)
  })

  it('treats a failed meta code inside a 200 response as an error', async () => {
    server.use(
      http.get(currenciesUrl, () =>
        HttpResponse.json({ meta: { code: 401 }, response: [] }),
      ),
    )

    await expect(fetchCurrencies()).rejects.toMatchObject({
      kind: 'http',
      status: 401,
    })
  })

  it('rejects responses that do not match the expected shape', async () => {
    server.use(
      http.get(convertUrl, () =>
        HttpResponse.json({ meta: { code: 200 }, response: { value: 'lots' } }),
      ),
    )

    await expect(
      fetchConversion({ from: 'USD', to: 'EUR', amount: 1 }),
    ).rejects.toMatchObject({ kind: 'invalid-response' })
  })

  it('reports network failures', async () => {
    server.use(http.get(currenciesUrl, () => HttpResponse.error()))

    await expect(fetchCurrencies()).rejects.toMatchObject({ kind: 'network' })
  })
})

describe('isCurrencyApiError', () => {
  it('recognises errors thrown by the client', async () => {
    server.use(http.get(currenciesUrl, () => apiError(401)))

    const error = await fetchCurrencies().catch((caught: unknown) => caught)

    expect(isCurrencyApiError(error)).toBe(true)
    expect(error).toBeInstanceOf(Error)
  })

  it.each([
    ['a plain Error', new Error('unexpected')],
    ['a non-Error value', { name: 'CurrencyApiError', kind: 'http' }],
  ])('rejects %s', (_, value) => {
    expect(isCurrencyApiError(value)).toBe(false)
  })
})

describe('getErrorMessage', () => {
  it.each([
    ['a rejected API key', httpError(401), USER_ERROR_MESSAGES.unavailable],
    ['a plan restriction', httpError(403), USER_ERROR_MESSAGES.unavailable],
    ['a bad request', httpError(422), USER_ERROR_MESSAGES.unavailable],
    ['a server error', httpError(503), USER_ERROR_MESSAGES.unavailable],
    [
      'an unexpected response',
      invalidResponseError(null),
      USER_ERROR_MESSAGES.unavailable,
    ],
    ['an unknown error', new Error('boom'), USER_ERROR_MESSAGES.unavailable],
    ['a rate limit', httpError(429), USER_ERROR_MESSAGES.rateLimited],
    ['a network failure', networkError(null), USER_ERROR_MESSAGES.offline],
  ])('tells users about %s in plain terms', (_, error, expected) => {
    expect(getErrorMessage(error)).toBe(expected)
  })

  it('never shows setup details', () => {
    const message = getErrorMessage(httpError(401))

    expect(message).not.toMatch(/API key|CURRENCYBEACON|\.env|HTTP/i)
  })
})

describe('isRetryableError', () => {
  it.each([
    [networkError(null), true],
    [httpError(503), true],
    [httpError(401), false],
    [httpError(429), false],
    [invalidResponseError(null), false],
    [new Error('unexpected'), true],
  ])('%s → %s', (error, expected) => {
    expect(isRetryableError(error)).toBe(expected)
  })
})
