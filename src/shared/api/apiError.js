/**
 * 백엔드 공통 에러 형식 `{ code, message, fieldErrors, requestId }` 를 감싼 에러.
 * client.js 의 응답 인터셉터가 모든 실패를 이 타입으로 바꿔 던진다.
 *
 * @typedef {{ field: string, rejectedValue: unknown, reason: string }} FieldError
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
    this.fieldErrors = fieldErrors
    this.requestId = requestId
    this.cause = cause
  }

  /** fieldErrors 를 { [field]: reason } 으로 (폼 필드 아래 표시용) */
  get fieldErrorMap() {
    return Object.fromEntries(this.fieldErrors.map((f) => [f.field, f.reason]))
  }
}

/** 프론트 자체 코드 (서버 응답이 아예 없을 때) */
export const CLIENT_ERROR_CODE = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN: 'UNKNOWN',
}

/**
 * code 별 사용자 메시지. 서버 message 가 더 구체적인 경우(409 건수, 422 날짜 범위 등)는
 * 여기 두지 않고 서버 message 를 그대로 쓴다. (핸드오프 §2 공통 상태 코드 표 기준)
 */
const USER_MESSAGE_BY_CODE = {
  // 401
  UNAUTHORIZED: '로그인이 필요합니다.',
  // 403
  FORBIDDEN: '이 계획에 접근할 권한이 없습니다.',
  // 404
  SCHEDULE_NOT_FOUND: '계획을 찾을 수 없습니다. 삭제되었을 수 있어요.',
  SCHEDULE_ITEM_NOT_FOUND: '할 일을 찾을 수 없습니다. 삭제되었을 수 있어요.',
  // 400
  INVALID_CURSOR: '목록 정보가 만료되어 처음부터 다시 불러옵니다.',
  // 기타
  NETWORK_ERROR: '서버에 연결할 수 없습니다.',
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
export const isUnauthorized = (err) => err instanceof ApiError && err.status === 401
export const isForbidden = (err) => err instanceof ApiError && err.status === 403
export const isNotFound = (err) => err instanceof ApiError && err.status === 404
export const isInvalidCursor = (err) => err instanceof ApiError && err.code === 'INVALID_CURSOR'
export const isValidationError = (err) =>
  err instanceof ApiError && err.code === 'INVALID_REQUEST' && err.fieldErrors.length > 0
