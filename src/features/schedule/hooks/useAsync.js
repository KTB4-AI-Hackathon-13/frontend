import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * 단순 데이터 로딩 훅: { data, loading, error, reload }
 * - loading 은 "요청 중인 키"와 "마지막으로 완료된 키"를 비교해서 파생한다.
 * - reload() 는 다음 로드가 끝날 때 resolve 되는 Promise 를 돌려준다 (낙관적 업데이트 해제 타이밍용).
 * - keepData: true 면 재로딩 중에도 이전 data 를 유지한다 (깜빡임 방지).
 */
export function useAsync(fn, deps, { keepData = true } = {}) {
  const [tick, setTick] = useState(0)
  const key = JSON.stringify([...deps, tick])
  const [result, setResult] = useState({ key: null, data: null, error: null })
  const resolvers = useRef([])

  useEffect(() => {
    let cancelled = false
    const settle = () => {
      const rs = resolvers.current
      resolvers.current = []
      rs.forEach((r) => r())
    }
    fn().then(
      (data) => {
        if (cancelled) return
        setResult({ key, data, error: null })
        settle()
      },
      (error) => {
        if (cancelled) return
        setResult((prev) => ({ key, data: keepData ? prev.data : null, error }))
        settle()
      },
    )
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const reload = useCallback(
    () =>
      new Promise((resolve) => {
        resolvers.current.push(resolve)
        setTick((t) => t + 1)
      }),
    [],
  )

  const loading = result.key !== key
  return {
    data: keepData ? result.data : loading ? null : result.data,
    error: loading ? null : result.error,
    loading,
    reload,
  }
}
