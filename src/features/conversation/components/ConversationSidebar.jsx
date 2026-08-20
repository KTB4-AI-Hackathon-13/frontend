import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'

import { getConversations } from '../api/conversationApi.js'

async function getAllConversations() {
  const conversations = []
  let cursor

  do {
    const page = await getConversations({ size: 100, cursor })
    conversations.push(...page.items)
    cursor = page.hasNext ? page.nextCursor : null
  } while (cursor != null)

  return conversations
}

function conversationPath(conversation) {
  return conversation.scheduleId
    ? `/schedules/${conversation.scheduleId}/conversation`
    : `/conversations/${conversation.conversationId}`
}

function ConversationSidebar({ currentConversationId, refreshKey }) {
  const [conversations, setConversations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true

    getAllConversations()
      .then((items) => {
        if (active) {
          setConversations(items)
          setError(false)
        }
      })
      .catch(() => {
        if (active) setError(true)
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [currentConversationId, refreshKey])

  return (
    <aside className="conversation-sidebar" aria-label="대화방 목록">
      <div className="conversation-sidebar__head">
        <strong>대화 목록</strong>
        <NavLink to="/conversations" className="conversation-sidebar__new">
          + 새 계획
        </NavLink>
      </div>

      <nav className="conversation-sidebar__list">
        {isLoading && <span className="conversation-sidebar__state">불러오는 중…</span>}
        {!isLoading && error && (
          <span className="conversation-sidebar__state">목록을 불러오지 못했어요.</span>
        )}
        {!isLoading && !error && conversations.length === 0 && (
          <span className="conversation-sidebar__state">아직 대화가 없어요.</span>
        )}
        {conversations.map((conversation) => (
          <NavLink
            key={conversation.conversationId}
            to={conversationPath(conversation)}
            className={`conversation-sidebar__item ${
              conversation.conversationId === currentConversationId ? 'is-active' : ''
            }`}
            title={conversation.title || '제목 없는 대화'}
          >
            <span>{conversation.title || '제목 없는 대화'}</span>
            <small>{conversation.scheduleId ? '계획 대화' : '작성 중'}</small>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default ConversationSidebar
