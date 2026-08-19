import axios from 'axios'

/**
 * 공통 axios 클라이언트.
 * - baseURL: /api/v1 (Vite proxy 또는 VITE_API_BASE_URL 로 백엔드 연결)
 * - 인증: 세션 + HttpOnly 쿠키 (withCredentials). 백엔드 인증 연동 전에는 X-User-Id 임시 헤더 사용.
 * - 성공 응답: { data, meta } → data 만 풀어서 돌려준다.
 */
const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  withCredentials: true,
  headers: import.meta.env.VITE_DEV_USER_ID
    ? { 'X-User-Id': import.meta.env.VITE_DEV_USER_ID }
    : {},
})

client.interceptors.response.use(
  (res) => res.data?.data ?? res.data,
  (err) => {
    const body = err.response?.data
    return Promise.reject(
      Object.assign(new Error(body?.message ?? err.message), {
        code: body?.code ?? 'NETWORK_ERROR',
        status: err.response?.status,
        fieldErrors: body?.fieldErrors ?? [],
      }),
    )
  },
)

export default client
