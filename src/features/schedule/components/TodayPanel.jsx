import {
  ITEM_STATUS,
  ITEM_STATUS_LABEL,
  ITEM_SOURCE_LABEL,
  ITEM_TYPE_LABEL,
  categoryLabelFor,
  colorForSchedule,
} from '../utils/constants.js'
import { formatDateLong } from '../utils/date.js'
import { orderScheduleItems } from '../utils/items.js'

/**
 * 오늘 할 일 패널 (와이어프레임 07 오른쪽) — 선택한 날짜의 모든 할 일을 나열, 체크만 한다.
 * - 데이터: GET /schedule-items/today (오늘) 또는 GET /calendar 응답의 해당 날짜 (다른 날짜 선택 시)
 * - 체크박스 = PATCH /schedule-items/{id}/status (COMPLETED ↔ TODO). 낙관적 업데이트는 부모(useItemStatus)가 담당
 * - 행(체크박스 밖) 클릭 → onOpen(item): 수정·상태·삭제는 할 일 모달에서
 * - 같은 날짜 안 순서는 서버가 준 순서 그대로 (position → priority → id)
 */
function TodayPanel({
  data,
  loading,
  onToggle,
  onOpen,
  onAdd,
  isToday = true,
  title = '오늘 할 일',
  statusOf = (it) => it.status,
  pending = new Set(),
}) {
  const items = orderScheduleItems(data?.items)
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

      {loading && items.length === 0 && <p className="muted small">불러오는 중…</p>}

      {!loading && items.length === 0 && (
        <div className="today__empty">
          <p>{isToday ? '오늘 할 일이 없어요.' : '이 날은 할 일이 없어요.'}</p>
          <p className="muted small">새 할 일을 추가하거나 AI와 계획을 만들어 보세요.</p>
        </div>
      )}

      <ul className="today__list">
        {items.map((it) => {
          const st = statusOf(it)
          const done = st === ITEM_STATUS.COMPLETED
          const cancelled = st === ITEM_STATUS.CANCELLED
          const inactive = st === ITEM_STATUS.SKIPPED || cancelled
          const isPending = pending.has(it.id)
          const category = categoryLabelFor(it.categoryId)
          const itemType = ITEM_TYPE_LABEL[it.itemType]
          const source = ITEM_SOURCE_LABEL[it.source]
          return (
            <li
              key={it.id}
              className={`today__item ${done ? 'is-done' : ''} ${inactive ? 'is-muted' : ''} ${isPending ? 'is-pending' : ''}`}
              style={{ '--chip-color': colorForSchedule(it.scheduleId) }}
            >
              <label className="today__check" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={done}
                  disabled={cancelled || isPending}
                  onChange={() => onToggle?.(it, done ? ITEM_STATUS.TODO : ITEM_STATUS.COMPLETED)}
                  aria-label={`${it.title} 완료`}
                />
              </label>
              <button
                type="button"
                className="today__body today__open"
                onClick={() => onOpen?.(it)}
                title="클릭해서 수정 · 삭제"
              >
                <span className="today__item-title">
                  {it.title}
                  {st !== ITEM_STATUS.TODO && st !== ITEM_STATUS.COMPLETED && (
                    <span className="pill pill--muted">{ITEM_STATUS_LABEL[st]}</span>
                  )}
                </span>
                <span className="today__schedule">
                  {[it.scheduleTitle, category ?? itemType, source].filter(Boolean).join(' · ')}
                </span>
              </button>
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
