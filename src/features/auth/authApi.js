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
