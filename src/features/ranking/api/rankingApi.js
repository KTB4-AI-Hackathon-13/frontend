import client from '../../../shared/api/client.js'
import { fetchCategories } from '../../../shared/api/categoryApi.js'

export const RANKING_TYPE = {
  STREAK: 'STREAK',
  COMPLETED_PUZZLES: 'COMPLETED_PUZZLES',
  PUZZLE_PIECES: 'PUZZLE_PIECES',
}

export const RANKING_PERIOD = {
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
  YEARLY: 'YEARLY',
  ALL: 'ALL',
}

/** 최신 랭킹 스냅샷과 로그인 사용자의 순위를 조회한다. */
export function fetchRankings({ type, period = RANKING_PERIOD.ALL, categoryId, size = 50 } = {}) {
  return client.get('/rankings', {
    params: { type, period, size, ...(categoryId ? { categoryId } : {}) },
  })
}

/** 랭킹 범위 필터용 활성 카테고리. */
export function fetchRankingCategories() {
  return fetchCategories()
}
