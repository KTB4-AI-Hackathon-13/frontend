import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'

import { fetchSchedules } from '../features/schedule/api/scheduleApi.js'
import PuzzleProgress from '../features/schedule/components/PuzzleProgress.jsx'
import ScheduleModal from '../features/schedule/components/ScheduleModal.jsx'
import { useCursorList } from '../features/schedule/hooks/useCursorList.js'
import { useInfiniteScroll } from '../features/schedule/hooks/useInfiniteScroll.js'
import {
  SCHEDULE_STATUS,
  SCHEDULE_STATUS_LABEL,
  colorForSchedule,
} from '../features/schedule/utils/constants.js'
import { formatPeriod } from '../features/schedule/utils/date.js'
import ErrorNotice from '../shared/components/ErrorNotice.jsx'

/** 한 페이지 크기 (1~100). seed 가 적어 무한 스크롤을 확인하려면 .env 에 VITE_SCHEDULE_PAGE_SIZE=1 */
const PAGE_SIZE = Number(import.meta.env.VITE_SCHEDULE_PAGE_SIZE) || 20

const FILTERS = [
  { key: '', label: '전체' },
  { key: SCHEDULE_STATUS.ACTIVE, label: '진행 중' },
  { key: SCHEDULE_STATUS.DRAFT, label: '검토 중' },
  { key: SCHEDULE_STATUS.COMPLETED, label: '완료' },
  { key: SCHEDULE_STATUS.ARCHIVED, label: '보관' },
]

/**
 * 내 계획 목록 — GET /schedules?status&size=20&cursor (커서 무한 스크롤, 최신순)
 * - 탭(status) 바뀌면 첫 페이지부터, 스크롤 끝에 닿으면 nextCursor 로 다음 페이지
 * - 행 클릭 → 계획 모달 (퍼즐 진행도 · 제목/기간 편집 PATCH · 삭제 DELETE). 상세 페이지 없음
 * - 스케줄 생성 화면은 없음 (AI 생성 API, 다른 담당)
 */
function SchedulesPage() {
  const [status, setStatus] = useState('')
  const [selected, setSelected] = useState(null) // ScheduleSummary
  const fetchPage = useCallback(
    (cursor) => fetchSchedules({ status: status || undefined, size: PAGE_SIZE, cursor }),
    [status],
  )
  const { items, hasNext, loading, loadingMore, error, loadMore, reload } = useCursorList(
    fetchPage,
    [status],
  )
  const sentinelRef = useInfiniteScroll(loadMore, { enabled: hasNext && !loading && !loadingMore })

  return (
    <section className="page">
      <header className="page-head">
        <div>
          <h1 className="page-title">내 계획</h1>
          <p className="page-sub">
            계획을 누르면 진행도를 보고 이름·기간을 고치거나 삭제할 수 있어요.
          </p>
        </div>
        <Link
          to="/ai"
          className="btn btn--primary"
          aria-disabled="true"
          onClick={(e) => e.preventDefault()}
          title="AI 계획 만들기 (다른 담당 · 준비 중)"
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
      {!loading && error && items.length === 0 && <ErrorNotice error={error} onRetry={reload} />}
      {!loading && !error && items.length === 0 && (
        <div className="empty">해당하는 계획이 없습니다.</div>
      )}

      <ul className="plan-list">
        {items.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              className="plan-row"
              style={{ '--chip-color': colorForSchedule(s.id) }}
              onClick={() => setSelected(s)}
            >
              <span className="plan-row__color" />
              <div className="plan-row__main">
                <div className="plan-row__title-line">
                  <span className="plan-row__title">{s.title}</span>
                  <span className={`status status--${s.status.toLowerCase()}`}>
                    {SCHEDULE_STATUS_LABEL[s.status]}
                  </span>
                </div>
                <div className="muted small">
                  {formatPeriod(s.startDate, s.endDate)} · 할 일 {s.puzzleCount}개 · v
                  {s.currentVersion}
                </div>
              </div>
              <div className="plan-row__progress">
                <PuzzleProgress completed={s.completedPuzzleCount} total={s.puzzleCount} />
              </div>
              <span className="plan-row__arrow">›</span>
            </button>
          </li>
        ))}
      </ul>

      {/* 무한 스크롤 센티널 + 수동 버튼(접근성/관찰자 미지원 폴백) */}
      {!loading && items.length > 0 && (
        <div className="list-foot" ref={sentinelRef}>
          {loadingMore && <span className="muted small">더 불러오는 중…</span>}
          {!loadingMore && error && (
            <ErrorNotice error={error} onRetry={loadMore} retryLabel="다시 불러오기" compact />
          )}
          {!loadingMore && !error && hasNext && (
            <button type="button" className="btn btn--sm" onClick={loadMore}>
              더 보기
            </button>
          )}
          {!hasNext && !error && <span className="muted small">마지막 계획까지 불러왔어요.</span>}
        </div>
      )}

      {selected && (
        <ScheduleModal
          key={selected.id}
          schedule={selected}
          onClose={() => setSelected(null)}
          onChanged={reload}
        />
      )}
    </section>
  )
}

export default SchedulesPage
