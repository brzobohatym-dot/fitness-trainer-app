'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ChatWindow from '@/components/messages/ChatWindow'
import { Conversation, Message, Profile } from '@/types/database'

export default function ClientMessagesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [trainer, setTrainer] = useState<Profile | null>(null)
  const [messages, setMessages] = useState<Message[]>([])

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*, trainer:profiles!profiles_trainer_id_fkey(*)')
        .eq('id', user.id)
        .single() as { data: any }

      setUserId(user.id)
      setTrainer(profile?.trainer || null)

      if (!profile?.trainer_id) {
        setLoading(false)
        return
      }

      // Get or create conversation
      let { data: conv } = await (supabase
        .from('conversations') as any)
        .select('*')
        .eq('client_id', user.id)
        .eq('trainer_id', profile.trainer_id)
        .single() as { data: any }

      if (!conv) {
        // Create conversation
        const { data: newConv } = await (supabase
          .from('conversations') as any)
          .insert({
            client_id: user.id,
            trainer_id: profile.trainer_id,
          })
          .select()
          .single()

        conv = newConv
      }

      if (conv) {
        setConversation(conv as Conversation)

        // Load messages
        const { data: msgs } = await (supabase
          .from('messages') as any)
          .select('*')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: true })

        setMessages((msgs as Message[]) || [])
      }

      setLoading(false)
    }

    loadData()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (!trainer) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Zprávy</h1>
        <div className="card text-center py-12">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <p className="text-gray-500">Nemáte přiřazeného trenéra</p>
          <p className="text-sm text-gray-400 mt-1">
            Požádejte trenéra, aby vás přidal jako klienta
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-12rem)]">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Zprávy</h1>

      {conversation && userId ? (
        <div className="card p-0 overflow-hidden h-[calc(100%-4rem)]">
          <ChatWindow
            conversationId={conversation.id}
            currentUserId={userId}
            otherUser={trainer}
            initialMessages={messages}
          />
        </div>
      ) : (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      )}
    </div>
  )
}
