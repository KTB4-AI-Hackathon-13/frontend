import client from '../../shared/api/client.js'
import { API_BASE_URL } from '../../shared/api/config.js'

const OAUTH_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? API_BASE_URL

export function login(credentials) {
  return client.post('/auth/login', credentials)
}

export function startKakaoLogin() {
  globalThis.location.assign(`${OAUTH_BASE_URL.replace(/\/$/, '')}/auth/oauth/kakao`)
}

export function signup(account) {
  return client.post('/auth/signup', account)
}

export function logout() {
  return client.post('/auth/logout')
}

export function getCurrentUser() {
  return client.get('/users/me')
}

export function updateCurrentUser(profile) {
  return client.patch('/users/me', profile)
}

export function changePassword(passwords) {
  return client.patch('/users/me/password', passwords)
}

export function withdrawUser(details) {
  return client.delete('/users/me', { data: details })
}
