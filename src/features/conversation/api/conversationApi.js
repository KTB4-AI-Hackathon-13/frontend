import apiClient from '../../../shared/api/client.js'

export function createConversation(title) {
  return apiClient.post('/conversations', title ? { title } : {})
}

export function getConversations({ size = 20, cursor } = {}) {
  return apiClient.get('/conversations', {
    params: { size, ...(cursor == null ? {} : { cursor }) },
  })
}

export function getConversation(conversationId) {
  return apiClient.get(`/conversations/${conversationId}`)
}

export function getMessages(conversationId, { size = 30, before } = {}) {
  return apiClient.get(`/conversations/${conversationId}/messages`, {
    params: { size, ...(before == null ? {} : { before }) },
  })
}

export function getConversationBySchedule(scheduleId) {
  return apiClient.get(`/schedules/${scheduleId}/conversation`)
}

export function generateScheduleTemplate(conversationId, text) {
  return apiClient.post(
    '/schedules/templates',
    {
      conversationId,
      // 배포된 BE(message)와 현재 작업본(text) 양쪽 계약을 지원한다.
      message: text,
      text,
    },
    { timeout: 60000 },
  )
}

export function generateSchedule({ conversationId, goalSummary, category, templateAnswers }) {
  return apiClient.post(
    '/schedules/ai-generations',
    {
      // 배포된 BE의 camelCase 계약도 함께 지원한다.
      conversationId,
      goalSummary,
      templateAnswers,
      busyDates: [],
      longTermContext: null,
      // 현재 작업본 BE의 snake_case 계약도 함께 지원한다.
      conversation_id: conversationId,
      goal_summary: goalSummary,
      category,
      template_answers: templateAnswers,
      busy_dates: [],
      long_term_context: null,
    },
    { timeout: 60000 },
  )
}

export function sendMessage(
  conversationId,
  { content, goalSummary, category, templateAnswers, currentPlan, feedbackHistory },
) {
  return apiClient.post(
    `/conversations/${conversationId}/messages`,
    {
      message: content,
      goal_summary: goalSummary,
      category,
      template_answers: templateAnswers,
      current_plan: currentPlan,
      feedback_history: feedbackHistory,
      busy_dates: [],
    },
    { timeout: 60000 },
  )
}
