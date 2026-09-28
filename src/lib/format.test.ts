import {
  formatAmount,
  getCurrencyFractionDigits,
  getNumberSeparators,
} from './format'

describe('getNumberSeparators', () => {
  it.each([
    ['en-US', ',', '.'],
    ['de-DE', '.', ','],
    ['fr-FR', '\u202f', ','],
  ])(
    '%s groups with %j and marks decimals with %j',
    (locale, group, decimal) => {
      expect(getNumberSeparators(locale)).toEqual({ group, decimal })
    },
  )
})

describe('getCurrencyFractionDigits', () => {
  it.each([
    ['USD', 2],
    ['JPY', 0],
    ['KWD', 3],
  ])('%s has %i minor units', (currency, digits) => {
    expect(getCurrencyFractionDigits(currency)).toBe(digits)
  })

  it('falls back to 2 for codes the runtime rejects', () => {
    expect(getCurrencyFractionDigits('not-a-code')).toBe(2)
  })
})

describe('formatAmount', () => {
  it.each([
    [90, 'EUR', '90.00'],
    [1234.5, 'USD', '1,234.50'],
    [150.4, 'JPY', '150'],
    [1.5, 'KWD', '1.500'],
    [0.9, 'EUR', '0.90'],
    [0.9234, 'EUR', '0.9234'],
    [0.0064, 'USD', '0.0064'],
    [0.000123, 'USD', '0.000123'],
  ])('formats %d %s as %s', (value, currency, expected) => {
    expect(formatAmount(value, currency)).toBe(expected)
  })
})
