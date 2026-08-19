import { useCallback, useEffect, useState } from 'react'

/**
 * 단순 데이터 로딩 훅: { data, loading, error, reload }
 * loading 은 "요청 중인 키"와 "마지막으로 완료된 키"를 비교해서 파생한다.
 */
export function useAsync(fn, deps) {
  const [tick, setTick] = useState(0)
  const key = JSON.stringify([...deps, tick])
  const [result, setResult] = useState({ key: null, data: null, error: null })

  useEffect(() => {
    let cancelled = false
    fn().then(
      (data) => !cancelled && setResult({ key, data, error: null }),
      (error) => !cancelled && setResult({ key, data: null, error }),
    )
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  const loading = result.key !== key
  return { data: result.data, error: loading ? null : result.error, loading, reload }
}
