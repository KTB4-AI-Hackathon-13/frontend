import { useCallback, useState } from 'react'

import { changeItemStatus } from '../api/scheduleApi.js'
import { userMessage } from '../../../shared/api/apiError.js'

/**
 * 작업 상태 변경(PATCH /schedule-items/{id}/status) 공통 훅 — 낙관적 업데이트.
 * - change(item, status): 화면에는 즉시 반영(overlay) → 서버 성공 시 onSuccess(보통 reload) → 실패 시 롤백 + onError(메시지)
 * - statusOf(item): 화면에 보여줄 상태 (overlay 우선)
 * - award: 응답 puzzlePieceAwarded=true 일 때 { pieceId, itemTitle } (PieceAwardEffect 용). 7번 구현 전까지는 항상 null.
 * - pending: 요청 중인 itemId 집합 (중복 클릭 방지)
 */
export function useItemStatus({ onSuccess, onError } = {}) {
  const [overlay, setOverlay] = useState({}) // { [itemId]: status }
  const [pending, setPending] = useState(() => new Set())
  const [award, setAward] = useState(null)

  const statusOf = useCallback((item) => overlay[item.id] ?? item.status, [overlay])

  const change = useCallback(
    async (item, status) => {
      if (pending.has(item.id) || statusOf(item) === status) return
      setOverlay((o) => ({ ...o, [item.id]: status }))
      setPending((p) => new Set(p).add(item.id))
      const dropOverlay = () =>
        setOverlay((o) => {
          const next = { ...o }
          delete next[item.id]
          return next
        })
      const dropPending = () =>
        setPending((p) => {
          const next = new Set(p)
          next.delete(item.id)
          return next
        })
      try {
        const res = await changeItemStatus(item.id, status)
        if (res?.puzzlePieceAwarded) {
          setAward({ pieceId: res.puzzlePieceId, itemTitle: item.title })
        }
        // 새 데이터가 도착한 뒤(overlay 와 서버 값이 같아진 뒤) overlay 를 내린다 → 깜빡임 없음
        await onSuccess?.(res, item)
      } catch (e) {
        // 롤백: overlay 제거 → 서버 값(item.status)로 돌아감
        onError?.(userMessage(e), e)
      } finally {
        dropOverlay()
        dropPending()
      }
    },
    [pending, statusOf, onSuccess, onError],
  )

  const clearAward = useCallback(() => setAward(null), [])

  return { statusOf, change, pending, award, clearAward }
}
