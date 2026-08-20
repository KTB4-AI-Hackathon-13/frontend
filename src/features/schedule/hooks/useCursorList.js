import { useCallback, useEffect, useRef, useState } from 'react'

import { isInvalidCursor } from '../../../shared/api/apiError.js'

/**
 * 커서 기반 목록 훅 (핸드오프 §2 "목록(커서 페이징)").
 * - fetchPage(cursor) 는 `{ items, nextCursor, hasNext }` 를 돌려주는 함수
 * - deps 가 바뀌면(예: status 탭) 첫 페이지부터 다시 로드
 * - loadMore(): nextCursor 로 다음 페이지를 이어 붙임 (hasNext=false 면 no-op)
 * - reload(): 첫 페이지 재조회가 끝날 때 resolve 되는 Promise 를 반환한다.
 * - INVALID_CURSOR(400) 이면 첫 페이지부터 자동 재시작 (문서: "첫 페이지부터 다시")
 *
 * 구현 메모: loading/loadingMore 는 "요청 키"와 "완료된 키"를 비교해 파생한다 (effect 안 동기 setState 없음).
 *
 * @template T
 * @param {(cursor: string | null) => Promise<{ items: T[], nextCursor: string | null, hasNext: boolean }>} fetchPage
 * @param {unknown[]} deps  fetchPage 가 의존하는 값들 (바뀌면 첫 페이지부터)
 */
export function useCursorList(fetchPage, deps) {
  const [resetTick, setResetTick] = useState(0)
  const reloadResolvers = useRef([])
  const genKey = JSON.stringify([...deps, resetTick]) // "세대" — 바뀌면 목록 초기화
  const [moreReq, setMoreReq] = useState(null) // { genKey, cursor } 추가 페이지 요청
  const [acc, setAcc] = useState({
    genKey: null,
    items: /** @type {T[]} */ ([]),
    nextCursor: null,
    hasNext: false,
    error: null,
    doneCursor: null, // 마지막으로 처리 완료한 추가 페이지 커서
  })

  // 1) 첫 페이지 — 세대가 바뀔 때마다
  useEffect(() => {
    let cancelled = false
    const settleReloads = () => {
      const resolvers = reloadResolvers.current
      reloadResolvers.current = []
      resolvers.forEach((resolve) => resolve())
    }
    fetchPage(null).then(
      (page) => {
        if (cancelled) return
        setAcc({
          genKey,
          items: page.items,
          nextCursor: page.nextCursor,
          hasNext: page.hasNext,
          error: null,
          doneCursor: null,
        })
        settleReloads()
      },
      (error) => {
        if (cancelled) return
        setAcc({ genKey, items: [], nextCursor: null, hasNext: false, error, doneCursor: null })
        settleReloads()
      },
    )
    return () => {
      cancelled = true
    }
    // fetchPage 는 deps 로 대표된다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genKey])

  const firstLoaded = acc.genKey === genKey
  const loading = !firstLoaded
  const activeMore = moreReq && moreReq.genKey === genKey && firstLoaded ? moreReq.cursor : null
  const loadingMore = activeMore != null && acc.doneCursor !== activeMore

  // 2) 추가 페이지 — loadMore() 로 요청된 커서가 있을 때
  useEffect(() => {
    if (activeMore == null || !loadingMore) return undefined
    let cancelled = false
    fetchPage(activeMore).then(
      (page) => {
        if (cancelled) return
        setAcc((cur) =>
          cur.genKey !== genKey
            ? cur
            : {
                ...cur,
                items: dedupeById([...cur.items, ...page.items]),
                nextCursor: page.nextCursor,
                hasNext: page.hasNext,
                error: null,
                doneCursor: activeMore,
              },
        )
      },
      (error) => {
        if (cancelled) return
        if (isInvalidCursor(error)) {
          // 커서가 깨지면 첫 페이지부터 다시
          setResetTick((t) => t + 1)
          return
        }
        setAcc((cur) => (cur.genKey !== genKey ? cur : { ...cur, error, doneCursor: activeMore }))
      },
    )
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genKey, activeMore, loadingMore])

  const loadMore = useCallback(() => {
    if (loading || loadingMore || !acc.hasNext || !acc.nextCursor) return
    setMoreReq({ genKey, cursor: acc.nextCursor })
  }, [loading, loadingMore, acc.hasNext, acc.nextCursor, genKey])

  const reload = useCallback(
    () =>
      new Promise((resolve) => {
        reloadResolvers.current.push(resolve)
        setResetTick((t) => t + 1)
      }),
    [],
  )

  return {
    items: acc.items,
    hasNext: acc.hasNext,
    loading,
    loadingMore,
    error: loading ? null : acc.error,
    loadMore,
    reload,
  }
}

function dedupeById(list) {
  const seen = new Set()
  return list.filter((x) => (seen.has(x.id) ? false : (seen.add(x.id), true)))
}
