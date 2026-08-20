import { SCHEDULE_STATUS } from '../../schedule/utils/constants.js'

/**
 * 퍼즐 상태 → 내 계획 목록의 탭.
 * 퍼즐 1개 = 계획 1개라, 진행 중 퍼즐은 진행 중 계획 · 완성 퍼즐은 완료 계획에 대응한다.
 * (탭 선택은 /schedules 의 ?status= 쿼리가 기준)
 */
const TAB_BY_PUZZLE_STATUS = {
  IN_PROGRESS: SCHEDULE_STATUS.ACTIVE,
  COMPLETED: SCHEDULE_STATUS.COMPLETED,
}

/** 퍼즐 상태에 맞는 내 계획 링크. 상태를 모르면 전체 탭으로 보낸다. */
export function schedulesPathForPuzzleStatus(puzzleStatus) {
  const tab = TAB_BY_PUZZLE_STATUS[puzzleStatus]
  return tab ? `/schedules?status=${tab}` : '/schedules'
}
