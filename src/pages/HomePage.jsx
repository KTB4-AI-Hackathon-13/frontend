import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  changeItemStatus,
  createItem,
  fetchCalendar,
  fetchSchedules,
  fetchToday,
  getToday,
} from '../features/schedule/api/scheduleApi.js'
import Modal from '../features/schedule/components/Modal.jsx'
import MonthCalendar from '../features/schedule/components/MonthCalendar.jsx'
import ScheduleItemForm from '../features/schedule/components/ScheduleItemForm.jsx'
import Toast from '../features/schedule/components/Toast.jsx'
import TodayPanel from '../features/schedule/components/TodayPanel.jsx'
import { useAsync } from '../features/schedule/hooks/useAsync.js'
import { useToast } from '../features/schedule/hooks/useToast.js'
import { SCHEDULE_STATUS } from '../features/schedule/utils/constants.js'
import { shiftMonth } from '../features/schedule/utils/date.js'

/**
 * 와이어프레임 07 · 메인 대시보드
 * - 왼쪽: 월간 캘린더 (GET /calendar?year&month)
 * - 오른쪽: 오늘 할 일 (GET /schedule-items/today) — 다른 날짜를 클릭하면 그 날의 할 일로 전환
 * - + 할 일 추가 (POST /schedules/{scheduleId}/items)
 */
function HomePage() {
  const navigate = useNavigate()
  const today = getToday()
  const [{ year, month }, setYm] = useState({
    year: Number(today.slice(0, 4)),
    month: Number(today.slice(5, 7)),
  })
  const [selectedDate, setSelectedDate] = useState(today)
  const [modal, setModal] = useState(null) // { defaultDate }
  const [serverError, setServerError] = useState(null)
  const { toast, show } = useToast()

  const calendar = useAsync(() => fetchCalendar(year, month), [year, month])
  const todayData = useAsync(() => fetchToday(), [])
  const schedules = useAsync(() => fetchSchedules({ status: SCHEDULE_STATUS.ACTIVE }), [])

  useEffect(() => {
    if (calendar.error) show(calendar.error.message, 'error')
  }, [calendar.error, show])

  // 선택한 날짜가 오늘이면 /schedule-items/today 응답을, 아니면 캘린더 응답에서 해당 날짜를 꺼내 쓴다.
  const panelData = useMemo(() => {
    if (selectedDate === today) return todayData.data
    const day = calendar.data?.days.find((d) => d.date === selectedDate)
    return {
      date: selectedDate,
      totalCount: day?.totalCount ?? 0,
      completedCount: day?.completedCount ?? 0,
      items: day?.items ?? [],
    }
  }, [selectedDate, today, todayData.data, calendar.data])

  const reloadAll = useCallback(() => {
    calendar.reload()
    todayData.reload()
  }, [calendar, todayData])

  const handleToggle = async (item, status) => {
    try {
      const res = await changeItemStatus(item.id, status)
      if (res.puzzlePieceAwarded) show('🧩 퍼즐 조각 1개를 획득했어요!', 'success')
      reloadAll()
    } catch (e) {
      show(e.message, 'error')
    }
  }

  const handleCreate = async (body) => {
    try {
      await createItem(body.scheduleId, body)
      setServerError(null)
      setModal(null)
      show('할 일을 추가했어요.')
      reloadAll()
    } catch (e) {
      setServerError(e.message)
    }
  }

  const openAdd = (date) => {
    setServerError(null)
    setModal({ defaultDate: date })
  }

  const goToday = () => {
    setYm({ year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) })
    setSelectedDate(today)
  }

  return (
    <section className="home">
      <div className="home__main">
        <header className="home__head">
          <div>
            <h1 className="page-title">
              {year}년 {month}월
            </h1>
            <p className="page-sub">일 단위로 계획을 확인하고 완료하세요.</p>
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

        <MonthCalendar
          year={year}
          month={month}
          days={calendar.data?.days}
          today={today}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onOpenItem={(it) => navigate(`/schedules/${it.scheduleId}`)}
        />
      </div>

      <TodayPanel
        data={panelData}
        loading={selectedDate === today ? todayData.loading : calendar.loading}
        isToday={selectedDate === today}
        title={selectedDate === today ? '오늘 할 일' : '할 일'}
        onToggle={handleToggle}
        onAdd={() => openAdd(selectedDate)}
      />

      {modal && (
        <Modal title="할 일 추가" onClose={() => setModal(null)}>
          <ScheduleItemForm
            schedules={schedules.data?.items ?? []}
            defaultDate={modal.defaultDate}
            onSubmit={handleCreate}
            onCancel={() => setModal(null)}
            serverError={serverError}
          />
        </Modal>
      )}

      <Toast toast={toast} />
    </section>
  )
}

export default HomePage
