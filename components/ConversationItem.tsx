import { formatDistanceToNow } from 'date-fns'
import type { Conversation } from '@/lib/api'

interface ConversationItemProps {
  conversation: Conversation
  isSelected: boolean
  onClick: () => void
}

export default function ConversationItem({
  conversation,
  isSelected,
  onClick,
}: ConversationItemProps) {
  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-lg cursor-pointer transition-all ${
        isSelected
          ? 'bg-blue-50 border border-blue-200 shadow-sm'
          : 'hover:bg-gray-50 border border-transparent'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="font-semibold text-gray-800 truncate">
              {conversation.participant_name || conversation.participant_id}
            </p>
            {conversation.unread_count > 0 && (
              <span className="ml-2 bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {conversation.unread_count}
              </span>
            )}
          </div>
          {conversation.last_message && (
            <>
              <p className="text-sm text-gray-600 truncate mb-1">
                {conversation.last_message.direction === 'outgoing' && (
                  <span className="text-blue-600 mr-1">You:</span>
                )}
                {conversation.last_message.content}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 capitalize">
                  {conversation.platform}
                </span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(conversation.last_message.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
