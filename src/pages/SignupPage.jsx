import { Link } from 'react-router-dom'

import AuthField from '../features/auth/AuthField.jsx'
import AuthShell from '../features/auth/AuthShell.jsx'

function SignupPage() {
  return (
    <AuthShell
      eyebrow="CREATE YOUR IDENTITY"
      title={
        <>
          CREATE YOUR
          <br />
          ALTER EGO.
        </>
      }
      description="목표를 실천으로 바꾸는 첫 번째 계정을 만드세요."
    >
      <div className="auth-glass__heading">
        <span>CREATE ACCOUNT</span>
        <strong>02</strong>
      </div>
      <form className="auth-form auth-form--signup">
        <AuthField
          id="signup-email"
          label="이메일"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
        />
        <AuthField
          id="nickname"
          label="닉네임"
          placeholder="나를 표현할 이름"
          autoComplete="nickname"
        />
        <div className="auth-form__row">
          <AuthField
            id="signup-password"
            label="비밀번호"
            type="password"
            placeholder="8자 이상"
            autoComplete="new-password"
          />
          <AuthField
            id="password-confirmation"
            label="비밀번호 확인"
            type="password"
            placeholder="한 번 더 입력"
            autoComplete="new-password"
          />
        </div>
        <div className="auth-agreements">
          <label className="auth-check">
            <input type="checkbox" />
            <span>이용약관에 동의합니다.</span>
          </label>
          <label className="auth-check">
            <input type="checkbox" />
            <span>개인정보 처리방침에 동의합니다.</span>
          </label>
        </div>
        <button className="auth-submit" type="button">
          계정 만들기 <span aria-hidden="true">→</span>
        </button>
      </form>
      <p className="auth-switch">
        이미 계정이 있나요? <Link to="/login">로그인</Link>
      </p>
    </AuthShell>
  )
}

export default SignupPage
