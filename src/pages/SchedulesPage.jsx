import { useCallback, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { createSchedule, fetchSchedules } from '../features/schedule/api/scheduleApi.js'
import Modal from '../features/schedule/components/Modal.jsx'
import PuzzleProgress from '../features/schedule/components/PuzzleProgress.jsx'
import ScheduleCreateForm from '../features/schedule/components/ScheduleCreateForm.jsx'
import ScheduleModal from '../features/schedule/components/ScheduleModal.jsx'
import { useCursorList } from '../features/schedule/hooks/useCursorList.js'
import { useInfiniteScroll } from '../features/schedule/hooks/useInfiniteScroll.js'
import { useAsync } from '../features/schedule/hooks/useAsync.js'
import {
  SCHEDULE_STATUS,
  SCHEDULE_STATUS_LABEL,
  colorForSchedule,
} from '../features/schedule/utils/constants.js'
import { formatPeriod } from '../features/schedule/utils/date.js'
import ErrorNotice from '../shared/components/ErrorNotice.jsx'
import { fetchCategories } from '../shared/api/categoryApi.js'

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
 * - 선택된 탭은 URL 쿼리(?status=)가 기준이다. 퍼즐 상세에서 "계획"을 누르면
 *   그 퍼즐의 상태(진행 중/완성)에 맞는 탭으로 바로 들어오고, 새로고침·뒤로가기에서도 유지된다
 * - 탭(status) 바뀌면 첫 페이지부터, 스크롤 끝에 닿으면 nextCursor 로 다음 페이지
 * - 행 클릭 → 계획 모달 (퍼즐 진행도 · 제목/기간 편집 PATCH · 삭제 DELETE). 상세 페이지 없음
 * - 사용자는 직접 계획을 추가하거나 AI와 대화해 계획을 만들 수 있다.
 */
function SchedulesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const statusParam = searchParams.get('status') ?? ''
  // 모르는 값이 들어오면 전체 탭으로 (다른 화면에서 넘어온 쿼리를 그대로 믿지 않는다)
  const status = FILTERS.some((f) => f.key === statusParam) ? statusParam : ''
  const [selected, setSelected] = useState(null) // ScheduleSummary
  const [createOpen, setCreateOpen] = useState(false)
  const [createError, setCreateError] = useState(null)
  const [creating, setCreating] = useState(false)
  const categories = useAsync(fetchCategories, [], { keepData: true })
  const fetchPage = useCallback(
    (cursor) => fetchSchedules({ status: status || undefined, size: PAGE_SIZE, cursor }),
    [status],
  )
  const { items, hasNext, loading, loadingMore, error, loadMore, reload } = useCursorList(
    fetchPage,
    [status],
  )
  const sentinelRef = useInfiniteScroll(loadMore, { enabled: hasNext && !loading && !loadingMore })

  const selectStatus = (key) => {
    const next = new URLSearchParams(searchParams)
    if (key) next.set('status', key)
    else next.delete('status')
    setSearchParams(next, { replace: true })
  }

  const handleCreate = async (body) => {
    setCreating(true)
    setCreateError(null)
    try {
      await createSchedule(body)
      setCreateOpen(false)
      reload()
    } catch (e) {
      setCreateError(e)
    } finally {
      setCreating(false)
    }
  }

  return (
    <section className="page page--centered">
      <header className="page-head">
        <div>
          <h1 className="page-title">내 계획</h1>
          <p className="page-sub">
            계획을 누르면 진행도를 보고 이름·기간을 고치거나 삭제할 수 있어요.
          </p>
        </div>
        <div className="page-head__actions">
          <button
            type="button"
            className="btn"
            onClick={() => {
              setCreateError(null)
              setCreateOpen(true)
            }}
          >
            + 직접 계획 추가
          </button>
          <Link to="/conversations" className="btn btn--primary">
            AI 계획 만들기
          </Link>
        </div>
      </header>

      <div className="tabs" role="tablist">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            role="tab"
            aria-selected={status === f.key}
            className={`tab ${status === f.key ? 'is-active' : ''}`}
            onClick={() => selectStatus(f.key)}
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
          categories={categories.data ?? []}
          onClose={() => setSelected(null)}
          onChanged={reload}
        />
      )}

      {createOpen && (
        <Modal title="직접 계획 추가" onClose={() => setCreateOpen(false)}>
          <ScheduleCreateForm
            categories={categories.data ?? []}
            onSubmit={handleCreate}
            onCancel={() => setCreateOpen(false)}
            serverError={createError}
            submitting={creating}
          />
        </Modal>
      )}
    </section>
  )
}

export default SchedulesPage
