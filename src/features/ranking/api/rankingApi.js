import client from '../../../shared/api/client.js'

export const RANKING_TYPE = {
  STREAK: 'STREAK',
  COMPLETED_PUZZLES: 'COMPLETED_PUZZLES',
  PUZZLE_PIECES: 'PUZZLE_PIECES',
}

export const RANKING_PERIOD = {
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
  ALL: 'ALL',
}

/** 최신 랭킹 스냅샷의 상위 50명과 로그인 사용자의 순위를 조회한다. */
export function fetchRankings({ type, period, categoryId } = {}) {
  return client.get('/rankings', {
    params: {
      type,
      period,
      ...(categoryId ? { categoryId } : {}),
    },
  })
}
