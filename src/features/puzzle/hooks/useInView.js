import { useEffect, useRef, useState } from 'react'

/**
 * 요소가 뷰포트 근처(rootMargin)에 들어오면 true 로 바뀌고, 그 뒤로는 계속 true 를 유지한다.
 * 퍼즐 카드 그리드처럼 한 화면에 카드가 여러 개 있을 때, 안 보이는 카드의 이미지 요청까지
 * 한꺼번에 쏘지 않게 지연시키는 용도.
 */
export function useInView({ rootMargin = '200px', enabled = true } = {}) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    if (inView || !enabled) return undefined
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return undefined
    }
    const io = new IntersectionObserver(
      (entries) => entries.some((e) => e.isIntersecting) && setInView(true),
      { rootMargin },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [inView, enabled, rootMargin])

  return [ref, inView]
}
