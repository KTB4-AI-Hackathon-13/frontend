function ChatMessage({ message }) {
  const isUser = message.role === 'USER'
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
      <p>{message.content}</p>
    </article>
  )
}

export default ChatMessage
