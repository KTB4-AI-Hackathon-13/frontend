import { Link } from 'react-router-dom'

import { ITEM_STATUS, colorForSchedule } from '../utils/constants.js'
import { formatDateLong } from '../utils/date.js'

/**
 * 와이어프레임 07 오른쪽 — 오늘 할 일 (GET /schedule-items/today)
 * 체크 = PATCH /schedule-items/{id}/status (COMPLETED ↔ TODO)
 */
function TodayPanel({ data, loading, onToggle, onAdd, isToday = true, title = '오늘 할 일' }) {
  const items = data?.items ?? []
  const completed = data?.completedCount ?? 0
  const total = data?.totalCount ?? 0

  return (
    <aside className="today">
      <div className="today__head">
        <h2 className="today__title">{title}</h2>
        <span className="today__count">
          {completed} / {total}
        </span>
      </div>
      {data?.date && <p className="today__date">{formatDateLong(data.date)}</p>}

      {loading && <p className="muted small">불러오는 중…</p>}

      {!loading && items.length === 0 && (
        <div className="today__empty">
          <p>{isToday ? '오늘 할 일이 없어요.' : '이 날은 할 일이 없어요.'}</p>
          <p className="muted small">새 할 일을 추가하거나 AI와 계획을 만들어 보세요.</p>
        </div>
      )}

      <ul className="today__list">
        {items.map((it) => {
          const done = it.status === ITEM_STATUS.COMPLETED
          const inactive = it.status === ITEM_STATUS.SKIPPED || it.status === ITEM_STATUS.CANCELLED
          return (
            <li
              key={it.id}
              className={`today__item ${done ? 'is-done' : ''} ${inactive ? 'is-muted' : ''}`}
            >
              <label className="today__check">
                <input
                  type="checkbox"
                  checked={done}
                  disabled={inactive}
                  onChange={() => onToggle?.(it, done ? ITEM_STATUS.TODO : ITEM_STATUS.COMPLETED)}
                  aria-label={`${it.title} 완료`}
                />
              </label>
              <div className="today__body">
                <span className="today__item-title">{it.title}</span>
                <Link
                  to={`/schedules/${it.scheduleId}`}
                  className="today__schedule"
                  style={{ '--chip-color': colorForSchedule(it.scheduleId) }}
                >
                  {it.scheduleTitle}
                </Link>
              </div>
            </li>
          )
        })}
      </ul>

      <div className="today__foot">
        <button type="button" className="btn btn--block" onClick={onAdd}>
          {isToday ? '오늘 할 일 추가' : '이 날 할 일 추가'}
        </button>
      </div>
    </aside>
  )
}

export default TodayPanel
