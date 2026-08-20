import { NavLink } from 'react-router-dom'

const NAV = [
  { to: '/', label: '홈', icon: 'calendar', end: true },
  { to: '/conversations', label: 'AI 계획 만들기', icon: 'spark' },
  { to: '/schedules', label: '내 계획', icon: 'list' },
  { to: '/puzzles', label: '내 퍼즐', icon: 'puzzle' },
  { to: '/rankings', label: '랭킹', icon: 'ranking' },
]

function NavIcon({ name }) {
  const paths = {
    calendar: <><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" /><path d="M7.5 3v4M16.5 3v4M3.5 9.5h17" /></>,
    spark: <><path d="m12 3 1.2 4.1L17 9l-3.8 1.9L12 15l-1.2-4.1L7 9l3.8-1.9L12 3Z" /><path d="m18.5 14 .7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7.7-2.3Z" /></>,
    list: <><rect x="4" y="4" width="16" height="16" rx="2.5" /><path d="M8 9h8M8 13h8M8 17h5" /></>,
    puzzle: <path d="M8.5 4H4v5a2.5 2.5 0 1 1 0 5v6h6a2.5 2.5 0 1 0 5 0h5v-6a2.5 2.5 0 1 0 0-5V4h-5.5a3 3 0 1 1-6 0Z" />,
    ranking: <><path d="M5 20v-5h4v5M10 20V9h4v11M15 20V4h4v16" /><path d="M3 20h18" /></>,
  }
  return <svg className="sidebar__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">{paths[name]}</svg>
}

function Sidebar({ isOpen, user, isLoadingUser }) {
  return (
    <aside id="app-sidebar" className={`sidebar ${isOpen ? 'is-open' : 'is-closed'}`}>
      <nav className="sidebar__nav">
        <span className="sidebar__nav-label">JUSTDO</span>
        {NAV.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `sidebar__link ${isActive ? 'is-active' : ''}`}>
            <NavIcon name={item.icon} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <NavLink to="/switch-user" className={({ isActive }) => `sidebar__user ${isActive ? 'is-active' : ''}`} aria-label="프로필 및 계정 관리">
        <span className="sidebar__avatar" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.25" /><path d="M5.5 19c.65-3.2 3.1-5 6.5-5s5.85 1.8 6.5 5" /></svg>
        </span>
        <span className="sidebar__user-copy">
          <strong>{user?.nickname || (isLoadingUser ? '불러오는 중…' : '내 정보')}</strong>
          <small>프로필 및 계정 관리</small>
        </span>
        <span className="sidebar__user-arrow" aria-hidden="true">›</span>
      </NavLink>
    </aside>
  )
}

export default Sidebar
