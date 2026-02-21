import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ChatWindow from '@/components/messages/ChatWindow'
import ConversationList from '@/components/messages/ConversationList'

export const dynamic = 'force-dynamic'

interface ConversationPageProps {
  params: { id: string }
  searchParams: { client?: string }
}

export default async function ConversationPage({
  params,
  searchParams,
}: ConversationPageProps) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single() as { data: { role: string } | null }

  if (profile?.role !== 'trainer') {
    redirect('/client/messages')
  }

  let conversationId = params.id

  // Handle "new" conversation
  if (params.id === 'new' && searchParams.client) {
    // Check if conversation already exists
    const { data: existing } = await (supabase
      .from('conversations') as any)
      .select('id')
      .eq('trainer_id', user.id)
      .eq('client_id', searchParams.client)
      .single() as { data: { id: string } | null }

    if (existing) {
      redirect(`/messages/${existing.id}`)
    }

    // Create new conversation
    const { data: newConv, error } = await (supabase
      .from('conversations') as any)
      .insert({
        trainer_id: user.id,
        client_id: searchParams.client,
      })
      .select()
      .single() as { data: { id: string } | null; error: any }

    if (error || !newConv) {
      redirect('/messages')
    }

    conversationId = newConv.id
  }

  // Get conversation
  const { data: conversation } = await (supabase
    .from('conversations') as any)
    .select(`
      *,
      client:profiles!conversations_client_id_fkey(*)
    `)
    .eq('id', conversationId)
    .eq('trainer_id', user.id)
    .single()

  if (!conversation) {
    notFound()
  }

  // Get messages
  const { data: messages } = await (supabase
    .from('messages') as any)
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  // Get all conversations for sidebar
  const { data: conversations } = await (supabase
    .from('conversations') as any)
    .select(`
      *,
      client:profiles!conversations_client_id_fkey(*)
    `)
    .eq('trainer_id', user.id)
    .order('last_message_at', { ascending: false })

  return (
    <div className="h-[calc(100vh-12rem)] lg:h-[calc(100vh-12rem)] max-lg:h-[calc(100dvh-14rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-between mb-4">
        <Link href="/messages" className="text-gray-600 hover:text-gray-900">
          ← Zpět na zprávy
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-6 h-full">
        {/* Conversations sidebar */}
        <div className="hidden md:block">
          <div className="card p-0 overflow-hidden h-full">
            <div className="p-3 border-b bg-gray-50">
              <h2 className="font-semibold text-gray-900 text-sm">Konverzace</h2>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(100% - 48px)' }}>
              <ConversationList
                conversations={(conversations as any) || []}
                currentUserId={user.id}
                isTrainer={true}
                selectedId={conversationId}
              />
            </div>
          </div>
        </div>

        {/* Chat window */}
        <div className="md:col-span-2">
          <div className="card p-0 overflow-hidden h-full">
            <ChatWindow
              conversationId={conversationId}
              currentUserId={user.id}
              otherUser={(conversation as any).client}
              initialMessages={(messages as any) || []}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
