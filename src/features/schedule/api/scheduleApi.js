/**
 * 스케줄(5번)·작업(6번) API 레이어 — 핸드오프 문서 §4·§5.
 * 모든 호출은 shared/api/client.js 를 거치며, 성공 시 `{ data, meta }` 의 data 만 돌아온다.
 * 실패 시 ApiError(code, message, fieldErrors, requestId) 가 throw 된다.
 *
 * ※ 순서 변경 `PUT /schedules/{id}/items/order` 는 백엔드에서 제거 예정이라 구현하지 않는다.
 *    같은 날짜 안 정렬은 서버가 준 순서(position → priority → id)를 그대로 쓴다.
 */
import client from '../../../shared/api/client.js'
import { STANDALONE_ITEM_DEFAULTS } from '../utils/constants.js'

/** @typedef {import('./types.js').ScheduleSummary} ScheduleSummary */
/** @typedef {import('./types.js').ScheduleDetail} ScheduleDetail */
/** @typedef {import('./types.js').ScheduleItem} ScheduleItem */
/** @typedef {import('./types.js').CalendarResponse} CalendarResponse */
/** @typedef {import('./types.js').TodayResponse} TodayResponse */
/** @typedef {import('./types.js').ItemStatusChangeResponse} ItemStatusChangeResponse */

/** undefined 값은 빼고 보낸다 (PATCH 는 "보낸 필드만 변경", null 도 유지 취급) */
const compact = (obj) =>
  Object.fromEntries(Object.entries(obj ?? {}).filter(([, v]) => v !== undefined))

/** 캘린더/오늘 응답의 작업에는 날짜가 없으므로 상위 일자 값을 편집용 모델에 주입한다. */
const withScheduledDate = (date, items = []) =>
  items.map((item) => ({ ...item, scheduledDate: date }))

// ---------- 5. 스케줄 API ----------

/**
 * 4.1 목록 `GET /schedules?status=&size=&cursor=` (최신 id 순, 커서 페이징)
 * @param {{ status?: string, size?: number, cursor?: string | null }} [params]
 * @returns {Promise<import('./types.js').CursorPage<ScheduleSummary>>}
 */
export function fetchSchedules({ status, size = 20, cursor } = {}) {
  return client.get('/schedules', {
    params: compact({ status: status || undefined, size, cursor: cursor || undefined }),
  })
}

/**
 * 사용자가 직접 계획을 만든다. `source/status/version`은 서버 기본 정책을 따른다.
 * body: title, startDate, endDate, description?
 * @returns {Promise<ScheduleSummary>}
 */
export function createSchedule(body) {
  return client.post('/schedules', compact(body))
}

/**
 * 4.2 상세 `GET /schedules/{scheduleId}` — 요약 + days[] (작업 있는 날짜만, 오름차순)
 * @returns {Promise<ScheduleDetail>}
 */
export function fetchScheduleDetail(scheduleId) {
  return client.get(`/schedules/${scheduleId}`)
}

/**
 * 4.3 수정 `PATCH /schedules/{scheduleId}` — title?, startDate?, endDate? (보낸 필드만 변경)
 * 409 ITEMS_OUTSIDE_SCHEDULE_PERIOD / 422 INVALID_SCHEDULE_PERIOD
 * @returns {Promise<ScheduleSummary>}
 */
export function updateSchedule(scheduleId, patch) {
  return client.patch(`/schedules/${scheduleId}`, compact(patch))
}

/** 4.4 삭제 `DELETE /schedules/{scheduleId}` → 204 (작업까지 소프트 삭제) */
export function deleteSchedule(scheduleId) {
  return client.delete(`/schedules/${scheduleId}`)
}

/**
 * AI 화면에서 받은 원본 JSON(summary, daily_tasks)을 확정 저장한다.
 * 성공하면 해당 DRAFT 스케줄이 ACTIVE가 되며 홈 GET /calendar 조회에 포함된다.
 */
export function submitAiPlan(scheduleId, aiPlanJson) {
  return client.post(`/schedules/${scheduleId}/ai-plan`, aiPlanJson)
}

/**
 * 4.5 월별 캘린더 `GET /calendar?year&month` — 작업 있는 날짜만, 여러 스케줄 섞여 옴
 * @returns {Promise<CalendarResponse>}
 */
export async function fetchCalendar(year, month) {
  const data = await client.get('/calendar', { params: { year, month } })
  return {
    ...data,
    days: (data.days ?? []).map((day) => ({
      ...day,
      items: withScheduledDate(day.date, day.items),
    })),
  }
}

/**
 * 4.6 오늘 할 일 `GET /schedule-items/today` — 서버 기준 오늘(Asia/Seoul)
 * @returns {Promise<TodayResponse>}
 */
export async function fetchToday() {
  const data = await client.get('/schedule-items/today')
  return { ...data, items: withScheduledDate(data.date, data.items) }
}

// ---------- 6. 작업 API ----------

/**
 * 5.1 추가: 계획 소속이면 `POST /schedules/{scheduleId}/items`, 단독 작업이면
 * `POST /schedule-items` → 201
 * body: title, scheduledDate, estimatedMinutes, description?, categoryId?, workload?,
 *       priority?, position?
 * 단독 작업은 카테고리와 작업량을 null로 강제 정규화한다.
 * 422 DATE_OUTSIDE_SCHEDULE_PERIOD / 422 MAX_DAILY_TASKS_EXCEEDED / 400 INVALID_REQUEST
 * @returns {Promise<ScheduleItem>}
 */
export function createItem(scheduleId, body) {
  if (scheduleId == null) {
    return client.post('/schedule-items', compact({ ...body, ...STANDALONE_ITEM_DEFAULTS }))
  }
  return client.post(`/schedules/${scheduleId}/items`, compact(body))
}

/**
 * 5.2 수정 `PATCH /schedule-items/{itemId}` — 보낸 것만 변경. status 는 여기서 못 바꿈(changeItemStatus).
 * @returns {Promise<ScheduleItem>}
 */
export function updateItem(itemId, patch) {
  return client.patch(`/schedule-items/${itemId}`, compact(patch))
}

/**
 * 5.3 상태 변경 `PATCH /schedule-items/{itemId}/status` — 멱등
 * @param {import('./types.js').ItemStatus} status
 * @returns {Promise<ItemStatusChangeResponse>} puzzlePieceAwarded 는 7번 구현 전까지 항상 false
 */
export function changeItemStatus(itemId, status) {
  return client.patch(`/schedule-items/${itemId}/status`, { status })
}

/** 5.5 삭제 `DELETE /schedule-items/{itemId}` → 204 */
export function deleteItem(itemId) {
  return client.delete(`/schedule-items/${itemId}`)
}
