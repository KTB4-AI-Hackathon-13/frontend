import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import {
  createItem,
  fetchCalendar,
  fetchSchedules,
  fetchToday,
} from '../features/schedule/api/scheduleApi.js'
import ItemModal from '../features/schedule/components/ItemModal.jsx'
import Modal from '../features/schedule/components/Modal.jsx'
import MonthCalendar from '../features/schedule/components/MonthCalendar.jsx'
import MonthPicker from '../features/schedule/components/MonthPicker.jsx'
import PieceAwardEffect from '../features/schedule/components/PieceAwardEffect.jsx'
import ScheduleItemForm from '../features/schedule/components/ScheduleItemForm.jsx'
import Toast from '../features/schedule/components/Toast.jsx'
import TodayPanel from '../features/schedule/components/TodayPanel.jsx'
import { useAsync } from '../features/schedule/hooks/useAsync.js'
import { useCalendarNav } from '../features/schedule/hooks/useCalendarNav.js'
import {
  CALENDAR_SHORTCUT_HELP,
  useCalendarShortcuts,
} from '../features/schedule/hooks/useCalendarShortcuts.js'
import { useItemStatus } from '../features/schedule/hooks/useItemStatus.js'
import { useToast } from '../features/schedule/hooks/useToast.js'
import { SCHEDULE_STATUS } from '../features/schedule/utils/constants.js'
import { isWithin, todayLocal } from '../features/schedule/utils/date.js'
import ErrorNotice from '../shared/components/ErrorNotice.jsx'

/** 할 일을 추가할 수 있는 계획 상태 (검토 중인 AI 초안에도 추가 가능) */
const ADDABLE_STATUSES = new Set([SCHEDULE_STATUS.ACTIVE, SCHEDULE_STATUS.DRAFT])

/** 트랙패드 가로 스와이프(휠 deltaX)로 월 이동할 때의 임계값/쿨다운 */
const SWIPE_THRESHOLD = 40
const SWIPE_COOLDOWN_MS = 650

/**
 * 메인 대시보드 (와이어프레임 07) — 할 일과 관련된 모든 조작은 이 화면 + 모달에서 끝난다.
 * - 왼쪽 월간 캘린더 : GET /calendar?year&month (월 이동 때마다). 칩 클릭 → 그 날짜 선택 + 할 일 모달
 * - 오른쪽 할 일 패널 : GET /schedule-items/today (서버 기준 오늘, Asia/Seoul). 다른 날짜 클릭 시 캘린더 응답의 그 날짜
 *                      패널은 "나열 + 완료 체크"만, 행 클릭 → 할 일 모달(수정·상태·삭제)
 * - 체크박스         : PATCH /schedule-items/{id}/status (낙관적 업데이트 → 성공 시 캘린더+오늘 재조회)
 * - + 할 일 추가     : 계획 소속 작업은 POST /schedules/{scheduleId}/items, 개인 일정은
 *                      POST /schedule-items (계획 목록은 GET /schedules?size=100 중 ACTIVE/DRAFT)
 *
 * 월 이동 수단 (useCalendarNav — 상태는 URL ?month=&date= 에 있어 뒤로가기/공유가 됨):
 *   ‹ › 월 · « » 해 · 오늘 · 제목 클릭 → 월/연도 피커 · "날짜로 이동" 입력 · 키보드(←→ PgUp/PgDn P/N T, Shift+←→ 해)
 *   · 캘린더 위 트랙패드 가로 스와이프
 */
function HomePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const localToday = todayLocal()
  const todayData = useAsync(() => fetchToday(), [])
  // 서버 기준 오늘(Asia/Seoul)을 우선, 도착 전에는 브라우저 날짜
  const today = todayData.data?.date ?? localToday
  const nav = useCalendarNav({ today })
  const { year, month, selectedDate } = nav

  const [modal, setModal] = useState(null) // { defaultDate }
  const [itemModal, setItemModal] = useState(null) // DailyItem
  const [pickerOpen, setPickerOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [serverError, setServerError] = useState(null)
  const [busy, setBusy] = useState(false)
  const { toast, show } = useToast()

  useEffect(() => {
    const routedToast = location.state?.toast
    if (!routedToast?.message) return
    show(routedToast.message, routedToast.tone)
    navigate(`${location.pathname}${location.search}`, { replace: true, state: null })
  }, [location.pathname, location.search, location.state, navigate, show])

  const calendar = useAsync(() => fetchCalendar(year, month), [year, month])
  const schedules = useAsync(() => fetchSchedules({ size: 100 }), [])

  // 키보드 단축키 — 모달/피커가 열려 있으면 끔
  useCalendarShortcuts({
    enabled: !modal && !itemModal && !pickerOpen,
    onMonth: nav.goMonth,
    onYear: nav.goYear,
    onToday: nav.goToday,
  })

  // 캘린더 위에서 트랙패드 가로 스와이프(또는 Shift+휠) → 월 이동. 세로 스크롤과 헷갈리지 않게 가로 성분이 우세할 때만
  const lastSwipe = useRef(0)
  const onCalendarWheel = (e) => {
    const dx = e.shiftKey && e.deltaX === 0 ? e.deltaY : e.deltaX
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(e.deltaY) * 1.5) return
    const now = Date.now()
    if (now - lastSwipe.current < SWIPE_COOLDOWN_MS) return
    lastSwipe.current = now
    nav.goMonth(dx > 0 ? 1 : -1)
  }
  const closePicker = useCallback(() => setPickerOpen(false), [])

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

  const cal = calendar.data
  const monthPct = cal?.totalCount ? Math.round((cal.completedCount / cal.totalCount) * 100) : 0

  return (
    <section className="home">
      <div className="home__main">
        <header className="home__head">
          <div className="home__title">
            <div className="home__month">
              <button
                type="button"
                className="home__month-btn"
                onClick={() => setPickerOpen((o) => !o)}
                aria-haspopup="dialog"
                aria-expanded={pickerOpen}
                title="눌러서 월/연도 선택"
              >
                <h1 className="page-title">
                  {year}년 {month}월
                </h1>
                <span className="home__month-caret" aria-hidden="true">
                  ▾
                </span>
              </button>
              {pickerOpen && (
                <MonthPicker
                  year={year}
                  month={month}
                  today={today}
                  onPick={(y, m) => {
                    nav.goTo(y, m)
                    setPickerOpen(false)
                  }}
                  onClose={closePicker}
                />
              )}
            </div>
            <p className="page-sub">
              {cal && cal.totalCount > 0
                ? `이번 달 할 일 ${cal.totalCount}개 중 ${cal.completedCount}개 완료 (${monthPct}%)`
                : '일 단위로 계획을 확인하고 완료하세요.'}
            </p>
          </div>

          <div className="home__nav" role="group" aria-label="달 이동">
            <button
              type="button"
              className="btn btn--icon"
              onClick={() => nav.goYear(-1)}
              aria-label="이전 해"
              title="이전 해 (Shift+←)"
            >
              «
            </button>
            <button
              type="button"
              className="btn btn--icon"
              onClick={() => nav.goMonth(-1)}
              aria-label="이전 달"
              title="이전 달 (←)"
            >
              ‹
            </button>
            <button type="button" className="btn" onClick={nav.goToday} title="오늘 (T)">
              오늘
            </button>
            <button
              type="button"
              className="btn btn--icon"
              onClick={() => nav.goMonth(1)}
              aria-label="다음 달"
              title="다음 달 (→)"
            >
              ›
            </button>
            <button
              type="button"
              className="btn btn--icon"
              onClick={() => nav.goYear(1)}
              aria-label="다음 해"
              title="다음 해 (Shift+→)"
            >
              »
            </button>
            <label className="home__jump" title="날짜를 고르면 그 달로 이동하고 선택해요">
              <span className="muted small">날짜로 이동</span>
              <input
                type="date"
                className="input input--sm"
                value={selectedDate}
                onChange={(e) => nav.jumpToDate(e.target.value)}
                aria-label="날짜로 이동"
              />
            </label>
            <div className="home__help">
              <button
                type="button"
                className="btn btn--icon"
                onClick={() => setHelpOpen((o) => !o)}
                aria-label="키보드 단축키 안내"
                aria-expanded={helpOpen}
                title="키보드 단축키"
              >
                ⌨
              </button>
              {helpOpen && (
                <div className="shortcut-help" role="dialog" aria-label="키보드 단축키">
                  <strong className="small">키보드 단축키</strong>
                  <ul>
                    {CALENDAR_SHORTCUT_HELP.map((h) => (
                      <li key={h}>{h}</li>
                    ))}
                    <li>캘린더 위에서 트랙패드 좌우 스와이프 : 이전·다음 달</li>
                  </ul>
                  <button type="button" className="btn btn--sm" onClick={() => setHelpOpen(false)}>
                    닫기
                  </button>
                </div>
              )}
            </div>
          </div>

          <button type="button" className="btn btn--primary" onClick={() => openAdd(selectedDate)}>
            + 할 일 추가
          </button>
        </header>

        {calendar.error && <ErrorNotice error={calendar.error} onRetry={calendar.reload} compact />}

        <div
          className={`cal-wrap ${calendar.loading ? 'is-loading' : ''}`}
          onWheel={onCalendarWheel}
        >
          <MonthCalendar
            year={year}
            month={month}
            days={cal?.days}
            today={today}
            selectedDate={selectedDate}
            onSelectDate={nav.selectDate}
            onOpenItem={(it, date) => {
              nav.selectDate(date)
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
          {schedules.error && (
            <ErrorNotice error={schedules.error} onRetry={schedules.reload} compact />
          )}
          {schedules.loading && !schedules.data && (
            <p className="muted">계획 목록을 불러오는 중…</p>
          )}
          <ScheduleItemForm
            schedules={schedulesForForm}
            defaultDate={modal.defaultDate}
            onSubmit={handleCreate}
            onCancel={() => setModal(null)}
            serverError={serverError}
            submitting={busy}
          />
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

      {/* 퍼즐 조각 획득 효과 — 계획 소속 작업의 puzzlePieceAwarded=true 일 때만 */}
      <PieceAwardEffect award={award} onDone={clearAward} />
      <Toast toast={toast} />
    </section>
  )
}

export default HomePage
