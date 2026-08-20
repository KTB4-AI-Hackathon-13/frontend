import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'

import { useAuth } from '../../features/auth/useAuth.js'
import { AUTH_EVENT_UNAUTHORIZED, authEvents } from '../../shared/api/client.js'
import Sidebar from './Sidebar.jsx'

function AppLayout() {
  const navigate = useNavigate()
  const { user, isLoadingUser, refreshUser, clearUser } = useAuth()
  const initializedUserRef = useRef(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // 세션 없음/만료(401 AUTHENTICATION_REQUIRED)면 로그인 화면으로. client.js 인터셉터가 authEvents 로 알려준다.
  useEffect(() => {
    const on = () => {
      clearUser()
      navigate('/login', { replace: true })
    }
    authEvents.addEventListener(AUTH_EVENT_UNAUTHORIZED, on)
    return () => authEvents.removeEventListener(AUTH_EVENT_UNAUTHORIZED, on)
  }, [clearUser, navigate])

  useEffect(() => {
    if (initializedUserRef.current) return
    initializedUserRef.current = true
    refreshUser().catch(() => { })
  }, [refreshUser, user])

  return (
    <div className="shell">
      <header className="app-header">
        <button
          type="button"
          className="app-header__menu"
          aria-label={isSidebarOpen ? '사이드바 닫기' : '사이드바 열기'}
          aria-expanded={isSidebarOpen}
          aria-controls="app-sidebar"
          onClick={() => setIsSidebarOpen((open) => !open)}
        >
          <span /><span /><span />
        </button>
        <NavLink to="/" className="sidebar__brand" aria-label="AI Planner 홈">
          {/* <span className="sidebar__brand-mark" aria-hidden="true"><span /></span> */}
          <span className="sidebar__brand-copy"><strong>AI Planner</strong></span>
        </NavLink>
      </header>
      <div className={`shell__body ${isSidebarOpen ? 'has-sidebar' : ''}`}>
        <Sidebar isOpen={isSidebarOpen} user={user} isLoadingUser={isLoadingUser} />
        {isSidebarOpen && (
          <button
            type="button"
            className="sidebar-backdrop"
            aria-label="사이드바 닫기"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        <main className="shell__main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppLayout
