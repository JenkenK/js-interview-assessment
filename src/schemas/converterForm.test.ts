import { converterFormSchema, createConverterFormSchema } from './converterForm'

const parseAmount = (amount: string, locale = 'en-US') =>
  createConverterFormSchema(locale).shape.amount.safeParse(amount)

describe('converterFormSchema amount', () => {
  it.each([
    ['1', 1],
    ['42.5', 42.5],
    ['1,000.50', 1000.5],
    ['1,000,000', 1_000_000],
    ['.5', 0.5],
    ['1.', 1],
    [' 7 ', 7],
  ])('accepts %j as %d', (input, expected) => {
    expect(parseAmount(input)).toMatchObject({ success: true, data: expected })
  })

  it.each([
    ['', 'Enter an amount'],
    ['abc', 'Enter a valid number'],
    ['1.2.3', 'Enter a valid number'],
    ['1,5', 'Enter a valid number'],
    ['1,0000', 'Enter a valid number'],
    ['-5', 'Enter a valid number'],
    ['1e5', 'Enter a valid number'],
    ['0', 'Enter an amount greater than 0'],
    ['2000000000000', 'That amount is too large'],
  ])('rejects %j with "%s"', (input, message) => {
    const result = parseAmount(input)

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toBe(message)
  })

  it.each([
    ['de-DE', '1.000,50', 1000.5],
    ['de-DE', '1,5', 1.5],
    ['fr-FR', '1 000,5', 1000.5],
    ['fr-FR', '1\u202f000,5', 1000.5],
    ['en-IN', '1,00,000', 100_000],
  ])('reads %s input %j as %d', (locale, input, expected) => {
    expect(parseAmount(input, locale)).toMatchObject({
      success: true,
      data: expected,
    })
  })

  it('rejects the other convention instead of misreading it', () => {
    expect(parseAmount('1.5', 'de-DE').success).toBe(false)
  })
})

describe('converterFormSchema currencies', () => {
  it('rejects converting a currency into itself', () => {
    const result = converterFormSchema.safeParse({
      amount: '1',
      from: 'USD',
      to: 'USD',
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0]).toMatchObject({
      path: ['to'],
      message: 'Choose two different currencies',
    })
  })
})
