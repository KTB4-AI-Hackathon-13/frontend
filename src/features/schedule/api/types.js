/**
 * 핸드오프 문서 §3 도메인 모델을 JSDoc 타입으로 옮긴 것 (프로젝트는 JS 유지).
 * 에디터에서 `@type {import('./types.js').ScheduleDetail}` 식으로 참조한다.
 *
 * @typedef {'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'} ScheduleStatus
 * @typedef {'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'CANCELLED'} ItemStatus
 *
 * @typedef {Object} ScheduleSummary           목록 항목 / 수정 응답
 * @property {number} id
 * @property {string} title
 * @property {ScheduleStatus} status
 * @property {string} startDate                YYYY-MM-DD
 * @property {string} endDate                  YYYY-MM-DD
 * @property {number} currentVersion
 * @property {number} puzzleCount              퍼즐 조각 수 = 유효한 작업 수 (삭제·CANCELLED 제외)
 * @property {number} completedPuzzleCount     그중 COMPLETED
 *
 * @typedef {Object} ScheduleItem
 * @property {number} id
 * @property {number} scheduleId
 * @property {number | null} categoryId
 * @property {number | null} parentItemId
 * @property {string} title
 * @property {string | null} description
 * @property {string} scheduledDate            YYYY-MM-DD
 * @property {number} position                 같은 날짜 안 표시 순서 (0부터) — 서버 정렬 그대로 사용
 * @property {number} workload                 상대적 업무량 (기본 1)
 * @property {number} priority                 1(높음) ~ 5(낮음), 기본 3
 * @property {ItemStatus} status
 * @property {string | null} completedAt       ISO 8601
 *
 * @typedef {Object} ScheduleDay
 * @property {string} date
 * @property {number} totalCount
 * @property {number} completedCount
 * @property {ScheduleItem[]} items
 *
 * @typedef {ScheduleSummary & { days: ScheduleDay[] }} ScheduleDetail
 *
 * @typedef {Object} DailyItem                 캘린더 / 오늘 할 일 항목 (어느 스케줄인지 포함)
 * @property {number} id
 * @property {number} scheduleId
 * @property {string} scheduleTitle
 * @property {number | null} categoryId
 * @property {string} title
 * @property {number} position
 * @property {number} workload
 * @property {number} priority
 * @property {ItemStatus} status
 * @property {string | null} completedAt
 *
 * @typedef {Object} DailyItemsDay
 * @property {string} date
 * @property {number} totalCount
 * @property {number} completedCount
 * @property {DailyItem[]} items
 *
 * @typedef {Object} CalendarResponse          GET /calendar
 * @property {number} year
 * @property {number} month
 * @property {number} totalCount
 * @property {number} completedCount
 * @property {DailyItemsDay[]} days
 *
 * @typedef {DailyItemsDay} TodayResponse      GET /schedule-items/today
 *
 * @typedef {Object} ItemStatusChangeResponse  PATCH /schedule-items/{id}/status
 * @property {number} itemId
 * @property {ItemStatus} status
 * @property {string | null} completedAt
 * @property {boolean} puzzlePieceAwarded      퍼즐 도메인(7번) 구현 전까지 항상 false
 * @property {number | null} puzzlePieceId
 *
 * @template T
 * @typedef {Object} CursorPage               목록(커서 페이징) data
 * @property {T[]} items
 * @property {string | null} nextCursor        불투명 문자열 — 파싱·생성 금지
 * @property {boolean} hasNext
 */

export {}
