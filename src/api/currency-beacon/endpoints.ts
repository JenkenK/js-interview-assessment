import { request } from './client'
import {
  convertResponseSchema,
  currenciesResponseSchema,
  type Currency,
} from './schemas'

export type ConversionParams = {
  from: string
  to: string
  amount: number
}

export type Conversion = ConversionParams & {
  value: number
  timestamp?: number
}

const byCode = (a: Currency, b: Currency) => a.code.localeCompare(b.code)

export const fetchCurrencies = async (
  signal?: AbortSignal,
): Promise<Currency[]> => {
  const { response } = await request('/currencies', {
    schema: currenciesResponseSchema,
    signal,
  })

  const uniqueByCode = new Map(
    response.map((currency) => [currency.code, currency]),
  )
  return [...uniqueByCode.values()].sort(byCode)
}

export const fetchConversion = async (
  { from, to, amount }: ConversionParams,
  signal?: AbortSignal,
): Promise<Conversion> => {
  const { response } = await request('/convert', {
    params: { from, to, amount: String(amount) },
    schema: convertResponseSchema,
    signal,
  })

  return {
    from,
    to,
    amount,
    value: response.value,
    timestamp: response.timestamp,
  }
}
