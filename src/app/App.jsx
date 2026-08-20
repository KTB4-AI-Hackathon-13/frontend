import { Navigate, Route, Routes } from 'react-router-dom'

import AppLayout from './layouts/AppLayout.jsx'
import HomePage from '../pages/HomePage.jsx'
import SchedulesPage from '../pages/SchedulesPage.jsx'
import LoginPage from '../pages/LoginPage.jsx'
import SignupPage from '../pages/SignupPage.jsx'
import MyPage from '../pages/MyPage.jsx'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route element={<AppLayout />}>
        {/* 07 메인 대시보드: 월간 캘린더 + 오늘 할 일 체크 · 할 일 수정/삭제는 모달 (5·6번) */}
        <Route path="/" element={<HomePage />} />
        {/* 내 계획 목록 — 행 클릭 시 계획 모달(퍼즐 진행도·제목/기간 편집·삭제). 상세 페이지 없음 */}
        <Route path="/schedules" element={<SchedulesPage />} />
        <Route path="/schedules/:scheduleId" element={<Navigate to="/schedules" replace />} />
        {/* 다른 담당자 라우트 (AI 대화, 내 퍼즐, 갤러리, 랭킹, 설정)는 여기에 추가 */}
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/mypage" element={<MyPage />} />
      </Route>
    </Routes>
  )
}

export default App
