import { Link } from 'react-router-dom'

function AuthShell({ children, eyebrow, title, description }) {
  return (
    <main className="auth-page">
      <div className="auth-page__glow auth-page__glow--one" />
      <div className="auth-page__glow auth-page__glow--two" />

      <header className="auth-header">
        <Link to="/" aria-label="JustDO 홈">
          JUSTDO
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
    </main>
  )
}

export default AuthShell
