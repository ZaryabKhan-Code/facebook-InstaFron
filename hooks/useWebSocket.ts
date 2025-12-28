import { useEffect, useRef, useState } from 'react'

interface WebSocketMessage {
  type: string
  data: any
}

export function useWebSocket(userId: number | null) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
  const ws = useRef<WebSocket | null>(null)
  const pingInterval = useRef<NodeJS.Timeout | null>(null)
  const pongTimeout = useRef<NodeJS.Timeout | null>(null)
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)

  const connect = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!userId) return

    // Determine WebSocket URL from environment or construct from API URL
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://rnd-48f97bdd68a0.herokuapp.com/api'
    const wsProtocol = apiUrl.includes('https') ? 'wss' : 'ws'
    const wsHost = apiUrl.replace('https://', '').replace('http://', '').replace('/api', '')
    const wsUrl = `${wsProtocol}://${wsHost}/api/ws/${userId}`

    connect.current = () => {
      console.log('🔌 Connecting to WebSocket:', wsUrl)

      // Clean up existing connection if any
      if (ws.current) {
        ws.current.close()
      }

      // Connect to WebSocket
      ws.current = new WebSocket(wsUrl)

      ws.current.onopen = () => {
        console.log('✅ WebSocket connected')
        setIsConnected(true)
        reconnectAttempts.current = 0

        // Send ping every 30 seconds to keep connection alive
        pingInterval.current = setInterval(() => {
          if (ws.current?.readyState === WebSocket.OPEN) {
            console.log('🏓 Sending ping...')
            ws.current.send('ping')

            // Set timeout to detect if pong is not received
            pongTimeout.current = setTimeout(() => {
              console.error('❌ Pong not received! Connection appears dead. Reconnecting...')
              setIsConnected(false)
              if (ws.current) {
                ws.current.close()
              }
              // Reconnect will happen in onclose
            }, 5000) // Wait 5 seconds for pong
          }
        }, 30000)
      }

      ws.current.onmessage = (event) => {
        try {
          console.log('🔔 Raw WebSocket message received:', event.data)
          const data = JSON.parse(event.data)
          console.log('🔔 Parsed WebSocket message:', data)
          console.log('🔔 Message type:', data.type)

          // Handle pong response
          if (data.type === 'pong') {
            console.log('✅ Pong received - connection alive')
            // Clear the pong timeout since we received response
            if (pongTimeout.current) {
              clearTimeout(pongTimeout.current)
              pongTimeout.current = null
            }
            return
          }

          console.log('🔔 Message data:', data.data)
          setLastMessage(data)
        } catch (error) {
          console.error('❌ Failed to parse WebSocket message:', error, event.data)
        }
      }

      ws.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error)
        setIsConnected(false)
      }

      ws.current.onclose = () => {
        console.log('🔌 WebSocket disconnected')
        setIsConnected(false)

        // Clear intervals and timeouts
        if (pingInterval.current) {
          clearInterval(pingInterval.current)
          pingInterval.current = null
        }
        if (pongTimeout.current) {
          clearTimeout(pongTimeout.current)
          pongTimeout.current = null
        }

        // Attempt to reconnect with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
        reconnectAttempts.current++

        console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})...`)

        reconnectTimeout.current = setTimeout(() => {
          if (connect.current) {
            connect.current()
          }
        }, delay)
      }
    }

    // Initial connection
    connect.current()

    // Cleanup
    return () => {
      if (ws.current) {
        ws.current.close()
      }
      if (pingInterval.current) {
        clearInterval(pingInterval.current)
      }
      if (pongTimeout.current) {
        clearTimeout(pongTimeout.current)
      }
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current)
      }
    }
  }, [userId])

  return { isConnected, lastMessage }
}
