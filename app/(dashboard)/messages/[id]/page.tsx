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
  let debugInfo: string[] = []

  try {
    const supabase = createClient()
    debugInfo.push('Supabase client created')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect('/login')
    }
    debugInfo.push(`User: ${user.id}`)

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single() as { data: any; error: any }

    if (profileError) {
      debugInfo.push(`Profile error: ${profileError.message}`)
    }

    if (profile?.role !== 'trainer') {
      redirect('/client/messages')
    }
    debugInfo.push(`Role: ${profile?.role}`)

    let conversationId = params.id
    debugInfo.push(`Params id: ${params.id}`)

    // Handle "new" conversation
    if (params.id === 'new' && searchParams.client) {
      const { data: existing } = await (supabase
        .from('conversations') as any)
        .select('id')
        .eq('trainer_id', user.id)
        .eq('client_id', searchParams.client)
        .single() as { data: { id: string } | null }

      if (existing) {
        redirect(`/messages/${existing.id}`)
      }

      const { data: newConv, error: newConvError } = await (supabase
        .from('conversations') as any)
        .insert({
          trainer_id: user.id,
          client_id: searchParams.client,
        })
        .select()
        .single() as { data: { id: string } | null; error: any }

      if (newConvError || !newConv) {
        debugInfo.push(`New conv error: ${newConvError?.message}`)
        redirect('/messages')
      }

      conversationId = newConv.id
    }

    // Get conversation
    const { data: conversation, error: convError } = await (supabase
      .from('conversations') as any)
      .select(`
        *,
        client:profiles!conversations_client_id_fkey(*)
      `)
      .eq('id', conversationId)
      .eq('trainer_id', user.id)
      .single()

    if (convError) {
      debugInfo.push(`Conversation error: ${convError.message}`)
    }
    debugInfo.push(`Conversation: ${conversation ? 'found' : 'null'}`)

    if (!conversation) {
      return (
        <div className="p-8">
          <h1 className="text-xl font-bold text-red-600 mb-4">Konverzace nenalezena</h1>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800">Konverzace s ID {conversationId} nebyla nalezena nebo k ní nemáte přístup.</p>
            {convError && <p className="text-sm text-red-600 mt-2">Chyba: {convError.message}</p>}
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <p className="font-semibold text-gray-700 mb-2">Debug:</p>
            <ul className="text-xs text-gray-600 space-y-1">
              {debugInfo.map((info, i) => <li key={i}>{info}</li>)}
            </ul>
          </div>
          <Link href="/messages" className="text-primary-600 underline">← Zpět na zprávy</Link>
        </div>
      )
    }

    // Get messages
    const { data: messages, error: msgError } = await (supabase
      .from('messages') as any)
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (msgError) {
      debugInfo.push(`Messages error: ${msgError.message}`)
    }
    debugInfo.push(`Messages: ${messages?.length || 0}`)

    // Get all conversations for sidebar
    const { data: conversations } = await (supabase
      .from('conversations') as any)
      .select(`
        *,
        client:profiles!conversations_client_id_fkey(*)
      `)
      .eq('trainer_id', user.id)
      .order('last_message_at', { ascending: false })

    debugInfo.push(`Sidebar conversations: ${conversations?.length || 0}`)

    return (
      <div className="h-[calc(100vh-12rem)]">
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
                otherUser={(conversation as any).client || null}
                initialMessages={(messages as any) || []}
              />
            </div>
          </div>
        </div>
      </div>
    )
  } catch (err: any) {
    // Re-throw Next.js internal errors (redirect, notFound)
    if (err?.digest) {
      throw err
    }

    return (
      <div className="p-8">
        <h1 className="text-xl font-bold text-red-600 mb-4">Chyba na stránce konverzace</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="font-mono text-sm text-red-800 break-all">{err.message}</p>
          {err.stack && (
            <pre className="text-xs text-red-600 mt-2 overflow-auto max-h-40">{err.stack}</pre>
          )}
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
          <p className="font-semibold text-gray-700 mb-2">Debug:</p>
          <ul className="text-xs text-gray-600 space-y-1">
            {debugInfo.map((info, i) => <li key={i}>{info}</li>)}
          </ul>
        </div>
        <Link href="/messages" className="text-primary-600 underline">← Zpět na zprávy</Link>
      </div>
    )
  }
}
