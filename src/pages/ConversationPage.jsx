import { useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import ChatComposer from '../features/conversation/components/ChatComposer.jsx'
import ChatMessage from '../features/conversation/components/ChatMessage.jsx'
import ConversationSidebar from '../features/conversation/components/ConversationSidebar.jsx'
import TypingIndicator from '../features/conversation/components/TypingIndicator.jsx'
import TemplateForm from '../features/conversation/components/TemplateForm.jsx'
import PlanCard from '../features/conversation/components/PlanCard.jsx'
import { useConversation } from '../features/conversation/hooks/useConversation.js'
import '../features/conversation/styles/conversation.css'

function ConversationPage() {
  const { conversationId: requestedConversationId, scheduleId } = useParams()
  const navigate = useNavigate()
  const createNew = !requestedConversationId && !scheduleId
  const {
    conversationId,
    messages,
    isFirstMessage,
    template,
    templateDraft,
    planTurn,
    confirmedScheduleId,
    isLoading,
    isLoadingOlder,
    isSending,
    hasNext,
    error,
    loadOlder,
    submit,
    submitTemplateAnswers,
    updateTemplateDraft,
  } = useConversation({
    requestedConversationId,
    scheduleId,
    createNew,
    onConfirmed: () => navigate('/', { replace: true }),
  })
  const scrollRef = useRef(null)
  const previousMessageCount = useRef(0)

  useEffect(() => {
    const container = scrollRef.current
    if (!container || messages.length === 0) return
    if (
      isSending ||
      previousMessageCount.current === 0 ||
      messages.length - previousMessageCount.current === 2
    ) {
      container.scrollTop = container.scrollHeight
    }
    previousMessageCount.current = messages.length
  }, [isSending, messages])

  async function handleScroll(event) {
    const container = event.currentTarget
    if (container.scrollTop > 80 || !hasNext || isLoadingOlder) return
    const previousHeight = container.scrollHeight
    if (await loadOlder()) {
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight - previousHeight
      })
    }
  }

  return (
    <div className="chat-page">
      <ConversationSidebar currentConversationId={conversationId} refreshKey={messages.length} />
      <main className="chat-shell">
        <section className="chat-panel" aria-label="AI 계획 대화">
          <div className="chat-history" ref={scrollRef} onScroll={handleScroll} aria-live="polite">
            {isLoading ? (
              <div className="chat-state">대화를 준비하고 있어요.</div>
            ) : (
              <>
                <div className="chat-history__top">
                  {isLoadingOlder
                    ? '이전 메시지를 불러오는 중…'
                    : hasNext
                      ? '위로 스크롤해 이전 대화 보기'
                      : '대화의 시작'}
                </div>
                {messages.length === 0 && (
                  <div className="chat-empty">
                    <div className="chat-empty__mark">A</div>
                    <h1 id="chat-title">무엇을 계획해 볼까요?</h1>
                    <p>목표, 기간, 가능한 요일을 편하게 이야기해 주세요.</p>
                  </div>
                )}
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                {template && (
                  <div className="chat-message">
                    <TemplateForm
                      questions={template.questions ?? []}
                      disabled={isSending}
                      initialAnswers={templateDraft}
                      onAnswersChange={updateTemplateDraft}
                      onSubmit={submitTemplateAnswers}
                    />
                  </div>
                )}
                {planTurn?.plan && (
                  <div className="chat-message">
                    <PlanCard plan={planTurn.plan} readyToConfirm={planTurn.ready_to_confirm} />
                  </div>
                )}
                {isSending && <TypingIndicator />}
              </>
            )}
          </div>

          {error && (
            <p className="chat-error" role="alert">
              {error}
            </p>
          )}
          {!template && !confirmedScheduleId && (
            <ChatComposer
              isSending={isSending || isLoading}
              onSubmit={submit}
              maxLength={isFirstMessage ? 500 : 20000}
            />
          )}
          {confirmedScheduleId && (
            <p className="readiness readiness--ready">
              계획이 저장됐어요. 내 계획에서 확인할 수 있습니다.
            </p>
          )}
          <p className="chat-disclaimer">Enter로 전송 · Shift + Enter로 줄바꿈</p>
        </section>
      </main>
    </div>
  )
}

export default ConversationPage
