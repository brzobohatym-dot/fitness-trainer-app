'use client'

import { useRef, useEffect } from 'react'
import AiMessageBubble from './AiMessageBubble'
import AiChatInput from './AiChatInput'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface AiChatWindowProps {
  messages: Message[]
  streamingContent: string
  isStreaming: boolean
  onSend: (content: string) => void
}

export default function AiChatWindow({
  messages,
  streamingContent,
  isStreaming,
  onSend,
}: AiChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
        {messages.length === 0 && !isStreaming ? (
          <EmptyState />
        ) : (
          <>
            {messages.map(msg => (
              <AiMessageBubble key={msg.id} role={msg.role} content={msg.content} />
            ))}

            {/* Streaming message */}
            {isStreaming && streamingContent && (
              <AiMessageBubble role="assistant" content={streamingContent} isStreaming />
            )}

            {/* Loading indicator when waiting for first token */}
            {isStreaming && !streamingContent && (
              <div className="flex justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mr-2">
                  <AiSparklesIcon className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <AiChatInput onSend={onSend} disabled={isStreaming} />
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mb-4">
        <AiSparklesIcon className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        AI Asistent
      </h3>
      <p className="text-gray-500 dark:text-gray-400 max-w-md">
        Zeptejte se na cokoliv ohledně tréninku, cviků, techniky nebo výživy.
        AI asistent zná vaše cviky a tréninkové plány.
      </p>
      <div className="mt-6 flex flex-wrap gap-2 justify-center">
        {[
          'Jak správně provádět dřep?',
          'Sestav tréninkový plán na sílu',
          'Jaké cviky na záda doporučuješ?',
        ].map(suggestion => (
          <span
            key={suggestion}
            className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm text-gray-600 dark:text-gray-300"
          >
            {suggestion}
          </span>
        ))}
      </div>
    </div>
  )
}

function AiSparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  )
}
