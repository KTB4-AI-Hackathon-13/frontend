/**
 * 퍼즐판 분할 규칙.
 *
 * 원칙
 *  1) **틀은 항상 같은 정사각형**이다. 퍼즐마다 판 모양이 달라지지 않는다.
 *  2) 조각 수 = 그 계획의 할 일 수. 조각은 틀을 **빈 칸 없이 정확히** 채운다.
 *
 * 조각 수가 소수(7, 11 …)라 rows×cols 로 딱 떨어지지 않으면, 정사각형에 가까운 격자를 고르고
 * 남는 칸 1~2개를 옆 칸과 합쳐 하나의 조각(가로 2칸짜리)으로 만든다. 그래서 빈 칸이 생기지 않는다.
 */

/** 격자를 고를 때 칸이 합쳐지는 것에 주는 벌점 (정사각형에 가까운 쪽을 더 중요하게 본다) */
const MERGE_PENALTY = 0.35
/** 허용하는 최대 합침 수 */
const MAX_MERGES = 2

/**
 * 조각 수에 맞는 격자와 조각 배치를 계산한다.
 *
 * @param {number} count 조각 수 (= 유효한 할 일 수)
 * @returns {{ rows: number, cols: number, pieces: {r:number,c:number,rowSpan:number,colSpan:number}[] }}
 *          pieces[i] 는 i번째 조각이 차지하는 칸 영역. 길이는 항상 count 와 같다.
 */
export function resolveLayout(count) {
  const n = Math.max(1, Math.floor(count) || 1)
  const { rows, cols } = pickGrid(n)
  return { rows, cols, pieces: assignPieces(rows, cols, n) }
}

/** 정사각형 틀에 가장 잘 맞으면서 남는 칸이 적은 격자 고르기 */
function pickGrid(n) {
  let best = null
  for (let rows = 1; rows <= n; rows += 1) {
    const minCols = Math.ceil(n / rows)
    for (let cols = minCols; cols <= minCols + MAX_MERGES; cols += 1) {
      const extra = rows * cols - n
      if (extra < 0 || extra > MAX_MERGES) continue
      // 칸이 정사각형에 가까울수록(=rows 와 cols 가 비슷할수록) 좋다
      const squareness = Math.abs(Math.log(rows / cols))
      const score = squareness + extra * MERGE_PENALTY
      if (!best || score < best.score) best = { rows, cols, score }
    }
  }
  return best ?? { rows: 1, cols: n }
}

/**
 * 칸을 조각에 배분한다. 남는 칸은 그 줄의 오른쪽 끝에서부터 옆 칸과 합쳐
 * 가로 2칸짜리 조각을 만든다 (아래 줄부터 합쳐 위쪽 줄이 고르게 보이도록).
 */
function assignPieces(rows, cols, n) {
  const merges = rows * cols - n
  /** 합쳐질 칸의 시작 좌표 "r:c" 집합 (그 칸과 오른쪽 칸이 한 조각이 된다) */
  const mergedAt = new Set()
  for (let k = 0; k < merges; k += 1) {
    const r = rows - 1 - (k % rows)
    mergedAt.add(`${r}:${cols - 2}`)
  }

  const pieces = []
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      // 앞 칸과 합쳐진 칸이면 건너뛴다
      if (c > 0 && mergedAt.has(`${r}:${c - 1}`)) continue
      const colSpan = mergedAt.has(`${r}:${c}`) && c + 1 < cols ? 2 : 1
      pieces.push({ r, c, rowSpan: 1, colSpan })
    }
  }
  return pieces
}
