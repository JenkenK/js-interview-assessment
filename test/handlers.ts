import { http, HttpResponse } from 'msw'

import { CURRENCY_BEACON_BASE_PATH } from '@/api/currency-beacon/client'

export const currenciesUrl = `${CURRENCY_BEACON_BASE_PATH}/currencies`
export const convertUrl = `${CURRENCY_BEACON_BASE_PATH}/convert`

const currency = (
  id: number,
  shortCode: string,
  numericCode: string,
  name: string,
  symbol: string,
) => ({
  id,
  name,
  short_code: shortCode,
  code: numericCode,
  precision: 2,
  subunit: 100,
  symbol,
  symbol_first: true,
  decimal_mark: '.',
  thousands_separator: ',',
})

export const currenciesFixture = [
  currency(1, 'USD', '840', 'US Dollar', '$'),
  currency(2, 'EUR', '978', 'Euro', '€'),
  currency(3, 'GBP', '826', 'Pound Sterling', '£'),
  currency(4, 'JPY', '392', 'Yen', '¥'),
]

const USD_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.9,
  GBP: 0.8,
  JPY: 150,
}

export const FIXED_TIMESTAMP = 1710515400

const envelope = (payload: object | unknown[]) => ({
  ...payload,
  meta: {
    code: 200,
    disclaimer: 'Usage subject to terms: https://currencybeacon.com/terms',
  },
  response: payload,
})

export const apiError = (code: number, errorType = 'error') =>
  HttpResponse.json(
    { meta: { code, error_type: errorType }, response: [] },
    { status: code },
  )

export const handlers = [
  http.get(currenciesUrl, () => HttpResponse.json(envelope(currenciesFixture))),

  http.get(convertUrl, ({ request }) => {
    const params = new URL(request.url).searchParams
    const from = params.get('from') ?? ''
    const to = params.get('to') ?? ''
    const amount = Number(params.get('amount'))

    if (!(from in USD_RATES) || !(to in USD_RATES)) return apiError(422)

    return HttpResponse.json(
      envelope({
        timestamp: FIXED_TIMESTAMP,
        date: '2024-03-15',
        from,
        to,
        amount,
        value: (amount / USD_RATES[from]) * USD_RATES[to],
      }),
    )
  }),
]
