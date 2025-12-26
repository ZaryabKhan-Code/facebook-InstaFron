'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { Card, Input, Button } from '@/components'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

export default function Home() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await axios.post(`${API_URL}/users/`, {
        username,
        email: email || null,
      })

      // Store user ID in localStorage
      localStorage.setItem('userId', response.data.id.toString())

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  const handleExistingUser = () => {
    const userId = prompt('Enter your User ID:')
    if (userId) {
      localStorage.setItem('userId', userId)
      router.push('/dashboard')
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card padding="large" className="max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">
          Social Messaging
        </h1>
        <p className="text-center text-gray-600 mb-6">
          Connect your Facebook and Instagram accounts
        </p>

        <form onSubmit={handleCreateUser} className="space-y-4">
          <Input
            label="Username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            required
          />

          <Input
            label="Email (optional)"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
          />

          <Button
            type="submit"
            disabled={loading}
            variant="primary"
            size="medium"
            fullWidth
          >
            {loading ? 'Creating...' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={handleExistingUser}
            className="text-blue-600 hover:text-blue-700 text-sm hover:underline"
          >
            Already have an account? Click here
          </button>
        </div>
      </Card>
    </main>
  )
}
