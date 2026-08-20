import { useCallback, useEffect, useRef, useState } from 'react'

import {
  createConversation,
  generateSchedule,
  generateScheduleTemplate,
  getConversation,
  getConversationBySchedule,
  getMessages,
  sendMessage,
} from '../api/conversationApi.js'
import { todayLocal } from '../../schedule/utils/date.js'

const WORKFLOW_STORAGE_KEY = 'my-alter-ego.conversation-workflow-v1'

function readStoredWorkflow() {
  try {
    const value = globalThis.sessionStorage?.getItem(WORKFLOW_STORAGE_KEY)
    return value ? JSON.parse(value) : {}
  } catch {
    globalThis.sessionStorage?.removeItem(WORKFLOW_STORAGE_KEY)
    return {}
  }
}

function clearStoredWorkflow() {
  try {
    globalThis.sessionStorage?.removeItem(WORKFLOW_STORAGE_KEY)
  } catch {
    // 브라우저가 저장소 사용을 막더라도 대화 자체는 계속할 수 있다.
  }
}

const makeLocalId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`

function localMessage(role, content, extra = {}) {
  return {
    id: makeLocalId(),
    role,
    content,
    createdAt: new Date().toISOString(),
    ...extra,
  }
}

function templateContent(result) {
  if (result.action === 'reject') {
    return result.payload?.message ?? '계획으로 만들 목표를 다시 입력해 주세요.'
  }

  const heading = result.payload?.goal_summary
    ? `${result.payload.goal_summary}\n\n계획을 만들기 위해 아래 내용을 알려주세요.`
    : '계획을 만들기 위해 아래 내용을 알려주세요.'
  return heading
}

async function getAllMessages(conversationId) {
  const allMessages = []
  let before

  do {
    const page = await getMessages(conversationId, { size: 100, before })
    allMessages.unshift(...page.items)
    before = page.hasNext ? page.nextCursor : null
  } while (before != null)

  return allMessages
}

export function useConversation({
  requestedConversationId,
  scheduleId,
  createNew = false,
  onConversationCreated,
  onLinkedSchedule,
  onConfirmed,
} = {}) {
  const [storedWorkflow] = useState(() => {
    const stored = readStoredWorkflow()
    if (
      createNew ||
      (requestedConversationId && stored.conversationId !== requestedConversationId)
    ) {
      return {}
    }
    return stored
  })
  const [conversationId, setConversationId] = useState(requestedConversationId ?? null)
  const [messages, setMessages] = useState([])
  const [nextCursor, setNextCursor] = useState(null)
  const [hasNext, setHasNext] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingOlder, setIsLoadingOlder] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState('')
  const [template, setTemplate] = useState(storedWorkflow.template ?? null)
  const [templateDraft, setTemplateDraft] = useState(storedWorkflow.templateDraft ?? {})
  const [planTurn, setPlanTurn] = useState(storedWorkflow.planTurn ?? null)
  const [planContext, setPlanContext] = useState(storedWorkflow.planContext ?? null)
  const [confirmedScheduleId, setConfirmedScheduleId] = useState(
    storedWorkflow.confirmedScheduleId ?? null,
  )
  const [isAwaitingGoal, setIsAwaitingGoal] = useState(storedWorkflow.isAwaitingGoal ?? true)
  const loadingOlderRef = useRef(false)
  const creationPromiseRef = useRef(null)

  useEffect(() => {
    let active = true
    async function initialize() {
      try {
        let id = requestedConversationId
        const linkedScheduleId = scheduleId ? Number(scheduleId) : null
        let allMessages
        let resumeContext = null
        if (createNew) {
          clearStoredWorkflow()
          id = null
          allMessages = []
        } else if (linkedScheduleId) {
          const conversation = await getConversationBySchedule(linkedScheduleId)
          id = conversation.conversationId
          allMessages = await getAllMessages(id)
          resumeContext = conversation.resumeContext
        } else if (id) {
          try {
            const conversation = await getConversation(id)
            if (conversation.scheduleId) {
              onLinkedSchedule?.(conversation.scheduleId)
              return
            }
            allMessages = await getAllMessages(id)
          } catch (requestError) {
            if (requestError?.status !== 404 && requestError?.status !== 403) throw requestError
            clearStoredWorkflow()
            id = null
          }
        }
        if (!active) return
        if (id !== storedWorkflow.conversationId) {
          setTemplate(null)
          setTemplateDraft({})
          setPlanTurn(null)
          setPlanContext(null)
          setConfirmedScheduleId(null)
          setIsAwaitingGoal(true)
        }
        if (linkedScheduleId) {
          setConfirmedScheduleId(linkedScheduleId)
          if (resumeContext) {
            setPlanContext({
              goalSummary: resumeContext.goalSummary,
              category: resumeContext.category,
              templateAnswers: resumeContext.templateAnswers,
            })
            setPlanTurn({
              plan: resumeContext.currentPlan,
              feedback_history: resumeContext.feedbackHistory ?? [],
              completed_task_ids: resumeContext.completedTaskIds ?? [],
              ready_to_confirm: false,
              confirmed: true,
              submitted: true,
              schedule_id: linkedScheduleId,
            })
            setIsAwaitingGoal(false)
          }
        }
        setConversationId(id)
        setMessages(allMessages)
        setNextCursor(null)
        setHasNext(false)
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
  }, [
    createNew,
    onLinkedSchedule,
    requestedConversationId,
    scheduleId,
    storedWorkflow,
  ])

  useEffect(() => {
    if (isLoading || !conversationId) return
    try {
      globalThis.sessionStorage?.setItem(
        WORKFLOW_STORAGE_KEY,
        JSON.stringify({
          conversationId,
          template,
          templateDraft,
          planTurn,
          planContext,
          confirmedScheduleId,
          isAwaitingGoal,
        }),
      )
    } catch {
      // 저장 공간 부족 등의 문제는 현재 대화 진행을 막지 않는다.
    }
  }, [
    confirmedScheduleId,
    conversationId,
    isAwaitingGoal,
    isLoading,
    planContext,
    planTurn,
    template,
    templateDraft,
  ])

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
      if (!trimmed || isSending) return false
      if (isAwaitingGoal && trimmed.length > 500) {
        setError('첫 목표는 500자 이내로 입력해 주세요.')
        return false
      }
      if (!isAwaitingGoal && (!planTurn?.plan || !planContext)) return false

      const optimisticMessage = localMessage('USER', trimmed, { pending: true })
      setMessages((current) => [...current, optimisticMessage])
      setIsSending(true)
      setError('')
      try {
        let activeConversationId = conversationId
        if (!activeConversationId) {
          creationPromiseRef.current ??= createConversation(trimmed.slice(0, 200))
          const created = await creationPromiseRef.current
          activeConversationId = created.conversationId
          setConversationId(activeConversationId)
          onConversationCreated?.(activeConversationId)
        }

        if (isAwaitingGoal) {
          const result = await generateScheduleTemplate(activeConversationId, trimmed)
          const generated = result.action === 'generate_template'
          setTemplate(generated ? result.payload : null)
          setTemplateDraft({})
          setIsAwaitingGoal(!generated)
          setMessages((current) => [
            ...current.map((message) =>
              message.id === optimisticMessage.id ? { ...message, pending: false } : message,
            ),
            localMessage('ASSISTANT', templateContent(result), { payload: result.payload }),
          ])
          return true
        }

        const result = await sendMessage(activeConversationId, {
          content: trimmed,
          goalSummary: planContext.goalSummary,
          category: planContext.category,
          templateAnswers: planContext.templateAnswers,
          currentPlan: planTurn.plan,
          feedbackHistory: planTurn.feedback_history ?? [],
        })
        setMessages((current) => [
          ...current.map((message) =>
            message.id === optimisticMessage.id ? { ...message, pending: false } : message,
          ),
          localMessage('ASSISTANT', result.assistant_message),
        ])
        setPlanTurn(result)
        if (result.confirmed && result.submitted && result.schedule_id) {
          setConfirmedScheduleId(result.schedule_id)
        }
        if (result.confirmed) {
          onConfirmed?.(result)
        }
        return true
      } catch {
        setMessages((current) =>
          current.filter((message) => message.id !== optimisticMessage.id),
        )
        setError('메시지를 전송하지 못했습니다. 다시 시도해 주세요.')
        return false
      } finally {
        setIsSending(false)
      }
    },
    [
      conversationId,
      isAwaitingGoal,
      isSending,
      onConfirmed,
      onConversationCreated,
      planContext,
      planTurn,
    ],
  )

  const submitTemplateAnswers = useCallback(
    async (templateAnswers) => {
      if (!conversationId || !template || isSending) return false
      const start = templateAnswers.start_date
      const end = templateAnswers.end_date
      if (start && start < todayLocal()) {
        setError('계획 시작일은 오늘 이후로 선택해 주세요.')
        return false
      }
      if (start && end) {
        const days = (new Date(end) - new Date(start)) / 86400000
        if (days < 0 || days >= 30) {
          setError('계획 기간은 시작일부터 최대 30일까지 선택할 수 있어요.')
          return false
        }
      }
      setIsSending(true)
      setError('')
      try {
        const result = await generateSchedule({
          conversationId,
          goalSummary: template.goal_summary,
          category: template.category,
          templateAnswers,
        })
        setMessages((current) =>
          [...current, localMessage('ASSISTANT', result.assistant_message)].filter(Boolean),
        )
        const hasPlan = (result.plan?.daily_tasks?.length ?? 0) > 0
        if (hasPlan) {
          setPlanTurn(result)
          setPlanContext({
            goalSummary: template.goal_summary,
            category: template.category,
            templateAnswers,
          })
          setTemplate(null)
          setTemplateDraft({})
        } else {
          // AI가 기간 등의 재입력을 요청하면 기존 폼과 답변을 유지해 재전송할 수 있게 한다.
          setPlanTurn(null)
        }
        return true
      } catch (requestError) {
        setError(requestError?.message ?? '계획 초안을 만들지 못했습니다.')
        return false
      } finally {
        setIsSending(false)
      }
    },
    [conversationId, isSending, template],
  )

  return {
    conversationId,
    messages,
    isFirstMessage: isAwaitingGoal,
    template,
    templateDraft,
    planTurn,
    confirmedScheduleId,
    canContinue: Boolean(!isAwaitingGoal && planContext && planTurn?.plan),
    isLoading,
    isLoadingOlder,
    isSending,
    hasNext,
    error,
    loadOlder,
    submit,
    submitTemplateAnswers,
    updateTemplateDraft: setTemplateDraft,
  }
}
