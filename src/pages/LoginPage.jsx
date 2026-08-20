import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import AuthField from '../features/auth/AuthField.jsx'
import AuthShell from '../features/auth/AuthShell.jsx'
import { useAuth } from '../features/auth/useAuth.js'
import { login } from '../features/auth/authApi.js'

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { refreshUser } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const update = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(form)
      await refreshUser()
      navigate('/', { replace: true })
    } catch (requestError) {
      setError(requestError.message || '로그인에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      eyebrow="WELCOME BACK"
      title={
        <>
          WELCOME BACK.
          <br />
          KEEP BECOMING.
        </>
      }
      description="계속 성장하고 있는 또 다른 나를 만나보세요."
    >
      <div className="auth-glass__heading">
        <span>SIGN IN</span>
        <strong>01</strong>
      </div>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {location.state?.signedUp && (
          <p className="auth-form__success" role="status">계정이 만들어졌어요. 로그인해주세요.</p>
        )}
        {location.state?.passwordChanged && (
          <p className="auth-form__success" role="status">비밀번호가 변경되었습니다. 다시 로그인해주세요.</p>
        )}
        {location.state?.withdrawn && (
          <p className="auth-form__success" role="status">회원 탈퇴가 처리되었습니다.</p>
        )}
        {location.state?.loggedOut && (
          <p className="auth-form__success" role="status">안전하게 로그아웃되었습니다.</p>
        )}
        <AuthField
          id="email"
          label="이메일"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          value={form.email}
          onChange={update}
        />
        <AuthField
          id="password"
          label="비밀번호"
          type="password"
          placeholder="8자 이상 입력하세요"
          autoComplete="current-password"
          value={form.password}
          onChange={update}
        />
        {error && <p className="auth-form__error" role="alert">{error}</p>}
        <button className="auth-submit" type="submit" disabled={submitting}>
          {submitting ? '로그인 중...' : '로그인'} <span aria-hidden="true">→</span>
        </button>
      </form>
      <p className="auth-switch">
        아직 계정이 없나요? <Link to="/signup">회원가입</Link>
      </p>
    </AuthShell>
  )
}

export default LoginPage
