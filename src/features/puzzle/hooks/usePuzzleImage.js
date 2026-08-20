import { useCallback, useEffect, useRef, useState } from 'react'

import { getImageUrl, invalidateImageUrl } from '../api/imageApi.js'

/** 만료 몇 초 전에 미리 갱신할지 (서명 URL 기본 유효 시간 10분) */
const REFRESH_MARGIN_MS = 45_000

/**
 * 퍼즐 그림 URL — 이미지 API(§8)의 S3 서명 URL 을 쓴다.
 *
 * - `puzzle.imageId` → `GET /images/{imageId}` 의 `url`(S3 presigned)을 쓰고, 만료 전에 자동 재발급한다
 * - `imageId` 가 없거나(서버가 아직 퍼즐에 이미지를 배정하지 않음) 조회에 실패하면 `imageUrl` 은 null 이다.
 *   그때 퍼즐판은 그림 없이 조각 틀만 그린다 (진행도는 그대로 보인다).
 * - `onImageError` 를 이미지 태그에 물려두면, URL 이 예상보다 일찍 죽었을 때 캐시를 버리고 한 번 재발급한다
 *
 * @param {{ id: number, imageId?: number | null } | null | undefined} puzzle
 */
export function usePuzzleImage(puzzle) {
  const imageId = puzzle?.imageId ?? null
  // { imageId, url } 로 들고 있어 퍼즐이 바뀌면 이전 URL 이 자동으로 무효가 된다
  const [signed, setSigned] = useState(null)
  const [failed, setFailed] = useState(false)
  const [reloadTick, setReloadTick] = useState(0)
  /** 이미 한 번 재발급을 시도한 imageId (무한 재시도 방지) */
  const retriedFor = useRef(null)

  useEffect(() => {
    if (!imageId) return undefined
    let cancelled = false
    let timer = null
    getImageUrl(imageId).then(
      ({ url, expiresAt }) => {
        if (cancelled) return
        setSigned({ imageId, url })
        setFailed(false)
        // 만료 직전에 스스로 갱신 (화면을 오래 열어둬도 이미지가 깨지지 않게)
        const wait = Math.max(5_000, expiresAt - Date.now() - REFRESH_MARGIN_MS)
        timer = setTimeout(() => {
          invalidateImageUrl(imageId)
          setReloadTick((t) => t + 1)
        }, wait)
      },
      () => {
        // 401(세션 없음)·403(업로더 아님)·404 — 그림 없이 조각 틀만 그린다
        if (!cancelled) setFailed(true)
      },
    )
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [imageId, reloadTick])

  /** <image> 로드 실패 시: 만료된 URL 로 보고 한 번만 재발급 */
  const onImageError = useCallback(() => {
    if (!imageId || retriedFor.current === imageId) return
    retriedFor.current = imageId
    invalidateImageUrl(imageId)
    setReloadTick((t) => t + 1)
  }, [imageId])

  const imageUrl = signed?.imageId === imageId ? signed.url : null
  return {
    imageUrl,
    /** 서버에 아직 이미지가 배정되지 않았거나 불러오지 못한 상태 */
    hasImage: Boolean(imageUrl),
    imageFailed: failed,
    onImageError,
  }
}
