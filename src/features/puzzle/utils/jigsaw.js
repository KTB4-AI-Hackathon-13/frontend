/**
 * 직소(jigsaw) 조각 외곽선 생성.
 *
 * 틀(정사각형)을 rows×cols 칸으로 나누고, 칸 경계를 탭(돌기)·홈이 맞물리는 곡선으로 만든다.
 * 조각 하나는 칸 1개 또는 가로 2칸(합쳐진 조각)이며, 경계 방향은 (rows, cols, seed) 로
 * 결정적으로 정해지므로 같은 퍼즐은 언제 봐도 같은 모양이다.
 *
 * 맞물림 규칙: 이웃한 두 조각은 같은 경계를 서로 반대 방향으로 그리므로,
 * 한쪽이 탭이면 다른 쪽은 자동으로 홈이 되도록 부호를 뒤집는다.
 */

/** 작고 결정적인 난수 (mulberry32) */
function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 탭 높이 (경계 길이 대비) */
const TAB = 0.2

/**
 * (x0,y0) → (x1,y1) 한 변의 path 조각.
 * tab: 0 이면 직선(틀 바깥 테두리), ±1 이면 진행 방향 기준 좌/우로 튀어나온 탭.
 */
function edge(x0, y0, x1, y1, tab) {
  const to = `${x1.toFixed(2)} ${y1.toFixed(2)}`
  if (!tab) return `L ${to}`
  const dx = x1 - x0
  const dy = y1 - y0
  const nx = -dy // 진행 방향의 법선 (길이 = 변 길이)
  const ny = dx
  const P = (t, o) =>
    `${(x0 + dx * t + nx * o * tab).toFixed(2)} ${(y0 + dy * t + ny * o * tab).toFixed(2)}`
  return [
    `L ${P(0.36, 0)}`,
    `C ${P(0.33, TAB * 0.28)} ${P(0.28, TAB * 0.6)} ${P(0.38, TAB * 0.78)}`,
    `C ${P(0.46, TAB * 1.05)} ${P(0.54, TAB * 1.05)} ${P(0.62, TAB * 0.78)}`,
    `C ${P(0.72, TAB * 0.6)} ${P(0.67, TAB * 0.28)} ${P(0.64, 0)}`,
    `L ${to}`,
  ].join(' ')
}

/**
 * 조각별 SVG path 를 만든다.
 *
 * @param {{
 *   layout: { rows: number, cols: number, pieces: {r:number,c:number,rowSpan:number,colSpan:number}[] },
 *   width: number, height: number, seed?: number
 * }} p
 * @returns {{ paths: string[], centers: {x:number,y:number}[], pad: number }}
 *          paths[i] · centers[i] 는 layout.pieces[i] (= pieces 배열 index i) 에 대응
 */
export function buildJigsawPaths({ layout, width, height, seed = 1 }) {
  const { rows, cols, pieces } = layout
  const rand = rng(seed * 2654435761 + rows * 97 + cols)
  const w = width / cols
  const h = height / rows

  // 칸 경계마다 탭 방향(±1)을 미리 정해 두면 이웃끼리 자동으로 맞물린다
  // hEdge[r][c] = 칸 (r,c) 의 위쪽 경계 (r >= 1 에서만 사용)
  // vEdge[r][c] = 칸 (r,c) 의 왼쪽 경계 (c >= 1 에서만 사용)
  const hEdge = grid(rows, cols, () => (rand() < 0.5 ? -1 : 1))
  const vEdge = grid(rows, cols, () => (rand() < 0.5 ? -1 : 1))

  const X = (c) => c * w
  const Y = (r) => r * h

  const paths = pieces.map(({ r, c, rowSpan, colSpan }) => {
    const r0 = r
    const r1 = r + rowSpan - 1
    const c0 = c
    const c1 = c + colSpan - 1
    const d = [`M ${X(c0).toFixed(2)} ${Y(r0).toFixed(2)}`]

    // 위 (왼→오)
    for (let cc = c0; cc <= c1; cc += 1) {
      d.push(edge(X(cc), Y(r0), X(cc + 1), Y(r0), r0 === 0 ? 0 : hEdge[r0][cc]))
    }
    // 오른쪽 (위→아래)
    for (let rr = r0; rr <= r1; rr += 1) {
      d.push(edge(X(c1 + 1), Y(rr), X(c1 + 1), Y(rr + 1), c1 === cols - 1 ? 0 : vEdge[rr][c1 + 1]))
    }
    // 아래 (오→왼) — 진행 방향이 뒤집히므로 부호도 뒤집는다
    for (let cc = c1; cc >= c0; cc -= 1) {
      d.push(edge(X(cc + 1), Y(r1 + 1), X(cc), Y(r1 + 1), r1 === rows - 1 ? 0 : -hEdge[r1 + 1][cc]))
    }
    // 왼쪽 (아래→위)
    for (let rr = r1; rr >= r0; rr -= 1) {
      d.push(edge(X(c0), Y(rr + 1), X(c0), Y(rr), c0 === 0 ? 0 : -vEdge[rr][c0]))
    }
    d.push('Z')
    return d.join(' ')
  })

  const centers = pieces.map(({ r, c, rowSpan, colSpan }) => ({
    x: X(c) + (colSpan * w) / 2,
    y: Y(r) + (rowSpan * h) / 2,
  }))

  // 탭이 칸 밖으로 튀어나오므로 viewBox 에 여백을 준다
  return { paths, centers, pad: Math.min(w, h) * TAB * 1.15 }
}

function grid(rows, cols, make) {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, make))
}
