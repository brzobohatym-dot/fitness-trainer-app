import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAiProvider } from '@/lib/ai/provider'
import { buildTrainerSystemPrompt, buildClientSystemPrompt } from '@/lib/ai/prompts'
import type { AiMessage as ProviderMessage } from '@/lib/ai/provider'
import type { Exercise } from '@/types/database'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const supabase = createClient()

  // 1. Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Parse request
  const { message, conversationId } = await request.json() as {
    message: string
    conversationId?: string
  }

  if (!message?.trim()) {
    return Response.json({ error: 'Message is required' }, { status: 400 })
  }

  // 3. Load profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single() as { data: { id: string; role: string; trainer_id: string | null } | null }

  if (!profile) {
    return Response.json({ error: 'Profile not found' }, { status: 404 })
  }

  // 4. Get or create conversation
  let activeConversationId = conversationId

  if (activeConversationId) {
    // Verify ownership
    const { data: conv } = await (supabase
      .from('ai_conversations') as any)
      .select('id')
      .eq('id', activeConversationId)
      .eq('user_id', user.id)
      .single()

    if (!conv) {
      return Response.json({ error: 'Conversation not found' }, { status: 404 })
    }
  } else {
    // Create new conversation
    const title = message.trim().substring(0, 60) + (message.trim().length > 60 ? '...' : '')
    const { data: newConv, error: convError } = await (supabase
      .from('ai_conversations') as any)
      .insert({ user_id: user.id, title })
      .select()
      .single()

    if (convError || !newConv) {
      return Response.json({ error: 'Failed to create conversation' }, { status: 500 })
    }
    activeConversationId = newConv.id
  }

  // 5. Save user message
  await (supabase
    .from('ai_messages') as any)
    .insert({
      conversation_id: activeConversationId,
      role: 'user',
      content: message.trim(),
    })

  // 6. Load conversation history (max 20 messages for cost control)
  const { data: history } = await (supabase
    .from('ai_messages') as any)
    .select('role, content')
    .eq('conversation_id', activeConversationId)
    .order('created_at', { ascending: true })
    .limit(20)

  // 7. Build context — load exercises based on role
  let exercises: Exercise[] = []

  if (profile.role === 'trainer') {
    const { data } = await supabase
      .from('exercises')
      .select('*')
      .eq('trainer_id', user.id)
      .order('name')
    exercises = (data || []) as Exercise[]
  } else {
    // Client — get exercises from assigned plans
    const { data: clientPlans } = await (supabase
      .from('client_plans') as any)
      .select('plan_id')
      .eq('client_id', user.id)

    if (clientPlans && clientPlans.length > 0) {
      const planIds = clientPlans.map((cp: any) => cp.plan_id)
      const { data: planExercises } = await (supabase
        .from('plan_exercises') as any)
        .select('exercise:exercises(*)')
        .in('plan_id', planIds)

      if (planExercises) {
        const seen = new Set<string>()
        for (const pe of planExercises) {
          const ex = pe.exercise as Exercise | null
          if (ex && !seen.has(ex.id)) {
            seen.add(ex.id)
            exercises.push(ex)
          }
        }
      }
    }
  }

  // 8. Build messages for AI
  const systemPrompt = profile.role === 'trainer'
    ? buildTrainerSystemPrompt(exercises)
    : buildClientSystemPrompt(exercises)

  const aiMessages: ProviderMessage[] = [
    { role: 'system', content: systemPrompt },
    ...(history || []).map((m: any) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content as string,
    })),
  ]

  // 9. Call AI provider (non-streaming for Netlify compatibility)
  try {
    const provider = createAiProvider()
    const response = await provider.chat(aiMessages)

    // Save assistant message to DB
    await (supabase
      .from('ai_messages') as any)
      .insert({
        conversation_id: activeConversationId,
        role: 'assistant',
        content: response,
      })

    return Response.json({
      conversationId: activeConversationId,
      content: response,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'AI provider error'
    return Response.json({ error: errorMessage }, { status: 500 })
  }
}
