import PlanCard from './PlanCard.jsx'

function messagePayload(message) {
  if (message.role !== 'ASSISTANT') return null
  return message.planDraft ?? (() => {
    if (typeof message.content !== 'string' || !message.content.trimStart().startsWith('{')) {
      return null
    }
    try {
      return JSON.parse(message.content)
    } catch {
      return null
    }
  })()
}

function parseMessageContent(message, payload) {
  if (message.role !== 'ASSISTANT') return message.content

  if (!payload || typeof payload !== 'object') return message.content
  if (typeof payload.assistant_message === 'string') return payload.assistant_message
  if (typeof payload.assistantMessage === 'string') return payload.assistantMessage

  if (payload.action === 'reject') {
    return payload.payload?.message ?? '계획으로 만들 목표를 다시 입력해 주세요.'
  }
  if (payload.action === 'generate_template') {
    const goal = payload.payload?.goal_summary ?? payload.payload?.goalSummary
    return goal
      ? `${goal}\n\n계획을 만들기 위해 아래 내용을 알려주세요.`
      : '계획을 만들기 위해 아래 내용을 알려주세요.'
  }

  return message.content
}

function ChatMessage({ message, completedTaskIds = [] }) {
  const isUser = message.role === 'USER'
  const payload = messagePayload(message)
  const content = parseMessageContent(message, payload)
  const time = new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(message.createdAt))

  return (
    <article
      className={`chat-message ${isUser ? 'chat-message--user' : 'chat-message--assistant'}`}
    >
      <div className="chat-message__meta">
        <span>{isUser ? 'YOU' : 'AI'}</span>
        <time dateTime={message.createdAt}>{time}</time>
      </div>
      <p>{content}</p>
      {payload?.plan && (payload.plan.daily_tasks?.length ?? 0) > 0 && (
        <PlanCard
          plan={payload.plan}
          readyToConfirm={payload.ready_to_confirm ?? payload.readyToConfirm}
          completedTaskIds={completedTaskIds}
        />
      )}
    </article>
  )
}

export default ChatMessage
