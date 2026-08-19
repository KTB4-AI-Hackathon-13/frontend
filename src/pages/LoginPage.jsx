import { Link } from 'react-router-dom'

import AuthField from '../features/auth/AuthField.jsx'
import AuthShell from '../features/auth/AuthShell.jsx'

function LoginPage() {
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
      <form className="auth-form">
        <AuthField
          id="email"
          label="이메일"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
        />
        <AuthField
          id="password"
          label="비밀번호"
          type="password"
          placeholder="8자 이상 입력하세요"
          autoComplete="current-password"
        />
        <div className="auth-form__meta">
          <label className="auth-check">
            <input type="checkbox" />
            <span>로그인 상태 유지</span>
          </label>
          <button type="button">비밀번호 찾기</button>
        </div>
        <button className="auth-submit" type="button">
          로그인 <span aria-hidden="true">→</span>
        </button>
      </form>
      <p className="auth-switch">
        아직 계정이 없나요? <Link to="/signup">회원가입</Link>
      </p>
    </AuthShell>
  )
}

export default LoginPage
