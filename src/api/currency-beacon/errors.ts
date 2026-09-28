type CurrencyApiErrorKind = 'http' | 'network' | 'invalid-response'

export class CurrencyApiError extends Error {
  readonly kind: CurrencyApiErrorKind
  readonly status?: number

  constructor(
    kind: CurrencyApiErrorKind,
    message: string,
    { status, cause }: { status?: number; cause?: unknown } = {},
  ) {
    super(message, { cause })
    this.name = 'CurrencyApiError'
    this.kind = kind
    this.status = status
  }
}

const HTTP_ERROR_HINTS: Record<number, string> = {
  401: 'The API key was rejected. Check CURRENCYBEACON_API_KEY in .env and restart the dev server.',
  403: "The CurrencyBeacon plan doesn't include this endpoint.",
  429: 'The CurrencyBeacon rate limit was reached.',
}

export const httpError = (status: number, detail?: string) =>
  new CurrencyApiError(
    'http',
    [`CurrencyBeacon responded with HTTP ${status}.`, HTTP_ERROR_HINTS[status]]
      .filter(Boolean)
      .join(' '),
    { status, cause: detail },
  )

export const networkError = (cause: unknown) =>
  new CurrencyApiError(
    'network',
    'The request to CurrencyBeacon failed before a response arrived.',
    { cause },
  )

export const invalidResponseError = (cause: unknown) =>
  new CurrencyApiError(
    'invalid-response',
    "CurrencyBeacon's response didn't match the expected schema.",
    { cause },
  )

export const isCurrencyApiError = (error: unknown): error is CurrencyApiError =>
  error instanceof CurrencyApiError

export const USER_ERROR_MESSAGES = {
  offline:
    "Couldn't reach the currency service. Check your connection and try again.",
  rateLimited: 'Too many requests. Please wait a moment and try again.',
  unavailable:
    'The currency service is unavailable right now. Please try again later.',
}

export const getErrorMessage = (error: unknown) => {
  if (!isCurrencyApiError(error)) return USER_ERROR_MESSAGES.unavailable
  if (error.kind === 'network') return USER_ERROR_MESSAGES.offline
  if (error.status === 429) return USER_ERROR_MESSAGES.rateLimited
  return USER_ERROR_MESSAGES.unavailable
}

/** Only transient failures are worth retrying: auth, quota and bad requests won't fix themselves. */
export const isRetryableError = (error: unknown) =>
  !isCurrencyApiError(error) ||
  error.kind === 'network' ||
  (error.kind === 'http' && (error.status ?? 0) >= 500)
