export const WEEKDAY_LABELS_MON_FIRST = ['월', '화', '수', '목', '금', '토', '일']
const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토']

export const pad2 = (n) => String(n).padStart(2, '0')
export const toDateString = (y, m, d) => `${y}-${pad2(m)}-${pad2(d)}`
export const toDateStringFromDate = (d) =>
  toDateString(d.getFullYear(), d.getMonth() + 1, d.getDate())

export function parseDate(str) {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** 8월 20일 목요일 */
export function formatDateLong(str) {
  const d = parseDate(str)
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${WEEKDAY_KO[d.getDay()]}요일`
}

/** 8월 20일 (목) */
export function formatDateShort(str) {
  const d = parseDate(str)
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAY_KO[d.getDay()]})`
}

export const formatDot = (str) => str.replaceAll('-', '.')
export const formatPeriod = (s, e) => `${formatDot(s)} - ${formatDot(e)}`

export function daysBetween(s, e) {
  return Math.round((parseDate(e) - parseDate(s)) / 86400000) + 1
}

/** 월요일 시작 그리드. 빈칸은 null */
export function buildMonthGridMonFirst(year, month) {
  const first = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0).getDate()
  const leading = (first.getDay() + 6) % 7
  const cells = []
  for (let i = 0; i < leading; i += 1) cells.push(null)
  for (let d = 1; d <= lastDay; d += 1) cells.push(toDateString(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export function shiftMonth(year, month, delta) {
  const d = new Date(year, month - 1 + delta, 1)
  return { year: d.getFullYear(), month: d.getMonth() + 1 }
}
