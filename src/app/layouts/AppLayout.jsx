import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'

import { logout } from '../../features/auth/authApi.js'
import { AUTH_EVENT_UNAUTHORIZED, authEvents } from '../../shared/api/client.js'

/** 와이어프레임 공통 왼쪽 사이드바. 구현되지 않은 메뉴는 비활성 (다른 담당자 영역). */
const NAV = [
  { to: '/', label: '홈', end: true },
  { to: '/ai', label: 'AI 계획 만들기', disabled: true },
  { to: '/schedules', label: '내 계획' },
  { to: '/puzzles', label: '내 퍼즐', disabled: true },
  { to: '/gallery', label: '퍼즐 갤러리', disabled: true },
  { to: '/rankings', label: '랭킹', disabled: true },
  { to: '/settings', label: '설정', disabled: true },
]

function AppLayout() {
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)

  // 세션 없음/만료(401 AUTHENTICATION_REQUIRED)면 로그인 화면으로. client.js 인터셉터가 authEvents 로 알려준다.
  useEffect(() => {
    const on = () => navigate('/login', { replace: true })
    authEvents.addEventListener(AUTH_EVENT_UNAUTHORIZED, on)
    return () => authEvents.removeEventListener(AUTH_EVENT_UNAUTHORIZED, on)
  }, [navigate])

  const handleLogout = async () => {
    if (loggingOut) return
    setLoggingOut(true)
    try {
      await logout()
      navigate('/login', { replace: true })
    } catch (error) {
      window.alert(error.message || '로그아웃에 실패했습니다.')
      setLoggingOut(false)
    }
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <NavLink to="/" className="sidebar__brand">
          AI Planner
        </NavLink>
        <nav className="sidebar__nav">
          {NAV.map((n) =>
            n.disabled ? (
              <span key={n.to} className="sidebar__link is-disabled" title="준비 중">
                {n.label}
              </span>
            ) : (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) => `sidebar__link ${isActive ? 'is-active' : ''}`}
              >
                {n.label}
              </NavLink>
            ),
          )}
        </nav>
        <button
          type="button"
          className="sidebar__logout"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          <span aria-hidden="true">↗</span>
          {loggingOut ? '로그아웃 중...' : '로그아웃'}
        </button>
      </aside>
      <main className="shell__main">
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout
