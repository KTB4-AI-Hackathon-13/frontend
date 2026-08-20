import { useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'

import { AUTH_EVENT_UNAUTHORIZED, authEvents } from '../../shared/api/client.js'

/** 와이어프레임 공통 왼쪽 사이드바. 구현되지 않은 메뉴는 비활성 (다른 담당자 영역). */
const NAV = [
  { to: '/', label: '홈', end: true },
  { to: '/ai', label: 'AI 계획 만들기' },
  { to: '/schedules', label: '내 계획' },
  { to: '/puzzles', label: '내 퍼즐'},
  { to: '/gallery', label: '퍼즐 갤러리' },
  { to: '/rankings', label: '랭킹' },
  { to: '/settings', label: '설정'},
]

function NavIcon({ name }) {
  const paths = {
    calendar: <><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" /><path d="M7.5 3v4M16.5 3v4M3.5 9.5h17" /></>,
    spark: <><path d="m12 3 1.2 4.1L17 9l-3.8 1.9L12 15l-1.2-4.1L7 9l3.8-1.9L12 3Z" /><path d="m18.5 14 .7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7.7-2.3Z" /></>,
    list: <><rect x="4" y="4" width="16" height="16" rx="2.5" /><path d="M8 9h8M8 13h8M8 17h5" /></>,
    puzzle: <path d="M8.5 4H4v5a2.5 2.5 0 1 1 0 5v6h6a2.5 2.5 0 1 0 5 0h5v-6a2.5 2.5 0 1 0 0-5V4h-5.5a3 3 0 1 1-6 0Z" />,
    gallery: <><rect x="3.5" y="4" width="17" height="16" rx="2.5" /><circle cx="9" cy="9" r="1.5" /><path d="m5.5 18 4.2-4.5 3 3 2.4-2.5 3.4 4" /></>,
    ranking: <><path d="M5 20v-5h4v5M10 20V9h4v11M15 20V4h4v16" /><path d="M3 20h18" /></>,
  }
  return <svg className="sidebar__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">{paths[name]}</svg>
}

function AppLayout() {
  const navigate = useNavigate()

  // 세션 없음/만료(401 AUTHENTICATION_REQUIRED)면 로그인 화면으로. client.js 인터셉터가 authEvents 로 알려준다.
  useEffect(() => {
    const on = () => navigate('/login', { replace: true })
    authEvents.addEventListener(AUTH_EVENT_UNAUTHORIZED, on)
    return () => authEvents.removeEventListener(AUTH_EVENT_UNAUTHORIZED, on)
  }, [navigate])

  return (
    <div className="shell">
      <aside className="sidebar">
        <NavLink to="/" className="sidebar__brand" aria-label="AI Planner 홈">
          <span className="sidebar__brand-mark" aria-hidden="true"><span /></span>
          <span className="sidebar__brand-copy"><strong>AI Planner</strong><small>Plan your better day</small></span>
        </NavLink>
        <nav className="sidebar__nav">
          <span className="sidebar__nav-label">PLANNER</span>
          {NAV.map((n) =>
            n.disabled ? (
              <span key={n.to} className="sidebar__link is-disabled" title="준비 중">
                <NavIcon name={n.icon} />
                <span>{n.label}</span>
                <small>준비 중</small>
              </span>
            ) : (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) => `sidebar__link ${isActive ? 'is-active' : ''}`}
              >
                <NavIcon name={n.icon} />
                <span>{n.label}</span>
              </NavLink>
            ),
          )}
        </nav>
        <NavLink
          to="/switch-user"
          className={({ isActive }) => `sidebar__user ${isActive ? 'is-active' : ''}`}
          aria-label="사용자 변경"
        >
          <span className="sidebar__avatar" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="3.25" />
              <path d="M5.5 19c.65-3.2 3.1-5 6.5-5s5.85 1.8 6.5 5" />
            </svg>
          </span>
          <span className="sidebar__user-copy">
            <strong>내 정보</strong>
            <small>프로필 및 계정 관리</small>
          </span>
          <span className="sidebar__user-arrow" aria-hidden="true">›</span>
        </NavLink>
      </aside>
      <main className="shell__main">
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout
