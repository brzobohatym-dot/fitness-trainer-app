import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import CopyButton from '@/components/ui/CopyButton'

export default async function ClientsPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: clients } = await supabase
    .from('profiles')
    .select('*')
    .eq('trainer_id', user?.id)
    .order('created_at', { ascending: false })

  // Get plan counts for each client
  const clientIds = clients?.map((c) => c.id) || []
  const { data: planCounts } = await supabase
    .from('client_plans')
    .select('client_id')
    .in('client_id', clientIds.length > 0 ? clientIds : ['none'])

  const countByClient = (planCounts || []).reduce((acc, cp) => {
    acc[cp.client_id] = (acc[cp.client_id] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Klienti</h1>
      </div>

      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Vas kod pro klienty
        </h2>
        <p className="text-sm text-gray-600 mb-3">
          Sdilejte tento kod s novymi klienty, aby se mohli registrovat pod
          vasim vedenim.
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-gray-100 px-4 py-2 rounded-lg font-mono text-sm break-all">
            {user?.id}
          </code>
          <CopyButton text={user?.id || ''} />
        </div>
      </div>

      {clients && clients.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <Link
              key={client.id}
              href={`/clients/${client.id}`}
              className="card hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-600 font-semibold text-lg">
                    {client.full_name?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {client.full_name || 'Bez jmena'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {countByClient[client.id] || 0} planu
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                Registrovan: {formatDate(client.created_at)}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-2">Zatim nemate zadne klienty</p>
          <p className="text-sm text-gray-400">
            Sdilejte svuj kod s klienty, aby se mohli registrovat
          </p>
        </div>
      )}
    </div>
  )
}
