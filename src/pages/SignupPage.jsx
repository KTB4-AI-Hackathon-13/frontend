import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import AuthField from '../features/auth/AuthField.jsx'
import AuthShell from '../features/auth/AuthShell.jsx'
import { signup } from '../features/auth/authApi.js'

function SignupPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', nickname: '', password: '', passwordConfirmation: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const update = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
    setServerError('')
  }

  const validate = () => {
    const next = {}
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = '올바른 이메일을 입력해주세요.'
    if (!form.nickname.trim()) next.nickname = '닉네임을 입력해주세요.'
    if (form.password.length < 8 || form.password.length > 72) next.password = '8자 이상 72자 이하로 입력해주세요.'
    if (form.password !== form.passwordConfirmation) next.passwordConfirmation = '비밀번호가 일치하지 않습니다.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    setServerError('')
    try {
      await signup({ ...form, nickname: form.nickname.trim() })
      navigate('/login', { replace: true, state: { signedUp: true } })
    } catch (requestError) {
      const fieldErrors = Object.fromEntries((requestError.fieldErrors || []).map(({ field, message }) => [field, message]))
      setErrors((current) => ({ ...current, ...fieldErrors }))
      setServerError(requestError.message || '회원가입에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      eyebrow="START YOUR PLAN"
      title={
        <>
          PLAN YOUR DAY.
          <br />
          BUILD YOUR FUTURE.
        </>
      }
      description="AI Planner와 함께 목표를 실천으로 바꾸는 첫 계정을 만드세요."
    >
      <div className="auth-glass__heading">
        <span>CREATE ACCOUNT</span>
        <strong>02</strong>
      </div>
      <form className="auth-form auth-form--signup" onSubmit={handleSubmit} noValidate>
        <AuthField
          id="signup-email"
          label="이메일"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          name="email"
          value={form.email}
          onChange={update}
          error={errors.email}
        />
        <AuthField
          id="nickname"
          label="닉네임"
          placeholder="나를 표현할 이름"
          autoComplete="nickname"
          name="nickname"
          value={form.nickname}
          onChange={update}
          error={errors.nickname}
        />
        <div className="auth-form__row">
          <AuthField
            id="signup-password"
            label="비밀번호"
            type="password"
            placeholder="8자 이상"
            autoComplete="new-password"
            name="password"
            value={form.password}
            onChange={update}
            error={errors.password}
          />
          <AuthField
            id="password-confirmation"
            label="비밀번호 확인"
            type="password"
            placeholder="한 번 더 입력"
            autoComplete="new-password"
            name="passwordConfirmation"
            value={form.passwordConfirmation}
            onChange={update}
            error={errors.passwordConfirmation}
          />
        </div>
        {serverError && <p className="auth-form__error" role="alert">{serverError}</p>}
        <button className="auth-submit" type="submit" disabled={submitting}>
          {submitting ? '계정 만드는 중...' : '계정 만들기'} <span aria-hidden="true">→</span>
        </button>
      </form>
      <p className="auth-switch">
        이미 계정이 있나요? <Link to="/login">로그인</Link>
      </p>
    </AuthShell>
  )
}

export default SignupPage
