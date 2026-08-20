function parseMessageContent(message) {
  if (message.role !== 'ASSISTANT') return message.content

  const payload = message.planDraft ?? (() => {
    if (typeof message.content !== 'string' || !message.content.trimStart().startsWith('{')) {
      return null
    }
    try {
      return JSON.parse(message.content)
    } catch {
      return null
    }
  })()

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

function ChatMessage({ message }) {
  const isUser = message.role === 'USER'
  const content = parseMessageContent(message)
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
    </article>
  )
}

export default ChatMessage
