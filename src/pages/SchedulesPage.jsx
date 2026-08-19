import { useState } from 'react'
import { Link } from 'react-router-dom'

import { fetchSchedules } from '../features/schedule/api/scheduleApi.js'
import { useAsync } from '../features/schedule/hooks/useAsync.js'
import {
  SCHEDULE_STATUS,
  SCHEDULE_STATUS_LABEL,
  colorForSchedule,
} from '../features/schedule/utils/constants.js'
import { formatPeriod } from '../features/schedule/utils/date.js'

const FILTERS = [
  { key: '', label: '전체' },
  { key: SCHEDULE_STATUS.ACTIVE, label: '진행 중' },
  { key: SCHEDULE_STATUS.DRAFT, label: '검토 중' },
  { key: SCHEDULE_STATUS.COMPLETED, label: '완료' },
  { key: SCHEDULE_STATUS.ARCHIVED, label: '보관' },
]

/** 내 계획 목록 — GET /schedules?status */
function SchedulesPage() {
  const [status, setStatus] = useState('')
  const { data, loading, error } = useAsync(
    () => fetchSchedules({ status: status || undefined }),
    [status],
  )
  const list = data?.items ?? []

  return (
    <section className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title">내 계획</h1>
          <p className="page-sub">AI와 만든 계획과 직접 만든 계획을 관리하세요.</p>
        </div>
        <Link
          to="/ai"
          className="btn btn--primary"
          aria-disabled="true"
          onClick={(e) => e.preventDefault()}
          title="AI 대화 (3·4번 API)"
        >
          AI 계획 만들기
        </Link>
      </header>

      <div className="tabs" role="tablist">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            role="tab"
            aria-selected={status === f.key}
            className={`tab ${status === f.key ? 'is-active' : ''}`}
            onClick={() => setStatus(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && <p className="muted">불러오는 중…</p>}
      {error && <p className="form-error">{error.message}</p>}
      {!loading && list.length === 0 && <div className="empty">해당하는 계획이 없습니다.</div>}

      <ul className="plan-list">
        {list.map((s) => {
          const pct = s.puzzleCount ? Math.round((s.completedPuzzleCount / s.puzzleCount) * 100) : 0
          return (
            <li key={s.id}>
              <Link
                to={`/schedules/${s.id}`}
                className="plan-row"
                style={{ '--chip-color': colorForSchedule(s.id) }}
              >
                <span className="plan-row__color" />
                <div className="plan-row__main">
                  <div className="plan-row__title-line">
                    <span className="plan-row__title">{s.title}</span>
                    <span className={`status status--${s.status.toLowerCase()}`}>
                      {SCHEDULE_STATUS_LABEL[s.status]}
                    </span>
                    <span className="muted small">
                      {s.source === 'AI' ? 'AI 생성' : '직접 생성'}
                    </span>
                  </div>
                  <div className="muted small">
                    {formatPeriod(s.startDate, s.endDate)} · 할 일 {s.puzzleCount}개
                  </div>
                </div>
                <div className="plan-row__progress">
                  <div className="bar">
                    <div className="bar__fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="small">
                    {s.completedPuzzleCount} / {s.puzzleCount} 조각
                  </span>
                </div>
                <span className="plan-row__arrow">›</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default SchedulesPage
