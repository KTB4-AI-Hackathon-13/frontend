/**
 * 계획 기간을 줄일 수 있는 한계 계산.
 *
 * 서버 규칙(§4.3): 새 기간 밖에 **취소되지 않은** 할 일이 하나라도 있으면 409
 * `ITEMS_OUTSIDE_SCHEDULE_PERIOD`. 그래서 유효한 할 일의 가장 이른 날짜·가장 늦은 날짜가
 * 그대로 "시작일을 미룰 수 있는 최대치"와 "종료일을 당길 수 있는 최소치"가 된다.
 *
 * @param {{ days?: { items: { scheduledDate: string, status: string }[] }[] } | null | undefined} detail
 *        GET /schedules/{id} 응답
 * @returns {{ earliest: string | null, latest: string | null, count: number }}
 *          할 일이 없거나 전부 취소면 null (기간 제한 없음)
 */
export function activeItemPeriod(detail) {
  const dates = (detail?.days ?? [])
    .flatMap((day) => day.items ?? [])
    .filter((item) => item.status !== 'CANCELLED')
    .map((item) => item.scheduledDate)
    .filter(Boolean)
    .sort()

  if (dates.length === 0) return { earliest: null, latest: null, count: 0 }
  return { earliest: dates[0], latest: dates[dates.length - 1], count: dates.length }
}
