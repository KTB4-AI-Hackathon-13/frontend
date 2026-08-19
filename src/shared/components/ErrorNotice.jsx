import { ApiError, userMessage } from '../api/apiError.js'

/**
 * API 에러를 사용자 메시지로 보여주는 공통 블록.
 * - 메시지는 code 별 매핑(apiError.js userMessage) 사용
 * - 400 INVALID_REQUEST 의 fieldErrors 가 있으면 항목별로 나열
 * - 디버깅/제보용 requestId 는 작게 표시
 */
function ErrorNotice({ error, onRetry, retryLabel = '다시 시도', children, compact = false }) {
  if (!error) return null
  const fieldErrors = error instanceof ApiError ? error.fieldErrors : []
  return (
    <div className={`notice notice--error ${compact ? 'notice--compact' : ''}`} role="alert">
      <p className="notice__msg">{userMessage(error)}</p>
      {fieldErrors.length > 0 && (
        <ul className="notice__fields">
          {fieldErrors.map((f) => (
            <li key={f.field}>
              <code>{f.field}</code> — {f.message}
            </li>
          ))}
        </ul>
      )}
      {(onRetry || children) && (
        <div className="notice__actions">
          {onRetry && (
            <button type="button" className="btn btn--sm" onClick={onRetry}>
              {retryLabel}
            </button>
          )}
          {children}
        </div>
      )}
      {error instanceof ApiError && error.requestId && !compact && (
        <p className="notice__req muted">requestId: {error.requestId}</p>
      )}
    </div>
  )
}

export default ErrorNotice
