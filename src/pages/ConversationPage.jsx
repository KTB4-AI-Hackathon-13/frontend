import { useEffect, useRef } from 'react'

import ChatComposer from '../features/conversation/components/ChatComposer.jsx'
import ChatMessage from '../features/conversation/components/ChatMessage.jsx'
import TypingIndicator from '../features/conversation/components/TypingIndicator.jsx'
import { useConversation } from '../features/conversation/hooks/useConversation.js'
import '../features/conversation/styles/conversation.css'

function ConversationPage() {
  const {
    messages,
    planReadiness,
    isLoading,
    isLoadingOlder,
    isSending,
    hasNext,
    error,
    loadOlder,
    submit,
  } = useConversation()
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
                {isSending && <TypingIndicator />}
              </>
            )}
          </div>

          {planReadiness && (
            <div className={`readiness ${planReadiness.ready ? 'readiness--ready' : ''}`}>
              <span>
                {planReadiness.ready ? '계획을 만들 준비가 됐어요' : '계획을 만들려면 아래 항목이 필요해요'}
              </span>
              {/* {!planReadiness.ready && <small>{planReadiness.missingFields.join(' · ')}</small>} */}
            </div>
          )}
          {error && (
            <p className="chat-error" role="alert">
              {error}
            </p>
          )}
          <ChatComposer isSending={isSending || isLoading} onSubmit={submit} />
          <p className="chat-disclaimer">Enter로 전송 · Shift + Enter로 줄바꿈</p>
        </section>
      </main>
    </div>
  )
}

export default ConversationPage
