import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import {
  createItem,
  fetchCalendar,
  fetchSchedules,
  fetchToday,
} from '../features/schedule/api/scheduleApi.js'
import ItemModal from '../features/schedule/components/ItemModal.jsx'
import Modal from '../features/schedule/components/Modal.jsx'
import MonthCalendar from '../features/schedule/components/MonthCalendar.jsx'
import PieceAwardEffect from '../features/schedule/components/PieceAwardEffect.jsx'
import ScheduleItemForm from '../features/schedule/components/ScheduleItemForm.jsx'
import Toast from '../features/schedule/components/Toast.jsx'
import TodayPanel from '../features/schedule/components/TodayPanel.jsx'
import { useAsync } from '../features/schedule/hooks/useAsync.js'
import { useItemStatus } from '../features/schedule/hooks/useItemStatus.js'
import { useToast } from '../features/schedule/hooks/useToast.js'
import { SCHEDULE_STATUS } from '../features/schedule/utils/constants.js'
import { isWithin, shiftMonth, todayLocal } from '../features/schedule/utils/date.js'
import ErrorNotice from '../shared/components/ErrorNotice.jsx'

/** 할 일을 추가할 수 있는 계획 상태 (검토 중인 AI 초안에도 추가 가능) */
const ADDABLE_STATUSES = new Set([SCHEDULE_STATUS.ACTIVE, SCHEDULE_STATUS.DRAFT])

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/**
 * 메인 대시보드 (와이어프레임 07) — 할 일과 관련된 모든 조작은 이 화면 + 모달에서 끝난다.
 * - 왼쪽 월간 캘린더 : GET /calendar?year&month (월 이동 때마다). 칩 클릭 → 그 날짜 선택 + 할 일 모달
 * - 오른쪽 할 일 패널 : GET /schedule-items/today (서버 기준 오늘, Asia/Seoul). 다른 날짜 클릭 시 캘린더 응답의 그 날짜
 *                      패널은 "나열 + 완료 체크"만, 행 클릭 → 할 일 모달(수정·상태·삭제)
 * - 체크박스         : PATCH /schedule-items/{id}/status (낙관적 업데이트 → 성공 시 캘린더+오늘 재조회)
 * - + 할 일 추가     : POST /schedules/{scheduleId}/items (계획 선택 목록은 GET /schedules?size=100 중 ACTIVE/DRAFT)
 * - ?date=YYYY-MM-DD 로 진입하면 그 날짜/달을 연다 (계획 모달의 "캘린더에서 보기")
 */
function HomePage() {
  const [searchParams] = useSearchParams()
  const localToday = todayLocal()
  const initialDate = DATE_RE.test(searchParams.get('date') ?? '') ? searchParams.get('date') : null
  const [{ year, month }, setYm] = useState(() => {
    const base = initialDate ?? localToday
    return { year: Number(base.slice(0, 4)), month: Number(base.slice(5, 7)) }
  })
  // null = "오늘" (서버 기준 오늘이 도착하면 자동으로 그 날짜를 가리킴)
  const [selectedState, setSelectedDate] = useState(initialDate)
  const [modal, setModal] = useState(null) // { defaultDate }
  const [itemModal, setItemModal] = useState(null) // DailyItem
  const [serverError, setServerError] = useState(null)
  const [busy, setBusy] = useState(false)
  const { toast, show } = useToast()

  const calendar = useAsync(() => fetchCalendar(year, month), [year, month])
  const todayData = useAsync(() => fetchToday(), [])
  const schedules = useAsync(() => fetchSchedules({ size: 100 }), [])

  // 서버 기준 오늘(Asia/Seoul)을 우선, 도착 전에는 브라우저 날짜
  const today = todayData.data?.date ?? localToday
  const selectedDate = selectedState ?? today

  const { reload: reloadCalendar } = calendar
  const { reload: reloadToday } = todayData
  const reloadAll = useCallback(
    () => Promise.all([reloadCalendar(), reloadToday()]),
    [reloadCalendar, reloadToday],
  )
  const onStatusError = useCallback((msg) => show(msg, 'error'), [show])
  const { statusOf, change, pending, award, clearAward } = useItemStatus({
    onSuccess: reloadAll,
    onError: onStatusError,
  })

  // 선택한 날짜가 오늘이면 /schedule-items/today 응답을, 아니면 캘린더 응답에서 해당 날짜를 꺼내 쓴다.
  const isTodaySelected = selectedDate === today
  const panelData = useMemo(() => {
    if (isTodaySelected && todayData.data) return todayData.data
    const day = calendar.data?.days.find((d) => d.date === selectedDate)
    return {
      date: selectedDate,
      totalCount: day?.totalCount ?? 0,
      completedCount: day?.completedCount ?? 0,
      items: day?.items ?? [],
    }
  }, [isTodaySelected, selectedDate, todayData.data, calendar.data])

  // 할 일 모달에는 재조회된 최신 항목을 넘긴다 (열 때 캡처한 객체는 상태가 바뀌어도 갱신되지 않음)
  const liveItemModal = useMemo(() => {
    if (!itemModal) return null
    return panelData.items.find((it) => it.id === itemModal.id) ?? itemModal
  }, [itemModal, panelData.items])

  const addableSchedules = useMemo(
    () => (schedules.data?.items ?? []).filter((s) => ADDABLE_STATUSES.has(s.status)),
    [schedules.data],
  )
  // 선택한 날짜를 기간에 포함하는 계획을 앞에 둔다 (폼 기본 선택)
  const schedulesForForm = useMemo(() => {
    const d = modal?.defaultDate
    if (!d) return addableSchedules
    return [...addableSchedules].sort(
      (a, b) =>
        Number(isWithin(d, b.startDate, b.endDate)) - Number(isWithin(d, a.startDate, a.endDate)),
    )
  }, [addableSchedules, modal?.defaultDate])

  const handleCreate = async ({ scheduleId, body }) => {
    setBusy(true)
    setServerError(null)
    try {
      await createItem(scheduleId, body)
      setModal(null)
      show('할 일을 추가했어요.', 'success')
      reloadAll()
    } catch (e) {
      setServerError(e)
    } finally {
      setBusy(false)
    }
  }

  const openAdd = (date) => {
    setServerError(null)
    setModal({ defaultDate: date })
  }

  const goToday = () => {
    setYm({ year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) })
    setSelectedDate(null)
  }

  const cal = calendar.data
  const monthPct = cal?.totalCount ? Math.round((cal.completedCount / cal.totalCount) * 100) : 0

  return (
    <section className="home">
      <div className="home__main">
        <header className="home__head">
          <div>
            <h1 className="page-title">
              {year}년 {month}월
            </h1>
            <p className="page-sub">
              {cal && cal.totalCount > 0
                ? `이번 달 할 일 ${cal.totalCount}개 중 ${cal.completedCount}개 완료 (${monthPct}%)`
                : '일 단위로 계획을 확인하고 완료하세요.'}
            </p>
          </div>
          <div className="home__nav">
            <button type="button" className="btn" onClick={goToday}>
              오늘
            </button>
            <button
              type="button"
              className="btn btn--icon"
              onClick={() => setYm(shiftMonth(year, month, -1))}
              aria-label="이전 달"
            >
              ‹
            </button>
            <button
              type="button"
              className="btn btn--icon"
              onClick={() => setYm(shiftMonth(year, month, 1))}
              aria-label="다음 달"
            >
              ›
            </button>
          </div>
          <button type="button" className="btn btn--primary" onClick={() => openAdd(selectedDate)}>
            + 할 일 추가
          </button>
        </header>

        {calendar.error && <ErrorNotice error={calendar.error} onRetry={calendar.reload} compact />}

        <div className={`cal-wrap ${calendar.loading ? 'is-loading' : ''}`}>
          <MonthCalendar
            year={year}
            month={month}
            days={cal?.days}
            today={today}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onOpenItem={(it, date) => {
              setSelectedDate(date)
              setItemModal(it)
            }}
          />
        </div>
      </div>

      <div className="home__side">
        {todayData.error && isTodaySelected && (
          <ErrorNotice error={todayData.error} onRetry={todayData.reload} compact />
        )}
        <TodayPanel
          data={panelData}
          loading={isTodaySelected ? todayData.loading : calendar.loading}
          isToday={isTodaySelected}
          title={isTodaySelected ? '오늘 할 일' : '할 일'}
          statusOf={statusOf}
          pending={pending}
          onToggle={change}
          onOpen={setItemModal}
          onAdd={() => openAdd(selectedDate)}
        />
      </div>

      {modal && (
        <Modal title="할 일 추가" onClose={() => setModal(null)}>
          {schedules.error ? (
            <ErrorNotice error={schedules.error} onRetry={schedules.reload} compact />
          ) : schedules.loading && !schedules.data ? (
            <p className="muted">계획 목록을 불러오는 중…</p>
          ) : (
            <ScheduleItemForm
              schedules={schedulesForForm}
              defaultDate={modal.defaultDate}
              onSubmit={handleCreate}
              onCancel={() => setModal(null)}
              serverError={serverError}
              submitting={busy}
            />
          )}
        </Modal>
      )}

      {liveItemModal && (
        <ItemModal
          key={liveItemModal.id}
          item={liveItemModal}
          status={statusOf(liveItemModal)}
          onClose={() => setItemModal(null)}
          onChanged={reloadAll}
          onStatusChange={change}
        />
      )}

      {/* 퍼즐 조각 획득 효과 — puzzlePieceAwarded=true 일 때만 (7번 구현 전까지 서버는 false) */}
      <PieceAwardEffect award={award} onDone={clearAward} />
      <Toast toast={toast} />
    </section>
  )
}

export default HomePage
