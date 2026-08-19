import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

import { pad2, shiftMonth } from '../utils/date.js'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const MONTH_RE = /^\d{4}-\d{2}$/

/**
 * 캘린더 탐색 상태를 URL 쿼리로 관리한다 — 뒤로/앞으로 가기로 월 이동이 되돌려지고, 주소를 공유하면 같은 화면이 열린다.
 *   ?date=YYYY-MM-DD  선택한 날짜 (없으면 오늘)
 *   ?month=YYYY-MM    보고 있는 달 (없으면 선택한 날짜의 달)
 *
 * - 월 이동(goMonth/goYear/goTo/goToday/jumpToDate) 은 history push → 브라우저 뒤로가기로 되돌림
 * - 날짜 선택(selectDate) 은 replace → 히스토리를 더럽히지 않음
 *
 * @param {{ today: string }} p  서버 기준 오늘 (YYYY-MM-DD)
 */
export function useCalendarNav({ today }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const dateParam = searchParams.get('date')
  const monthParam = searchParams.get('month')
  const selectedDate = DATE_RE.test(dateParam ?? '') ? dateParam : today
  const viewBase = MONTH_RE.test(monthParam ?? '') ? `${monthParam}-01` : selectedDate
  const year = Number(viewBase.slice(0, 4))
  const month = Number(viewBase.slice(5, 7))

  const update = useCallback(
    (patch, { replace = false } = {}) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          for (const [k, v] of Object.entries(patch)) {
            if (v == null) next.delete(k)
            else next.set(k, v)
          }
          return next
        },
        { replace },
      )
    },
    [setSearchParams],
  )

  /** 특정 연/월로 */
  const goTo = useCallback((y, m) => update({ month: `${y}-${pad2(m)}` }), [update])
  /** ±n 개월 */
  const goMonth = useCallback(
    (delta) => {
      const n = shiftMonth(year, month, delta)
      goTo(n.year, n.month)
    },
    [year, month, goTo],
  )
  /** ±n 년 */
  const goYear = useCallback((delta) => goTo(year + delta, month), [year, month, goTo])
  /** 오늘 달 + 오늘 선택 */
  const goToday = useCallback(() => update({ month: null, date: null }), [update])
  /** 보고 있는 달 안에서 날짜 선택 (캘린더 칸 클릭) */
  const selectDate = useCallback(
    (d) => update({ date: d === today ? null : d, month: null }, { replace: true }),
    [update, today],
  )
  /** 임의 날짜로 점프 (그 달로 이동 + 선택) — "날짜로 이동" 입력 */
  const jumpToDate = useCallback(
    (d) => {
      if (!DATE_RE.test(d ?? '')) return
      update({ date: d === today ? null : d, month: null })
    },
    [update, today],
  )

  return { year, month, selectedDate, goTo, goMonth, goYear, goToday, selectDate, jumpToDate }
}
