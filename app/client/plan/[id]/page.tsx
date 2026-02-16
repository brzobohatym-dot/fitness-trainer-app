import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ClientPlanView from '@/components/client/ClientPlanView'

export const dynamic = 'force-dynamic'

interface ClientPlanPageProps {
  params: {
    id: string
  }
}

export default async function ClientPlanPage({ params }: ClientPlanPageProps) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verify client has access to this plan
  const { data: clientPlan } = await supabase
    .from('client_plans')
    .select('*')
    .eq('client_id', user.id)
    .eq('plan_id', params.id)
    .single() as { data: any | null }

  if (!clientPlan) {
    notFound()
  }

  const { data: plan } = await supabase
    .from('training_plans')
    .select('*')
    .eq('id', params.id)
    .single() as { data: any | null }

  const { data: planExercises } = await supabase
    .from('plan_exercises')
    .select(`
      *,
      exercise:exercises(*)
    `)
    .eq('plan_id', params.id)
    .order('order_index') as { data: any[] | null }

  if (!plan) {
    notFound()
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/client"
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Zpět na přehled
        </Link>
      </div>

      <div className="max-w-3xl mx-auto">
        <ClientPlanView
          plan={plan}
          planExercises={planExercises || []}
          clientId={user.id}
        />
      </div>
    </div>
  )
}
