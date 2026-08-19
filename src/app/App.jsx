import { Navigate, Route, Routes } from 'react-router-dom'

import AppLayout from './layouts/AppLayout.jsx'
import HomePage from '../pages/HomePage.jsx'
import ScheduleDetailPage from '../pages/ScheduleDetailPage.jsx'
import SchedulesPage from '../pages/SchedulesPage.jsx'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* 07 메인 대시보드: 월간 캘린더 + 오늘 할 일 (5번 /calendar, /schedule-items/today) */}
        <Route path="/" element={<HomePage />} />
        {/* 내 계획 목록 / 06 계획 검토·수정 (5·6번) */}
        <Route path="/schedules" element={<SchedulesPage />} />
        <Route path="/schedules/:scheduleId" element={<ScheduleDetailPage />} />
        {/* 다른 담당자 라우트 (AI 대화, 내 퍼즐, 갤러리, 랭킹, 설정)는 여기에 추가 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
