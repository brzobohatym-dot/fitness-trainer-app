import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify trainer has access to this client
  const { data: client } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.id)
    .eq('trainer_id', user.id)
    .single()

  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  }

  // Get client's plans
  const { data: clientPlans } = await supabase
    .from('client_plans')
    .select(`
      *,
      plan:training_plans(
        *,
        plan_exercises:plan_exercises(
          *,
          exercise:exercises(*)
        )
      )
    `)
    .eq('client_id', params.id)
    .order('assigned_at', { ascending: false })

  // Get workout logs
  const { data: workoutLogs } = await supabase
    .from('workout_logs')
    .select('*')
    .eq('client_id', params.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Get body measurements
  const { data: measurements } = await supabase
    .from('body_measurements')
    .select('*')
    .eq('client_id', params.id)
    .order('measured_at', { ascending: false })
    .limit(10)

  // Get personal records
  const { data: records } = await supabase
    .from('personal_records')
    .select(`
      *,
      exercise:exercises(name)
    `)
    .eq('client_id', params.id)
    .order('one_rep_max', { ascending: false })
    .limit(10)

  // Generate HTML report (can be converted to PDF using browser print)
  const html = generateReportHTML({
    client,
    clientPlans: clientPlans || [],
    workoutLogs: workoutLogs || [],
    measurements: measurements || [],
    records: records || [],
  })

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
}

function generateReportHTML(data: {
  client: any
  clientPlans: any[]
  workoutLogs: any[]
  measurements: any[]
  records: any[]
}) {
  const { client, clientPlans, workoutLogs, measurements, records } = data
  const today = new Date().toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return `
<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Report - ${client.full_name || 'Klient'}</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    h1 {
      font-size: 24px;
      margin-bottom: 8px;
      color: #4f46e5;
    }
    h2 {
      font-size: 18px;
      margin: 24px 0 12px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e5e7eb;
    }
    h3 {
      font-size: 14px;
      margin: 16px 0 8px;
      color: #6b7280;
    }
    .header {
      margin-bottom: 32px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e5e7eb;
    }
    .date {
      color: #6b7280;
      font-size: 14px;
    }
    .card {
      background: #f9fafb;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      font-size: 14px;
    }
    th, td {
      text-align: left;
      padding: 8px 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    th {
      background: #f3f4f6;
      font-weight: 600;
    }
    .stat {
      display: inline-block;
      margin-right: 24px;
      margin-bottom: 8px;
    }
    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #4f46e5;
    }
    .stat-label {
      font-size: 12px;
      color: #6b7280;
    }
    .empty {
      color: #9ca3af;
      font-style: italic;
    }
    @media print {
      body {
        padding: 20px;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${client.full_name || 'Klient'}</h1>
    <p class="date">Report vygenerován: ${today}</p>
    ${client.email ? `<p class="date">Email: ${client.email}</p>` : ''}
  </div>

  <button onclick="window.print()" class="no-print" style="padding: 10px 20px; background: #4f46e5; color: white; border: none; border-radius: 8px; cursor: pointer; margin-bottom: 20px;">
    Vytisknout / Uložit PDF
  </button>

  <h2>Statistiky</h2>
  <div class="card">
    <div class="stat">
      <div class="stat-value">${workoutLogs.length}</div>
      <div class="stat-label">Tréninků</div>
    </div>
    <div class="stat">
      <div class="stat-value">${clientPlans.length}</div>
      <div class="stat-label">Plánů</div>
    </div>
    <div class="stat">
      <div class="stat-value">${records.length}</div>
      <div class="stat-label">Osobních rekordů</div>
    </div>
    ${measurements.length > 0 && measurements[0].body_weight ? `
    <div class="stat">
      <div class="stat-value">${measurements[0].body_weight} kg</div>
      <div class="stat-label">Aktuální váha</div>
    </div>
    ` : ''}
  </div>

  <h2>Přiřazené plány</h2>
  ${clientPlans.length === 0
    ? '<p class="empty">Žádné přiřazené plány</p>'
    : `
    <table>
      <thead>
        <tr>
          <th>Plán</th>
          <th>Přiřazeno</th>
          <th>Období</th>
        </tr>
      </thead>
      <tbody>
        ${clientPlans.map(cp => `
          <tr>
            <td>${cp.plan?.name || '—'}</td>
            <td>${new Date(cp.assigned_at).toLocaleDateString('cs-CZ')}</td>
            <td>${cp.start_date ? new Date(cp.start_date).toLocaleDateString('cs-CZ') : '—'} - ${cp.end_date ? new Date(cp.end_date).toLocaleDateString('cs-CZ') : '—'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `}

  <h2>Osobní rekordy (Top 10)</h2>
  ${records.length === 0
    ? '<p class="empty">Žádné osobní rekordy</p>'
    : `
    <table>
      <thead>
        <tr>
          <th>Cvik</th>
          <th>Váha</th>
          <th>Opakování</th>
          <th>1RM</th>
          <th>Datum</th>
        </tr>
      </thead>
      <tbody>
        ${records.map((r: any) => `
          <tr>
            <td>${r.exercise?.name || '—'}</td>
            <td>${r.weight} kg</td>
            <td>${r.reps}</td>
            <td>${r.one_rep_max ? r.one_rep_max.toFixed(1) + ' kg' : '—'}</td>
            <td>${new Date(r.achieved_at).toLocaleDateString('cs-CZ')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `}

  <h2>Měření těla</h2>
  ${measurements.length === 0
    ? '<p class="empty">Žádná měření</p>'
    : `
    <table>
      <thead>
        <tr>
          <th>Datum</th>
          <th>Váha</th>
          <th>Hrudník</th>
          <th>Pas</th>
          <th>Boky</th>
        </tr>
      </thead>
      <tbody>
        ${measurements.map((m: any) => `
          <tr>
            <td>${new Date(m.measured_at).toLocaleDateString('cs-CZ')}</td>
            <td>${m.body_weight ? m.body_weight + ' kg' : '—'}</td>
            <td>${m.chest_cm ? m.chest_cm + ' cm' : '—'}</td>
            <td>${m.waist_cm ? m.waist_cm + ' cm' : '—'}</td>
            <td>${m.hips_cm ? m.hips_cm + ' cm' : '—'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `}

  <h2>Poslední tréninky</h2>
  ${workoutLogs.length === 0
    ? '<p class="empty">Žádné tréninky</p>'
    : `
    <table>
      <thead>
        <tr>
          <th>Datum</th>
          <th>Únava</th>
          <th>Bolest svalů</th>
          <th>Nálada</th>
        </tr>
      </thead>
      <tbody>
        ${workoutLogs.map((w: any) => `
          <tr>
            <td>${new Date(w.created_at).toLocaleDateString('cs-CZ')}</td>
            <td>${w.fatigue_level}/5</td>
            <td>${w.muscle_pain}/5</td>
            <td>${w.mood}/5</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `}

  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px;">
    FitTrainer - ${today}
  </div>
</body>
</html>
  `.trim()
}
