/**
 * 백엔드 공통 에러 형식 `{ code, message, fieldErrors, requestId }` 를 감싼 에러.
 * client.js 의 응답 인터셉터가 모든 실패를 이 타입으로 바꿔 던진다.
 *
 * fieldErrors 항목은 현재 계약이 `{ field, message }` 다.
 * (초기 핸드오프의 `{ field, rejectedValue, reason }` 도 함께 받아 normalize 한다.)
 *
 * @typedef {{ field: string, message: string, rejectedValue?: unknown }} FieldError
 */
export class ApiError extends Error {
  /**
   * @param {{ code: string, message: string, status?: number, fieldErrors?: FieldError[], requestId?: string | null, cause?: unknown }} p
   */
  constructor({ code, message, status, fieldErrors = [], requestId = null, cause }) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.fieldErrors = normalizeFieldErrors(fieldErrors)
    this.requestId = requestId
    this.cause = cause
  }

  /** fieldErrors 를 { [field]: message } 로 (폼 필드 아래 표시용) */
  get fieldErrorMap() {
    return Object.fromEntries(this.fieldErrors.map((f) => [f.field, f.message]))
  }
}

/** `{field, message}` 로 통일 (구 형식 `reason` 도 허용) */
function normalizeFieldErrors(list) {
  if (!Array.isArray(list)) return []
  return list.map((f) => ({
    field: f?.field ?? '',
    message: f?.message ?? f?.reason ?? '',
    rejectedValue: f?.rejectedValue,
  }))
}

/** 프론트 자체 코드 (서버 응답이 아예 없을 때) */
export const CLIENT_ERROR_CODE = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN: 'UNKNOWN',
}

/** 세션이 없거나 만료됐을 때 서버가 주는 코드 (구 `UNAUTHORIZED` 도 방어적으로 포함) */
export const AUTH_REQUIRED_CODES = new Set(['AUTHENTICATION_REQUIRED', 'UNAUTHORIZED'])

/**
 * code 별 사용자 메시지. 서버 message 가 더 구체적인 경우(409 건수, 422 날짜 범위, 검증 실패 등)는
 * 여기 두지 않고 서버 message 를 그대로 쓴다.
 */
const USER_MESSAGE_BY_CODE = {
  // 401 — 세션 없음/만료
  AUTHENTICATION_REQUIRED: '로그인이 필요합니다.',
  UNAUTHORIZED: '로그인이 필요합니다.',
  // 403
  FORBIDDEN: '이 계획에 접근할 권한이 없습니다.',
  ACCOUNT_SUSPENDED: '이용이 정지된 계정입니다.',
  // 404
  SCHEDULE_NOT_FOUND: '계획을 찾을 수 없습니다. 삭제되었을 수 있어요.',
  SCHEDULE_ITEM_NOT_FOUND: '할 일을 찾을 수 없습니다. 삭제되었을 수 있어요.',
  // 400
  INVALID_CURSOR: '목록 정보가 만료되어 처음부터 다시 불러옵니다.',
  // 422 — 서버 문구를 그대로 써도 되지만, 화면 안내와 표현을 맞춘다
  SCHEDULE_PERIOD_TOO_LONG: '계획 기간은 최대 30일까지 설정할 수 있어요.',
  // 기타
  NETWORK_ERROR: '서버에 연결할 수 없습니다. 백엔드(localhost:8080)가 실행 중인지 확인해 주세요.',
  UNKNOWN: '알 수 없는 오류가 발생했습니다.',
}

/**
 * 화면에 보여줄 사용자 메시지.
 * - code 매핑 → 서버 message → 폴백 순
 * - 500 은 제보용 requestId 를 같이 붙인다.
 * @param {unknown} err
 * @returns {string}
 */
export function userMessage(err) {
  if (!(err instanceof ApiError)) {
    return err instanceof Error && err.message ? err.message : USER_MESSAGE_BY_CODE.UNKNOWN
  }
  if (err.status >= 500) {
    return `서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.${
      err.requestId ? ` (requestId: ${err.requestId})` : ''
    }`
  }
  return USER_MESSAGE_BY_CODE[err.code] ?? err.message ?? USER_MESSAGE_BY_CODE.UNKNOWN
}

/** 편의 판별자 — 화면에서 code 별 분기할 때 사용 */
export const isAuthRequired = (err) => err instanceof ApiError && AUTH_REQUIRED_CODES.has(err.code)
export const isForbidden = (err) => err instanceof ApiError && err.status === 403
export const isNotFound = (err) => err instanceof ApiError && err.status === 404
export const isInvalidCursor = (err) => err instanceof ApiError && err.code === 'INVALID_CURSOR'
export const isValidationError = (err) =>
  err instanceof ApiError && err.code === 'INVALID_REQUEST' && err.fieldErrors.length > 0
