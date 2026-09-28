import { zodResolver } from '@hookform/resolvers/zod'
import type { QueryStatus } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'

import type { ConversionParams } from '@/api/currency-beacon/endpoints'
import { getErrorMessage } from '@/api/currency-beacon/errors'
import type { Currency } from '@/api/currency-beacon/schemas'
import { useConversion } from '@/hooks/useConversion'
import { useCurrencies } from '@/hooks/useCurrencies'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import {
  type ConverterFormInput,
  type ConverterFormOutput,
  converterFormSchema,
  DEFAULT_CONVERTER_VALUES,
} from '@/schemas/converterForm'

const AMOUNT_DEBOUNCE_MS = 400
const NO_CURRENCIES: Currency[] = []

export type CurrencyListStatus = 'loading' | 'error' | 'ready'

const CURRENCY_LIST_STATUS: Record<QueryStatus, CurrencyListStatus> = {
  pending: 'loading',
  error: 'error',
  success: 'ready',
}

const toConversionParams = (
  values: ConverterFormInput,
): ConversionParams | null => {
  const result = converterFormSchema.safeParse(values)
  return result.success ? result.data : null
}

export const useCurrencyConverter = () => {
  const currenciesQuery = useCurrencies()
  const currencies = currenciesQuery.data ?? NO_CURRENCIES
  const currenciesByCode = new Map(
    currencies.map((currency) => [currency.code, currency]),
  )

  const {
    control,
    register,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<ConverterFormInput, unknown, ConverterFormOutput>({
    resolver: zodResolver(converterFormSchema),
    defaultValues: DEFAULT_CONVERTER_VALUES,
    mode: 'onChange',
  })
  const [amount, from, to] = useWatch({
    control,
    name: ['amount', 'from', 'to'],
  })

  const debouncedAmount = useDebouncedValue(amount, AMOUNT_DEBOUNCE_MS)
  const conversionQuery = useConversion(
    toConversionParams({ amount: debouncedAmount, from, to }),
  )
  const isAmountInvalid = !!errors.amount

  // In priority order: without currencies, a conversion error is secondary.
  const failedQueries = [
    { title: "Couldn't load currencies", query: currenciesQuery },
    { title: "Couldn't convert this amount", query: conversionQuery },
  ].filter(({ query }) => query.isError)
  const primaryFailure = failedQueries.at(0)

  const swapCurrencies = () => {
    const values = getValues()
    setValue('from', values.to, { shouldValidate: true })
    setValue('to', values.from, { shouldValidate: true })
  }

  return {
    control,
    register,
    amountError: errors.amount,
    currencyStatus: CURRENCY_LIST_STATUS[currenciesQuery.status],
    // Each side leaves out the other side's currency, so the pair always differs.
    fromCurrencies: currencies.filter((currency) => currency.code !== to),
    toCurrencies: currencies.filter((currency) => currency.code !== from),
    fromSymbol: currenciesByCode.get(from)?.symbol,
    toSymbol: currenciesByCode.get(to)?.symbol,
    getCurrencyName: (code: string) => currenciesByCode.get(code)?.name ?? code,
    conversion: isAmountInvalid ? undefined : conversionQuery.data,
    isConverting:
      !isAmountInvalid &&
      (conversionQuery.isFetching || amount !== debouncedAmount),
    failure: primaryFailure
      ? {
          title: primaryFailure.title,
          message: getErrorMessage(primaryFailure.query.error),
          isRetrying: failedQueries.some(({ query }) => query.isFetching),
          retry: () => {
            for (const { query } of failedQueries) void query.refetch()
          },
        }
      : null,
    swapCurrencies,
  }
}
