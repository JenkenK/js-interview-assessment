import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import type { Currency } from '@/api/currency-beacon/schemas'

import { CurrencyCombobox } from './CurrencyCombobox'

const currencies: Currency[] = [
  { code: 'AUD', name: 'Australian Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
]

const renderCombobox = (value = 'EUR') => {
  const onValueChange = vi.fn()
  render(
    <CurrencyCombobox
      currencies={currencies}
      value={value}
      onValueChange={onValueChange}
    />,
  )
  return { onValueChange, input: screen.getByRole('combobox') }
}

describe('CurrencyCombobox', () => {
  it('shows the selected currency', () => {
    const { input } = renderCombobox('EUR')

    expect(input).toHaveValue('EUR – Euro')
  })

  it('filters currencies by name', async () => {
    const user = userEvent.setup()
    const { input } = renderCombobox()

    await user.clear(input)
    await user.type(input, 'dollar')

    const options = await screen.findAllByRole('option')
    expect(options.map((option) => option.textContent)).toEqual([
      'AUD Australian Dollar',
      'USD US Dollar',
    ])
  })

  it('reports the selected currency code', async () => {
    const user = userEvent.setup()
    const { input, onValueChange } = renderCombobox()

    await user.clear(input)
    await user.type(input, 'usd')
    await user.click(await screen.findByRole('option', { name: /US Dollar/ }))

    expect(onValueChange).toHaveBeenCalledWith('USD')
  })

  it('shows an empty state when nothing matches', async () => {
    const user = userEvent.setup()
    const { input } = renderCombobox()

    await user.clear(input)
    await user.type(input, 'zzz')

    expect(await screen.findByText('No currencies found.')).toBeVisible()
  })
})
