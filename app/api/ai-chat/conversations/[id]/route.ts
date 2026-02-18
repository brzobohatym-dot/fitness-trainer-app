import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET: Load a conversation with its messages
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const conversationId = params.id

  // Load conversation (RLS ensures ownership)
  const { data: conversation, error: convError } = await (supabase
    .from('ai_conversations') as any)
    .select('*')
    .eq('id', conversationId)
    .eq('user_id', user.id)
    .single()

  if (convError || !conversation) {
    return Response.json({ error: 'Conversation not found' }, { status: 404 })
  }

  // Load messages
  const { data: messages } = await (supabase
    .from('ai_messages') as any)
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  return Response.json({
    ...conversation,
    messages: messages || [],
  })
}
