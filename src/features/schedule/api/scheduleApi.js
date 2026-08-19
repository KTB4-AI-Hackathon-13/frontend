/**
 * 스케줄(5번)·작업(6번) API 레이어.
 *
 * 지금은 mockStore 를 읽고 쓰는 정적 구현이며, 반환 형태는 백엔드 DTO
 * (ScheduleSummaryResponse / ScheduleDetailResponse / CalendarResponse / TodayItemsResponse /
 *  ScheduleItemResponse) 와 동일하다. 백엔드 연동 시 각 함수 본문을
 * `client.get('/schedules', { params })` 식으로 교체하면 화면 코드는 그대로 쓴다.
 */
import { MOCK_TODAY, items, newItemId, preferences, schedules } from './mockStore.js'
import { ITEM_STATUS } from '../utils/constants.js'

const LATENCY = 120
const delay = (v) => new Promise((resolve) => setTimeout(() => resolve(v), LATENCY))
const fail = (code, message, status = 422) =>
  Promise.reject(Object.assign(new Error(message), { code, status, fieldErrors: [] }))

const alive = (arr) => arr.filter((x) => !x.deletedAt)
const isDone = (it) => it.status === ITEM_STATUS.COMPLETED
const findSchedule = (id) => alive(schedules).find((s) => s.id === Number(id))
const itemsOf = (scheduleId) => alive(items).filter((it) => it.scheduleId === Number(scheduleId))

const summary = (s) => {
  const its = itemsOf(s.id)
  return {
    id: s.id,
    title: s.title,
    status: s.status,
    source: s.source,
    startDate: s.startDate,
    endDate: s.endDate,
    currentVersion: s.currentVersion,
    puzzleCount: its.length,
    completedPuzzleCount: its.filter(isDone).length,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  }
}

const dailyItem = (it) => {
  const s = findSchedule(it.scheduleId)
  return {
    id: it.id,
    scheduleId: it.scheduleId,
    scheduleTitle: s?.title ?? '',
    categoryId: it.categoryId,
    title: it.title,
    workload: it.workload,
    priority: it.priority,
    status: it.status,
    completedAt: it.completedAt,
  }
}

const groupDays = (list, mapper) => {
  const map = new Map()
  for (const it of [...list].sort(
    (a, b) => a.scheduledDate.localeCompare(b.scheduledDate) || a.id - b.id,
  )) {
    if (!map.has(it.scheduledDate)) map.set(it.scheduledDate, [])
    map.get(it.scheduledDate).push(it)
  }
  return [...map.entries()].map(([date, dayItems]) => ({
    date,
    totalCount: dayItems.length,
    completedCount: dayItems.filter(isDone).length,
    items: dayItems.map(mapper),
  }))
}

/** 현재 날짜 (백엔드는 Asia/Seoul 기준 LocalDate.now) */
export const getToday = () => MOCK_TODAY

// ---------- 5. 스케줄 API ----------

/** GET /schedules?status&size&cursor */
export async function fetchSchedules({ status } = {}) {
  const list = alive(schedules)
    .filter((s) => !status || s.status === status)
    .sort((a, b) => b.id - a.id)
    .map(summary)
  return delay({ items: list, nextCursor: null, hasNext: false })
}

/** GET /schedules/{scheduleId} */
export async function fetchScheduleDetail(scheduleId) {
  const s = findSchedule(scheduleId)
  if (!s) return fail('SCHEDULE_NOT_FOUND', '스케줄을 찾을 수 없습니다.', 404)
  const its = itemsOf(s.id)
  return delay({
    ...summary(s),
    description: s.description,
    days: groupDays(its, (it) => ({ ...it })),
  })
}

/** PATCH /schedules/{scheduleId} — title?, description?, startDate?, endDate? */
export async function updateSchedule(scheduleId, patch) {
  const s = findSchedule(scheduleId)
  if (!s) return fail('SCHEDULE_NOT_FOUND', '스케줄을 찾을 수 없습니다.', 404)
  const next = {
    ...s,
    ...Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)),
  }
  if (next.startDate > next.endDate)
    return fail('INVALID_PERIOD', '시작일이 종료일보다 늦을 수 없습니다.', 400)
  const outside = itemsOf(s.id).filter(
    (it) => it.scheduledDate < next.startDate || it.scheduledDate > next.endDate,
  )
  if (outside.length > 0) {
    return fail(
      'ITEMS_OUTSIDE_SCHEDULE_PERIOD',
      `변경된 기간 밖에 작업 ${outside.length}건이 있습니다.`,
      409,
    )
  }
  Object.assign(s, next, {
    currentVersion: s.currentVersion + 1,
    updatedAt: new Date().toISOString(),
  })
  return fetchScheduleDetail(s.id)
}

/** DELETE /schedules/{scheduleId} */
export async function deleteSchedule(scheduleId) {
  const s = findSchedule(scheduleId)
  if (!s) return fail('SCHEDULE_NOT_FOUND', '스케줄을 찾을 수 없습니다.', 404)
  s.deletedAt = new Date().toISOString()
  itemsOf(s.id).forEach((it) => (it.deletedAt = s.deletedAt))
  return delay(undefined)
}

/** GET /calendar?year&month */
export async function fetchCalendar(year, month) {
  const prefix = `${year}-${String(month).padStart(2, '0')}-`
  const its = alive(items).filter((it) => it.scheduledDate.startsWith(prefix))
  return delay({
    year,
    month,
    totalCount: its.length,
    completedCount: its.filter(isDone).length,
    days: groupDays(its, dailyItem),
  })
}

/** GET /schedule-items/today */
export async function fetchToday() {
  const date = getToday()
  const its = alive(items)
    .filter((it) => it.scheduledDate === date)
    .sort((a, b) => a.id - b.id)
  return delay({
    date,
    totalCount: its.length,
    completedCount: its.filter(isDone).length,
    items: its.map(dailyItem),
  })
}

// ---------- 6. 작업 API ----------

/** POST /schedules/{scheduleId}/items */
export async function createItem(scheduleId, body) {
  const s = findSchedule(scheduleId)
  if (!s) return fail('SCHEDULE_NOT_FOUND', '스케줄을 찾을 수 없습니다.', 404)
  if (body.scheduledDate < s.startDate || body.scheduledDate > s.endDate) {
    return fail(
      'DATE_OUTSIDE_SCHEDULE_PERIOD',
      `작업 날짜는 계획 기간(${s.startDate} ~ ${s.endDate}) 안이어야 합니다.`,
    )
  }
  const sameDay = itemsOf(s.id).filter((it) => it.scheduledDate === body.scheduledDate).length
  if (sameDay >= preferences.maxDailyTasks) {
    return fail(
      'MAX_DAILY_TASKS_EXCEEDED',
      `하루 최대 작업 수(${preferences.maxDailyTasks}개)를 초과했습니다.`,
    )
  }
  const now = new Date().toISOString()
  const created = {
    id: newItemId(),
    scheduleId: s.id,
    categoryId: body.categoryId ?? null,
    parentItemId: null,
    title: body.title,
    description: body.description ?? null,
    scheduledDate: body.scheduledDate,
    workload: body.workload ?? 1,
    priority: body.priority ?? 3,
    status: ITEM_STATUS.TODO,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
  }
  items.push(created)
  return delay({ ...created })
}

/** PATCH /schedule-items/{itemId} */
export async function updateItem(itemId, patch) {
  const it = alive(items).find((x) => x.id === Number(itemId))
  if (!it) return fail('SCHEDULE_ITEM_NOT_FOUND', '작업을 찾을 수 없습니다.', 404)
  const s = findSchedule(it.scheduleId)
  const nextDate = patch.scheduledDate ?? it.scheduledDate
  if (nextDate < s.startDate || nextDate > s.endDate) {
    return fail(
      'DATE_OUTSIDE_SCHEDULE_PERIOD',
      `작업 날짜는 계획 기간(${s.startDate} ~ ${s.endDate}) 안이어야 합니다.`,
    )
  }
  Object.assign(it, Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)), {
    updatedAt: new Date().toISOString(),
  })
  return delay({ ...it })
}

/**
 * PATCH /schedule-items/{itemId}/status
 * 응답: { itemId, status, completedAt, puzzlePieceAwarded, puzzlePieceId }
 * 최초 COMPLETED 전환 시에만 조각 지급. 되돌려도 회수하지 않음.
 */
export async function changeItemStatus(itemId, status) {
  const it = alive(items).find((x) => x.id === Number(itemId))
  if (!it) return fail('SCHEDULE_ITEM_NOT_FOUND', '작업을 찾을 수 없습니다.', 404)
  const firstCompletion = status === ITEM_STATUS.COMPLETED && !it.completedAt
  it.status = status
  if (firstCompletion) it.completedAt = new Date().toISOString()
  it.updatedAt = new Date().toISOString()
  return delay({
    itemId: it.id,
    status: it.status,
    completedAt: it.completedAt,
    puzzlePieceAwarded: firstCompletion,
    puzzlePieceId: firstCompletion ? 5000 + it.id : null,
  })
}

/** DELETE /schedule-items/{itemId} */
export async function deleteItem(itemId) {
  const it = alive(items).find((x) => x.id === Number(itemId))
  if (!it) return fail('SCHEDULE_ITEM_NOT_FOUND', '작업을 찾을 수 없습니다.', 404)
  it.deletedAt = new Date().toISOString()
  return delay(undefined)
}
