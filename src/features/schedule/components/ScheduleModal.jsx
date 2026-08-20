import { useState } from 'react'
import { Link } from 'react-router-dom'

import Modal from './Modal.jsx'
import PuzzleProgress from './PuzzleProgress.jsx'
import ScheduleEditForm from './ScheduleEditForm.jsx'
import { deleteSchedule, fetchScheduleDetail, updateSchedule } from '../api/scheduleApi.js'
import { useAsync } from '../hooks/useAsync.js'
import { activeItemPeriod } from '../utils/period.js'
import { SCHEDULE_STATUS_LABEL, colorForSchedule } from '../utils/constants.js'
import { formatPeriod } from '../utils/date.js'
import { userMessage } from '../../../shared/api/apiError.js'

/**
 * 계획 모달 (내 계획 목록 행 클릭) — 퍼즐 진행도 + 제목/기간 편집 + 삭제.
 * - 수정: PATCH /schedules/{id} (title/startDate/endDate, 바뀐 필드만; 409/422 는 폼에 표시)
 * - 삭제: DELETE /schedules/{id} (작업 전부 함께 삭제, 인라인 확인)
 * - 할 일 자체는 홈 캘린더에서 다룬다 → "캘린더에서 보기" 링크
 * - 기간을 줄일 때 서버가 409 로 막는 걸 미리 알 수 있도록, 열릴 때 상세를 한 번 받아
 *   할 일이 놓인 날짜 범위를 편집 폼에 넘긴다 (그 범위 밖으로는 날짜를 못 고르게)
 *
 * @param {{ schedule: import('../api/types.js').ScheduleSummary, onClose: () => void, onChanged: () => Promise<unknown> | void }} props
 */
function ScheduleModal({ schedule: s, categories = [], onClose, onChanged }) {
  const [serverError, setServerError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  // 기간 축소 한계를 알기 위한 상세 조회 (실패해도 폼은 그대로 동작한다 — 그때는 서버 409 로 걸린다)
  const { data: detail } = useAsync(() => fetchScheduleDetail(s.id), [s.id])
  const itemPeriod = activeItemPeriod(detail)

  const run = async (fn) => {
    setBusy(true)
    setServerError(null)
    try {
      await fn()
      await onChanged?.()
      onClose()
    } catch (e) {
      setServerError(e)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title="계획" onClose={onClose}>
      <div className="schedule-modal" style={{ '--chip-color': colorForSchedule(s.id) }}>
        <div className="schedule-modal__meta">
          <span className={`status status--${s.status.toLowerCase()}`}>
            {SCHEDULE_STATUS_LABEL[s.status]}
          </span>
          <span className="muted small">
            {formatPeriod(s.startDate, s.endDate)} · 할 일 {s.puzzleCount}개 · v{s.currentVersion}
          </span>
        </div>
        <div className="schedule-modal__puzzle">
          <PuzzleProgress completed={s.completedPuzzleCount} total={s.puzzleCount} showGrid />
          <Link to={`/?date=${s.startDate}`} className="link small" onClick={onClose}>
            캘린더에서 보기 →
          </Link>
          <Link to={`/schedules/${s.id}/conversation`} className="link small" onClick={onClose}>
            AI 대화 보기 →
          </Link>
        </div>

        <section
          className="schedule-modal__edit-method"
          aria-labelledby="schedule-edit-method-title"
        >
          <div className="schedule-modal__edit-heading">
            <strong id="schedule-edit-method-title">계획 수정 방법</strong>
            <span className="muted small">직접 고치거나 AI와 대화하며 다시 계획할 수 있어요.</span>
          </div>
          <div className="schedule-modal__edit-options">
            <div className="schedule-modal__edit-option is-active" aria-current="true">
              <span className="schedule-modal__edit-icon" aria-hidden="true">
                ✎
              </span>
              <span>
                <strong>직접 수정</strong>
                <small>계획 이름과 기간을 바로 변경</small>
              </span>
            </div>
            <Link
              to={`/schedules/${s.id}/conversation`}
              className="schedule-modal__edit-option"
              onClick={onClose}
            >
              <span className="schedule-modal__edit-icon" aria-hidden="true">
                A
              </span>
              <span>
                <strong>AI로 계획 수정</strong>
                <small>현재 계획을 바탕으로 AI와 재설계</small>
              </span>
              <span className="schedule-modal__edit-arrow" aria-hidden="true">
                →
              </span>
            </Link>
          </div>
        </section>

        <ScheduleEditForm
          schedule={detail ?? s}
          categories={categories}
          itemPeriod={itemPeriod}
          serverError={confirmDelete ? null : serverError}
          submitting={busy}
          onCancel={onClose}
          onSubmit={(patch) => run(() => updateSchedule(s.id, patch))}
        />

        <div className="item-modal__danger">
          {!confirmDelete ? (
            <button
              type="button"
              className="link link--danger"
              disabled={busy}
              onClick={() => setConfirmDelete(true)}
            >
              이 계획 삭제
            </button>
          ) : (
            <div className="inline-confirm">
              <span className="small">
                <strong>{s.title}</strong> 계획과 할 일 {s.puzzleCount}개를 삭제할까요?
              </span>
              <button
                type="button"
                className="btn btn--sm btn--danger"
                disabled={busy}
                onClick={() => run(() => deleteSchedule(s.id))}
              >
                {busy ? '삭제 중…' : '삭제'}
              </button>
              <button
                type="button"
                className="btn btn--sm"
                disabled={busy}
                onClick={() => setConfirmDelete(false)}
              >
                취소
              </button>
            </div>
          )}
          {serverError && confirmDelete && <p className="form-error">{userMessage(serverError)}</p>}
        </div>
      </div>
    </Modal>
  )
}

export default ScheduleModal
