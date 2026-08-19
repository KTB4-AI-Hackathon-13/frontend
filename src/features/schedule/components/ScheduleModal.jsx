import { useState } from 'react'
import { Link } from 'react-router-dom'

import Modal from './Modal.jsx'
import PuzzleProgress from './PuzzleProgress.jsx'
import ScheduleEditForm from './ScheduleEditForm.jsx'
import { deleteSchedule, updateSchedule } from '../api/scheduleApi.js'
import { SCHEDULE_STATUS_LABEL, colorForSchedule } from '../utils/constants.js'
import { formatPeriod } from '../utils/date.js'
import { userMessage } from '../../../shared/api/apiError.js'

/**
 * 계획 모달 (내 계획 목록 행 클릭) — 퍼즐 진행도 + 제목/기간 편집 + 삭제.
 * - 수정: PATCH /schedules/{id} (title/startDate/endDate, 바뀐 필드만; 409/422 는 폼에 표시)
 * - 삭제: DELETE /schedules/{id} (작업 전부 함께 삭제, 인라인 확인)
 * - 할 일 자체는 홈 캘린더에서 다룬다 → "캘린더에서 보기" 링크
 *
 * @param {{ schedule: import('../api/types.js').ScheduleSummary, onClose: () => void, onChanged: () => Promise<unknown> | void }} props
 */
function ScheduleModal({ schedule: s, onClose, onChanged }) {
  const [serverError, setServerError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

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
        </div>

        <ScheduleEditForm
          schedule={s}
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
