const DEFAULT_FRACTION_DIGITS = 2
const MIN_SIGNIFICANT_DIGITS = 4

export const getCurrencyFractionDigits = (currency: string) => {
  try {
    return (
      new Intl.NumberFormat('en', {
        style: 'currency',
        currency,
      }).resolvedOptions().maximumFractionDigits ?? DEFAULT_FRACTION_DIGITS
    )
  } catch {
    return DEFAULT_FRACTION_DIGITS
  }
}

export const formatAmount = (value: number, currency: string) => {
  const fractionDigits = getCurrencyFractionDigits(currency)
  const magnitude = Math.abs(value)
  const maximumFractionDigits =
    magnitude > 0 && magnitude < 1
      ? Math.max(
          fractionDigits,
          MIN_SIGNIFICANT_DIGITS - 1 - Math.floor(Math.log10(magnitude)),
        )
      : fractionDigits

  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits,
  }).format(value)
}

export const getNumberSeparators = (locale?: string) => {
  const parts = new Intl.NumberFormat(locale).formatToParts(1_000_000.5)

  return {
    group: parts.find((part) => part.type === 'group')?.value ?? ',',
    decimal: parts.find((part) => part.type === 'decimal')?.value ?? '.',
  }
}

export const formatTimestamp = (unixSeconds: number) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(unixSeconds * 1000))
