import { useState } from 'react'

import { ApiError, userMessage } from '../../../shared/api/apiError.js'

/**
 * 계획 제목/기간 편집 — PATCH /schedules/{scheduleId} (§4.3)
 * - title?(1~200자), startDate?, endDate? — "보낸 필드만 변경"이므로 바뀐 값만 보낸다.
 * - 응답에 description 이 없어(§8) 편집 UI 에서 제외.
 * - 서버 오류: 422 INVALID_SCHEDULE_PERIOD(시작>종료), 409 ITEMS_OUTSIDE_SCHEDULE_PERIOD(기간 밖 작업 존재)
 */
function ScheduleEditForm({ schedule, onSubmit, onCancel, serverError, submitting = false }) {
  const [form, setForm] = useState({
    title: schedule.title,
    startDate: schedule.startDate,
    endDate: schedule.endDate,
  })
  const [error, setError] = useState(null)
  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const fieldErrors = serverError instanceof ApiError ? serverError.fieldErrorMap : {}

  const handleSubmit = (e) => {
    e.preventDefault()
    const title = form.title.trim()
    if (!title) return setError('계획 이름을 입력하세요.')
    if (title.length > 200) return setError('계획 이름은 200자 이하여야 합니다.')
    if (!form.startDate || !form.endDate) return setError('시작일과 종료일을 입력하세요.')
    if (form.startDate > form.endDate) return setError('시작일이 종료일보다 늦을 수 없습니다.')

    const patch = {}
    if (title !== schedule.title) patch.title = title
    if (form.startDate !== schedule.startDate) patch.startDate = form.startDate
    if (form.endDate !== schedule.endDate) patch.endDate = form.endDate
    if (Object.keys(patch).length === 0) return setError('변경된 내용이 없습니다.')

    setError(null)
    onSubmit(patch)
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
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
        기간을 줄이면 새 기간 밖에 있는 할 일(취소된 것 제외)이 있을 때 저장되지 않아요. 먼저 해당
        할 일의 날짜를 옮기거나 삭제해 주세요.
      </p>
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
