import type { Currency } from '@/api/currency-beacon/schemas'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox'

type CurrencyComboboxProps = {
  id?: string
  currencies: Currency[]
  value: string
  onValueChange: (code: string) => void
  onBlur?: () => void
  placeholder?: string
  disabled?: boolean
  invalid?: boolean
}

const toLabel = (currency: Currency) => `${currency.code} – ${currency.name}`

export const CurrencyCombobox = ({
  id,
  currencies,
  value,
  onValueChange,
  onBlur,
  placeholder,
  disabled = false,
  invalid = false,
}: CurrencyComboboxProps) => {
  const selected =
    currencies.find((currency) => currency.code === value) ?? null

  return (
    <Combobox
      items={currencies}
      value={selected}
      onValueChange={(currency) => onValueChange(currency?.code ?? '')}
      itemToStringLabel={toLabel}
      itemToStringValue={(currency) => currency.code}
      isItemEqualToValue={(item, selectedItem) =>
        item.code === selectedItem.code
      }
      autoHighlight
      disabled={disabled}
    >
      <ComboboxInput
        id={id}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        onBlur={onBlur}
        className="w-full"
      />
      <ComboboxContent>
        <ComboboxEmpty>No currencies found.</ComboboxEmpty>
        <ComboboxList>
          {(currency: Currency) => (
            <ComboboxItem key={currency.code} value={currency}>
              <span className="w-9 shrink-0 font-medium">{currency.code}</span>{' '}
              <span className="truncate text-muted-foreground">
                {currency.name}
              </span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
