'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Message, Profile } from '@/types/database'
import MessageInput from './MessageInput'

interface ChatWindowProps {
  conversationId: string
  currentUserId: string
  otherUser: Profile | null
  initialMessages: Message[]
}

export default function ChatWindow({
  conversationId,
  currentUserId,
  otherUser,
  initialMessages,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Mark messages as read
  useEffect(() => {
    const markAsRead = async () => {
      const supabase = createClient()
      const unreadIds = messages
        .filter(m => m.sender_id !== currentUserId && !m.read_at)
        .map(m => m.id)

      if (unreadIds.length > 0) {
        await (supabase
          .from('messages') as any)
          .update({ read_at: new Date().toISOString() })
          .in('id', unreadIds)
      }
    }

    markAsRead()
  }, [messages, currentUserId])

  // Subscribe to realtime messages
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(m => m.id === newMessage.id)) {
              return prev
            }
            return [...prev, newMessage]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId])

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return

    setSending(true)
    const supabase = createClient()

    const { data, error } = await (supabase
      .from('messages') as any)
      .insert({
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: content.trim(),
      })
      .select()
      .single()

    if (!error && data) {
      // Message will be added via realtime subscription
      // But we can add it optimistically
      setMessages(prev => {
        if (prev.some(m => m.id === data.id)) {
          return prev
        }
        return [...prev, data as Message]
      })
    }

    setSending(false)
  }

  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = []
  let currentDate = ''

  messages.forEach(msg => {
    const msgDate = new Date(msg.created_at).toLocaleDateString('cs-CZ')
    if (msgDate !== currentDate) {
      currentDate = msgDate
      groupedMessages.push({ date: msgDate, messages: [msg] })
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(msg)
    }
  })

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-white">
        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
          <span className="text-primary-600 font-medium">
            {otherUser?.full_name?.[0]?.toUpperCase() || '?'}
          </span>
        </div>
        <div>
          <p className="font-medium text-gray-900">
            {otherUser?.full_name || 'Uživatel'}
          </p>
          <p className="text-sm text-gray-500">{otherUser?.email}</p>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
      >
        {groupedMessages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>Zatím žádné zprávy</p>
            <p className="text-sm">Napište první zprávu!</p>
          </div>
        ) : (
          groupedMessages.map(group => (
            <div key={group.date}>
              {/* Date separator */}
              <div className="flex items-center gap-4 my-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 font-medium">
                  {formatDateLabel(group.date)}
                </span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Messages for this date */}
              <div className="space-y-2">
                {group.messages.map(msg => {
                  const isOwn = msg.sender_id === currentUserId

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                          isOwn
                            ? 'bg-primary-600 text-white rounded-br-md'
                            : 'bg-white text-gray-900 rounded-bl-md shadow-sm'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">
                          {msg.content}
                        </p>
                        <p
                          className={`text-xs mt-1 ${
                            isOwn ? 'text-primary-200' : 'text-gray-400'
                          }`}
                        >
                          {new Date(msg.created_at).toLocaleTimeString('cs-CZ', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {isOwn && msg.read_at && (
                            <span className="ml-2">✓✓</span>
                          )}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <MessageInput onSend={handleSendMessage} disabled={sending} />
    </div>
  )
}

function formatDateLabel(dateStr: string): string {
  const [day, month, year] = dateStr.split('. ').map(Number)
  const date = new Date(year, month - 1, day)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.getTime() === today.getTime()) {
    return 'Dnes'
  } else if (date.getTime() === yesterday.getTime()) {
    return 'Včera'
  } else {
    return date.toLocaleDateString('cs-CZ', {
      day: 'numeric',
      month: 'long',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    })
  }
}
