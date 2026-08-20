import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import AuthShell from '../features/auth/AuthShell.jsx'
import { useAuth } from '../features/auth/useAuth.js'

function OAuthCallbackPage() {
  const navigate = useNavigate()
  const { refreshUser } = useAuth()

  useEffect(() => {
    let active = true

    refreshUser()
      .then(() => {
        if (!active) return
        navigate('/', {
          replace: true,
          state: { toast: { message: '카카오 로그인이 완료되었습니다.', tone: 'success' } },
        })
      })
      .catch(() => {
        if (!active) return
        navigate('/login', { replace: true, state: { oauthError: true } })
      })

    return () => {
      active = false
    }
  }, [navigate, refreshUser])

  return (
    <AuthShell
      eyebrow="SIGNING IN"
      title={
        <>
          ALMOST
          <br />
          THERE.
        </>
      }
      description="로그인 정보를 안전하게 확인하고 있습니다."
    >
      <div className="auth-callback" role="status" aria-live="polite">
        <span className="auth-callback__spinner" aria-hidden="true" />
        <strong>카카오 로그인 확인 중</strong>
        <p>잠시만 기다려주세요.</p>
      </div>
    </AuthShell>
  )
}

export default OAuthCallbackPage
