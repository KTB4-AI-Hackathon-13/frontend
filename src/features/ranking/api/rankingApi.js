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
  ALL: 'ALL',
}

/** 현재 활동 엔티티로 계산한 랭킹과 로그인 사용자의 순위를 조회한다. */
export async function fetchRankings({
  type,
  period = RANKING_PERIOD.ALL,
  categoryId,
  size = 50,
} = {}) {
  const data = await client.get('/rankings', {
    params: { type, period, size, ...(categoryId ? { categoryId } : {}) },
  })

  const items = Array.isArray(data?.items) ? data.items : []
  return {
    ...data,
    items,
    myRanking: data?.myRanking ?? null,
    // 백엔드와 프론트의 배포 순서가 달라도 목록은 정상 표시한다.
    participantCount: Number.isInteger(data?.participantCount)
      ? data.participantCount
      : items.length,
  }
}

/** 랭킹 범위 필터용 활성 카테고리. */
export function fetchRankingCategories() {
  return fetchCategories()
}
