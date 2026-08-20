import { useState } from 'react'

import { ApiError, userMessage } from '../../../shared/api/apiError.js'
import { isWithin } from '../utils/date.js'
import { ITEM_TYPE, ITEM_TYPE_OPTIONS } from '../utils/constants.js'

/**
 * 할 일 추가/수정 폼 (시간 없이 날짜 단위).
 * - 추가: 계획을 고르면 POST /schedules/{scheduleId}/items, 고르지 않으면 POST /schedule-items.
 * - 생성 계약: title, scheduledDate, estimatedMinutes, itemType 은 필수다.
 * - 수정: PATCH /schedule-items/{itemId} — 바뀐 필드만 전송. status 는 별도 API로 변경한다.
 *
 * props
 * - schedules: 선택 가능한 계획 목록 [{ id, title, startDate, endDate }]
 * - fixedScheduleId: 상세 화면처럼 계획이 정해져 있을 때
 * - initial: 수정 모드일 때 기존 ScheduleItem
 * - onSubmit({ scheduleId, body }) — 단독 작업의 scheduleId 는 null
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
  submitting = false,
}) {
  const isEdit = Boolean(initial)
  const [form, setForm] = useState({
    scheduleId: initial ? (initial.scheduleId ?? '') : (fixedScheduleId ?? schedules[0]?.id ?? ''),
    title: initial?.title ?? '',
    scheduledDate: initial?.scheduledDate ?? defaultDate ?? '',
    description: initial?.description ?? '',
    estimatedMinutes: initial?.estimatedMinutes ?? 30,
    itemType: initial?.itemType ?? ITEM_TYPE.ETC,
    priority: initial?.priority ?? 3,
    position: initial?.position ?? '',
  })
  const [error, setError] = useState(null)

  const schedule = schedules.find((candidate) => candidate.id === Number(form.scheduleId))
  const isStandalone = form.scheduleId === ''
  const update = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }))
  const fieldErrors = serverError instanceof ApiError ? serverError.fieldErrorMap : {}

  const handleSubmit = (event) => {
    event.preventDefault()
    const title = form.title.trim()
    const scheduleId = isStandalone ? null : Number(form.scheduleId)
    const estimatedMinutes = Number(form.estimatedMinutes)
    const priority = Number(form.priority)
    const position = form.position === '' ? undefined : Number(form.position)

    if (!title) return setError('할 일 제목을 입력하세요.')
    if (title.length > 100) return setError('제목은 100자 이하여야 합니다.')
    if (form.description.length > 1000) return setError('메모는 1000자 이하여야 합니다.')
    if (!form.scheduledDate) return setError('날짜를 선택하세요.')
    if (schedule && !isWithin(form.scheduledDate, schedule.startDate, schedule.endDate)) {
      return setError(
        `날짜는 계획 기간(${schedule.startDate} ~ ${schedule.endDate}) 안이어야 합니다.`,
      )
    }
    if (!ITEM_TYPE_OPTIONS.some((option) => option.value === form.itemType)) {
      return setError('사용 가능한 작업 유형을 선택하세요.')
    }
    if (!Number.isInteger(estimatedMinutes) || estimatedMinutes < 1 || estimatedMinutes > 1440) {
      return setError('예상 소요 시간은 1~1440분 사이의 정수로 입력하세요.')
    }
    if (!Number.isInteger(priority) || priority < 1 || priority > 5) {
      return setError('우선순위는 1~5입니다.')
    }
    if (position !== undefined && (!Number.isInteger(position) || position < 0)) {
      return setError('표시 순서는 0 이상의 정수입니다.')
    }
    setError(null)

    const full = {
      title,
      scheduledDate: form.scheduledDate,
      description: form.description.trim(),
      estimatedMinutes,
      itemType: form.itemType,
      priority,
      position,
    }
    if (!isEdit) return onSubmit({ scheduleId, body: full })

    // PATCH 는 보낸 값만 변경한다.
    const patch = {}
    if (full.title !== initial.title) patch.title = full.title
    if (full.scheduledDate !== initial.scheduledDate) patch.scheduledDate = full.scheduledDate
    if (full.description !== (initial.description ?? '')) patch.description = full.description
    if (full.estimatedMinutes !== initial.estimatedMinutes) {
      patch.estimatedMinutes = full.estimatedMinutes
    }
    if (full.itemType !== initial.itemType) patch.itemType = full.itemType
    if (full.priority !== initial.priority) patch.priority = full.priority
    if (full.position !== undefined && full.position !== initial.position) {
      patch.position = full.position
    }
    if (Object.keys(patch).length === 0) return setError('변경된 내용이 없습니다.')
    return onSubmit({ scheduleId: initial.scheduleId, body: patch })
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      {!fixedScheduleId && !isEdit && (
        <label className="field">
          <span className="field__label">계획</span>
          <select className="select" value={form.scheduleId} onChange={update('scheduleId')}>
            <option value="">계획 없음 · 개인 일정</option>
            {schedules.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.title}
              </option>
            ))}
          </select>
          <span className="field__hint">
            개인 일정은 캘린더와 AI 계획 조정에는 반영되지만 퍼즐 조각에는 포함되지 않아요.
          </span>
        </label>
      )}

      <label className="field">
        <span className="field__label">할 일</span>
        <input
          className="input"
          value={form.title}
          onChange={update('title')}
          maxLength={100}
          placeholder="예: 교재 1장 읽기"
          autoFocus
        />
        {fieldErrors.title && <span className="field__error">{fieldErrors.title}</span>}
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
        {schedule ? (
          <span className="field__hint">
            계획 기간 {schedule.startDate} ~ {schedule.endDate} · 하루 최대 작업 수(기본 5개, 모든
            계획 합산)를 넘으면 추가할 수 없어요
          </span>
        ) : (
          <span className="field__hint">계획 기간 제약 없이 선택한 날짜에 저장됩니다.</span>
        )}
        {fieldErrors.scheduledDate && (
          <span className="field__error">{fieldErrors.scheduledDate}</span>
        )}
      </label>

      <div className="field-row">
        <label className="field">
          <span className="field__label">작업 유형</span>
          <select className="select" value={form.itemType} onChange={update('itemType')}>
            {ITEM_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {fieldErrors.itemType && <span className="field__error">{fieldErrors.itemType}</span>}
        </label>
        <label className="field">
          <span className="field__label">예상 소요 시간 (분)</span>
          <input
            type="number"
            className="input"
            min={1}
            max={1440}
            step={1}
            value={form.estimatedMinutes}
            onChange={update('estimatedMinutes')}
          />
          {fieldErrors.estimatedMinutes && (
            <span className="field__error">{fieldErrors.estimatedMinutes}</span>
          )}
        </label>
      </div>

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
          {fieldErrors.priority && <span className="field__error">{fieldErrors.priority}</span>}
        </label>
        <label className="field">
          <span className="field__label">표시 순서 (선택)</span>
          <input
            type="number"
            className="input"
            min={0}
            step={1}
            value={form.position}
            placeholder="자동"
            onChange={update('position')}
          />
          {fieldErrors.position && <span className="field__error">{fieldErrors.position}</span>}
        </label>
      </div>

      <label className="field">
        <span className="field__label">메모 (선택)</span>
        <textarea
          className="input"
          rows={2}
          maxLength={1000}
          value={form.description}
          onChange={update('description')}
        />
        {fieldErrors.description && <span className="field__error">{fieldErrors.description}</span>}
      </label>

      {(error || serverError) && <p className="form-error">{error || userMessage(serverError)}</p>}
      <div className="form__actions">
        <button type="button" className="btn" onClick={onCancel}>
          취소
        </button>
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? '저장 중…' : (submitLabel ?? (isEdit ? '저장' : '추가'))}
        </button>
      </div>
    </form>
  )
}

export default ScheduleItemForm
