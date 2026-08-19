import { useEffect, useRef, useState } from 'react'

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)

/**
 * 월/연도 피커 팝오버 — 헤더의 "2026년 8월" 제목을 누르면 열린다 (Google/Notion 캘린더 패턴).
 * - 연도 ‹ › 로 연 이동, 12개월 버튼으로 바로 점프, "오늘" 로 현재 달
 * - Esc / 바깥 클릭으로 닫힘. 열릴 때 현재 달 버튼에 포커스
 *
 * @param {{ year: number, month: number, today: string, onPick: (y: number, m: number) => void, onClose: () => void }} props
 */
function MonthPicker({ year, month, today, onPick, onClose }) {
  const [viewYear, setViewYear] = useState(year)
  const ref = useRef(null)
  const todayY = Number(today.slice(0, 4))
  const todayM = Number(today.slice(5, 7))

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    window.addEventListener('keydown', onKey, true)
    document.addEventListener('mousedown', onDown)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      document.removeEventListener('mousedown', onDown)
    }
  }, [onClose])

  useEffect(() => {
    ref.current?.querySelector('.month-picker__month.is-current')?.focus()
  }, [])

  return (
    <div className="month-picker" ref={ref} role="dialog" aria-label="월 선택">
      <div className="month-picker__year">
        <button
          type="button"
          className="btn btn--icon btn--sm"
          onClick={() => setViewYear((y) => y - 1)}
          aria-label="이전 해"
        >
          ‹
        </button>
        <strong>{viewYear}년</strong>
        <button
          type="button"
          className="btn btn--icon btn--sm"
          onClick={() => setViewYear((y) => y + 1)}
          aria-label="다음 해"
        >
          ›
        </button>
      </div>
      <div className="month-picker__grid">
        {MONTHS.map((m) => {
          const isCurrent = viewYear === year && m === month
          const isToday = viewYear === todayY && m === todayM
          return (
            <button
              key={m}
              type="button"
              className={`month-picker__month ${isCurrent ? 'is-current' : ''} ${isToday ? 'is-today' : ''}`}
              onClick={() => onPick(viewYear, m)}
              aria-current={isCurrent ? 'date' : undefined}
            >
              {m}월
            </button>
          )
        })}
      </div>
      <div className="month-picker__foot">
        <button type="button" className="link" onClick={() => onPick(todayY, todayM)}>
          오늘 ({todayY}년 {todayM}월)
        </button>
      </div>
    </div>
  )
}

export default MonthPicker
