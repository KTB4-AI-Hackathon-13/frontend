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
/** 계획에 속하지 않은 개인 일정은 세부 분류를 입력받지 않고 이 값으로 저장한다. */
export const STANDALONE_ITEM_DEFAULTS = Object.freeze({
  categoryId: null,
  workload: null,
})

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
export const ITEM_PRIORITY_LABEL = {
  1: '매우 높음',
  2: '높음',
  3: '보통',
  4: '낮음',
  5: '매우 낮음',
}

/** 현재 DB categories 중 활성 항목. 카테고리 목록 API가 생기면 서버 조회로 교체한다. */
export const ITEM_CATEGORY_OPTIONS = [
  { id: 3, label: '학습' },
  { id: 4, label: '운동' },
  { id: 5, label: '프로젝트' },
]

export const categoryLabelFor = (categoryId) =>
  ITEM_CATEGORY_OPTIONS.find((category) => category.id === Number(categoryId))?.label ?? null

/** 계획별 색상 (와이어프레임: 계획별 색상, 완료 항목은 흐리게) */
export const SCHEDULE_COLORS = ['#5b6cff', '#2fb38a', '#f2a33c', '#e06aa6', '#4db2e0', '#9b6cf2']
export const STANDALONE_ITEM_LABEL = '개인 일정'
export const STANDALONE_ITEM_COLOR = '#8491a8'
export const colorForSchedule = (scheduleId) =>
  scheduleId == null
    ? STANDALONE_ITEM_COLOR
    : SCHEDULE_COLORS[Math.abs(Number(scheduleId)) % SCHEDULE_COLORS.length]

/** 계획 수정 기간 상한 (백엔드 ScheduleService.MAX_SCHEDULE_PERIOD_DAYS 와 같아야 함) */
export const MAX_SCHEDULE_PERIOD_DAYS = 30

/** 하루 작업 수 제한 (user_preferences.max_daily_tasks 기본값) */
export const DEFAULT_MAX_DAILY_TASKS = 5
