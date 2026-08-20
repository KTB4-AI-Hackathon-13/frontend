import {
  ITEM_SOURCE_LABEL,
  ITEM_STATUS,
  ITEM_TYPE_LABEL,
  categoryLabelFor,
  colorForSchedule,
} from '../utils/constants.js'
import { WEEKDAY_LABELS_MON_FIRST, buildMonthGridMonFirst } from '../utils/date.js'
import { orderScheduleItems } from '../utils/items.js'

const itemTooltip = (item) =>
  [
    item.scheduleTitle,
    item.title,
    categoryLabelFor(item.categoryId) ?? ITEM_TYPE_LABEL[item.itemType],
    ITEM_SOURCE_LABEL[item.source],
    item.priority ? `우선순위 ${item.priority}` : null,
    item.workload ? `작업량 ${item.workload}` : null,
  ]
    .filter(Boolean)
    .join(' · ')

/**
 * 와이어프레임 07 — 월간 캘린더 (월요일 시작).
 * - 날짜 칸에 그 날 할 일을 전부 표시하고, 칸 높이는 행 수만큼 자란다 (잘라내기 없음)
 * - 계획별 색상, 완료 항목은 흐리게
 * - 칩 클릭 → onOpenItem(item, date) (할 일 모달), 칸 클릭 → onSelectDate(date)
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
          const list = orderScheduleItems(day?.items)
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
                {list.map((it) => (
                  <button
                    type="button"
                    key={it.id}
                    className={`chip-item ${it.status === ITEM_STATUS.COMPLETED ? 'is-done' : ''} ${
                      it.status === ITEM_STATUS.SKIPPED || it.status === ITEM_STATUS.CANCELLED
                        ? 'is-muted'
                        : ''
                    }`}
                    style={{ '--chip-color': colorForSchedule(it.scheduleId) }}
                    title={itemTooltip(it)}
                    onClick={(e) => {
                      e.stopPropagation()
                      onOpenItem?.(it, date)
                    }}
                  >
                    {it.title}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MonthCalendar
