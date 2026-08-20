/**
 * 같은 날짜의 작업 표시 순서.
 * 서버 정렬 규칙(position -> priority -> id)을 프론트에서도 보장한다.
 */
export function orderScheduleItems(items = []) {
  const numberOr = (value, fallback) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }

  return [...items].sort(
    (a, b) =>
      numberOr(a.position, Number.MAX_SAFE_INTEGER) -
        numberOr(b.position, Number.MAX_SAFE_INTEGER) ||
      numberOr(a.priority, 3) - numberOr(b.priority, 3) ||
      numberOr(a.id, Number.MAX_SAFE_INTEGER) - numberOr(b.id, Number.MAX_SAFE_INTEGER),
  )
}
