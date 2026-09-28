import { z } from 'zod'

import { getNumberSeparators } from '@/lib/format'

const MAX_AMOUNT = 1_000_000_000_000

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const createAmountParser = (locale?: string) => {
  const { group, decimal } = getNumberSeparators(locale)
  // Locales that group with a (narrow) no-break space also accept a typed space.
  const groupSeparator = /\s/.test(group) ? '\\s' : escapeRegExp(group)
  const decimalSeparator = escapeRegExp(decimal)

  const ungrouped = '\\d+'
  const grouped = `\\d{1,3}(?:${groupSeparator}\\d{2,3})*${groupSeparator}\\d{3}`
  const integer = `(?:${ungrouped}|${grouped})`
  const withOptionalFraction = `${integer}(?:${decimalSeparator}\\d*)?`
  const fractionOnly = `${decimalSeparator}\\d+`

  const groupSeparators = new RegExp(groupSeparator, 'g')

  return {
    pattern: new RegExp(`^(?:${withOptionalFraction}|${fractionOnly})$`),
    toNumber: (value: string) =>
      Number(value.replace(groupSeparators, '').replace(decimal, '.')),
  }
}

export const createConverterFormSchema = (locale?: string) => {
  const amountParser = createAmountParser(locale)

  return z
    .object({
      amount: z
        .string()
        .trim()
        .min(1, 'Enter an amount')
        .pipe(z.string().regex(amountParser.pattern, 'Enter a valid number'))
        .transform(amountParser.toNumber)
        .pipe(
          z
            .number()
            .positive('Enter an amount greater than 0')
            .max(MAX_AMOUNT, 'That amount is too large'),
        ),
      from: z.string().min(1, 'Select a currency'),
      to: z.string().min(1, 'Select a currency'),
    })
    .refine(({ from, to }) => from !== to, {
      path: ['to'],
      message: 'Choose two different currencies',
    })
}

export const converterFormSchema = createConverterFormSchema()

export type ConverterFormInput = z.input<typeof converterFormSchema>
export type ConverterFormOutput = z.output<typeof converterFormSchema>

export const DEFAULT_CONVERTER_VALUES: ConverterFormInput = {
  amount: '1',
  from: 'USD',
  to: 'EUR',
}
