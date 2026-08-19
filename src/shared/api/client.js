import axios from 'axios'

import { ApiError, AUTH_REQUIRED_CODES, CLIENT_ERROR_CODE } from './apiError.js'
import { API_BASE_URL } from './config.js'

/**
 * 공통 axios 클라이언트 — 모든 API 호출은 이 파일을 통해서만 나간다.
 *
 * - baseURL : config.js 의 `/api/v1` (개발은 Vite 프록시 → 127.0.0.1:8080, 배포는 Caddy).
 *             `VITE_API_BASE_URL` 로 덮어쓸 수 있음
 * - 인증     : **세션 쿠키 `SESSION`(HttpOnly)**. `withCredentials: true` 라 로그인(POST /auth/login) 후
 *             브라우저가 쿠키를 자동 첨부한다. 쿠키 없음/만료 → 401 `AUTHENTICATION_REQUIRED`
 *             → authEvents 로 알려 로그인 화면으로 보낸다.
 *             로컬 개발 편의로 백엔드가 `APP_AUTH_DEV_HEADER_ENABLED=true` 일 때만 동작하는
 *             `X-User-Id` 폴백이 있는데, `.env` 에 `VITE_DEV_USER_ID` 를 넣은 경우에만 보낸다(기본 미사용).
 * - 성공 응답: `{ data, meta }` → data 만 풀어서 반환. 204 는 undefined.
 * - 실패 응답: `{ code, message, fieldErrors, requestId }` → ApiError 로 변환해 throw.
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? API_BASE_URL

/**
 * 로컬 개발용 임시 헤더. `.env` 에 VITE_DEV_USER_ID=1 을 넣었을 때만 붙는다.
 * (백엔드도 APP_AUTH_DEV_HEADER_ENABLED=true 여야 하고, 세션 쿠키가 있으면 쿠키가 우선한다)
 */
const DEV_USER_ID = import.meta.env.VITE_DEV_USER_ID
const AUTH_HEADERS = DEV_USER_ID ? { 'X-User-Id': String(DEV_USER_ID) } : {}

/** 401(세션 없음/만료)을 화면 쪽(레이아웃)에 알리기 위한 작은 이벤트 버스 */
export const authEvents = new EventTarget()
export const AUTH_EVENT_UNAUTHORIZED = 'unauthorized'

const client = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // 세션 쿠키 전송 (인증의 기본 경로)
  headers: { 'Content-Type': 'application/json', ...AUTH_HEADERS },
  timeout: 15000,
})

client.interceptors.response.use(
  (res) => {
    // 204 No Content
    if (res.status === 204 || res.data === '' || res.data == null) return undefined
    // { data, meta } 래퍼 해제. meta.requestId 는 디버깅용으로 data 에 비열거 속성으로 붙여둔다.
    const body = res.data
    if (body && typeof body === 'object' && 'data' in body) {
      const data = body.data
      if (data && typeof data === 'object' && body.meta?.requestId) {
        Object.defineProperty(data, '__requestId', {
          value: body.meta.requestId,
          enumerable: false,
        })
      }
      return data
    }
    return body
  },
  (err) => {
    const res = err.response
    const body = res?.data
    const apiError =
      res && body && typeof body === 'object' && body.code
        ? new ApiError({
            code: body.code,
            message: body.message,
            status: res.status,
            fieldErrors: body.fieldErrors ?? [],
            requestId: body.requestId ?? res.headers?.['x-request-id'] ?? null,
            cause: err,
          })
        : new ApiError({
            code: res ? CLIENT_ERROR_CODE.UNKNOWN : CLIENT_ERROR_CODE.NETWORK_ERROR,
            message: res ? `요청이 실패했습니다. (HTTP ${res.status})` : '네트워크 오류',
            status: res?.status,
            requestId: res?.headers?.['x-request-id'] ?? null,
            cause: err,
          })

    // 세션 만료만 로그인 화면으로. 로그인 실패(INVALID_CREDENTIALS)도 401 이지만 그 폼에서 처리해야 한다.
    if (AUTH_REQUIRED_CODES.has(apiError.code)) {
      authEvents.dispatchEvent(new Event(AUTH_EVENT_UNAUTHORIZED))
    }
    return Promise.reject(apiError)
  },
)

export default client
