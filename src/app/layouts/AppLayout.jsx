import { NavLink, Outlet } from 'react-router-dom'

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
      </aside>
      <main className="shell__main">
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout