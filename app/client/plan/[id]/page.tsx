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
    .select(
      `
      *,
      exercise:exercises(*)
    `
    )
    .eq('plan_id', params.id)
    .order('order_index') as { data: any[] | null }

  if (!plan) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/client"
            className="text-xl font-bold text-primary-600 hover:text-primary-700"
          >
            FitTrainer
          </Link>
          <Link
            href="/client"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Zpět na přehled
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <ClientPlanView
            plan={plan}
            planExercises={planExercises || []}
            clientId={user.id}
          />
        </div>
      </main>
    </div>
  )
}
