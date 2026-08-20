import client from './client.js'

/** 계획 생성·수정과 랭킹 필터에서 공통으로 사용하는 활성 카테고리 목록. */
export function fetchCategories() {
  return client.get('/categories')
}
