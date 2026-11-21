import { useCallback, useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

export const inputCls = 'input field__input w-full'

/**
 * Load async data through the shared React Query cache (stale-while-revalidate).
 *
 * - Revisiting a screen paints cached data instantly (`loading` stays false) and refreshes quietly.
 * - Re-runs when `deps` change or `reload()` is called; any successful write refetches mounted loads.
 * - `fn` may be a fresh closure each render; the latest one is used. The cache key is the loader's
 *   source plus `deps`, so two screens calling the same loader with the same deps share one request.
 */
export function useLoad(fn, deps = []) {
  const qc = useQueryClient()
  const fnRef = useRef(fn)
  useEffect(() => {
    fnRef.current = fn
  })

  const queryKey = ['load', fn.toString(), JSON.stringify(deps)]
  const q = useQuery({
    queryKey,
    queryFn: async () => (await fnRef.current()) ?? null, // react-query rejects `undefined`
  })

  const keyRef = useRef(queryKey)
  useEffect(() => {
    keyRef.current = queryKey
  })

  const reload = useCallback(() => {
    qc.invalidateQueries({ queryKey: keyRef.current })
  }, [qc])
  const setData = useCallback(
    (v) => qc.setQueryData(keyRef.current, (old) => (typeof v === 'function' ? v(old ?? null) : v)),
    [qc],
  )

  return {
    data: q.data ?? null,
    error: q.error ? q.error.message || 'Request failed' : '',
    loading: q.isPending,
    reload,
    setData,
  }
}
