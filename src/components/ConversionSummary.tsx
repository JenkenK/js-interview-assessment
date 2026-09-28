import type { Conversion } from '@/api/currency-beacon/endpoints'
import { Skeleton } from '@/components/ui/skeleton'
import { formatAmount, formatTimestamp } from '@/lib/format'
import { cn } from '@/lib/utils'

type ConversionSummaryProps = {
  conversion: Conversion | undefined
  isConverting: boolean
  getCurrencyName: (code: string) => string
}

export const ConversionSummary = ({
  conversion,
  isConverting,
  getCurrencyName,
}: ConversionSummaryProps) => (
  <div
    aria-live="polite"
    aria-busy={isConverting}
    className={cn(
      'min-h-20 transition-opacity',
      conversion && isConverting && 'opacity-50',
    )}
  >
    {conversion ? (
      <>
        <p className="text-sm text-muted-foreground">
          {formatAmount(conversion.amount, conversion.from)}{' '}
          {getCurrencyName(conversion.from)} equals
        </p>
        <p className="text-3xl font-semibold tracking-tight tabular-nums">
          {formatAmount(conversion.value, conversion.to)}{' '}
          {getCurrencyName(conversion.to)}
        </p>
        {conversion.timestamp !== undefined && (
          <p className="mt-1 text-xs text-muted-foreground">
            {formatTimestamp(conversion.timestamp)}
          </p>
        )}
      </>
    ) : isConverting ? (
      <div className="space-y-2" aria-label="Loading conversion">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-64" />
      </div>
    ) : (
      <p className="text-sm text-muted-foreground">
        Enter an amount and choose two currencies to convert.
      </p>
    )}
  </div>
)
