import { CALENDAR_CELL_LIMIT, ITEM_STATUS, colorForSchedule } from '../utils/constants.js'
import { WEEKDAY_LABELS_MON_FIRST, buildMonthGridMonFirst } from '../utils/date.js'

/**
 * 와이어프레임 07 — 월간 캘린더 (월요일 시작).
 * - 날짜 칸은 최대 3개, 나머지는 "+N 더보기"
 * - 계획별 색상, 완료 항목은 흐리게
 * - 시간 없음, 일 단위
 */
function MonthCalendar({ year, month, days = [], today, selectedDate, onSelectDate, onOpenItem }) {
  const cells = buildMonthGridMonFirst(year, month)
  const byDate = Object.fromEntries(days.map((d) => [d.date, d]))

  return (
    <div className="cal">
      <div className="cal__weekdays">
        {WEEKDAY_LABELS_MON_FIRST.map((w, i) => (
          <div
            key={w}
            className={`cal__weekday ${i === 5 ? 'is-sat' : ''} ${i === 6 ? 'is-sun' : ''}`}
          >
            {w}
          </div>
        ))}
      </div>
      <div className="cal__grid">
        {cells.map((date, idx) => {
          if (!date) return <div key={`e${idx}`} className="cal__cell cal__cell--empty" />
          const day = byDate[date]
          const list = day?.items ?? []
          const visible = list.slice(0, CALENDAR_CELL_LIMIT)
          const rest = list.length - visible.length
          const dow = idx % 7
          const classes = [
            'cal__cell',
            date === today ? 'is-today' : '',
            date === selectedDate ? 'is-selected' : '',
            dow === 5 ? 'is-sat' : dow === 6 ? 'is-sun' : '',
          ].join(' ')
          return (
            <div
              key={date}
              className={classes}
              role="button"
              tabIndex={0}
              onClick={() => onSelectDate?.(date)}
              onKeyDown={(e) => e.key === 'Enter' && onSelectDate?.(date)}
            >
              <span className="cal__day">{Number(date.slice(8, 10))}</span>
              <div className="cal__chips">
                {visible.map((it) => (
                  <button
                    type="button"
                    key={it.id}
                    className={`chip-item ${it.status === ITEM_STATUS.COMPLETED ? 'is-done' : ''} ${
                      it.status === ITEM_STATUS.SKIPPED || it.status === ITEM_STATUS.CANCELLED
                        ? 'is-muted'
                        : ''
                    }`}
                    style={{ '--chip-color': colorForSchedule(it.scheduleId) }}
                    title={`${it.scheduleTitle} · ${it.title}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      onOpenItem?.(it)
                    }}
                  >
                    {it.title}
                  </button>
                ))}
                {rest > 0 && (
                  <button
                    type="button"
                    className="chip-more"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectDate?.(date)
                    }}
                  >
                    +{rest} 더보기
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MonthCalendar
