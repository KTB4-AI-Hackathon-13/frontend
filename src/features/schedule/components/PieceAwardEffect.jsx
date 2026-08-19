import { useEffect } from 'react'

/**
 * 퍼즐 조각 획득 효과 — PATCH /schedule-items/{id}/status 응답의 puzzlePieceAwarded 가 true 일 때 표시.
 * ⚠️ 퍼즐 도메인(7번) 구현 전까지 서버는 항상 false 를 주므로 지금은 나타나지 않는다.
 *    true 로 바뀌면 이 컴포넌트가 그대로 동작한다 (puzzlePieceId 도 함께 받음).
 *
 * @param {{ award: { pieceId: number | null, itemTitle?: string } | null, onDone: () => void }} props
 */
function PieceAwardEffect({ award, onDone, duration = 2200 }) {
  useEffect(() => {
    if (!award) return undefined
    const t = setTimeout(onDone, duration)
    return () => clearTimeout(t)
  }, [award, onDone, duration])

  if (!award) return null
  return (
    <div className="award" role="status" aria-live="polite" onClick={onDone}>
      <div className="award__card">
        <span className="award__icon" aria-hidden="true">
          🧩
        </span>
        <strong className="award__title">퍼즐 조각 획득!</strong>
        <span className="award__sub">
          {award.itemTitle ? `"${award.itemTitle}" 완료` : '할 일 완료'}
          {award.pieceId != null && <span className="muted"> · 조각 #{award.pieceId}</span>}
        </span>
      </div>
    </div>
  )
}

export default PieceAwardEffect
