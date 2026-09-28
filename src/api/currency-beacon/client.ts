import type { z } from 'zod'

import { httpError, invalidResponseError, networkError } from './errors'
import { metaEnvelopeSchema } from './schemas'

export const CURRENCY_BEACON_BASE_PATH = '/api/currencybeacon'

type RequestOptions<TSchema extends z.ZodType> = {
  params?: Record<string, string>
  schema: TSchema
  signal?: AbortSignal
}

/** CurrencyBeacon also reports errors inside HTTP 200 responses, so check both. */
const getHttpError = (response: Response, body: unknown) => {
  const envelope = metaEnvelopeSchema.safeParse(body)
  const meta = envelope.success ? envelope.data.meta : undefined

  if (!response.ok) return httpError(response.status, meta?.error_detail)
  if (meta && meta.code !== 200) return httpError(meta.code, meta.error_detail)
  return null
}

export const request = async <TSchema extends z.ZodType>(
  path: string,
  { params, schema, signal }: RequestOptions<TSchema>,
): Promise<z.output<TSchema>> => {
  const query = new URLSearchParams(params).toString()
  const url = `${CURRENCY_BEACON_BASE_PATH}${path}${query ? `?${query}` : ''}`

  let response: Response
  try {
    response = await fetch(url, { signal })
  } catch (error) {
    if (signal?.aborted) throw error
    throw networkError(error)
  }

  const body: unknown = await response.json().catch(() => null)

  const error = getHttpError(response, body)
  if (error) throw error

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw invalidResponseError(parsed.error)
  }

  return parsed.data
}
