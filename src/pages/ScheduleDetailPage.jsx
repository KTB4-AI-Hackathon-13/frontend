import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import {
  changeItemStatus,
  createItem,
  deleteItem,
  deleteSchedule,
  fetchScheduleDetail,
  getToday,
  updateItem,
  updateSchedule,
} from '../features/schedule/api/scheduleApi.js'
import Modal from '../features/schedule/components/Modal.jsx'
import ScheduleEditForm from '../features/schedule/components/ScheduleEditForm.jsx'
import ScheduleItemForm from '../features/schedule/components/ScheduleItemForm.jsx'
import Toast from '../features/schedule/components/Toast.jsx'
import { useAsync } from '../features/schedule/hooks/useAsync.js'
import { useToast } from '../features/schedule/hooks/useToast.js'
import {
  ITEM_STATUS,
  ITEM_STATUS_LABEL,
  SCHEDULE_STATUS,
  SCHEDULE_STATUS_LABEL,
  colorForSchedule,
} from '../features/schedule/utils/constants.js'
import { daysBetween, formatDateShort, formatPeriod } from '../features/schedule/utils/date.js'

/**
 * 와이어프레임 06 · 계획 검토·수정
 * - 헤더: 제목 · 기간 요약 · [AI에게 수정 요청(4번 API, 비활성)]
 * - 왼쪽: 계획 요약 (목표 / 기간 / 할 일 수 / 퍼즐 진행)
 * - 오른쪽: 날짜별 할 일, 각 행에 수정 · 삭제, 하단 + 할 일 추가
 * 검토 중(DRAFT)이든 진행 중이든 같은 화면을 쓴다.
 */
function ScheduleDetailPage() {
  const { scheduleId } = useParams()
  const navigate = useNavigate()
  const today = getToday()
  const {
    data: s,
    loading,
    error,
    reload,
  } = useAsync(() => fetchScheduleDetail(scheduleId), [scheduleId])
  const [modal, setModal] = useState(null) // { type: 'add'|'edit'|'schedule'|'delete-schedule', item?, date? }
  const [serverError, setServerError] = useState(null)
  const { toast, show } = useToast()

  const openModal = (m) => {
    setServerError(null)
    setModal(m)
  }
  const run = async (fn, successMsg) => {
    try {
      await fn()
      setModal(null)
      if (successMsg) show(successMsg)
      reload()
    } catch (e) {
      setServerError(e.message)
      if (!modal) show(e.message, 'error')
    }
  }

  const handleStatus = async (item, status) => {
    try {
      const res = await changeItemStatus(item.id, status)
      if (res.puzzlePieceAwarded) show('🧩 퍼즐 조각 1개를 획득했어요!', 'success')
      reload()
    } catch (e) {
      show(e.message, 'error')
    }
  }

  if (loading)
    return (
      <section className="page">
        <p className="muted">불러오는 중…</p>
      </section>
    )
  if (error || !s) {
    return (
      <section className="page">
        <div className="empty">
          <p>{error?.message ?? '계획을 찾을 수 없습니다.'}</p>
          <Link to="/schedules" className="btn">
            내 계획으로
          </Link>
        </div>
      </section>
    )
  }

  const weeks = Math.max(1, Math.round(daysBetween(s.startDate, s.endDate) / 7))
  const pct = s.puzzleCount ? Math.round((s.completedPuzzleCount / s.puzzleCount) * 100) : 0
  const color = colorForSchedule(s.id)

  return (
    <section className="page detail" style={{ '--chip-color': color }}>
      <nav className="crumbs">
        <Link to="/schedules">내 계획</Link>
        <span>›</span>
        <span>{s.title}</span>
      </nav>

      <header className="detail__head">
        <div>
          <div className="detail__badges">
            <span className={`status status--${s.status.toLowerCase()}`}>
              {SCHEDULE_STATUS_LABEL[s.status]}
            </span>
            {s.status === SCHEDULE_STATUS.DRAFT && (
              <span className="muted small">AI 제안을 확인하고 수정하세요.</span>
            )}
          </div>
          <h1 className="page-title">{s.title}</h1>
          <p className="page-sub">
            {formatPeriod(s.startDate, s.endDate)} · {weeks}주 · 일 단위 계획
          </p>
        </div>
        <div className="detail__actions">
          <button type="button" className="btn" disabled title="AI 계획 수정 (4번 API) 연동 예정">
            AI에게 수정 요청
          </button>
          <button type="button" className="btn" onClick={() => openModal({ type: 'schedule' })}>
            계획 수정
          </button>
          <button
            type="button"
            className="btn btn--danger-ghost"
            onClick={() => openModal({ type: 'delete-schedule' })}
          >
            삭제
          </button>
        </div>
      </header>

      <div className="detail__grid">
        <aside className="summary">
          <h2 className="summary__title">계획 요약</h2>
          <dl className="summary__list">
            <div>
              <dt>목표</dt>
              <dd>{s.description || s.title}</dd>
            </div>
            <div>
              <dt>기간</dt>
              <dd>
                {weeks}주 ({daysBetween(s.startDate, s.endDate)}일)
              </dd>
            </div>
            <div>
              <dt>할 일</dt>
              <dd>{s.puzzleCount}개</dd>
            </div>
            <div>
              <dt>퍼즐 조각</dt>
              <dd>
                {s.completedPuzzleCount} / {s.puzzleCount}
                <div className="bar">
                  <div className="bar__fill" style={{ width: `${pct}%` }} />
                </div>
              </dd>
            </div>
            <div>
              <dt>버전</dt>
              <dd>v{s.currentVersion}</dd>
            </div>
          </dl>
        </aside>

        <div className="plan-days">
          {s.days.length === 0 && (
            <div className="empty">아직 할 일이 없습니다. 아래에서 추가하세요.</div>
          )}
          {s.days.map((day) => (
            <section
              key={day.date}
              className={`plan-day ${day.date === today ? 'is-today' : ''} ${day.date < today ? 'is-past' : ''}`}
            >
              <h3 className="plan-day__date">
                {formatDateShort(day.date)}
                {day.date === today && <span className="pill">오늘</span>}
                <span className="muted small plan-day__count">
                  {day.completedCount}/{day.totalCount}
                </span>
              </h3>
              <ul className="plan-day__list">
                {day.items.map((it) => {
                  const done = it.status === ITEM_STATUS.COMPLETED
                  const inactive =
                    it.status === ITEM_STATUS.SKIPPED || it.status === ITEM_STATUS.CANCELLED
                  return (
                    <li
                      key={it.id}
                      className={`plan-item ${done ? 'is-done' : ''} ${inactive ? 'is-muted' : ''}`}
                    >
                      <input
                        type="checkbox"
                        className="plan-item__check"
                        checked={done}
                        disabled={inactive}
                        onChange={() =>
                          handleStatus(it, done ? ITEM_STATUS.TODO : ITEM_STATUS.COMPLETED)
                        }
                        aria-label={`${it.title} 완료`}
                      />
                      <span className="plan-item__title">{it.title}</span>
                      {it.description && (
                        <span className="muted small plan-item__desc">{it.description}</span>
                      )}
                      <select
                        className="select select--inline"
                        value={it.status}
                        onChange={(e) => handleStatus(it, e.target.value)}
                        aria-label="상태"
                      >
                        {Object.values(ITEM_STATUS).map((st) => (
                          <option key={st} value={st}>
                            {ITEM_STATUS_LABEL[st]}
                          </option>
                        ))}
                      </select>
                      <span className="plan-item__actions">
                        <button
                          type="button"
                          className="link"
                          onClick={() => openModal({ type: 'edit', item: it })}
                        >
                          수정
                        </button>
                        <span className="muted">·</span>
                        <button
                          type="button"
                          className="link link--danger"
                          onClick={() => run(() => deleteItem(it.id), '할 일을 삭제했어요.')}
                        >
                          삭제
                        </button>
                      </span>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}

          <button
            type="button"
            className="btn btn--dashed"
            onClick={() => openModal({ type: 'add', date: s.days.at(-1)?.date ?? s.startDate })}
          >
            + 할 일 추가
          </button>
        </div>
      </div>

      {modal?.type === 'add' && (
        <Modal title="할 일 추가" onClose={() => setModal(null)}>
          <ScheduleItemForm
            fixedScheduleId={s.id}
            schedules={[s]}
            defaultDate={modal.date}
            serverError={serverError}
            onCancel={() => setModal(null)}
            onSubmit={(body) => run(() => createItem(s.id, body), '할 일을 추가했어요.')}
          />
        </Modal>
      )}
      {modal?.type === 'edit' && (
        <Modal title="할 일 수정" onClose={() => setModal(null)}>
          <ScheduleItemForm
            initial={modal.item}
            fixedScheduleId={s.id}
            schedules={[s]}
            serverError={serverError}
            onCancel={() => setModal(null)}
            onSubmit={(body) => run(() => updateItem(modal.item.id, body), '수정했어요.')}
          />
        </Modal>
      )}
      {modal?.type === 'schedule' && (
        <Modal title="계획 수정" onClose={() => setModal(null)}>
          <ScheduleEditForm
            schedule={s}
            serverError={serverError}
            onCancel={() => setModal(null)}
            onSubmit={(body) => run(() => updateSchedule(s.id, body), '계획을 수정했어요.')}
          />
        </Modal>
      )}
      {modal?.type === 'delete-schedule' && (
        <Modal title="계획 삭제" onClose={() => setModal(null)} width={400}>
          <p>
            <strong>{s.title}</strong> 계획과 할 일 {s.puzzleCount}개를 삭제할까요?
            <br />
            <span className="muted small">이미 획득한 퍼즐 조각은 사라지지 않아요.</span>
          </p>
          <div className="form__actions">
            <button type="button" className="btn" onClick={() => setModal(null)}>
              취소
            </button>
            <button
              type="button"
              className="btn btn--danger"
              onClick={async () => {
                try {
                  await deleteSchedule(s.id)
                  navigate('/schedules')
                } catch (e) {
                  setServerError(e.message)
                }
              }}
            >
              삭제
            </button>
          </div>
          {serverError && <p className="form-error">{serverError}</p>}
        </Modal>
      )}

      <Toast toast={toast} />
    </section>
  )
}

export default ScheduleDetailPage
