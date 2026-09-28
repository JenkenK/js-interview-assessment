import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const FieldGroup = ({ className, ...props }: React.ComponentProps<'div'>) => {
  return (
    <div
      data-slot="field-group"
      className={cn('flex w-full flex-col gap-5', className)}
      {...props}
    />
  )
}

const Field = ({ className, ...props }: React.ComponentProps<'div'>) => {
  return (
    <div
      role="group"
      data-slot="field"
      className={cn(
        'flex w-full flex-col gap-2 *:w-full data-[invalid=true]:text-destructive',
        className,
      )}
      {...props}
    />
  )
}

const FieldLabel = ({
  className,
  ...props
}: React.ComponentProps<typeof Label>) => {
  return (
    <Label
      data-slot="field-label"
      className={cn('flex w-fit gap-2 leading-snug', className)}
      {...props}
    />
  )
}

const FieldError = ({
  className,
  error,
  ...props
}: React.ComponentProps<'div'> & { error?: { message?: string } }) => {
  if (!error?.message) return null

  return (
    <div
      role="alert"
      data-slot="field-error"
      className={cn('text-sm font-normal text-destructive', className)}
      {...props}
    >
      {error.message}
    </div>
  )
}

export { Field, FieldError, FieldGroup, FieldLabel }
