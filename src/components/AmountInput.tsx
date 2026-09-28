import type { ComponentProps } from 'react'

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group'
import { Spinner } from '@/components/ui/spinner'

type AmountInputProps = ComponentProps<'input'> & {
  symbol?: string
  isLoading?: boolean
}

export const AmountInput = ({
  symbol,
  isLoading = false,
  ...inputProps
}: AmountInputProps) => (
  <InputGroup>
    <InputGroupInput
      type="text"
      inputMode="decimal"
      autoComplete="off"
      className="tabular-nums"
      {...inputProps}
    />
    {symbol && (
      <InputGroupAddon>
        <InputGroupText>{symbol}</InputGroupText>
      </InputGroupAddon>
    )}
    {isLoading && (
      <InputGroupAddon align="inline-end">
        <Spinner />
      </InputGroupAddon>
    )}
  </InputGroup>
)
