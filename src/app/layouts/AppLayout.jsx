import { Link, Outlet } from 'react-router-dom'

function AppLayout() {
  return (
    <div className="layout">
      <header className="site-header">
        <Link className="site-header__brand" to="/" aria-label="MY ALTER EGO 홈">
          MY ALTER EGO
        </Link>
        <nav className="site-header__nav" aria-label="주요 메뉴">
          <a href="#experience">EXPERIENCE</a>
          <a href="#process">HOW IT WORKS</a>
        </nav>
        <div className="site-header__actions">
          <Link className="text-link" to="/login">
            로그인
          </Link>
          <Link className="header-cta" to="/signup">
            시작하기
          </Link>
        </div>
      </header>
      <main className="layout__main">
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout
