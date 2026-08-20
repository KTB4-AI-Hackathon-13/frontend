import { useState } from 'react'

import { ApiError, userMessage } from '../../../shared/api/apiError.js'
import { isWithin } from '../utils/date.js'
import {
  ITEM_CATEGORY_OPTIONS,
  STANDALONE_ITEM_DEFAULTS,
  categoryLabelFor,
} from '../utils/constants.js'

/**
 * 할 일 추가/수정 폼 (시간 없이 날짜 단위).
 * - 추가: 계획을 고르면 POST /schedules/{scheduleId}/items, 고르지 않으면 POST /schedule-items.
 * - 생성 계약: title, scheduledDate, estimatedMinutes 는 필수다.
 * - 개인 일정: categoryId/workload 는 null로 고정하고 입력받지 않는다.
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
    categoryId: initial?.categoryId ?? '',
    workload: initial?.workload ?? '',
    estimatedMinutes: initial?.estimatedMinutes ?? 30,
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
    const categoryId = isStandalone
      ? STANDALONE_ITEM_DEFAULTS.categoryId
      : form.categoryId === ''
        ? undefined
        : Number(form.categoryId)
    const workload = isStandalone
      ? STANDALONE_ITEM_DEFAULTS.workload
      : form.workload === ''
        ? undefined
        : Number(form.workload)
    const estimatedMinutes = Number(form.estimatedMinutes)
    const priority = Number(form.priority)
    const position = form.position === '' ? undefined : Number(form.position)

    if (!title) return setError('할 일 제목을 입력하세요.')
    if (title.length > 200) return setError('제목은 200자 이하여야 합니다.')
    if (!form.scheduledDate) return setError('날짜를 선택하세요.')
    if (schedule && !isWithin(form.scheduledDate, schedule.startDate, schedule.endDate)) {
      return setError(
        `날짜는 계획 기간(${schedule.startDate} ~ ${schedule.endDate}) 안이어야 합니다.`,
      )
    }
    if (
      !isStandalone &&
      categoryId !== undefined &&
      !ITEM_CATEGORY_OPTIONS.some((category) => category.id === categoryId)
    ) {
      return setError('사용 가능한 카테고리를 선택하세요.')
    }
    if (
      workload !== undefined &&
      workload !== null &&
      (!Number.isInteger(workload) || workload < 1)
    ) {
      return setError('작업량은 비워두거나 1 이상의 정수로 입력하세요.')
    }
    if (!Number.isInteger(estimatedMinutes) || estimatedMinutes < 1) {
      return setError('예상 소요 시간은 1분 이상의 정수로 입력하세요.')
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
      categoryId,
      workload,
      estimatedMinutes,
      priority,
      position,
    }
    if (!isEdit) return onSubmit({ scheduleId, body: full })

    // PATCH 는 보낸 값만 변경한다. 백엔드가 null을 "변경 없음"으로 처리하는 선택 필드는
    // 빈 값으로 지우려 하지 않고 실제 숫자가 입력됐을 때만 전송한다.
    const patch = {}
    if (full.title !== initial.title) patch.title = full.title
    if (full.scheduledDate !== initial.scheduledDate) patch.scheduledDate = full.scheduledDate
    if (full.description !== (initial.description ?? '')) patch.description = full.description
    if (
      !isStandalone &&
      full.workload !== undefined &&
      full.workload !== initial.workload
    ) {
      patch.workload = full.workload
    }
    if (full.estimatedMinutes !== initial.estimatedMinutes) {
      patch.estimatedMinutes = full.estimatedMinutes
    }
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
          maxLength={200}
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

      {isStandalone ? (
        <div className="field">
          <span className="field__label">개인 일정 기본값</span>
          <span className="field__hint">
            카테고리와 작업량은 입력하지 않고 기본값(null)으로 저장됩니다.
          </span>
        </div>
      ) : isEdit ? (
        <div className="field">
          <span className="field__label">카테고리</span>
          <span className="field__readonly">
            {categoryLabelFor(initial?.categoryId) ?? '카테고리 없음'}
          </span>
        </div>
      ) : (
        <label className="field">
          <span className="field__label">카테고리 (선택)</span>
          <select className="select" value={form.categoryId} onChange={update('categoryId')}>
            <option value="">카테고리 없음</option>
            {ITEM_CATEGORY_OPTIONS.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
          {fieldErrors.categoryId && <span className="field__error">{fieldErrors.categoryId}</span>}
        </label>
      )}

      <div className="field-row">
        {!isStandalone && (
          <label className="field">
            <span className="field__label">작업량 (선택)</span>
            <input
              type="number"
              className="input"
              min={1}
              step={1}
              value={form.workload}
              placeholder="미지정"
              onChange={update('workload')}
            />
            {fieldErrors.workload && <span className="field__error">{fieldErrors.workload}</span>}
          </label>
        )}
        <label className="field">
          <span className="field__label">예상 소요 시간 (분)</span>
          <input
            type="number"
            className="input"
            min={1}
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
          maxLength={5000}
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
