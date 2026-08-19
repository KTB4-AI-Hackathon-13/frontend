import { Route, Routes } from 'react-router-dom'

import AppLayout from './layouts/AppLayout.jsx'
import HomePage from '../pages/HomePage.jsx'
import LoginPage from '../pages/LoginPage.jsx'
import SignupPage from '../pages/SignupPage.jsx'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
      </Route>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
    </Routes>
  )
}

export default App
