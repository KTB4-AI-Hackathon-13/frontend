import { useCallback, useEffect, useRef, useState } from 'react'

import { getImageUrl, invalidateImageUrl } from '../api/imageApi.js'

/** 만료 몇 초 전에 미리 갱신할지 (서명 URL 기본 유효 시간 10분) */
const REFRESH_MARGIN_MS = 45_000

/**
 * 퍼즐 그림 URL — schedule id로 연결된 직접 URL을 우선하고 기존 이미지 API를 폴백으로 쓴다.
 *
 * - `puzzle.imageUrl`은 이미지 테이블의 `schedule_id`와 연결된 `img_url`이다.
 * - 직접 URL이 없거나 로드에 실패하고 `puzzle.imageId`가 있으면 `GET /images/{imageId}`의
 *   S3 presigned URL을 쓰고, 만료 전에 자동 재발급한다.
 * - 두 이미지 소스가 모두 없거나 조회에 실패하면 `imageUrl`은 null이다.
 *   그때 퍼즐판은 그림 없이 조각 틀만 그린다 (진행도는 그대로 보인다).
 * - `onImageError` 를 이미지 태그에 물려두면, URL 이 예상보다 일찍 죽었을 때 캐시를 버리고 한 번 재발급한다
 * - `enabled: false` 면 요청 자체를 미룬다 (예: 카드가 아직 화면에 안 보일 때 — `useInView` 와 함께 쓴다)
 *
 * @param {{ id: number, imageId?: number | null, imageUrl?: string | null } | null | undefined} puzzle
 * @param {{ enabled?: boolean }} [opts]
 */
export function usePuzzleImage(puzzle, { enabled = true } = {}) {
  const imageId = puzzle?.imageId ?? null
  const directUrl = typeof puzzle?.imageUrl === 'string' && puzzle.imageUrl ? puzzle.imageUrl : null
  const directKey = directUrl ? `url:${directUrl}` : null
  const imageIdKey = imageId ? `id:${imageId}` : null
  // { imageId, url } 로 들고 있어 퍼즐이 바뀌면 이전 URL 이 자동으로 무효가 된다
  const [signed, setSigned] = useState(null)
  const [failedDirectKey, setFailedDirectKey] = useState(null)
  const [failedImageIdKey, setFailedImageIdKey] = useState(null)
  const [reloadTick, setReloadTick] = useState(0)
  /** 이미 한 번 재발급을 시도한 imageId (무한 재시도 방지) */
  const retriedFor = useRef(null)

  useEffect(() => {
    const directAvailable = directKey && failedDirectKey !== directKey
    if (!imageId || !enabled || directAvailable || failedImageIdKey === imageIdKey) {
      return undefined
    }
    let cancelled = false
    let timer = null
    getImageUrl(imageId).then(
      ({ url, expiresAt }) => {
        if (cancelled) return
        setSigned({ imageId, url })
        setFailedImageIdKey((key) => (key === imageIdKey ? null : key))
        // 만료 직전에 스스로 갱신 (화면을 오래 열어둬도 이미지가 깨지지 않게)
        const wait = Math.max(5_000, expiresAt - Date.now() - REFRESH_MARGIN_MS)
        timer = setTimeout(() => {
          invalidateImageUrl(imageId)
          setReloadTick((t) => t + 1)
        }, wait)
      },
      () => {
        // 401(세션 없음)·403(업로더 아님)·404 — 그림 없이 조각 틀만 그린다
        if (!cancelled) setFailedImageIdKey(imageIdKey)
      },
    )
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [directKey, enabled, failedDirectKey, failedImageIdKey, imageId, imageIdKey, reloadTick])

  /** <image> 로드 실패 시: 만료된 URL 로 보고 한 번만 재발급 */
  const onImageError = useCallback(() => {
    if (directKey && failedDirectKey !== directKey) {
      setFailedDirectKey(directKey)
      return
    }
    if (!imageId) return
    if (retriedFor.current === imageIdKey) {
      setSigned(null)
      setFailedImageIdKey(imageIdKey)
      return
    }
    retriedFor.current = imageIdKey
    invalidateImageUrl(imageId)
    setSigned(null)
    setReloadTick((t) => t + 1)
  }, [directKey, failedDirectKey, imageId, imageIdKey])

  const directAvailable = enabled && directKey && failedDirectKey !== directKey
  const signedUrl = signed?.imageId === imageId ? signed.url : null
  const imageUrl = directAvailable ? directUrl : enabled ? signedUrl : null
  const imageFailed =
    !imageUrl &&
    ((imageIdKey != null && failedImageIdKey === imageIdKey) ||
      (directKey != null && failedDirectKey === directKey && !imageId))
  return {
    imageUrl,
    /** 서버에 아직 이미지가 배정되지 않았거나 불러오지 못한 상태 */
    hasImage: Boolean(imageUrl),
    /** 서명 URL 을 받아오는 중 (스켈레톤 UI 표시용) */
    imageLoading:
      enabled && !imageUrl && Boolean(imageId) && failedImageIdKey !== imageIdKey,
    imageFailed,
    onImageError,
  }
}
