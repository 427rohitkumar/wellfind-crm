import { useCallback, useEffect, useRef, useState } from 'react'

export const inputCls = 'input field__input w-full'

/**
 * Load async data. Re-runs when `deps` change or `reload()` is called.
 * `fn` may be a fresh closure each render; the latest one is used.
 */
export function useLoad(fn, deps = []) {
  const [state, setState] = useState({ key: null, data: null, error: '' })
  const [tick, setTick] = useState(0)
  const fnRef = useRef(fn)
  useEffect(() => {
    fnRef.current = fn
  })

  const key = `${JSON.stringify(deps)}|${tick}`

  useEffect(() => {
    let alive = true
    fnRef
      .current()
      .then((data) => alive && setState({ key, data, error: '' }))
      .catch((e) => alive && setState({ key, data: null, error: e.message || 'Request failed' }))
    return () => {
      alive = false
    }
  }, [key])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  const setData = useCallback(
    (v) => setState((s) => ({ ...s, data: typeof v === 'function' ? v(s.data) : v })),
    [],
  )

  return { data: state.data, error: state.error, loading: state.key !== key, reload, setData }
}
