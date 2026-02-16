'use client'

import Link from 'next/link'
import { Conversation, Profile } from '@/types/database'

interface ConversationListProps {
  conversations: (Conversation & {
    trainer?: Profile
    client?: Profile
    unread_count?: number
  })[]
  currentUserId: string
  isTrainer: boolean
  selectedId?: string
}

export default function ConversationList({
  conversations,
  currentUserId,
  isTrainer,
  selectedId,
}: ConversationListProps) {
  const basePath = isTrainer ? '/messages' : '/client/messages'

  if (conversations.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>Žádné konverzace</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-100">
      {conversations.map(conv => {
        const otherUser = isTrainer ? conv.client : conv.trainer
        const isSelected = selectedId === conv.id

        return (
          <Link
            key={conv.id}
            href={`${basePath}/${conv.id}`}
            className={`block p-4 hover:bg-gray-50 transition-colors ${
              isSelected ? 'bg-primary-50' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                <span className="text-primary-600 font-medium">
                  {otherUser?.full_name?.[0]?.toUpperCase() || '?'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900 truncate">
                    {otherUser?.full_name || 'Uživatel'}
                  </p>
                  <span className="text-xs text-gray-400">
                    {formatTime(conv.last_message_at)}
                  </span>
                </div>
                <p className="text-sm text-gray-500 truncate">
                  {otherUser?.email}
                </p>
              </div>
              {conv.unread_count && conv.unread_count > 0 && (
                <div className="w-5 h-5 rounded-full bg-primary-600 text-white text-xs flex items-center justify-center">
                  {conv.unread_count}
                </div>
              )}
            </div>
          </Link>
        )
      })}
    </div>
  )
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    return date.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })
  } else if (days === 1) {
    return 'Včera'
  } else if (days < 7) {
    return date.toLocaleDateString('cs-CZ', { weekday: 'short' })
  } else {
    return date.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' })
  }
}
