import { useCallback, useRef, useState } from 'react'

export function useToast(duration = 2400) {
  const [toast, setToast] = useState(null)
  const timer = useRef(null)
  const show = useCallback(
    (message, tone = 'info') => {
      clearTimeout(timer.current)
      setToast({ message, tone })
      timer.current = setTimeout(() => setToast(null), duration)
    },
    [duration],
  )
  return { toast, show }
}
