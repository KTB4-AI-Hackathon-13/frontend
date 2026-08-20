import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { changePassword, getCurrentUser, logout, updateCurrentUser, withdrawUser } from '../features/auth/authApi.js'

const TIMEZONES = ['Asia/Seoul', 'Asia/Tokyo', 'UTC', 'America/New_York', 'Europe/London']

function UserIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="8" r="3.25" /><path d="M5.5 19c.65-3.2 3.1-5 6.5-5s5.85 1.8 6.5 5" /></svg>
}

function Status({ status }) {
  if (!status.message) return null
  return <p className={`account-status is-${status.type}`} role={status.type === 'error' ? 'alert' : 'status'}>{status.message}</p>
}

function SwitchUserPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState({ nickname: '', timezone: 'Asia/Seoul' })
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', newPasswordConfirmation: '' })
  const [withdrawal, setWithdrawal] = useState({ password: '', reason: '' })
  const [confirmWithdraw, setConfirmWithdraw] = useState(false)
  const [busy, setBusy] = useState('')
  const [profileStatus, setProfileStatus] = useState({})
  const [passwordStatus, setPasswordStatus] = useState({})
  const [withdrawStatus, setWithdrawStatus] = useState({})

  const handleLogout = async () => {
    setBusy('logout'); setProfileStatus({})
    try {
      await logout()
      navigate('/login', { replace: true, state: { loggedOut: true } })
    } catch (error) {
      setProfileStatus({ type: 'error', message: error.message || '로그아웃하지 못했습니다.' }); setBusy('')
    }
  }

  useEffect(() => {
    getCurrentUser().then((currentUser) => {
      setUser(currentUser)
      setProfile({ nickname: currentUser.nickname, timezone: currentUser.timezone })
    }).catch((error) => setProfileStatus({ type: 'error', message: error.message || '정보를 불러오지 못했습니다.' }))
  }, [])

  const saveProfile = async (event) => {
    event.preventDefault()
    setBusy('profile'); setProfileStatus({})
    try {
      const updated = await updateCurrentUser(profile)
      setUser(updated)
      setProfileStatus({ type: 'success', message: '내 정보가 저장되었습니다.' })
    } catch (error) {
      setProfileStatus({ type: 'error', message: error.message || '정보를 저장하지 못했습니다.' })
    } finally { setBusy('') }
  }

  const savePassword = async (event) => {
    event.preventDefault()
    if (passwords.newPassword !== passwords.newPasswordConfirmation) {
      setPasswordStatus({ type: 'error', message: '새 비밀번호가 서로 일치하지 않습니다.' }); return
    }
    setBusy('password'); setPasswordStatus({})
    try {
      await changePassword(passwords)
      navigate('/login', { replace: true, state: { passwordChanged: true } })
    } catch (error) {
      setPasswordStatus({ type: 'error', message: error.message || '비밀번호를 변경하지 못했습니다.' }); setBusy('')
    }
  }

  const handleWithdraw = async (event) => {
    event.preventDefault()
    if (!confirmWithdraw) {
      setWithdrawStatus({ type: 'error', message: '회원 탈퇴 안내를 확인해주세요.' }); return
    }
    setBusy('withdraw'); setWithdrawStatus({})
    try {
      await withdrawUser(withdrawal)
      navigate('/login', { replace: true, state: { withdrawn: true } })
    } catch (error) {
      setWithdrawStatus({ type: 'error', message: error.message || '회원 탈퇴를 처리하지 못했습니다.' }); setBusy('')
    }
  }

  return (
    <section className="account-page page" aria-labelledby="account-title">
      <header className="account-page__header">
        <div><p className="switch-user__eyebrow">ACCOUNT</p><h1 className="page-title" id="account-title">내 정보</h1><p className="page-sub">프로필과 계정 보안 정보를 관리할 수 있어요.</p></div>
        <button className="account-logout" type="button" onClick={handleLogout} disabled={busy === 'logout'}>
          <span aria-hidden="true">↗</span>{busy === 'logout' ? '로그아웃 중...' : '로그아웃'}
        </button>
      </header>

      <form className="account-card" onSubmit={saveProfile}>
        <div className="account-card__heading"><div><h2>기본 정보</h2><p>서비스에 표시되는 내 정보를 수정합니다.</p></div><span className="switch-user__avatar"><UserIcon /></span></div>
        <div className="account-grid">
          <label><span>이메일</span><input value={user?.email || ''} disabled /></label>
          <label><span>닉네임</span><input value={profile.nickname} maxLength="50" required onChange={(e) => setProfile({ ...profile, nickname: e.target.value })} /></label>
          <label className="account-grid__wide"><span>시간대</span><select value={profile.timezone} onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}>{TIMEZONES.map((timezone) => <option key={timezone}>{timezone}</option>)}</select></label>
        </div>
        <Status status={profileStatus} />
        <div className="account-card__actions"><button type="submit" disabled={busy === 'profile'}>{busy === 'profile' ? '저장 중...' : '변경사항 저장'}</button></div>
      </form>

      <form className="account-card" onSubmit={savePassword}>
        <div className="account-card__heading"><div><h2>비밀번호 변경</h2><p>변경 후에는 모든 기기에서 다시 로그인해야 합니다.</p></div></div>
        <div className="account-grid">
          <label className="account-grid__wide"><span>현재 비밀번호</span><input type="password" autoComplete="current-password" required value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} /></label>
          <label><span>새 비밀번호</span><input type="password" autoComplete="new-password" required value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} /></label>
          <label><span>새 비밀번호 확인</span><input type="password" autoComplete="new-password" required value={passwords.newPasswordConfirmation} onChange={(e) => setPasswords({ ...passwords, newPasswordConfirmation: e.target.value })} /></label>
        </div>
        <Status status={passwordStatus} />
        <div className="account-card__actions"><button type="submit" disabled={busy === 'password'}>{busy === 'password' ? '변경 중...' : '비밀번호 변경'}</button></div>
      </form>

      <form className="account-card account-card--danger" onSubmit={handleWithdraw}>
        <div className="account-card__heading"><div><h2>회원 탈퇴</h2><p>탈퇴하면 계정과 관련된 데이터를 더 이상 이용할 수 없습니다.</p></div></div>
        <div className="account-grid">
          <label><span>비밀번호</span><input type="password" autoComplete="current-password" value={withdrawal.password} onChange={(e) => setWithdrawal({ ...withdrawal, password: e.target.value })} /></label>
          <label><span>탈퇴 사유 (선택)</span><input value={withdrawal.reason} placeholder="서비스 개선에 참고할게요" onChange={(e) => setWithdrawal({ ...withdrawal, reason: e.target.value })} /></label>
        </div>
        <label className="account-confirm"><input type="checkbox" checked={confirmWithdraw} onChange={(e) => setConfirmWithdraw(e.target.checked)} /><span>탈퇴 후 계정을 복구할 수 없음을 확인했습니다.</span></label>
        <Status status={withdrawStatus} />
        <div className="account-card__actions"><button className="is-danger" type="submit" disabled={busy === 'withdraw'}>{busy === 'withdraw' ? '처리 중...' : '회원 탈퇴'}</button></div>
      </form>
    </section>
  )
}

export default SwitchUserPage
