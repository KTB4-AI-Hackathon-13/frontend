import { useState } from 'react'

import Modal from './Modal.jsx'
import ScheduleItemForm from './ScheduleItemForm.jsx'
import { deleteItem, fetchScheduleDetail, updateItem } from '../api/scheduleApi.js'
import { useAsync } from '../hooks/useAsync.js'
import {
  ITEM_STATUS,
  ITEM_STATUS_LABEL,
  STANDALONE_ITEM_LABEL,
  colorForSchedule,
} from '../utils/constants.js'
import { userMessage } from '../../../shared/api/apiError.js'
import ErrorNotice from '../../../shared/components/ErrorNotice.jsx'

/**
 * 할 일 모달 (홈 패널/캘린더 칩 클릭) — 수정 · 상태 변경 · 삭제를 한 곳에서.
 * - 계획 소속 작업은 GET /schedules/{scheduleId}에서 최신 상세를 찾고, scheduleId가 null인
 *   단독 작업은 캘린더/오늘 응답에 포함된 항목을 그대로 편집한다.
 * - 수정: PATCH /schedule-items/{id} (바뀐 필드만)
 * - 상태: PATCH /schedule-items/{id}/status (부모 useItemStatus.change — 낙관적 업데이트·조각 효과 공유)
 * - 삭제: DELETE /schedule-items/{id} (모달 안 인라인 확인)
 *
 * @param {{ item: import('../api/types.js').DailyItem, status: string, onClose: () => void,
 *          onChanged: () => Promise<unknown> | void, onStatusChange: (item, status) => void }} props
 */
function ItemModal({ item, status, onClose, onChanged, onStatusChange }) {
  const hasSchedule = item.scheduleId != null
  const {
    data: schedule,
    loading,
    error,
    reload,
  } = useAsync(
    () => (hasSchedule ? fetchScheduleDetail(item.scheduleId) : Promise.resolve(null)),
    [item.scheduleId],
  )
  const scheduleItems = schedule?.days.flatMap((d) => d.items) ?? []
  const full = hasSchedule ? (scheduleItems.find((it) => it.id === item.id) ?? null) : item
  const [serverError, setServerError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const run = async (fn, { close = true } = {}) => {
    setBusy(true)
    setServerError(null)
    try {
      await fn()
      await onChanged?.()
      if (close) onClose()
    } catch (e) {
      setServerError(e)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title="할 일" onClose={onClose}>
      <div className="item-modal">
        <div className="item-modal__head">
          <span
            className="today__schedule"
            style={{ '--chip-color': colorForSchedule(item.scheduleId) }}
          >
            {item.scheduleTitle ?? STANDALONE_ITEM_LABEL}
          </span>
          <label className="item-modal__status">
            <span className="muted small">상태</span>
            <select
              className="select select--inline"
              value={status}
              onChange={(e) => onStatusChange(item, e.target.value)}
              aria-label="상태"
            >
              {Object.values(ITEM_STATUS).map((v) => (
                <option key={v} value={v}>
                  {ITEM_STATUS_LABEL[v]}
                </option>
              ))}
            </select>
          </label>
        </div>

        {hasSchedule && loading && !schedule && <p className="muted small">불러오는 중…</p>}
        {hasSchedule && error && <ErrorNotice error={error} onRetry={reload} compact />}
        {hasSchedule && schedule && !full && (
          <ErrorNotice
            error={new Error('할 일을 찾을 수 없습니다. 삭제되었을 수 있어요.')}
            compact
          />
        )}

        {full && (
          <ScheduleItemForm
            key={full.id}
            initial={full}
            fixedScheduleId={schedule?.id}
            schedules={schedule ? [schedule] : []}
            serverError={confirmDelete ? null : serverError}
            submitting={busy}
            submitLabel="저장"
            onCancel={onClose}
            onSubmit={({ body }) => run(() => updateItem(full.id, body))}
          />
        )}

        <div className="item-modal__danger">
          {!confirmDelete ? (
            <button
              type="button"
              className="link link--danger"
              disabled={busy}
              onClick={() => setConfirmDelete(true)}
            >
              이 할 일 삭제
            </button>
          ) : (
            <div className="inline-confirm">
              <span className="small">
                {hasSchedule
                  ? '삭제할까요? 퍼즐 조각 수도 1개 줄어요.'
                  : '이 개인 일정을 삭제할까요? 단독 일정은 퍼즐 조각에 포함되지 않아요.'}
              </span>
              <button
                type="button"
                className="btn btn--sm btn--danger"
                disabled={busy}
                onClick={() => run(() => deleteItem(item.id))}
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

export default ItemModal
