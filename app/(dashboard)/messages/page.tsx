import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ConversationList from '@/components/messages/ConversationList'

export const dynamic = 'force-dynamic'

export default async function MessagesPage() {
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
    } else {
      debugInfo.push(`Profile role: ${profile?.role}`)
    }

    if (profile?.role !== 'trainer') {
      redirect('/client/messages')
    }

    // Get conversations with unread count
    const { data: conversations, error: convError } = await (supabase
      .from('conversations') as any)
      .select(`
        *,
        client:profiles!conversations_client_id_fkey(*)
      `)
      .eq('trainer_id', user.id)
      .order('last_message_at', { ascending: false }) as { data: any[] | null; error: any }

    if (convError) {
      debugInfo.push(`Conversations error: ${convError.message}`)
    } else {
      debugInfo.push(`Conversations: ${conversations?.length || 0}`)
    }

    // Get unread counts
    const conversationsWithUnread = await Promise.all(
      (conversations || []).map(async (conv: any) => {
        const { count } = await (supabase
          .from('messages') as any)
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .neq('sender_id', user.id)
          .is('read_at', null)

        return { ...conv, unread_count: count || 0 }
      })
    )
    debugInfo.push('Unread counts loaded')

    // Get clients without conversations
    const { data: clients, error: clientsError } = await supabase
      .from('profiles')
      .select('*')
      .eq('trainer_id', user.id)
      .eq('role', 'client') as { data: any[] | null; error: any }

    if (clientsError) {
      debugInfo.push(`Clients error: ${clientsError.message}`)
    } else {
      debugInfo.push(`Clients: ${clients?.length || 0}`)
    }

    const clientsWithoutConvo = (clients || []).filter(
      (client: any) => !conversations?.some((c: any) => c.client_id === client.id)
    )

    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Zprávy</h1>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Conversations list */}
          <div className="md:col-span-2">
            <div className="card p-0 overflow-hidden">
              <div className="p-4 border-b bg-gray-50">
                <h2 className="font-semibold text-gray-900">Konverzace</h2>
              </div>
              {conversationsWithUnread.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <svg
                    className="w-12 h-12 mx-auto mb-4 text-gray-300"
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
                  <p>Zatím žádné konverzace</p>
                  <p className="text-sm mt-1">Začněte konverzaci s klientem</p>
                </div>
              ) : (
                <ConversationList
                  conversations={conversationsWithUnread as any}
                  currentUserId={user.id}
                  isTrainer={true}
                />
              )}
            </div>
          </div>

          {/* Start new conversation */}
          <div>
            <div className="card">
              <h2 className="font-semibold text-gray-900 mb-4">
                Nová konverzace
              </h2>
              {clientsWithoutConvo.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Máte konverzaci se všemi klienty
                </p>
              ) : (
                <div className="space-y-2">
                  {clientsWithoutConvo.map((client: any) => (
                    <StartConversationButton
                      key={client.id}
                      client={client}
                      trainerId={user.id}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  } catch (err: any) {
    // Check if it's a redirect (Next.js throws for redirects)
    if (err?.digest?.startsWith('NEXT_REDIRECT')) {
      throw err
    }

    return (
      <div className="p-8">
        <h1 className="text-xl font-bold text-red-600 mb-4">Chyba na stránce Zprávy</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="font-mono text-sm text-red-800 break-all">{err.message}</p>
          {err.stack && (
            <pre className="text-xs text-red-600 mt-2 overflow-auto max-h-40">{err.stack}</pre>
          )}
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="font-semibold text-gray-700 mb-2">Debug info:</p>
          <ul className="text-sm text-gray-600 space-y-1">
            {debugInfo.map((info, i) => (
              <li key={i}>{info}</li>
            ))}
          </ul>
        </div>
      </div>
    )
  }
}

function StartConversationButton({
  client,
  trainerId,
}: {
  client: any
  trainerId: string
}) {
  return (
    <form action={`/messages/new?client=${client.id}`} method="GET">
      <button
        type="submit"
        className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
          <span className="text-primary-600 font-medium text-sm">
            {client.full_name?.[0]?.toUpperCase() || '?'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 text-sm truncate">
            {client.full_name || 'Bez jména'}
          </p>
          <p className="text-xs text-gray-500 truncate">{client.email}</p>
        </div>
        <svg
          className="w-4 h-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>
    </form>
  )
}
