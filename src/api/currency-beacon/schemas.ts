import { z } from 'zod'

export const metaEnvelopeSchema = z.object({
  meta: z.object({
    code: z.number(),
    error_type: z.string().optional(),
    error_detail: z.string().optional(),
    disclaimer: z.string().optional(),
  }),
})

const currencySchema = z
  .object({
    short_code: z.string().min(1),
    name: z.string().min(1),
    symbol: z.string().optional(),
  })
  .transform(({ short_code, name, symbol }) => ({
    code: short_code,
    name,
    symbol: symbol || undefined,
  }))

export const currenciesResponseSchema = z.object({
  response: z.array(currencySchema),
})

export const convertResponseSchema = z.object({
  response: z.object({
    value: z.number(),
    timestamp: z.number().optional(),
  }),
})

export type Currency = z.output<typeof currencySchema>
