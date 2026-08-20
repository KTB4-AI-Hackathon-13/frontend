import client from '../../shared/api/client.js'

export function login(credentials) {
  return client.post('/auth/login', credentials)
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
