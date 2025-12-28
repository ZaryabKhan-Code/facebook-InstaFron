'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getAISettings, updateAISettings, testAIResponse, getConversations } from '@/lib/api'
import type { AISettings, Conversation } from '@/lib/api'
import { Button, LoadingSpinner, Card } from '@/components'

export default function AISettingsPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<string>('')
  const [testMessage, setTestMessage] = useState('Hello, how can you help me?')

  const [settings, setSettings] = useState<Partial<AISettings>>({
    ai_provider: 'openai',
    api_key: '',
    model_name: 'gpt-4',
    system_prompt: 'You are a helpful customer service assistant. Be professional, friendly, and concise in your responses.',
    response_tone: 'professional',
    max_tokens: 500,
    temperature: 7,
    context_messages_count: 10,
  })

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
      loadSettings()
      loadConversations()
    }
  }, [userId])

  const loadSettings = async () => {
    if (!userId) return
    setLoading(true)
    try {
      const data = await getAISettings(userId)
      setSettings(data)
    } catch (error: any) {
      // If no settings exist yet, use defaults
      if (error.response?.status !== 404) {
        console.error('Failed to load AI settings:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  const loadConversations = async () => {
    if (!userId) return
    try {
      const data = await getConversations(userId)
      setConversations(data)
      if (data.length > 0 && !selectedConversationId) {
        setSelectedConversationId(data[0].conversation_id)
      }
    } catch (error) {
      console.error('Failed to load conversations:', error)
    }
  }

  const handleSave = async () => {
    if (!userId) return
    setSaving(true)
    try {
      await updateAISettings(userId, { ...settings, user_id: userId })
      alert('AI settings saved successfully!')
    } catch (error) {
      console.error('Failed to save settings:', error)
      alert('Failed to save AI settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    if (!userId || !selectedConversationId || !testMessage.trim()) {
      alert('Please select a conversation and enter a test message')
      return
    }

    setTesting(true)
    setTestResult(null)
    try {
      const result = await testAIResponse(userId, selectedConversationId, testMessage)
      setTestResult(result.response)
    } catch (error: any) {
      console.error('Failed to test AI:', error)
      if (error.response?.data?.detail) {
        alert(`Test failed: ${error.response.data.detail}`)
      } else {
        alert('Failed to test AI response. Please make sure your API key is valid and saved.')
      }
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Settings</h1>
            <p className="text-gray-600 mt-2">Configure your AI assistant for automated responses</p>
          </div>
          <Button variant="secondary" onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>

        {/* Main Settings Card */}
        <Card padding="large">
          <div className="space-y-6">
            {/* AI Provider */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AI Provider
              </label>
              <select
                value={settings.ai_provider}
                onChange={(e) => setSettings({
                  ...settings,
                  ai_provider: e.target.value as 'openai' | 'anthropic',
                  model_name: e.target.value === 'openai' ? 'gpt-4' : 'claude-3-5-sonnet-20241022'
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              >
                <option value="openai">OpenAI (GPT)</option>
                <option value="anthropic">Anthropic (Claude)</option>
              </select>
            </div>

            {/* Model Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model
              </label>
              <select
                value={settings.model_name}
                onChange={(e) => setSettings({ ...settings, model_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              >
                {settings.ai_provider === 'openai' ? (
                  <>
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  </>
                ) : (
                  <>
                    <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                    <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                    <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
                    <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
                  </>
                )}
              </select>
            </div>

            {/* API Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key
              </label>
              <input
                type="password"
                value={settings.api_key || ''}
                onChange={(e) => setSettings({ ...settings, api_key: e.target.value })}
                placeholder={settings.ai_provider === 'openai' ? 'sk-...' : 'sk-ant-...'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
              <p className="text-sm text-gray-500 mt-1">
                {settings.ai_provider === 'openai'
                  ? 'Get your API key from https://platform.openai.com/api-keys'
                  : 'Get your API key from https://console.anthropic.com/'}
              </p>
            </div>

            {/* System Prompt */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                System Prompt (Instructions for AI)
              </label>
              <textarea
                value={settings.system_prompt || ''}
                onChange={(e) => setSettings({ ...settings, system_prompt: e.target.value })}
                rows={4}
                placeholder="Define how the AI should behave, its role, and guidelines..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>

            {/* Response Tone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Response Tone
              </label>
              <select
                value={settings.response_tone}
                onChange={(e) => setSettings({ ...settings, response_tone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              >
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="casual">Casual</option>
                <option value="formal">Formal</option>
              </select>
            </div>

            {/* Advanced Settings */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Settings</h3>

              {/* Temperature */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temperature: {settings.temperature ? settings.temperature / 10 : 0.7}
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={settings.temperature || 7}
                  onChange={(e) => setSettings({ ...settings, temperature: parseInt(e.target.value) })}
                  className="w-full"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Lower = more focused, Higher = more creative
                </p>
              </div>

              {/* Max Tokens */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Tokens (Response Length)
                </label>
                <input
                  type="number"
                  value={settings.max_tokens}
                  onChange={(e) => setSettings({ ...settings, max_tokens: parseInt(e.target.value) })}
                  min="50"
                  max="2000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>

              {/* Context Messages */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Context Messages Count
                </label>
                <input
                  type="number"
                  value={settings.context_messages_count}
                  onChange={(e) => setSettings({ ...settings, context_messages_count: parseInt(e.target.value) })}
                  min="1"
                  max="50"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Number of recent messages to include as context for AI
                </p>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <Button
                variant="primary"
                size="large"
                onClick={handleSave}
                disabled={saving || !settings.api_key}
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Test AI Response Card */}
        <Card padding="large" className="mt-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Test AI Response</h2>
          <p className="text-gray-600 mb-4">
            Test how your AI assistant will respond before enabling it for live conversations
          </p>

          <div className="space-y-4">
            {/* Conversation Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Conversation (for context)
              </label>
              <select
                value={selectedConversationId}
                onChange={(e) => setSelectedConversationId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                disabled={conversations.length === 0}
              >
                {conversations.length === 0 ? (
                  <option>No conversations available</option>
                ) : (
                  conversations.map((conv) => (
                    <option key={conv.conversation_id} value={conv.conversation_id}>
                      {conv.participant_name || conv.participant_username || conv.participant_id} ({conv.platform})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Test Message Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Message
              </label>
              <textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                rows={3}
                placeholder="Enter a message to see how AI would respond..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>

            {/* Test Button */}
            <div>
              <Button
                variant="primary"
                onClick={handleTest}
                disabled={testing || !settings.api_key || !selectedConversationId || !testMessage.trim()}
              >
                {testing ? 'Testing...' : 'Test AI Response'}
              </Button>
            </div>

            {/* Test Result */}
            {testResult && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <p className="text-sm font-medium text-blue-900 mb-2">AI Response:</p>
                <p className="text-blue-800">{testResult}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Info Card */}
        <Card padding="large" className="mt-6 bg-yellow-50 border-yellow-200">
          <div className="flex gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Important Notes</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Your API key is stored securely and never shared</li>
                <li>• AI responses are charged to your OpenAI/Anthropic account</li>
                <li>• Enable AI per conversation using the toggle button (🤖) in the Messages page</li>
                <li>• AI will only respond when enabled for specific conversations</li>
                <li>• Test your settings before enabling for live conversations</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
