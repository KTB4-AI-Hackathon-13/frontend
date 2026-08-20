import { useState } from 'react'

import { ApiError, userMessage } from '../../../shared/api/apiError.js'
import { todayLocal } from '../utils/date.js'

/** 사용자가 직접 계획을 만드는 폼 — POST /schedules. */
function ScheduleCreateForm({ onSubmit, onCancel, serverError, submitting = false }) {
  const today = todayLocal()
  const [form, setForm] = useState({
    title: '',
    description: '',
    startDate: today,
    endDate: today,
  })
  const [error, setError] = useState(null)
  const update = (key) => (e) => setForm((current) => ({ ...current, [key]: e.target.value }))
  const fieldErrors = serverError instanceof ApiError ? serverError.fieldErrorMap : {}

  const handleSubmit = (e) => {
    e.preventDefault()
    const title = form.title.trim()
    if (!title) return setError('계획 이름을 입력하세요.')
    if (title.length > 200) return setError('계획 이름은 200자 이하여야 합니다.')
    if (!form.startDate || !form.endDate) return setError('시작일과 종료일을 입력하세요.')
    if (form.startDate > form.endDate) return setError('시작일이 종료일보다 늦을 수 없습니다.')
    setError(null)
    return onSubmit({
      title,
      description: form.description.trim() || null,
      startDate: form.startDate,
      endDate: form.endDate,
    })
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <label className="field">
        <span className="field__label">계획 이름</span>
        <input
          className="input"
          value={form.title}
          onChange={update('title')}
          maxLength={200}
          placeholder="예: 자격증 시험 준비"
          autoFocus
        />
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
      <label className="field">
        <span className="field__label">설명 (선택)</span>
        <textarea
          className="input"
          rows={3}
          maxLength={5000}
          value={form.description}
          onChange={update('description')}
          placeholder="AI가 계획을 조정할 때 참고할 목표나 제약을 적어주세요."
        />
        {fieldErrors.description && <span className="field__error">{fieldErrors.description}</span>}
      </label>
      {(error || serverError) && <p className="form-error">{error || userMessage(serverError)}</p>}
      <div className="form__actions">
        <button type="button" className="btn" onClick={onCancel}>
          취소
        </button>
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? '추가 중…' : '계획 추가'}
        </button>
      </div>
    </form>
  )
}

export default ScheduleCreateForm
