export const SCHEDULE_STATUS = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  ARCHIVED: 'ARCHIVED',
}
export const ITEM_STATUS = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  SKIPPED: 'SKIPPED',
  CANCELLED: 'CANCELLED',
}

export const SCHEDULE_STATUS_LABEL = {
  DRAFT: '검토 중',
  ACTIVE: '진행 중',
  COMPLETED: '완료',
  ARCHIVED: '보관',
}
export const ITEM_STATUS_LABEL = {
  TODO: '할 일',
  IN_PROGRESS: '진행 중',
  COMPLETED: '완료',
  SKIPPED: '건너뜀',
  CANCELLED: '취소',
}

/** 계획별 색상 (와이어프레임: 계획별 색상, 완료 항목은 흐리게) */
export const SCHEDULE_COLORS = ['#5b6cff', '#2fb38a', '#f2a33c', '#e06aa6', '#4db2e0', '#9b6cf2']
export const colorForSchedule = (scheduleId) =>
  SCHEDULE_COLORS[Math.abs(Number(scheduleId)) % SCHEDULE_COLORS.length]

/** 하루 작업 수 제한 (user_preferences.max_daily_tasks 기본값) */
export const DEFAULT_MAX_DAILY_TASKS = 5
/** 캘린더 셀에 보여줄 최대 개수 (나머지는 더보기) */
export const CALENDAR_CELL_LIMIT = 3
