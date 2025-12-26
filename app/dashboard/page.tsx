'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getConnectedAccounts, getFacebookAuthUrl, getInstagramAuthUrl, disconnectAccount } from '@/lib/api'
import type { ConnectedAccount } from '@/lib/api'
import { Card, Button, LoadingSpinner, AccountCard, EmptyState } from '@/components'

function DashboardContent() {
  const [userId, setUserId] = useState<number | null>(null)
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()

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

  useEffect(() => {
    const success = searchParams.get('success')
    if (success) {
      setTimeout(() => {
        if (userId) loadAccounts()
      }, 1000)
    }
  }, [searchParams, userId])

  const loadAccounts = async () => {
    if (!userId) return
    try {
      const data = await getConnectedAccounts(userId)
      setAccounts(data)
    } catch (error) {
      console.error('Failed to load accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConnectFacebook = async () => {
    if (!userId) return
    try {
      const authUrl = await getFacebookAuthUrl(userId)
      window.location.href = authUrl
    } catch (error) {
      alert('Failed to initiate Facebook connection')
    }
  }

  const handleConnectInstagram = async () => {
    if (!userId) return
    try {
      const authUrl = await getInstagramAuthUrl(userId)
      window.location.href = authUrl
    } catch (error) {
      alert('Failed to initiate Instagram connection')
    }
  }

  const handleDisconnect = async (accountId: number) => {
    if (!confirm('Are you sure you want to disconnect this account?')) return
    try {
      await disconnectAccount(accountId)
      loadAccounts()
    } catch (error) {
      alert('Failed to disconnect account')
    }
  }

  const handleGoToMessages = () => {
    router.push('/messages')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <Card padding="large">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Connected Accounts
            </h2>

            {accounts.length === 0 ? (
              <EmptyState
                icon="🔌"
                title="No accounts connected"
                description="Connect your Facebook or Instagram account to get started with messaging."
              />
            ) : (
              <div className="space-y-3 mb-4">
                {accounts.map((account) => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    onDisconnect={handleDisconnect}
                  />
                ))}
              </div>
            )}

            <div className="flex gap-4 mt-6">
              <Button
                variant="facebook"
                size="large"
                fullWidth
                onClick={handleConnectFacebook}
                className="flex items-center justify-center gap-2"
              >
                <span className="font-bold text-xl">f</span>
                Connect Facebook
              </Button>
              <Button
                variant="instagram"
                size="large"
                fullWidth
                onClick={handleConnectInstagram}
                className="flex items-center justify-center gap-2"
              >
                <span className="font-bold text-xl">i</span>
                Connect Instagram
              </Button>
            </div>
          </div>

          {accounts.length > 0 && (
            <div className="mt-8">
              <Button
                variant="success"
                size="large"
                fullWidth
                onClick={handleGoToMessages}
              >
                Go to Messages
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

export default function Dashboard() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <DashboardContent />
    </Suspense>
  )
}
