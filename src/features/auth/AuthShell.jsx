import { Link } from 'react-router-dom'

function AuthShell({ children, eyebrow, title, description }) {
  return (
    <main className="auth-page">
      <div className="auth-page__glow auth-page__glow--one" />
      <div className="auth-page__glow auth-page__glow--two" />

      <header className="auth-header">
        <Link to="/" aria-label="MY ALTER EGO 홈">
          MY ALTER EGO
        </Link>
        <Link to="/" className="auth-header__close" aria-label="랜딩 페이지로 돌아가기">
          <span />
          <span />
        </Link>
      </header>

      <section className="auth-stage" aria-labelledby="auth-title">
        <div className="auth-stage__intro">
          <p>{eyebrow}</p>
          <h1 id="auth-title">{title}</h1>
          <span>{description}</span>
        </div>
        <div className="auth-glass">{children}</div>
      </section>

      <footer className="auth-footer">
        <span>01 — IDENTITY ACCESS</span>
        <span>SECURE SESSION · ASIA/SEOUL</span>
      </footer>
    </main>
  )
}

export default AuthShell
