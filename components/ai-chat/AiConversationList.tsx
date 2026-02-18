'use client'

import { AiConversation } from '@/types/database'

interface AiConversationListProps {
  conversations: AiConversation[]
  activeId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onNew: () => void
}

export default function AiConversationList({
  conversations,
  activeId,
  onSelect,
  onDelete,
  onNew,
}: AiConversationListProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header with New button */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={onNew}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nová konverzace
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
            Zatím žádné konverzace
          </div>
        ) : (
          <ul className="py-1">
            {conversations.map(conv => (
              <li key={conv.id}>
                <button
                  onClick={() => onSelect(conv.id)}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors group ${
                    activeId === conv.id
                      ? 'bg-purple-50 dark:bg-purple-900/20 border-r-2 border-purple-600'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${
                      activeId === conv.id
                        ? 'font-semibold text-purple-900 dark:text-purple-200'
                        : 'text-gray-900 dark:text-gray-100'
                    }`}>
                      {conv.title || 'Nová konverzace'}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {formatRelativeDate(conv.updated_at)}
                    </p>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(conv.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                    title="Smazat konverzaci"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Právě teď'
  if (diffMins < 60) return `Před ${diffMins} min`
  if (diffHours < 24) return `Před ${diffHours} h`
  if (diffDays < 7) return `Před ${diffDays} d`

  return date.toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'short',
  })
}
