'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  getConnectedAccounts,
  getConversations,
  getConversationMessages,
  sendMessage,
  syncMessages,
  toggleAI,
} from '@/lib/api'
import type { ConnectedAccount, Conversation, Message } from '@/lib/api'
import {
  Button,
  LoadingSpinner,
  MessageBubble,
  ConversationItem,
  Card,
  EmptyState,
} from '@/components'
import { useWebSocket } from '@/hooks/useWebSocket'

export default function Messages() {
  const [userId, setUserId] = useState<number | null>(null)
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([])
  const [selectedAccount, setSelectedAccount] = useState<ConnectedAccount | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const router = useRouter()

  // WebSocket for real-time updates
  const { isConnected, lastMessage } = useWebSocket(userId)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const storedUserId = localStorage.getItem('userId')
    if (!storedUserId) {
      router.push('/')
      return
    }
    setUserId(parseInt(storedUserId))
  }, [router])

  useEffect(() => {
    if (userId) {
      loadAccounts()
    }
  }, [userId])

  const loadAccounts = async () => {
    if (!userId) return
    try {
      const data = await getConnectedAccounts(userId)
      setAccounts(data)
      if (data.length > 0) {
        setSelectedAccount(data[0])
      }
    } catch (error) {
      console.error('Failed to load accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedAccount && userId) {
      loadConversations()
    }
  }, [selectedAccount, userId])

  // Handle incoming WebSocket messages
  useEffect(() => {
    console.log('🔔 WebSocket lastMessage changed:', lastMessage)
    if (!lastMessage) return

    console.log('🔔 Processing message type:', lastMessage.type)

    if (lastMessage.type === 'new_message') {
      console.log('🔔 NEW MESSAGE EVENT RECEIVED!')
      const { conversation_id, message } = lastMessage.data
      console.log('🔔 Conversation ID:', conversation_id)
      console.log('🔔 Message:', message)
      console.log('🔔 Selected conversation:', selectedConversation?.conversation_id)

      // If viewing this conversation, add message to list
      if (selectedConversation?.conversation_id === conversation_id) {
        console.log('✅ Adding message to current conversation')
        setMessages((prev) => [...prev, message])

        // Scroll to bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      } else {
        console.log('⚠️ Message is for different conversation, not adding to view')
      }

      // Update conversation list to show new message
      console.log('🔄 Reloading conversations list')
      loadConversations()
    } else {
      console.log('⚠️ Unknown message type:', lastMessage.type)
    }
  }, [lastMessage, selectedConversation])

  const loadConversations = async () => {
    if (!userId || !selectedAccount) return
    try {
      const data = await getConversations(userId, selectedAccount.platform)
      setConversations(data)
    } catch (error) {
      console.error('Failed to load conversations:', error)
    }
  }

  const loadMessages = async (conversation: Conversation) => {
    if (!userId) return
    try {
      const data = await getConversationMessages(conversation.conversation_id, userId)
      setMessages(data.reverse())
      setSelectedConversation(conversation)

      // Scroll to bottom after messages load
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation || !userId || !selectedAccount) return

    setSending(true)
    try {
      const message = await sendMessage(
        userId,
        selectedAccount.id,
        selectedAccount.platform,
        selectedConversation.participant_id,
        newMessage
      )

      setMessages([...messages, message])
      setNewMessage('')
    } catch (error) {
      alert('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleSync = async () => {
    if (!userId || !selectedAccount) return
    try {
      await syncMessages(userId, selectedAccount.id)
      loadConversations()
      if (selectedConversation) {
        loadMessages(selectedConversation)
      }
      alert('Messages synced successfully')
    } catch (error) {
      alert('Failed to sync messages')
    }
  }

  const handleAIToggle = async (conversationId: string, aiEnabled: boolean) => {
    if (!userId) return
    try {
      await toggleAI(conversationId, userId, aiEnabled)
      // Refresh conversations to update AI status
      loadConversations()
    } catch (error) {
      console.error('Failed to toggle AI:', error)
      alert('Failed to toggle AI auto-response')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  if (accounts.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card padding="large">
          <EmptyState
            icon="📱"
            title="No Accounts Connected"
            description="Please connect a Facebook or Instagram account first."
            action={{
              label: 'Go to Dashboard',
              onClick: () => router.push('/dashboard'),
            }}
          />
        </Card>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Messages</h1>
          {isConnected ? (
            <div className="flex items-center gap-2 text-green-600">
              <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
              <span className="text-sm font-medium">Live</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-400">
              <div className="w-2 h-2 bg-gray-400 rounded-full" />
              <span className="text-sm">Connecting...</span>
            </div>
          )}
        </div>
        <div className="flex gap-4">
          <select
            value={selectedAccount?.id || ''}
            onChange={(e) => {
              const account = accounts.find((a) => a.id === parseInt(e.target.value))
              if (account) setSelectedAccount(account)
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.platform_username || account.page_name} ({account.platform})
              </option>
            ))}
          </select>
          <Button variant="primary" onClick={handleSync}>
            Sync
          </Button>
          <Button variant="secondary" onClick={() => router.push('/dashboard')}>
            Dashboard
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Conversations List */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h2 className="font-semibold text-gray-700 mb-4">Conversations</h2>
            {conversations.length === 0 ? (
              <EmptyState
                icon="💬"
                title="No conversations"
                description="Sync your account to load conversations"
              />
            ) : (
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <ConversationItem
                    key={conv.conversation_id}
                    conversation={conv}
                    isSelected={selectedConversation?.conversation_id === conv.conversation_id}
                    onClick={() => loadMessages(conv)}
                    onAIToggle={handleAIToggle}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} userId={userId} />
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="bg-white border-t border-gray-200 p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  />
                  <Button
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    variant="primary"
                    size="medium"
                  >
                    {sending ? 'Sending...' : 'Send'}
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <EmptyState
              icon="👈"
              title="Select a conversation"
              description="Choose a conversation from the left to view and send messages"
            />
          )}
        </div>
      </div>
    </div>
  )
}
