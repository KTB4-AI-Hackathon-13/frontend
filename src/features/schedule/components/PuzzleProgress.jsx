/**
 * 퍼즐 진행도 — 작업 1건 = 퍼즐 조각 1개 (핸드오프 §3 규칙).
 * completed / total (= completedPuzzleCount / puzzleCount) 를 막대 + 조각 그리드로 보여준다.
 * 조각별 실제 매핑(어느 작업이 어느 조각인지)은 퍼즐 도메인(7번) 몫이라 여기서는 개수 기준으로만 채운다.
 */
function PuzzleProgress({ completed = 0, total = 0, showGrid = false, maxGrid = 40 }) {
  const pct = total ? Math.round((completed / total) * 100) : 0
  const cells = showGrid ? Math.min(total, maxGrid) : 0
  return (
    <div className="puzzle">
      <div className="puzzle__line">
        <div className="bar" aria-hidden="true">
          <div className="bar__fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="small puzzle__count">
          {completed} / {total} 조각 ({pct}%)
        </span>
      </div>
      {showGrid && total > 0 && (
        <div className="puzzle__grid" aria-label={`퍼즐 조각 ${total}개 중 ${completed}개 완료`}>
          {Array.from({ length: cells }, (_, i) => (
            <span
              key={i}
              className={`puzzle__piece ${i < completed ? 'is-filled' : ''}`}
              aria-hidden="true"
            />
          ))}
          {total > maxGrid && <span className="muted small">+{total - maxGrid}</span>}
        </div>
      )}
    </div>
  )
}

export default PuzzleProgress
