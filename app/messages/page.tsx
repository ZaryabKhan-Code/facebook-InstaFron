'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  getConnectedAccounts,
  getConversations,
  getConversationMessages,
  sendMessage,
  syncMessages,
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
        <h1 className="text-2xl font-bold text-gray-800">Messages</h1>
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
                  <MessageBubble key={message.id} message={message} />
                ))}
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
