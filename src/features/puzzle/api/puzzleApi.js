/**
 * 퍼즐 API (명세서 §7 · 백엔드 MVP 구현 완료분).
 *
 *   GET /puzzles/mine?status=&size=&cursor=      내 퍼즐 목록 (커서 페이징)
 *   GET /puzzles/{puzzleId}                      내 퍼즐 상세 (조각별 획득 상태)
 *   GET /users/{userId}/public-puzzles           사용자 공개 퍼즐
 *
 * 아직 없는 것(호출하지 않는다): 공개 범위 변경 PATCH, /gallery, 좋아요, /rankings — 전부 2차.
 * 오류: 404 PUZZLE_NOT_FOUND
 */
import client from '../../../shared/api/client.js'

/** @typedef {import('./types.js').PuzzleSummary} PuzzleSummary */
/** @typedef {import('./types.js').PuzzleDetail} PuzzleDetail */

/**
 * 내 퍼즐 목록 — GET /puzzles/mine
 * @param {{ status?: import('./types.js').PuzzleStatus, size?: number, cursor?: string | null }} [params]
 */
export function fetchMyPuzzles({ status, size = 12, cursor } = {}) {
  return client
    .get('/puzzles/mine', {
      params: { status: status || undefined, size, cursor: cursor || undefined },
    })
    .then(normalizePuzzlePage)
}

/**
 * 내 퍼즐 상세 — GET /puzzles/{puzzleId}
 * @returns {Promise<PuzzleDetail>}
 */
export function fetchPuzzle(puzzleId) {
  return client.get(`/puzzles/${puzzleId}`).then(normalizePuzzle)
}

/** 사용자 공개 퍼즐 — GET /users/{userId}/public-puzzles */
export function fetchPublicPuzzles(userId, { size = 12, cursor } = {}) {
  return client
    .get(`/users/${userId}/public-puzzles`, {
      params: { size, cursor: cursor || undefined },
    })
    .then(normalizePuzzlePage)
}

/**
 * 백엔드 이미지 연동 전환 어댑터.
 *
 * 권장 응답은 퍼즐 항목마다 `scheduleId`, `imgUrl`을 포함하는 형태다. 다만 실제 DB 컬럼명을
 * 그대로 내리는 초기 구현(`schedule_id`, `img_url`)과 기존 이미지 API 계약(`imageId`)도 함께
 * 받아 화면에서는 항상 `scheduleId`, `imageUrl`, `imageId`로 사용한다.
 *
 * 목록 응답이 이미지 행을 `images` 또는 `scheduleImages` 배열로 따로 내려주는 경우에도
 * schedule id로 결합한다. 따라서 백엔드는 다음 둘 중 하나로 구현할 수 있다.
 * - `items[].imgUrl`
 * - `{ items: [...], images: [{ scheduleId, imgUrl }] }`
 */
export function normalizePuzzlePage(page) {
  if (!page || typeof page !== 'object') return page

  const rows = page.scheduleImages ?? page.schedule_images ?? page.images ?? []
  const imageByScheduleId = new Map(
    (Array.isArray(rows) ? rows : [])
      .map((row) => [scheduleKey(row?.scheduleId ?? row?.schedule_id), row])
      .filter(([key]) => key != null),
  )

  return {
    ...page,
    items: Array.isArray(page.items)
      ? page.items.map((puzzle) => normalizePuzzle(puzzle, imageByScheduleId))
      : [],
  }
}

/** @returns {PuzzleSummary | PuzzleDetail} */
export function normalizePuzzle(puzzle, imageByScheduleId = new Map()) {
  if (!puzzle || typeof puzzle !== 'object') return puzzle

  const scheduleId = puzzle.scheduleId ?? puzzle.schedule_id ?? null
  const linkedImage = imageByScheduleId.get(scheduleKey(scheduleId)) ?? puzzle.image ?? null
  const imageUrl = readImageUrl(puzzle) ?? readImageUrl(linkedImage)
  const imageId =
    puzzle.imageId ??
    puzzle.image_id ??
    linkedImage?.imageId ??
    linkedImage?.image_id ??
    linkedImage?.id ??
    null

  return {
    ...puzzle,
    scheduleId,
    imageId,
    imageUrl,
  }
}

function readImageUrl(source) {
  const value = source?.imageUrl ?? source?.imgUrl ?? source?.img_url ?? null
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function scheduleKey(value) {
  return value == null || value === '' ? null : String(value)
}
