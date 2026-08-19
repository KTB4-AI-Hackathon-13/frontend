import { Route, Routes } from 'react-router-dom'

import AppLayout from './layouts/AppLayout.jsx'
import HomePage from '../pages/HomePage.jsx'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        {/* 페이지 라우트를 여기에 추가한다 */}
      </Route>
    </Routes>
  )
}

export default App
