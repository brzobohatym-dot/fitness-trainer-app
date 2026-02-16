import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: { client?: string }
}

export default async function NewMessagePage({ searchParams }: PageProps) {
  const clientId = searchParams.client

  if (!clientId) {
    redirect('/messages')
  }

  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verify user is trainer
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: string } | null }

  if (profile?.role !== 'trainer') {
    redirect('/client/messages')
  }

  // Verify client belongs to this trainer
  const { data: client } = await supabase
    .from('profiles')
    .select('id, trainer_id')
    .eq('id', clientId)
    .single() as { data: { id: string; trainer_id: string } | null }

  if (!client || client.trainer_id !== user.id) {
    redirect('/messages')
  }

  // Check if conversation already exists
  const { data: existingConvo } = await (supabase
    .from('conversations') as any)
    .select('id')
    .eq('trainer_id', user.id)
    .eq('client_id', clientId)
    .single()

  if (existingConvo) {
    // Conversation exists, redirect to it
    redirect(`/messages/${existingConvo.id}`)
  }

  // Create new conversation
  const { data: newConvo, error } = await (supabase
    .from('conversations') as any)
    .insert({
      trainer_id: user.id,
      client_id: clientId,
    })
    .select('id')
    .single()

  if (error || !newConvo) {
    console.error('Error creating conversation:', error)
    redirect('/messages')
  }

  // Redirect to the new conversation
  redirect(`/messages/${newConvo.id}`)
}
