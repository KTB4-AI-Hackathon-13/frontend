import {
  ITEM_STATUS,
  ITEM_PRIORITY_LABEL,
  STANDALONE_ITEM_LABEL,
  colorForSchedule,
  itemTypeLabelFor,
} from '../utils/constants.js'
import { WEEKDAY_LABELS_MON_FIRST, buildMonthGridMonFirst } from '../utils/date.js'
import { orderScheduleItems } from '../utils/items.js'

const itemTooltip = (item) =>
  [
    item.scheduleTitle ?? STANDALONE_ITEM_LABEL,
    item.title,
    itemTypeLabelFor(item.itemType),
    item.estimatedMinutes ? `예상 ${item.estimatedMinutes}분` : null,
    item.priority ? `우선순위 ${ITEM_PRIORITY_LABEL[item.priority] ?? item.priority}` : null,
  ]
    .filter(Boolean)
    .join(' · ')

const groupBySchedule = (items = []) =>
  Array.from(
    orderScheduleItems(items)
      .reduce((groups, item) => {
        const key =
          item.scheduleId == null ? `standalone-${item.id}` : `schedule-${item.scheduleId}`
        const group = groups.get(key) ?? {
          key,
          scheduleId: item.scheduleId,
          title: item.scheduleTitle ?? STANDALONE_ITEM_LABEL,
          items: [],
        }
        group.items.push(item)
        groups.set(key, group)
        return groups
      }, new Map())
      .values(),
  )

const isCompletedGroup = (group) =>
  group.items.every((item) => item.status === ITEM_STATUS.COMPLETED)

const isMutedGroup = (group) =>
  group.items.every(
    (item) => item.status === ITEM_STATUS.SKIPPED || item.status === ITEM_STATUS.CANCELLED,
  )

/**
 * 와이어프레임 07 — 월간 캘린더 (월요일 시작).
 * - 날짜 칸에 그 날 할 일을 전부 표시하고, 칸 높이는 행 수만큼 자란다 (잘라내기 없음)
 * - 같은 scheduleId의 할 일을 계획별 그룹 칩 하나로 표시
 * - 그룹 칩/칸 클릭 → onSelectDate(date), 개별 할 일은 날짜별 패널에서 확인
 * - 시간 없음, 일 단위
 */
function MonthCalendar({ year, month, days = [], today, selectedDate, onSelectDate }) {
  const cells = buildMonthGridMonFirst(year, month)
  const byDate = Object.fromEntries(days.map((d) => [d.date, d]))
  const groupsByDate = Object.fromEntries(
    cells.filter(Boolean).map((date) => [date, groupBySchedule(byDate[date]?.items)]),
  )
  const laneKeysByWeek = Array.from({ length: Math.ceil(cells.length / 7) }, (_, weekIndex) => {
    const laneKeys = []
    cells.slice(weekIndex * 7, weekIndex * 7 + 7).forEach((date) => {
      if (!date) return
      groupsByDate[date].forEach((group) => {
        if (!laneKeys.includes(group.key)) laneKeys.push(group.key)
      })
    })
    return laneKeys
  })

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
          const scheduleGroups = groupsByDate[date]
          const groupsByKey = new Map(scheduleGroups.map((group) => [group.key, group]))
          const laneKeys = laneKeysByWeek[Math.floor(idx / 7)]
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
                {laneKeys.map((laneKey) => {
                  const group = groupsByKey.get(laneKey)
                  if (!group)
                    return <span key={laneKey} className="cal__schedule-slot" aria-hidden="true" />

                  const previousDate = idx % 7 > 0 ? cells[idx - 1] : null
                  const nextDate = idx % 7 < 6 ? cells[idx + 1] : null
                  const continuesBefore = Boolean(
                    previousDate &&
                    groupsByDate[previousDate]?.some((item) => item.key === laneKey),
                  )
                  const continuesAfter = Boolean(
                    nextDate && groupsByDate[nextDate]?.some((item) => item.key === laneKey),
                  )

                  return (
                    <button
                      type="button"
                      key={group.key}
                      className={`chip-item cal__schedule-chip ${continuesBefore ? 'is-continued-before' : ''} ${continuesAfter ? 'is-continued-after' : ''} ${isCompletedGroup(group) ? 'is-done' : ''} ${isMutedGroup(group) ? 'is-muted' : ''}`}
                      style={{ '--chip-color': colorForSchedule(group.scheduleId) }}
                      title={group.items.map(itemTooltip).join('\n')}
                      aria-label={`${group.title}, ${date}, 할 일 ${group.items.length}개`}
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectDate?.(date)
                      }}
                    >
                      <span className="cal__schedule-title">
                        {continuesBefore ? '' : group.title}
                      </span>
                      <span className="cal__schedule-count">{group.items.length}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MonthCalendar
