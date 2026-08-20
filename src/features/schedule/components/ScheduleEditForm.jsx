import { useState } from 'react'

import { ApiError, userMessage } from '../../../shared/api/apiError.js'
import { MAX_SCHEDULE_PERIOD_DAYS } from '../utils/constants.js'
import { daysBetween, formatDot } from '../utils/date.js'

/**
 * 계획 제목/기간 편집 — PATCH /schedules/{scheduleId} (§4.3)
 * - title?(1~200자), startDate?, endDate? — "보낸 필드만 변경"이므로 바뀐 값만 보낸다.
 * - 응답에 description 이 없어(§8) 편집 UI 에서 제외.
 * - 서버 오류: 422 INVALID_SCHEDULE_PERIOD(시작>종료), 409 ITEMS_OUTSIDE_SCHEDULE_PERIOD(기간 밖 작업 존재)
 *
 * 저장을 눌러야만 "왜 안 되는지"를 알 수 있는 게 문제였다. 그래서 두 가지 제약을
 * 문구로 미리 알려주고, 저장 직전에 구체적인 이유로 막는다. (달력 자체는 막지 않는다)
 *   1) 취소되지 않은 할 일이 놓인 날짜 범위(`itemPeriod`)는 반드시 포함해야 한다 (409)
 *   2) 기간은 최대 30일 (422 SCHEDULE_PERIOD_TOO_LONG, 백엔드 MAX_SCHEDULE_PERIOD_DAYS)
 *
 * @param {{ itemPeriod?: { earliest: string | null, latest: string | null, count: number } }} props
 */
function ScheduleEditForm({
  schedule,
  itemPeriod,
  onSubmit,
  onCancel,
  serverError,
  submitting = false,
}) {
  const [form, setForm] = useState({
    title: schedule.title,
    startDate: schedule.startDate,
    endDate: schedule.endDate,
  })
  const [error, setError] = useState(null)
  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const fieldErrors = serverError instanceof ApiError ? serverError.fieldErrorMap : {}
  // 할 일이 놓인 날짜 범위 — 이 범위는 반드시 포함해야 저장된다
  const earliest = itemPeriod?.earliest ?? null
  const latest = itemPeriod?.latest ?? null
  // 할 일 범위 자체가 30일을 넘으면 어떤 기간을 골라도 두 규칙을 동시에 만족할 수 없다
  const itemSpan = earliest && latest ? daysBetween(earliest, latest) : 0
  const impossible = itemSpan > MAX_SCHEDULE_PERIOD_DAYS

  const currentDays =
    form.startDate && form.endDate && form.startDate <= form.endDate
      ? daysBetween(form.startDate, form.endDate)
      : 0

  const handleSubmit = (e) => {
    e.preventDefault()
    const title = form.title.trim()
    if (!title) return setError('계획 이름을 입력하세요.')
    if (title.length > 200) return setError('계획 이름은 200자 이하여야 합니다.')
    if (!form.startDate || !form.endDate) return setError('시작일과 종료일을 입력하세요.')
    if (form.startDate > form.endDate) return setError('시작일이 종료일보다 늦을 수 없습니다.')
    if (earliest && form.startDate > earliest) {
      return setError(`${formatDot(earliest)}에 할 일이 있어 시작일을 그보다 뒤로 옮길 수 없어요.`)
    }
    if (latest && form.endDate < latest) {
      return setError(`${formatDot(latest)}에 할 일이 있어 종료일을 그보다 앞으로 당길 수 없어요.`)
    }
    // 서버와 동일하게 "기간이 바뀐 경우"에만 30일 상한을 본다.
    // (이미 30일을 넘게 만들어진 계획의 제목만 고치는 것은 막지 않는다)
    const periodChanged = form.startDate !== schedule.startDate || form.endDate !== schedule.endDate
    if (periodChanged && currentDays > MAX_SCHEDULE_PERIOD_DAYS) {
      return setError(
        `계획 기간은 최대 ${MAX_SCHEDULE_PERIOD_DAYS}일까지예요. 지금은 ${currentDays}일입니다.`,
      )
    }

    const patch = {}
    if (title !== schedule.title) patch.title = title
    if (form.startDate !== schedule.startDate) patch.startDate = form.startDate
    if (form.endDate !== schedule.endDate) patch.endDate = form.endDate
    if (Object.keys(patch).length === 0) return setError('변경된 내용이 없습니다.')

    setError(null)
    onSubmit(patch)
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <label className="field">
        <span className="field__label">계획 이름</span>
        <input className="input" value={form.title} onChange={update('title')} maxLength={200} />
        {fieldErrors.title && <span className="field__error">{fieldErrors.title}</span>}
      </label>
      <div className="field-row">
        <label className="field">
          <span className="field__label">시작일</span>
          <input
            type="date"
            className="input"
            value={form.startDate}
            onChange={update('startDate')}
          />
          {fieldErrors.startDate && <span className="field__error">{fieldErrors.startDate}</span>}
        </label>
        <label className="field">
          <span className="field__label">종료일</span>
          <input type="date" className="input" value={form.endDate} onChange={update('endDate')} />
          {fieldErrors.endDate && <span className="field__error">{fieldErrors.endDate}</span>}
        </label>
      </div>
      <p className="field__hint">
        계획 기간은 <strong>최대 {MAX_SCHEDULE_PERIOD_DAYS}일</strong>까지 설정할 수 있어요
        {currentDays > 0 && ` (현재 ${currentDays}일)`}.
        {earliest &&
          latest &&
          ` 할 일이 ${formatDot(earliest)} ~ ${formatDot(latest)}에 있어 이 범위는 반드시 포함해야 합니다.`}
        {!earliest && ' 아직 할 일이 없어 날짜는 자유롭게 고를 수 있어요.'}
      </p>
      {impossible && (
        <p className="form-error">
          할 일이 {itemSpan}일에 걸쳐 있어 {MAX_SCHEDULE_PERIOD_DAYS}일 제한을 만족할 수 없어요.
          먼저 할 일 날짜를 좁혀 주세요.
        </p>
      )}
      {(error || serverError) && <p className="form-error">{error || userMessage(serverError)}</p>}
      <div className="form__actions">
        <button type="button" className="btn" onClick={onCancel}>
          취소
        </button>
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? '저장 중…' : '저장'}
        </button>
      </div>
    </form>
  )
}

export default ScheduleEditForm
