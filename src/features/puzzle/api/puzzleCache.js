/**
 * 퍼즐 상세 조회 캐시.
 *
 * 목록 응답에는 조각 배열이 없어서(백엔드 요청 06번) 카드도 상세를 한 번 불러야 하는데,
 * 그대로 두면 퍼즐 수만큼 요청이 늘어난다. 그래서
 *
 *  1) 같은 퍼즐은 한 번만 부르고 (카드 ↔ 상세 모달이 같은 결과를 공유),
 *  2) 조각 수·획득 수가 바뀌었을 때만 다시 부르고,
 *  3) 한꺼번에 몰리지 않게 동시 요청 수를 제한한다.
 *
 * 상세 응답은 읽기 전용으로만 쓰므로(상태 변경 UI 없음) 캐시해도 안전하다.
 */
import { fetchPuzzle } from './puzzleApi.js'

/** 동시에 나갈 수 있는 상세 요청 수 */
const MAX_CONCURRENT = 4

const cache = new Map() // key -> Promise<PuzzleDetail>
let running = 0
const waiting = []

const keyOf = (id, pieceCount, earnedPieceCount) => `${id}:${pieceCount}:${earnedPieceCount}`

function run(task) {
  return new Promise((resolve, reject) => {
    const start = () => {
      running += 1
      task()
        .then(resolve, reject)
        .finally(() => {
          running -= 1
          const next = waiting.shift()
          if (next) next()
        })
    }
    if (running < MAX_CONCURRENT) start()
    else waiting.push(start)
  })
}

/**
 * 상세를 캐시에서 가져오거나 한 번만 요청한다.
 * @param {number} id
 * @param {number} pieceCount
 * @param {number} earnedPieceCount
 * @returns {Promise<import('./types.js').PuzzleDetail>}
 */
export function getPuzzleDetail(id, pieceCount, earnedPieceCount) {
  const key = keyOf(id, pieceCount, earnedPieceCount)
  const hit = cache.get(key)
  if (hit) return hit

  const promise = run(() => fetchPuzzle(id)).catch((error) => {
    cache.delete(key) // 실패는 캐시하지 않는다
    throw error
  })
  cache.set(key, promise)
  return promise
}

/** 전체 비우기 (필요할 때만) */
export function clearPuzzleCache() {
  cache.clear()
}
