import { NavLink } from 'react-router-dom'

const NAV = [
  { to: '/', label: '홈', icon: 'home', end: true },
  { to: '/conversations', label: 'AI 계획 만들기', icon: 'spark' },
  { to: '/schedules', label: '내 계획', icon: 'list' },
  { to: '/puzzles', label: '내 퍼즐', icon: 'puzzle' },
  { to: '/rankings', label: '랭킹', icon: 'ranking' },
]

function NavIcon({ name }) {
  const paths = {
    home: <><path d="M3.5 10.5 12 3l8.5 7.5" /><path d="M5.5 9v11h13V9M9.5 20v-6h5v6" /></>,
    spark: <><path d="m12 3 1.2 4.1L17 9l-3.8 1.9L12 15l-1.2-4.1L7 9l3.8-1.9L12 3Z" /><path d="m18.5 14 .7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7.7-2.3Z" /></>,
    list: <><rect x="4" y="4" width="16" height="16" rx="2.5" /><path d="M8 9h8M8 13h8M8 17h5" /></>,
    puzzle: <path d="M8.5 4H4v5a2.5 2.5 0 1 1 0 5v6h6a2.5 2.5 0 1 0 5 0h5v-6a2.5 2.5 0 1 0 0-5V4h-5.5a3 3 0 1 1-6 0Z" />,
    ranking: <><path d="M5 20v-5h4v5M10 20V9h4v11M15 20V4h4v16" /><path d="M3 20h18" /></>,
  }

  return <svg className="header-nav__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">{paths[name]}</svg>
}

function HeaderNav({ user, isLoadingUser }) {
  const userName = user?.nickname || (isLoadingUser ? '불러오는 중…' : '내 정보')

  return (
    <>
      <nav className="header-nav" aria-label="주요 메뉴">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `header-nav__link ${isActive ? 'is-active' : ''}`}
          >
            <NavIcon name={item.icon} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <NavLink
        to="/switch-user"
        className={({ isActive }) => `header-user ${isActive ? 'is-active' : ''}`}
        aria-label={`${userName}, 프로필 및 계정 관리`}
        title={userName}
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="8" r="3.25" />
          <path d="M5.5 19c.65-3.2 3.1-5 6.5-5s5.85 1.8 6.5 5" />
        </svg>
      </NavLink>
    </>
  )
}

export default HeaderNav
