import { useId } from 'react'
import { type Control, Controller } from 'react-hook-form'

import type { Currency } from '@/api/currency-beacon/schemas'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import type { CurrencyListStatus } from '@/hooks/useCurrencyConverter'
import type {
  ConverterFormInput,
  ConverterFormOutput,
} from '@/schemas/converterForm'

import { CurrencyCombobox } from './CurrencyCombobox'

type CurrencyFieldProps = {
  control: Control<ConverterFormInput, unknown, ConverterFormOutput>
  name: 'from' | 'to'
  label: string
  currencies: Currency[]
  status: CurrencyListStatus
}

const PLACEHOLDERS: Record<CurrencyListStatus, string> = {
  loading: 'Loading currencies…',
  error: 'Currencies unavailable',
  ready: 'Select currency',
}

export const CurrencyField = ({
  control,
  name,
  label,
  currencies,
  status,
}: CurrencyFieldProps) => {
  const id = useId()

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          <CurrencyCombobox
            id={id}
            currencies={currencies}
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            placeholder={PLACEHOLDERS[status]}
            disabled={status !== 'ready'}
            invalid={fieldState.invalid}
          />
          <FieldError error={fieldState.error} />
        </Field>
      )}
    />
  )
}
