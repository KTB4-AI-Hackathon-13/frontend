import client from '../../../shared/api/client.js'

export const RANKING_TYPE = {
  STREAK: 'STREAK',
  COMPLETED_PUZZLES: 'COMPLETED_PUZZLES',
}

export const RANKING_PERIOD = {
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
  YEARLY: 'YEARLY',
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
