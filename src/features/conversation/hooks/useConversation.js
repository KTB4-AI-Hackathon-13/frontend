import { useCallback, useEffect, useRef, useState } from 'react'

import { createConversation, getMessages, sendMessage } from '../api/conversationApi.js'

const STORAGE_KEY = 'my-alter-ego.conversation-id'
let conversationInitialization

async function getOrCreateConversation() {
  const storedId = sessionStorage.getItem(STORAGE_KEY)
  if (storedId) {
    try {
      await getMessages(storedId, { size: 1 })
      return storedId
    } catch (error) {
      if (error.status !== 404) throw error
      sessionStorage.removeItem(STORAGE_KEY)
    }
  }

  const conversation = await createConversation('나의 새로운 계획')
  sessionStorage.setItem(STORAGE_KEY, conversation.conversationId)
  return conversation.conversationId
}

function initializeOnce() {
  conversationInitialization ??= getOrCreateConversation()
  return conversationInitialization
}

export function useConversation() {
  const [conversationId, setConversationId] = useState(null)
  const [messages, setMessages] = useState([])
  const [nextCursor, setNextCursor] = useState(null)
  const [hasNext, setHasNext] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingOlder, setIsLoadingOlder] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')
  const [planReadiness, setPlanReadiness] = useState(null)
  const loadingOlderRef = useRef(false)

  useEffect(() => {
    let active = true

    async function initialize() {
      try {
        const id = await initializeOnce()
        const result = await getMessages(id)
        if (!active) return
        setConversationId(id)
        setMessages(result.items)
        setNextCursor(result.nextCursor)
        setHasNext(result.hasNext)
      } catch {
        if (active) setError('대화를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')
      } finally {
        if (active) setIsLoading(false)
      }
    }

    initialize()
    return () => {
      active = false
    }
  }, [])

  const loadOlder = useCallback(async () => {
    if (!conversationId || !hasNext || nextCursor == null || loadingOlderRef.current) return false
    loadingOlderRef.current = true
    setIsLoadingOlder(true)
    try {
      const result = await getMessages(conversationId, { before: nextCursor })
      setMessages((current) => [...result.items, ...current])
      setNextCursor(result.nextCursor)
      setHasNext(result.hasNext)
      return true
    } catch {
      setError('이전 메시지를 불러오지 못했습니다.')
      return false
    } finally {
      loadingOlderRef.current = false
      setIsLoadingOlder(false)
    }
  }, [conversationId, hasNext, nextCursor])

  const submit = useCallback(
    async (content) => {
      const trimmed = content.trim()
      if (!conversationId || !trimmed || isSending) return false
      setIsSending(true)
      setError('')
      try {
        const result = await sendMessage(conversationId, trimmed)
        setMessages((current) => [...current, result.userMessage, result.assistantMessage])
        setPlanReadiness(result.planReadiness)
        return true
      } catch {
        setError('메시지를 전송하지 못했습니다. 다시 시도해 주세요.')
        return false
      } finally {
        setIsSending(false)
      }
    },
    [conversationId, isSending],
  )

  return {
    messages,
    planReadiness,
    isLoading,
    isLoadingOlder,
    isSending,
    hasNext,
    error,
    loadOlder,
    submit,
  }
}
