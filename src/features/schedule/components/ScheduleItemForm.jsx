import { useState } from 'react'

import { ApiError, userMessage } from '../../../shared/api/apiError.js'
import { isWithin } from '../utils/date.js'
import {
  ITEM_CATEGORY_OPTIONS,
  ITEM_TYPE,
  ITEM_TYPE_LABEL,
  categoryLabelFor,
} from '../utils/constants.js'

/**
 * 할 일 추가/수정 폼 (시간 없이 날짜 단위).
 * - 추가: POST /schedules/{scheduleId}/items — DB/요청 DTO의 사용자 입력 필드를 전송한다.
 *         position 을 비우면 서버가 그 날짜의 맨 뒤 순서를 자동 배정한다.
 * - 수정: PATCH /schedule-items/{itemId} — 바뀐 필드만 전송. status 는 여기서 못 바꿈(상태 변경 API 사용).
 * - 서버 오류: 400 INVALID_REQUEST(fieldErrors → 필드 아래 표시), 422 DATE_OUTSIDE_SCHEDULE_PERIOD, 422 MAX_DAILY_TASKS_EXCEEDED
 *
 * props
 * - schedules: 선택 가능한 계획 목록 [{ id, title, startDate, endDate }] (fixedScheduleId 가 없을 때 select 로 보여줌)
 * - fixedScheduleId: 상세 화면처럼 계획이 정해져 있을 때
 * - initial: 수정 모드일 때 기존 ScheduleItem
 * - onSubmit({ scheduleId, body }) — body 는 추가면 전체, 수정이면 바뀐 필드만
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
    scheduleId: fixedScheduleId ?? initial?.scheduleId ?? schedules[0]?.id ?? '',
    title: initial?.title ?? '',
    scheduledDate: initial?.scheduledDate ?? defaultDate ?? '',
    description: initial?.description ?? '',
    itemType: initial?.itemType ?? ITEM_TYPE.TASK,
    categoryId: initial?.categoryId ?? '',
    workload: initial?.workload ?? 1,
    priority: initial?.priority ?? 3,
    position: initial?.position ?? '',
  })
  const [error, setError] = useState(null)

  const schedule = schedules.find((s) => s.id === Number(form.scheduleId))
  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const fieldErrors = serverError instanceof ApiError ? serverError.fieldErrorMap : {}

  const handleSubmit = (e) => {
    e.preventDefault()
    const title = form.title.trim()
    const categoryId = form.categoryId === '' ? undefined : Number(form.categoryId)
    const workload = Number(form.workload)
    const priority = Number(form.priority)
    const position = form.position === '' ? undefined : Number(form.position)
    if (!form.scheduleId) return setError('계획을 선택하세요.')
    if (!title) return setError('할 일 제목을 입력하세요.')
    if (title.length > 200) return setError('제목은 200자 이하여야 합니다.')
    if (!form.scheduledDate) return setError('날짜를 선택하세요.')
    if (!Object.values(ITEM_TYPE).includes(form.itemType))
      return setError('사용 가능한 유형을 선택하세요.')
    if (schedule && !isWithin(form.scheduledDate, schedule.startDate, schedule.endDate)) {
      return setError(
        `날짜는 계획 기간(${schedule.startDate} ~ ${schedule.endDate}) 안이어야 합니다.`,
      )
    }
    if (categoryId !== undefined && !ITEM_CATEGORY_OPTIONS.some((v) => v.id === categoryId))
      return setError('사용 가능한 카테고리를 선택하세요.')
    if (!Number.isInteger(workload) || workload < 1)
      return setError('작업량은 1 이상의 정수입니다.')
    if (!Number.isInteger(priority) || priority < 1 || priority > 5)
      return setError('우선순위는 1~5입니다.')
    if (position !== undefined && (!Number.isInteger(position) || position < 0))
      return setError('표시 순서는 0 이상의 정수입니다.')
    setError(null)

    const full = {
      title,
      scheduledDate: form.scheduledDate,
      description: form.description.trim(),
      itemType: form.itemType,
      categoryId,
      workload,
      priority,
      position,
    }
    if (!isEdit) return onSubmit({ scheduleId: Number(form.scheduleId), body: full })

    // 수정: 바뀐 필드만 (PATCH 는 보낸 것만 변경)
    const patch = {}
    if (full.title !== initial.title) patch.title = full.title
    if (full.scheduledDate !== initial.scheduledDate) patch.scheduledDate = full.scheduledDate
    if (full.description !== (initial.description ?? ''))
      patch.description = full.description
    if (full.workload !== initial.workload) patch.workload = full.workload
    if (full.priority !== initial.priority) patch.priority = full.priority
    if (full.position !== undefined && full.position !== initial.position)
      patch.position = full.position
    if (Object.keys(patch).length === 0) return setError('변경된 내용이 없습니다.')
    return onSubmit({ scheduleId: initial.scheduleId, body: patch })
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      {!fixedScheduleId && !isEdit && (
        <label className="field">
          <span className="field__label">계획</span>
          <select className="select" value={form.scheduleId} onChange={update('scheduleId')}>
            {schedules.length === 0 && <option value="">추가할 수 있는 계획이 없습니다</option>}
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
        {schedule && (
          <span className="field__hint">
            계획 기간 {schedule.startDate} ~ {schedule.endDate} · 하루 최대 작업 수(기본 5개, 모든
            계획 합산)를 넘으면 추가할 수 없어요
          </span>
        )}
        {fieldErrors.scheduledDate && (
          <span className="field__error">{fieldErrors.scheduledDate}</span>
        )}
      </label>
      {isEdit ? (
        <div className="field-row">
          <div className="field">
            <span className="field__label">유형</span>
            <span className="field__readonly">
              {ITEM_TYPE_LABEL[form.itemType] ?? '유형 없음'}
            </span>
          </div>
          <div className="field">
            <span className="field__label">카테고리</span>
            <span className="field__readonly">
              {categoryLabelFor(initial?.categoryId) ?? '카테고리 없음'}
            </span>
          </div>
        </div>
      ) : (
        <div className="field-row">
          <label className="field">
            <span className="field__label">유형</span>
            <select className="select" value={form.itemType} onChange={update('itemType')}>
              {Object.values(ITEM_TYPE).map((type) => (
                <option key={type} value={type}>
                  {ITEM_TYPE_LABEL[type]}
                </option>
              ))}
            </select>
            {fieldErrors.itemType && <span className="field__error">{fieldErrors.itemType}</span>}
          </label>
          <label className="field">
            <span className="field__label">카테고리</span>
            <select className="select" value={form.categoryId} onChange={update('categoryId')}>
              <option value="">카테고리 없음</option>
              {ITEM_CATEGORY_OPTIONS.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
            {fieldErrors.categoryId && (
              <span className="field__error">{fieldErrors.categoryId}</span>
            )}
          </label>
        </div>
      )}
      <div className="field-row">
        <label className="field">
          <span className="field__label">작업량</span>
          <input
            type="number"
            className="input"
            min={1}
            step={1}
            value={form.workload}
            onChange={update('workload')}
          />
          {fieldErrors.workload && <span className="field__error">{fieldErrors.workload}</span>}
        </label>
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
      </div>
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
