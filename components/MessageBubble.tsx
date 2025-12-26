import { formatDistanceToNow } from 'date-fns'
import type { Message } from '@/lib/api'

interface MessageBubbleProps {
  message: Message
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isOutgoing = message.direction === 'outgoing'

  return (
    <div className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isOutgoing
            ? 'bg-blue-600 text-white rounded-br-none'
            : 'bg-gray-200 text-gray-800 rounded-bl-none'
        }`}
      >
        <p className="break-words">{message.content}</p>
        <div className="flex items-center justify-between gap-2 mt-1">
          <p
            className={`text-xs ${
              isOutgoing ? 'text-blue-100' : 'text-gray-600'
            }`}
          >
            {formatDistanceToNow(new Date(message.created_at), {
              addSuffix: true,
            })}
          </p>
          {isOutgoing && (
            <span
              className={`text-xs ${
                message.status === 'sent'
                  ? 'text-blue-200'
                  : message.status === 'delivered'
                  ? 'text-blue-100'
                  : message.status === 'read'
                  ? 'text-green-300'
                  : 'text-red-300'
              }`}
            >
              {message.status === 'sent' && '✓'}
              {message.status === 'delivered' && '✓✓'}
              {message.status === 'read' && '✓✓'}
              {message.status === 'failed' && '✗'}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
