import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http } from 'msw'

import { apiError, convertUrl, currenciesUrl } from '@/test/handlers'
import { server } from '@/test/server'
import { renderWithQueryClient } from '@/test/test-utils'

import { CurrencyConverter } from './CurrencyConverter'

const getAmountInput = () => screen.getByLabelText('Amount')
const getConvertedInput = () => screen.getByLabelText('Converted amount')
const getCurrencyInput = (label: 'From' | 'To') =>
  screen.getByRole('combobox', { name: label })

const renderConverter = async () => {
  const user = userEvent.setup()
  renderWithQueryClient(<CurrencyConverter />)
  await waitFor(() => expect(getConvertedInput()).toHaveValue('0.90'))
  return { user }
}

const selectCurrency = async (
  user: ReturnType<typeof userEvent.setup>,
  label: 'From' | 'To',
  search: string,
) => {
  const input = getCurrencyInput(label)
  await user.clear(input)
  await user.type(input, search)
  await user.click(
    await screen.findByRole('option', { name: new RegExp(search, 'i') }),
  )
}

const trackConvertRequests = () => {
  const amounts: (string | null)[] = []
  server.events.on('request:start', ({ request }) => {
    const url = new URL(request.url)
    if (url.pathname === convertUrl)
      amounts.push(url.searchParams.get('amount'))
  })
  return amounts
}

afterEach(() => server.events.removeAllListeners())

describe('CurrencyConverter', () => {
  it('shows loading states, then the currencies and the default conversion', async () => {
    renderWithQueryClient(<CurrencyConverter />)

    expect(getCurrencyInput('From')).toBeDisabled()
    expect(getCurrencyInput('From')).toHaveAttribute(
      'placeholder',
      'Loading currencies…',
    )
    expect(screen.getByLabelText('Loading conversion')).toBeInTheDocument()

    await waitFor(() => expect(getConvertedInput()).toHaveValue('0.90'))
    expect(getCurrencyInput('From')).toHaveValue('USD – US Dollar')
    expect(getCurrencyInput('To')).toHaveValue('EUR – Euro')
    expect(screen.getByText('1.00 US Dollar equals')).toBeInTheDocument()
    expect(screen.getByText('0.90 Euro')).toBeInTheDocument()
  })

  it('converts the amount the user types, with a single request', async () => {
    const { user } = await renderConverter()
    const requestedAmounts = trackConvertRequests()

    await user.clear(getAmountInput())
    await user.type(getAmountInput(), '250')

    await waitFor(() => expect(getConvertedInput()).toHaveValue('225.00'))
    expect(requestedAmounts).toEqual(['250'])
  })

  it('converts into the selected currency', async () => {
    const { user } = await renderConverter()

    await selectCurrency(user, 'To', 'Pound')

    expect(getCurrencyInput('To')).toHaveValue('GBP – Pound Sterling')
    await waitFor(() => expect(getConvertedInput()).toHaveValue('0.80'))
  })

  it('swaps the currencies', async () => {
    const { user } = await renderConverter()

    await user.click(screen.getByRole('button', { name: 'Swap currencies' }))

    expect(getCurrencyInput('From')).toHaveValue('EUR – Euro')
    expect(getCurrencyInput('To')).toHaveValue('USD – US Dollar')
    await waitFor(() => expect(getConvertedInput()).toHaveValue('1.11'))
  })

  it.each([
    ['To', 'US Dollar'],
    ['From', 'Euro'],
  ] as const)(
    "doesn't offer the other side's currency in the %s list",
    async (label, otherCurrency) => {
      const { user } = await renderConverter()

      await user.clear(getCurrencyInput(label))
      await user.type(getCurrencyInput(label), otherCurrency)

      expect(await screen.findByText('No currencies found.')).toBeVisible()
    },
  )

  it('validates the amount and does not convert invalid input', async () => {
    const { user } = await renderConverter()
    const requestedAmounts = trackConvertRequests()

    await user.clear(getAmountInput())
    await user.type(getAmountInput(), '12abc')

    expect(await screen.findByText('Enter a valid number')).toBeInTheDocument()
    expect(getAmountInput()).toHaveAttribute('aria-invalid', 'true')
    expect(getConvertedInput()).toHaveValue('')
    expect(
      screen.getByText('Enter an amount and choose two currencies to convert.'),
    ).toBeInTheDocument()
    expect(requestedAmounts).toEqual([])
  })

  it('shows an error when the currencies fail to load, and recovers on retry', async () => {
    server.use(http.get(currenciesUrl, () => apiError(503), { once: true }))
    const user = userEvent.setup()
    renderWithQueryClient(<CurrencyConverter />)

    expect(
      await screen.findByText("Couldn't load currencies"),
    ).toBeInTheDocument()
    expect(screen.getByText(/unavailable right now/)).toBeInTheDocument()
    expect(getCurrencyInput('From')).toHaveAttribute(
      'placeholder',
      'Currencies unavailable',
    )

    await user.click(screen.getByRole('button', { name: 'Retry' }))

    await waitFor(() =>
      expect(getCurrencyInput('From')).toHaveValue('USD – US Dollar'),
    )
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows an error when the conversion fails', async () => {
    server.use(http.get(convertUrl, () => apiError(429)))
    renderWithQueryClient(<CurrencyConverter />)

    expect(
      await screen.findByText("Couldn't convert this amount"),
    ).toBeInTheDocument()
    expect(screen.getByText(/Too many requests/)).toBeInTheDocument()
  })

  it("doesn't reveal setup details when the API key is rejected", async () => {
    server.use(http.get(currenciesUrl, () => apiError(401)))
    renderWithQueryClient(<CurrencyConverter />)

    const alert = await screen.findByRole('alert')

    expect(alert).toHaveTextContent("Couldn't load currencies")
    expect(alert).toHaveTextContent(/unavailable right now/)
    expect(alert).not.toHaveTextContent(/API key|CURRENCYBEACON|\.env|401/i)
  })
})
