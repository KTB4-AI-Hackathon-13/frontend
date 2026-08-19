import { useState } from 'react'

/** PATCH /schedules/{scheduleId} — title?, description?, startDate?, endDate? */
function ScheduleEditForm({ schedule, onSubmit, onCancel, serverError }) {
  const [form, setForm] = useState({
    title: schedule.title,
    description: schedule.description ?? '',
    startDate: schedule.startDate,
    endDate: schedule.endDate,
  })
  const [error, setError] = useState(null)
  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.title.trim()) return setError('제목을 입력하세요.')
    if (form.startDate > form.endDate) return setError('시작일이 종료일보다 늦을 수 없습니다.')
    setError(null)
    onSubmit({ ...form, title: form.title.trim(), description: form.description.trim() || null })
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label className="field">
        <span className="field__label">계획 이름</span>
        <input className="input" value={form.title} onChange={update('title')} maxLength={200} />
      </label>
      <label className="field">
        <span className="field__label">목표 / 설명</span>
        <textarea
          className="input"
          rows={2}
          value={form.description}
          onChange={update('description')}
        />
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
        </label>
        <label className="field">
          <span className="field__label">종료일</span>
          <input type="date" className="input" value={form.endDate} onChange={update('endDate')} />
        </label>
      </div>
      {(error || serverError) && <p className="form-error">{error || serverError}</p>}
      <div className="form__actions">
        <button type="button" className="btn" onClick={onCancel}>
          취소
        </button>
        <button type="submit" className="btn btn--primary">
          저장
        </button>
      </div>
    </form>
  )
}

export default ScheduleEditForm
