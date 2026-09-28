import { CircleAlertIcon, RotateCwIcon } from 'lucide-react'

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

type ErrorAlertProps = {
  title: string
  description: string
  onRetry?: () => void
  isRetrying?: boolean
}

export const ErrorAlert = ({
  title,
  description,
  onRetry,
  isRetrying = false,
}: ErrorAlertProps) => (
  <Alert>
    <CircleAlertIcon />
    <AlertTitle>{title}</AlertTitle>
    <AlertDescription>{description}</AlertDescription>
    {onRetry && (
      <AlertAction>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onRetry}
          disabled={isRetrying}
        >
          {isRetrying ? <Spinner /> : <RotateCwIcon />}
          Retry
        </Button>
      </AlertAction>
    )}
  </Alert>
)
