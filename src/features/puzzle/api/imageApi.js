/**
 * 이미지 API (§8) — 퍼즐 그림을 가져오는 경로.
 *
 *   GET /images/{imageId} → { id, url, urlExpiresAt, contentType, width, height, ownerType, ownerId }
 *
 * `url` 은 S3 **서명 URL 이라 만료된다**(`urlExpiresAt`). 그래서 그냥 캐싱하면 화면에서 이미지가
 * 깨지므로, 아래 캐시가 만료 전에 다시 받아오고 같은 이미지에 대한 동시 요청은 하나로 합친다.
 *
 * S3 경로나 presigned URL을 브라우저 저장소에 보관하지 않는다. 퍼즐 응답의 imageId만 유지하고
 * 화면 진입 또는 URL 만료 시 이 API에서 새 URL을 발급받는다.
 */
import client from '../../../shared/api/client.js'

/** 만료 직전에 미리 갱신할 여유 (서명 URL 이 실제로 죽기 전에 새로 받는다) */
const SAFETY_MS = 60_000
/** urlExpiresAt 이 없을 때 가정하는 유효 시간 */
const FALLBACK_TTL_MS = 5 * 60_000

/** imageId → { url, expiresAt(ms) } */
const cache = new Map()
/** imageId → Promise (동시 요청 합치기) */
const inflight = new Map()
/** imageId → URL 갱신 구독자. 카드와 상세 모달의 상태를 같은 캐시 값으로 맞춘다. */
const subscribers = new Map()

/**
 * GET /images/{imageId} 원본 호출.
 * suppressAuthEvent: 이미지 조회가 401 이어도 로그인 화면으로 튕기지 않는다.
 * (ImageController 가 세션 쿠키만 받아서 로컬 개발 중엔 401 이 나는데, 그것 때문에
 *  화면 전체가 로그인으로 넘어가면 안 되기 때문. 실패하면 로컬 대체 그림으로 폴백한다.)
 */
export function fetchImage(imageId) {
  return client.get(`/images/${imageId}`, { suppressAuthEvent: true })
}

/** 캐시에서 지운다 (URL 이 예상보다 일찍 죽어 이미지 로드가 실패했을 때) */
export function invalidateImageUrl(imageId) {
  const key = String(imageId)
  cache.delete(key)
  inflight.delete(key)
}

/** 같은 imageId의 새 presigned URL이 발급되면 모든 표시 위치에 알린다. */
export function subscribeImageUrl(imageId, listener) {
  const key = String(imageId)
  const listeners = subscribers.get(key) ?? new Set()
  listeners.add(listener)
  subscribers.set(key, listeners)
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) subscribers.delete(key)
  }
}

/**
 * 유효한 이미지 URL 을 돌려준다. 캐시가 만료됐거나 없으면 다시 받아온다.
 * @param {number} imageId
 * @returns {Promise<{ url: string, expiresAt: number }>}
 */
export function getImageUrl(imageId, { force = false } = {}) {
  const key = String(imageId)
  if (force) invalidateImageUrl(key)

  const hit = cache.get(key)
  if (hit && hit.expiresAt - SAFETY_MS > Date.now()) return Promise.resolve(hit)

  const pending = inflight.get(key)
  if (pending) return pending

  const promise = fetchImage(imageId)
    .then((image) => {
      const url = typeof image?.url === 'string' ? image.url.trim() : ''
      if (!url) throw new Error('이미지 API 응답에 S3 URL이 없습니다.')

      const parsedExpiresAt = image?.urlExpiresAt
        ? new Date(image.urlExpiresAt).getTime()
        : Number.NaN
      const expiresAt = Number.isFinite(parsedExpiresAt)
        ? parsedExpiresAt
        : Date.now() + FALLBACK_TTL_MS
      const entry = { url, expiresAt }
      cache.set(key, entry)
      subscribers.get(key)?.forEach((listener) => listener(entry))
      return entry
    })
    .finally(() => inflight.delete(key))

  inflight.set(key, promise)
  return promise
}
