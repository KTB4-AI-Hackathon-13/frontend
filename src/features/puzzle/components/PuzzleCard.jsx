import PuzzleBoard from './PuzzleBoard.jsx'
import { getPuzzleDetail } from '../api/puzzleCache.js'
import { useInView } from '../hooks/useInView.js'
import { usePuzzleImage } from '../hooks/usePuzzleImage.js'
import { useAsync } from '../../schedule/hooks/useAsync.js'
import { formatDot } from '../../schedule/utils/date.js'

/**
 * 내 퍼즐 카드 (와이어프레임 08).
 *
 * 썸네일과 상세 모달이 **같은 조각 배치**를 보여줘야 하는데 목록 응답에는 조각 배열이 없다.
 * 그래서 부분 진행(0% 도 100% 도 아닌) 퍼즐만 상세를 한 번 받아온다.
 * 0% 는 전부 빈 칸, 100% 는 전부 채움이라 개수만으로 배치가 정해지므로 요청이 필요 없다.
 * 요청은 puzzleCache 가 캐시·동시 실행 수 제한으로 관리한다.
 * (목록 응답에 조각 획득 상태가 포함되면 이 추가 호출은 아예 없앨 수 있다 — 백엔드 요청 06번)
 *
 * 그림은 카드가 화면에 들어왔을 때만 받아온다(useInView) — 안 보이는 카드까지 서명 URL 을
 * 한꺼번에 요청하지 않도록.
 */
function PuzzleCard({ puzzle, onOpen }) {
  const { pieceCount: total, earnedPieceCount: earned } = puzzle
  const complete = puzzle.status === 'COMPLETED'
  const pct = total ? Math.round((earned / total) * 100) : 0
  // 카드가 화면에 들어오기 전엔 이미지를 요청하지 않는다 (그리드에 카드가 여러 장이면
  // 안 보이는 카드까지 한꺼번에 서명 URL·이미지를 받아오면서 느려지는 걸 막는다)
  const [thumbRef, inView] = useInView()
  const { imageUrl, hasImage, imageLoading, imageFailed, onImageError } = usePuzzleImage(puzzle, {
    enabled: inView,
  })

  // 부분 진행일 때만 실제 배치가 필요하다. 조각 수·획득 수가 바뀌면 다시 받아온다.
  const needsDetail = earned > 0 && earned < total
  const { data: detail } = useAsync(
    () => (needsDetail ? getPuzzleDetail(puzzle.id, total, earned) : Promise.resolve(null)),
    [puzzle.id, total, earned, needsDetail],
  )
  const pieces =
    detail?.pieces ??
    Array.from({ length: total }, (_, i) => ({ scheduleItemId: i, earned: i < earned }))
  const canOpen = typeof onOpen === 'function'
  const CardRoot = canOpen ? 'button' : 'article'

  return (
    <CardRoot
      {...(canOpen ? { type: 'button', onClick: () => onOpen(puzzle) } : {})}
      className={`pcard ${canOpen ? '' : 'pcard--readonly'}`.trim()}
    >
      <div className="pcard__thumb" ref={thumbRef}>
        <PuzzleBoard
          imageUrl={imageUrl}
          imageLoading={imageLoading}
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
        {!hasImage && !imageLoading && (
          <span className="muted small">
            {imageFailed ? '그림을 불러오지 못했어요' : '그림 준비 중'}
          </span>
        )}
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
      {canOpen && (
        <span className="pcard__action">{complete ? '작품 보기' : '진행 보기'} ›</span>
      )}
    </CardRoot>
  )
}

export default PuzzleCard
