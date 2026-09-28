import { queryOptions, useQuery } from '@tanstack/react-query'

import { fetchCurrencies } from '@/api/currency-beacon/endpoints'

export const currenciesQueryOptions = queryOptions({
  queryKey: ['currencies'],
  queryFn: ({ signal }) => fetchCurrencies(signal),
  staleTime: Infinity,
})

export const useCurrencies = () => useQuery(currenciesQueryOptions)
