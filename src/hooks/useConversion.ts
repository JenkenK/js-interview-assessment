import { queryOptions, skipToken, useQuery } from '@tanstack/react-query'

import {
  type Conversion,
  type ConversionParams,
  fetchConversion,
} from '@/api/currency-beacon/endpoints'

const isSamePair = (conversion: Conversion, params: ConversionParams) =>
  conversion.from === params.from && conversion.to === params.to

export const conversionQueryOptions = (params: ConversionParams | null) =>
  queryOptions({
    queryKey: ['conversion', params],
    queryFn: params
      ? ({ signal }) => fetchConversion(params, signal)
      : skipToken,
    // Keep the last result visible while a new amount loads, but never across
    // pairs: an old EUR value must not appear under a GBP label.
    placeholderData: (previous) =>
      previous && params && isSamePair(previous, params) ? previous : undefined,
  })

export const useConversion = (params: ConversionParams | null) =>
  useQuery(conversionQueryOptions(params))
