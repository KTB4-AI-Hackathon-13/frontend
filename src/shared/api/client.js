import axios from 'axios'

import { ApiError, CLIENT_ERROR_CODE } from './apiError.js'
import { API_BASE_URL } from './config.js'

/**
 * 공통 axios 클라이언트 — 모든 API 호출은 이 파일을 통해서만 나간다.
 *
 * - baseURL : config.js 의 /api/v1 (개발은 Vite 프록시 → 8080, 배포는 Caddy 프록시). VITE_API_BASE_URL 로 덮어쓰기 가능
 * - 인증     : ★ 임시 `X-User-Id` 헤더. 회원·인증 도메인(세션 + HttpOnly 쿠키)이 붙으면
 *              아래 AUTH_HEADERS 를 `{}` 로 바꾸는 한 줄만 수정하면 된다 (withCredentials 는 이미 켜 둠).
 * - 성공 응답: `{ data, meta }` → data 만 풀어서 반환. 204 는 undefined.
 * - 실패 응답: `{ code, message, fieldErrors, requestId }` → ApiError 로 변환해 throw.
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? API_BASE_URL

/** 임시 인증 헤더. 세션 쿠키 인증으로 전환되면 이 줄을 `{}` 로. */
const AUTH_HEADERS = { 'X-User-Id': import.meta.env.VITE_DEV_USER_ID ?? '1' }

/** 401 등 인증 이벤트를 화면 쪽(레이아웃)에 알리기 위한 작은 이벤트 버스 */
export const authEvents = new EventTarget()
export const AUTH_EVENT_UNAUTHORIZED = 'unauthorized'

const client = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
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

    if (apiError.status === 401) authEvents.dispatchEvent(new Event(AUTH_EVENT_UNAUTHORIZED))
    return Promise.reject(apiError)
  },
)

export default client
