import { ArrowUpDownIcon } from 'lucide-react'
import { useId } from 'react'

import { ErrorAlert } from '@/components/ErrorAlert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Separator } from '@/components/ui/separator'
import { useCurrencyConverter } from '@/hooks/useCurrencyConverter'
import { formatAmount } from '@/lib/format'

import { AmountInput } from './AmountInput'
import { ConversionSummary } from './ConversionSummary'
import { CurrencyField } from './CurrencyField'

const ROW_CLASS_NAME = 'grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]'

export const CurrencyConverter = () => {
  const amountId = useId()
  const convertedId = useId()
  const {
    control,
    register,
    amountError,
    currencyStatus,
    fromCurrencies,
    toCurrencies,
    fromSymbol,
    toSymbol,
    getCurrencyName,
    conversion,
    isConverting,
    failure,
    swapCurrencies,
  } = useCurrencyConverter()

  return (
    <Card className="w-full">
      <CardHeader>
        {failure ? (
          <ErrorAlert
            title={failure.title}
            description={failure.message}
            onRetry={failure.retry}
            isRetrying={failure.isRetrying}
          />
        ) : (
          <ConversionSummary
            conversion={conversion}
            isConverting={isConverting}
            getCurrencyName={getCurrencyName}
          />
        )}
      </CardHeader>

      <CardContent>
        <form noValidate onSubmit={(event) => event.preventDefault()}>
          <FieldGroup>
            <div className={ROW_CLASS_NAME}>
              <Field data-invalid={!!amountError}>
                <FieldLabel htmlFor={amountId}>Amount</FieldLabel>
                <AmountInput
                  id={amountId}
                  symbol={fromSymbol}
                  aria-invalid={!!amountError}
                  {...register('amount')}
                />
                <FieldError error={amountError} />
              </Field>
              <CurrencyField
                control={control}
                name="from"
                label="From"
                currencies={fromCurrencies}
                status={currencyStatus}
              />
            </div>

            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={swapCurrencies}
                aria-label="Swap currencies"
              >
                <ArrowUpDownIcon />
              </Button>
              <Separator className="flex-1" />
            </div>

            <div className={ROW_CLASS_NAME}>
              <Field>
                <FieldLabel htmlFor={convertedId}>Converted amount</FieldLabel>
                <AmountInput
                  id={convertedId}
                  readOnly
                  value={
                    conversion
                      ? formatAmount(conversion.value, conversion.to)
                      : ''
                  }
                  placeholder="—"
                  symbol={toSymbol}
                  isLoading={isConverting}
                />
              </Field>
              <CurrencyField
                control={control}
                name="to"
                label="To"
                currencies={toCurrencies}
                status={currencyStatus}
              />
            </div>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
