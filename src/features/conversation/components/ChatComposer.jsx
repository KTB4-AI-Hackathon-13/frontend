import { useState } from 'react'

function ChatComposer({ isSending, onSubmit }) {
  const [content, setContent] = useState('')

  async function submit(event) {
    event.preventDefault()
    if (await onSubmit(content)) setContent('')
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  return (
    <form className="chat-composer" onSubmit={submit}>
      <label className="sr-only" htmlFor="chat-message-input">
        AI에게 보낼 메시지
      </label>
      <textarea
        id="chat-message-input"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="어떤 모습이 되고 싶은지 이야기해 주세요."
        rows={1}
        maxLength={20000}
        readOnly={isSending}
        aria-busy={isSending}
      />
      <button type="submit" disabled={isSending || !content.trim()} aria-label="메시지 보내기">
        {isSending ? (
          '···'
        ) : (
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 19V5M6.5 10.5 12 5l5.5 5.5" />
          </svg>
        )}
      </button>
    </form>
  )
}

export default ChatComposer
