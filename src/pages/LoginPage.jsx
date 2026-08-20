import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import AuthField from '../features/auth/AuthField.jsx'
import AuthShell from '../features/auth/AuthShell.jsx'
import { useAuth } from '../features/auth/useAuth.js'
import { login, startKakaoLogin } from '../features/auth/authApi.js'
import Toast from '../features/schedule/components/Toast.jsx'
import { useToast } from '../features/schedule/hooks/useToast.js'

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { refreshUser } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(() =>
    location.state?.oauthError ? '카카오 로그인에 실패했습니다. 다시 시도해주세요.' : '',
  )
  const [submitting, setSubmitting] = useState(false)
  const [oauthStarting, setOauthStarting] = useState(false)
  const { toast, show: showToast } = useToast(3000)

  useEffect(() => {
    if (location.state?.oauthError) {
      navigate(`${location.pathname}${location.search}`, {
        replace: true,
        state: { ...location.state, oauthError: false },
      })
      return
    }

    if (!location.state?.loggedOut) return

    showToast('로그아웃되었습니다.', 'success')
    navigate(`${location.pathname}${location.search}`, {
      replace: true,
      state: { ...location.state, loggedOut: false },
    })
  }, [location.pathname, location.search, location.state, navigate, showToast])

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

  const handleKakaoLogin = () => {
    setError('')
    setOauthStarting(true)
    startKakaoLogin()
  }

  return (
    <AuthShell
      eyebrow="WELCOME BACK"
      title={
        <>
          TURN YOUR PLAN
          <br />
          INTO ACTION.
        </>
      }
      description="오늘의 계획을 이어가세요."
    >
      <div className="auth-glass__heading">
        <span>로그인</span>
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
        <AuthField
          id="email"
          label="이메일"
          type="email"
          placeholder="가입한 이메일을 입력하세요"
          autoComplete="email"
          value={form.email}
          onChange={update}
        />
        <AuthField
          id="password"
          label="비밀번호"
          type="password"
          placeholder="비밀번호를 입력하세요"
          autoComplete="current-password"
          value={form.password}
          onChange={update}
        />
        {error && <p className="auth-form__error" role="alert">{error}</p>}
        <button className="auth-submit" type="submit" disabled={submitting}>
          {submitting ? '로그인 중...' : '로그인하고 계속하기'} <span aria-hidden="true">→</span>
        </button>
      </form>
      <div className="auth-divider" aria-hidden="true">
        <span>또는</span>
      </div>
      <button
        className="auth-kakao"
        type="button"
        disabled={oauthStarting || submitting}
        onClick={handleKakaoLogin}
      >
        {oauthStarting ? '카카오로 이동 중...' : '카카오로 계속하기'}
        <span aria-hidden="true">→</span>
      </button>
      <p className="auth-switch">
        JustDO가 처음인가요? <Link to="/signup">계정 만들기</Link>
      </p>
      <Toast toast={toast} />
    </AuthShell>
  )
}

export default LoginPage
