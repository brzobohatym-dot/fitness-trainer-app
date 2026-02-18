'use client'

import { useState, useEffect, useCallback } from 'react'
import { AiConversation, AiMessage } from '@/types/database'
import AiChatWindow from './AiChatWindow'
import AiConversationList from './AiConversationList'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export default function AiAssistantClient() {
  const [conversations, setConversations] = useState<AiConversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [streamingContent, setStreamingContent] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)

  // Load conversations on mount
  useEffect(() => {
    loadConversations()
  }, [])

  const loadConversations = async () => {
    const res = await fetch('/api/ai-chat/conversations')
    if (res.ok) {
      const data = await res.json()
      setConversations(data)
    }
  }

  const loadConversation = useCallback(async (id: string) => {
    const res = await fetch(`/api/ai-chat/conversations/${id}`)
    if (res.ok) {
      const data = await res.json()
      setMessages(
        (data.messages || []).map((m: AiMessage) => ({
          id: m.id,
          role: m.role,
          content: m.content,
        }))
      )
      setActiveConversationId(id)
      setShowSidebar(false)
    }
  }, [])

  const handleNewConversation = () => {
    setActiveConversationId(null)
    setMessages([])
    setStreamingContent('')
    setShowSidebar(false)
  }

  const handleDeleteConversation = async (id: string) => {
    const res = await fetch('/api/ai-chat/conversations', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: id }),
    })

    if (res.ok) {
      setConversations(prev => prev.filter(c => c.id !== id))
      if (activeConversationId === id) {
        handleNewConversation()
      }
    }
  }

  const handleSendMessage = async (content: string) => {
    if (isStreaming) return

    // Add user message to UI immediately
    const userMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content,
    }
    setMessages(prev => [...prev, userMsg])
    setIsStreaming(true)
    setStreamingContent('')

    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          conversationId: activeConversationId,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to send message')
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No reader')

      const decoder = new TextDecoder()
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value)
        const lines = text.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const jsonStr = line.slice(6)
          if (!jsonStr) continue

          try {
            const data = JSON.parse(jsonStr)

            if (data.type === 'conversation_id') {
              if (!activeConversationId) {
                setActiveConversationId(data.id)
              }
            } else if (data.type === 'token') {
              fullContent += data.content
              setStreamingContent(fullContent)
            } else if (data.type === 'done') {
              // Add complete assistant message
              setMessages(prev => [
                ...prev,
                {
                  id: `assistant-${Date.now()}`,
                  role: 'assistant',
                  content: fullContent,
                },
              ])
              setStreamingContent('')
              // Refresh conversation list
              loadConversations()
            } else if (data.type === 'error') {
              throw new Error(data.message)
            }
          } catch (parseErr) {
            // Skip malformed JSON chunks
          }
        }
      }
    } catch (error) {
      // Show error as assistant message
      setMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `Omlouvám se, došlo k chybě: ${error instanceof Error ? error.message : 'Neznámá chyba'}. Zkuste to prosím znovu.`,
        },
      ])
      setStreamingContent('')
    } finally {
      setIsStreaming(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-6rem)] lg:h-[calc(100vh-2rem)] rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setShowSidebar(!showSidebar)}
        className="lg:hidden fixed top-16 right-4 z-50 w-10 h-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg flex items-center justify-center"
        aria-label="Historie konverzací"
      >
        <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {/* Sidebar — conversation list */}
      <div className={`
        ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        fixed lg:static inset-y-0 left-0 z-40
        w-72 lg:w-64 xl:w-72
        bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700
        transition-transform duration-200 lg:transition-none
      `}>
        <AiConversationList
          conversations={conversations}
          activeId={activeConversationId}
          onSelect={loadConversation}
          onDelete={handleDeleteConversation}
          onNew={handleNewConversation}
        />
      </div>

      {/* Mobile overlay */}
      {showSidebar && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/50"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AiChatWindow
          messages={messages}
          streamingContent={streamingContent}
          isStreaming={isStreaming}
          onSend={handleSendMessage}
        />
      </div>
    </div>
  )
}
