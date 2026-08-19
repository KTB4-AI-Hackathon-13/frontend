import { useEffect } from 'react'

/** 단축키 안내 문구 (헤더 툴팁/도움말에 그대로 사용) */
export const CALENDAR_SHORTCUT_HELP = [
  '← / → 또는 P / N : 이전·다음 달',
  'Shift + ← / → : 이전·다음 해',
  'PageUp / PageDown : 이전·다음 달',
  'T : 오늘',
]

const isTypingTarget = (el) =>
  !!el &&
  (el.tagName === 'INPUT' ||
    el.tagName === 'TEXTAREA' ||
    el.tagName === 'SELECT' ||
    el.isContentEditable)

/**
 * 캘린더 키보드 단축키 (Google Calendar 의 p/n/t 와 일반적인 화살표·PageUp/Down 관례).
 * - 입력 중(input/textarea/select)이거나 모달·팝오버가 열려 있으면 무시 (enabled=false 로 전달)
 * - 브라우저 기본 동작(PageUp/Down 스크롤 등)은 단축키가 먹을 때만 막는다
 *
 * @param {{ enabled?: boolean, onMonth: (delta: number) => void, onYear: (delta: number) => void, onToday: () => void }} handlers
 */
export function useCalendarShortcuts({ enabled = true, onMonth, onYear, onToday }) {
  useEffect(() => {
    if (!enabled) return undefined
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (isTypingTarget(document.activeElement)) return
      let handled = true
      switch (e.key) {
        case 'ArrowLeft':
          e.shiftKey ? onYear(-1) : onMonth(-1)
          break
        case 'ArrowRight':
          e.shiftKey ? onYear(1) : onMonth(1)
          break
        case 'PageUp':
          onMonth(-1)
          break
        case 'PageDown':
          onMonth(1)
          break
        case 'p':
        case 'P':
        case 'ㅔ':
          onMonth(-1)
          break
        case 'n':
        case 'N':
        case 'ㅜ':
          onMonth(1)
          break
        case 't':
        case 'T':
        case 'ㅅ':
          onToday()
          break
        default:
          handled = false
      }
      if (handled) e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enabled, onMonth, onYear, onToday])
}
