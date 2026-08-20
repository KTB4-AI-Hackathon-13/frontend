import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'

import { fetchMyPuzzles } from '../features/puzzle/api/puzzleApi.js'
import PuzzleCard from '../features/puzzle/components/PuzzleCard.jsx'
import PuzzleDetailModal from '../features/puzzle/components/PuzzleDetailModal.jsx'
import { useCursorList } from '../features/schedule/hooks/useCursorList.js'
import { useInfiniteScroll } from '../features/schedule/hooks/useInfiniteScroll.js'
import ErrorNotice from '../shared/components/ErrorNotice.jsx'

const PAGE_SIZE = 12

const FILTERS = [
  { key: '', label: '전체' },
  { key: 'IN_PROGRESS', label: '진행 중' },
  { key: 'COMPLETED', label: '완성' },
]

/**
 * 내 퍼즐 (와이어프레임 08) — GET /puzzles/mine?status&size&cursor
 * - 탭으로 진행/완성 필터, 커서 무한 스크롤(스케줄 목록과 같은 훅)
 * - 카드 클릭 → 퍼즐 상세 모달 (GET /puzzles/{id})
 * - 할 일 1건 완료 = 조각 1개. 퍼즐은 그 계획에서 첫 조각이 지급될 때 서버가 만든다
 */
function PuzzlesPage() {
  const [status, setStatus] = useState('')
  const [open, setOpen] = useState(null) // 열려 있는 퍼즐 요약
  const fetchPage = useCallback(
    (cursor) => fetchMyPuzzles({ status: status || undefined, size: PAGE_SIZE, cursor }),
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
          <h1 className="page-title">내 퍼즐</h1>
          <p className="page-sub">할 일을 하나 끝낼 때마다 조각이 한 개씩 채워져요.</p>
        </div>
        <Link to="/schedules" className="btn">
          내 계획 보기
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
        <div className="empty">
          <p>아직 퍼즐이 없어요.</p>
          <p className="muted small">
            계획의 할 일을 처음 완료하면 그 계획의 퍼즐이 만들어지고 첫 조각이 채워져요.
          </p>
          <Link to="/" className="btn">
            오늘 할 일 보러가기
          </Link>
        </div>
      )}

      <div className="pgrid">
        {items.map((p) => (
          <PuzzleCard key={p.id} puzzle={p} onOpen={() => setOpen(p)} />
        ))}
      </div>

      {!loading && items.length > 0 && (
        <div className="list-foot" ref={sentinelRef}>
          {loadingMore && <span className="muted small">더 불러오는 중…</span>}
          {!loadingMore && !error && hasNext && (
            <button type="button" className="btn btn--sm" onClick={loadMore}>
              더 보기
            </button>
          )}
          {!hasNext && !error && <span className="muted small">마지막 퍼즐까지 불러왔어요.</span>}
        </div>
      )}

      {open && (
        <PuzzleDetailModal
          puzzleId={open.id}
          pieceCount={open.pieceCount}
          earnedPieceCount={open.earnedPieceCount}
          onClose={() => setOpen(null)}
        />
      )}
    </section>
  )
}

export default PuzzlesPage
