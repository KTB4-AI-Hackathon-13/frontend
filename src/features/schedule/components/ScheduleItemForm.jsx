import { useState } from 'react'

/**
 * 할 일 추가/수정 폼.
 * - POST /schedules/{scheduleId}/items : title, scheduledDate, description?, workload?, priority?
 * - PATCH /schedule-items/{itemId}
 * 와이어프레임 원칙: 시간 없이 날짜 단위만 사용.
 */
function ScheduleItemForm({
  initial,
  schedules = [],
  fixedScheduleId,
  defaultDate,
  submitLabel,
  onSubmit,
  onCancel,
  serverError,
}) {
  const [form, setForm] = useState({
    scheduleId: fixedScheduleId ?? initial?.scheduleId ?? schedules[0]?.id ?? '',
    title: initial?.title ?? '',
    scheduledDate: initial?.scheduledDate ?? defaultDate ?? '',
    description: initial?.description ?? '',
    priority: initial?.priority ?? 3,
    workload: initial?.workload ?? 1,
  })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const schedule = schedules.find((s) => s.id === Number(form.scheduleId))
  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.scheduleId) return setError('계획을 선택하세요.')
    if (!form.title.trim()) return setError('할 일 제목을 입력하세요.')
    if (!form.scheduledDate) return setError('날짜를 선택하세요.')
    if (
      schedule &&
      (form.scheduledDate < schedule.startDate || form.scheduledDate > schedule.endDate)
    ) {
      return setError(
        `날짜는 계획 기간(${schedule.startDate} ~ ${schedule.endDate}) 안이어야 합니다.`,
      )
    }
    setError(null)
    setSubmitting(true)
    try {
      await onSubmit({
        scheduleId: Number(form.scheduleId),
        title: form.title.trim(),
        scheduledDate: form.scheduledDate,
        description: form.description.trim() || null,
        priority: Number(form.priority),
        workload: Number(form.workload),
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      {!fixedScheduleId && (
        <label className="field">
          <span className="field__label">계획</span>
          <select className="select" value={form.scheduleId} onChange={update('scheduleId')}>
            {schedules.length === 0 && <option value="">진행 중인 계획이 없습니다</option>}
            {schedules.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="field">
        <span className="field__label">할 일</span>
        <input
          className="input"
          value={form.title}
          onChange={update('title')}
          maxLength={200}
          placeholder="예: 교재 1장 읽기"
          autoFocus
        />
      </label>
      <label className="field">
        <span className="field__label">날짜</span>
        <input
          type="date"
          className="input"
          value={form.scheduledDate}
          min={schedule?.startDate}
          max={schedule?.endDate}
          onChange={update('scheduledDate')}
        />
        {schedule && (
          <span className="field__hint">
            계획 기간 {schedule.startDate} ~ {schedule.endDate}
          </span>
        )}
      </label>
      <div className="field-row">
        <label className="field">
          <span className="field__label">우선순위</span>
          <select className="select" value={form.priority} onChange={update('priority')}>
            <option value={1}>1 · 매우 높음</option>
            <option value={2}>2 · 높음</option>
            <option value={3}>3 · 보통</option>
            <option value={4}>4 · 낮음</option>
            <option value={5}>5 · 매우 낮음</option>
          </select>
        </label>
        <label className="field">
          <span className="field__label">작업량</span>
          <input
            type="number"
            className="input"
            min={1}
            max={10}
            value={form.workload}
            onChange={update('workload')}
          />
        </label>
      </div>
      <label className="field">
        <span className="field__label">메모 (선택)</span>
        <textarea
          className="input"
          rows={2}
          value={form.description}
          onChange={update('description')}
        />
      </label>
      {(error || serverError) && <p className="form-error">{error || serverError}</p>}
      <div className="form__actions">
        <button type="button" className="btn" onClick={onCancel}>
          취소
        </button>
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitLabel ?? (initial ? '저장' : '추가')}
        </button>
      </div>
    </form>
  )
}

export default ScheduleItemForm
