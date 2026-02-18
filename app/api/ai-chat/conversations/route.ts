import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET: List all conversations for the current user
export async function GET() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: conversations, error } = await (supabase
    .from('ai_conversations') as any)
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) {
    return Response.json({ error: 'Failed to load conversations' }, { status: 500 })
  }

  return Response.json(conversations || [])
}

// DELETE: Delete a conversation
export async function DELETE(request: NextRequest) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { conversationId } = await request.json() as { conversationId: string }

  if (!conversationId) {
    return Response.json({ error: 'conversationId is required' }, { status: 400 })
  }

  const { error } = await (supabase
    .from('ai_conversations') as any)
    .delete()
    .eq('id', conversationId)
    .eq('user_id', user.id)

  if (error) {
    return Response.json({ error: 'Failed to delete conversation' }, { status: 500 })
  }

  return Response.json({ success: true })
}
