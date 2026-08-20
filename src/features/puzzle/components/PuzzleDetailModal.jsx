import { useState } from 'react'
import { Link } from 'react-router-dom'

import PuzzleBoard from './PuzzleBoard.jsx'
import { getPuzzleDetail } from '../api/puzzleCache.js'
import { usePuzzleImage } from '../hooks/usePuzzleImage.js'
import Modal from '../../schedule/components/Modal.jsx'
import { useAsync } from '../../schedule/hooks/useAsync.js'
import { formatDot } from '../../schedule/utils/date.js'
import ErrorNotice from '../../../shared/components/ErrorNotice.jsx'

/**
 * 퍼즐 상세 모달 (와이어프레임 09-1 변형 — 이 프로젝트는 상세 페이지 대신 모달).
 * - GET /puzzles/{puzzleId} 로 조각별 획득 상태를 받아 판을 그린다
 * - 조각에 마우스를 올리면 어떤 할 일로 딴 조각인지 + 몇 번째로 획득했는지(position) 보여준다
 * - 공개 범위(visibility)는 서버 값을 배지로 보여주기만 한다. 변경 PATCH·좋아요·신고는 백엔드에 없어 UI 도 두지 않는다
 */
function PuzzleDetailModal({ puzzleId, pieceCount, earnedPieceCount, onClose }) {
  // 카드가 이미 받아둔 상세가 있으면 캐시에서 즉시 나온다 (추가 요청 없음)
  const {
    data: puzzle,
    loading,
    error,
    reload,
  } = useAsync(
    () => getPuzzleDetail(puzzleId, pieceCount, earnedPieceCount),
    [puzzleId, pieceCount, earnedPieceCount],
  )
  const [hovered, setHovered] = useState(null)

  const { imageUrl, hasImage, onImageError } = usePuzzleImage(puzzle)
  const complete = puzzle?.status === 'COMPLETED'
  const pct = puzzle?.pieceCount
    ? Math.round((puzzle.earnedPieceCount / puzzle.pieceCount) * 100)
    : 0

  return (
    <Modal title={puzzle?.title ?? '퍼즐'} onClose={onClose} width={760}>
      {loading && !puzzle && <p className="muted">불러오는 중…</p>}
      {error && <ErrorNotice error={error} onRetry={reload} compact />}

      {puzzle && (
        <div className="pdetail">
          <div className="pdetail__board">
            <PuzzleBoard
              imageUrl={imageUrl}
              pieces={puzzle.pieces}
              size={320}
              seed={puzzle.id}
              showNumbers
              onImageError={onImageError}
              onPieceHover={setHovered}
            />
            <p className="pdetail__hint muted small">
              {hovered
                ? hovered.earned
                  ? `“${hovered.scheduleItemTitle}” 완료로 ${(hovered.position ?? 0) + 1}번째 조각 획득 · ${formatDot((hovered.earnedAt ?? '').slice(0, 10))}`
                  : `“${hovered.scheduleItemTitle}” (${formatDot(hovered.scheduledDate)}) — 완료하면 이 칸이 열려요`
                : '조각에 마우스를 올리면 어떤 할 일로 얻은 조각인지 보여요.'}
            </p>
          </div>

          <div className="pdetail__info">
            <div className="pdetail__row">
              <span className={`status status--${complete ? 'completed' : 'active'}`}>
                {complete ? '완성' : '진행 중'}
              </span>
              <span className={`pill ${puzzle.visibility === 'PUBLIC' ? '' : 'pill--muted'}`}>
                {puzzle.visibility === 'PUBLIC' ? '공개' : '비공개'}
              </span>
            </div>

            <dl className="summary__list">
              <div>
                <dt>계획</dt>
                <dd>
                  <Link to="/schedules" onClick={onClose} className="link">
                    {puzzle.title}
                  </Link>
                </dd>
              </div>
              <div>
                <dt>조각</dt>
                <dd>
                  {puzzle.earnedPieceCount} / {puzzle.pieceCount} ({pct}%)
                  <div className="bar">
                    <div className="bar__fill" style={{ width: `${pct}%` }} />
                  </div>
                </dd>
              </div>
              <div>
                <dt>완성일</dt>
                <dd>{puzzle.completedAt ? formatDot(puzzle.completedAt.slice(0, 10)) : '—'}</dd>
              </div>
            </dl>

            <p className="muted small">
              할 일을 하나 완료할 때마다 조각이 한 개씩 열려요. 모두 열면 원본 그림이 공개됩니다.
              {!hasImage && ' 이 퍼즐에는 아직 그림이 배정되지 않았어요.'}
            </p>
          </div>
        </div>
      )}
    </Modal>
  )
}

export default PuzzleDetailModal
