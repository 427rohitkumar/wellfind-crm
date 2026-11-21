import { QueryClient } from '@tanstack/react-query'

/**
 * Single shared cache for every API read in the CRM.
 *
 * - Data is served instantly from cache and silently re-validated in the background
 *   (stale-while-revalidate), so revisiting a page never shows a blocking loader.
 * - Every successful write (POST/PATCH/PUT/DELETE, see apiClient) invalidates the cache, so
 *   mounted pages refetch immediately and the DOM never shows stale data after an update.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // fresh for 30s: no refetch on quick page hops
      gcTime: 10 * 60_000, // keep unused cache for 10 minutes
      refetchOnWindowFocus: true, // coming back to the tab pulls fresh data
      refetchOnReconnect: true,
      retry: (count, err) => !(err?.status >= 400 && err.status < 500) && count < 1,
    },
  },
})

/**
 * Cached data for a key, or undefined. Lets list pages paint instantly on revisit.
 * Entries invalidated by a write are treated as missing so pre-write data is never painted.
 */
export const peek = (key) =>
  queryClient.getQueryState(key)?.isInvalidated ? undefined : queryClient.getQueryData(key)

/**
 * Always hits the network (staleTime 0) but de-duplicates identical in-flight requests and
 * stores the result in the cache for the next visit.
 */
export const revalidate = (key, fn) =>
  queryClient.fetchQuery({ queryKey: key, queryFn: fn, staleTime: 0 })

/** Drop all cached reads (logout / session expiry) so one user's data never leaks to the next. */
export const clearCache = () => queryClient.clear()

/** Mark all cached reads stale and refetch the mounted ones. Called after every write. */
export const invalidateAll = () => queryClient.invalidateQueries()
