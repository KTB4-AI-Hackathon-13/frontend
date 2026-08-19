import { useEffect, useRef } from 'react'

/**
 * 목록 끝의 센티널 요소가 화면에 들어오면 onIntersect 를 호출한다 (무한 스크롤).
 * 반환된 ref 를 빈 <div> 에 달아 두면 된다.
 * @param {() => void} onIntersect
 * @param {{ enabled?: boolean, rootMargin?: string }} [opts]
 */
export function useInfiniteScroll(onIntersect, { enabled = true, rootMargin = '200px' } = {}) {
  const ref = useRef(null)
  const cbRef = useRef(onIntersect)
  useEffect(() => {
    cbRef.current = onIntersect
  })

  useEffect(() => {
    const el = ref.current
    if (!el || !enabled || typeof IntersectionObserver === 'undefined') return undefined
    const io = new IntersectionObserver(
      (entries) => entries.some((e) => e.isIntersecting) && cbRef.current(),
      { rootMargin },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [enabled, rootMargin])

  return ref
}
