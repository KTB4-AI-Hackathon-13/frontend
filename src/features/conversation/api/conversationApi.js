import apiClient from '../../../shared/api/client.js'

export async function createConversation(title) {
  return apiClient.post('/conversations', title ? { title } : {})
}

export async function getMessages(conversationId, { size = 30, before } = {}) {
  return apiClient.get(`/conversations/${conversationId}/messages`, {
    params: { size, ...(before == null ? {} : { before }) },
  })
}

export async function sendMessage(conversationId, content) {
  return apiClient.post(`/conversations/${conversationId}/messages`, { message: content })
}
