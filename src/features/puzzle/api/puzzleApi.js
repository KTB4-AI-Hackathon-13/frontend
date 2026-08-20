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
  return client.get('/puzzles/mine', {
    params: { status: status || undefined, size, cursor: cursor || undefined },
  })
}

/**
 * 내 퍼즐 상세 — GET /puzzles/{puzzleId}
 * @returns {Promise<PuzzleDetail>}
 */
export function fetchPuzzle(puzzleId) {
  return client.get(`/puzzles/${puzzleId}`)
}

/** 사용자 공개 퍼즐 — GET /users/{userId}/public-puzzles */
export function fetchPublicPuzzles(userId, { size = 12, cursor } = {}) {
  return client.get(`/users/${userId}/public-puzzles`, {
    params: { size, cursor: cursor || undefined },
  })
}
