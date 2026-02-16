import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PersonalRecords from '@/components/client/PersonalRecords'

export const dynamic = 'force-dynamic'

export default async function ClientRecordsPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get personal records with exercise details
  const { data: records } = await supabase
    .from('personal_records')
    .select(`
      *,
      exercise:exercises(*)
    `)
    .eq('client_id', user.id)
    .order('achieved_at', { ascending: false })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Osobní rekordy (PR)
      </h1>

      <PersonalRecords records={(records as any) || []} />
    </div>
  )
}
