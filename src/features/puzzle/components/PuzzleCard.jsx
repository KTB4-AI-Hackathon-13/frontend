import PuzzleBoard from './PuzzleBoard.jsx'
import { fetchPuzzle } from '../api/puzzleApi.js'
import { usePuzzleImage } from '../hooks/usePuzzleImage.js'
import { useAsync } from '../../schedule/hooks/useAsync.js'
import { formatDot } from '../../schedule/utils/date.js'

/**
 * 내 퍼즐 카드 (와이어프레임 08).
 *
 * 썸네일과 상세 모달이 **같은 조각 배치**를 보여줘야 해서, 목록 응답(조각 배열 없음)만으로
 * 그리지 않고 GET /puzzles/{id} 로 실제 조각 상태를 받아온다. 도착 전에는 개수 기준으로
 * 먼저 그려 화면이 비지 않게 하고, 도착하면 실제 배치로 교체된다.
 * (목록 응답에 조각 획득 상태가 포함되면 이 추가 호출은 없앨 수 있다 — 백엔드 요청 항목)
 */
function PuzzleCard({ puzzle, onOpen }) {
  const { pieceCount: total, earnedPieceCount: earned } = puzzle
  const complete = puzzle.status === 'COMPLETED'
  const pct = total ? Math.round((earned / total) * 100) : 0
  const { imageUrl, hasImage, onImageError } = usePuzzleImage(puzzle)

  // 조각 수·획득 수가 바뀌면(할 일 완료 등) 다시 받아온다
  const { data: detail } = useAsync(() => fetchPuzzle(puzzle.id), [puzzle.id, total, earned])
  const pieces =
    detail?.pieces ??
    Array.from({ length: total }, (_, i) => ({ scheduleItemId: i, earned: i < earned }))

  return (
    <button type="button" className="pcard" onClick={() => onOpen?.(puzzle)}>
      <div className="pcard__thumb">
        <PuzzleBoard
          imageUrl={imageUrl}
          pieces={pieces}
          size={200}
          seed={puzzle.id}
          onImageError={onImageError}
        />
      </div>
      <div className="pcard__body">
        <div className="pcard__titleline">
          <span className="pcard__title">{puzzle.title}</span>
          <span className={`status status--${complete ? 'completed' : 'active'}`}>
            {complete ? '완성' : '진행 중'}
          </span>
        </div>
        {!hasImage && <span className="muted small">그림 준비 중</span>}
        <div className="pcard__meta">
          <span className="small">
            {earned} / {total} 조각 ({pct}%)
          </span>
          <span className="muted small">
            {complete && puzzle.completedAt
              ? `${formatDot(puzzle.completedAt.slice(0, 10))} 완성`
              : puzzle.visibility === 'PUBLIC'
                ? '공개'
                : '비공개'}
          </span>
        </div>
        <div className="bar">
          <div className="bar__fill" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <span className="pcard__action">{complete ? '작품 보기' : '진행 보기'} ›</span>
    </button>
  )
}

export default PuzzleCard
