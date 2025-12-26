import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://rnd-48f97bdd68a0.herokuapp.com/api'

export interface User {
  id: number
  username: string
  email: string | null
  created_at: string
  updated_at: string
}

export interface ConnectedAccount {
  id: number
  platform: string
  platform_user_id: string
  platform_username: string | null
  page_id: string | null
  page_name: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Message {
  id: number
  platform: string
  conversation_id: string
  message_id: string
  sender_id: string
  recipient_id: string
  direction: 'incoming' | 'outgoing'
  content: string
  status: 'sent' | 'delivered' | 'read' | 'failed'
  created_at: string
  updated_at: string
}

export interface Conversation {
  conversation_id: string
  platform: string
  participant_id: string
  participant_name: string | null
  last_message: Message | null
  unread_count: number
}

// User APIs
export const createUser = async (username: string, email?: string) => {
  const response = await axios.post<User>(`${API_URL}/users/`, {
    username,
    email: email || null,
  })
  return response.data
}

export const getUser = async (userId: number) => {
  const response = await axios.get<User>(`${API_URL}/users/${userId}`)
  return response.data
}

// Account APIs
export const getConnectedAccounts = async (userId: number) => {
  const response = await axios.get<ConnectedAccount[]>(
    `${API_URL}/accounts/${userId}`
  )
  return response.data
}

export const disconnectAccount = async (accountId: number) => {
  const response = await axios.delete(`${API_URL}/accounts/${accountId}`)
  return response.data
}

export const getFacebookAuthUrl = async (userId: number) => {
  const response = await axios.get<{ auth_url: string }>(
    `${API_URL}/auth/facebook/login?user_id=${userId}`
  )
  return response.data.auth_url
}

export const getInstagramAuthUrl = async (userId: number) => {
  const response = await axios.get<{ auth_url: string }>(
    `${API_URL}/auth/instagram/login?user_id=${userId}`
  )
  return response.data.auth_url
}

// Message APIs
export const getConversations = async (
  userId: number,
  platform?: string
) => {
  const params = new URLSearchParams({ user_id: userId.toString() })
  if (platform) params.append('platform', platform)

  const response = await axios.get<Conversation[]>(
    `${API_URL}/messages/conversations?${params}`
  )
  return response.data
}

export const getConversationMessages = async (
  conversationId: string,
  userId: number,
  limit = 50,
  offset = 0
) => {
  const response = await axios.get<Message[]>(
    `${API_URL}/messages/conversation/${conversationId}?user_id=${userId}&limit=${limit}&offset=${offset}`
  )
  return response.data
}

export const sendMessage = async (
  userId: number,
  accountId: number,
  platform: string,
  recipientId: string,
  content: string
) => {
  const response = await axios.post<Message>(
    `${API_URL}/messages/send?user_id=${userId}&account_id=${accountId}`,
    {
      recipient_id: recipientId,
      content,
      platform,
    }
  )
  return response.data
}

export const syncMessages = async (userId: number, accountId: number) => {
  const response = await axios.get(
    `${API_URL}/messages/sync?user_id=${userId}&account_id=${accountId}`
  )
  return response.data
}
