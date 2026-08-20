/**
 * 이미지 API (§8) — 퍼즐 그림을 가져오는 경로.
 *
 *   GET /images/{imageId} → { id, url, urlExpiresAt, contentType, width, height, ownerType, ownerId }
 *
 * `url` 은 S3 **서명 URL 이라 만료된다**(`urlExpiresAt`). 그래서 그냥 캐싱하면 화면에서 이미지가
 * 깨지므로, 아래 캐시가 만료 전에 다시 받아오고 같은 이미지에 대한 동시 요청은 하나로 합친다.
 *
 * ⚠️ 백엔드 ImageController 는 세션 쿠키(SESSION)만 인증으로 받는다(X-User-Id dev 헤더 미지원).
 *    로그인 없이 개발 중이면 401 이 날 수 있고, 그때는 호출부가 로컬 대체 이미지로 폴백한다.
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
  cache.delete(imageId)
  inflight.delete(imageId)
}

/**
 * 유효한 이미지 URL 을 돌려준다. 캐시가 만료됐거나 없으면 다시 받아온다.
 * @param {number} imageId
 * @returns {Promise<{ url: string, expiresAt: number }>}
 */
export function getImageUrl(imageId) {
  const hit = cache.get(imageId)
  if (hit && hit.expiresAt - SAFETY_MS > Date.now()) return Promise.resolve(hit)

  const pending = inflight.get(imageId)
  if (pending) return pending

  const promise = fetchImage(imageId)
    .then((image) => {
      const expiresAt = image?.urlExpiresAt
        ? new Date(image.urlExpiresAt).getTime()
        : Date.now() + FALLBACK_TTL_MS
      const entry = { url: image.url, expiresAt }
      cache.set(imageId, entry)
      return entry
    })
    .finally(() => inflight.delete(imageId))

  inflight.set(imageId, promise)
  return promise
}
