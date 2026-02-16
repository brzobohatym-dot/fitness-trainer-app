import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'

export const dynamic = 'force-dynamic'

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

  // Get plan
  const { data: plan } = await supabase
    .from('training_plans')
    .select('*')
    .eq('id', params.id)
    .eq('trainer_id', user.id)
    .single()

  if (!plan) {
    return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
  }

  // Get exercises
  const { data: planExercises } = await supabase
    .from('plan_exercises')
    .select(`
      *,
      exercise:exercises(*)
    `)
    .eq('plan_id', params.id)
    .order('order_index')

  // Create workbook
  const wb = XLSX.utils.book_new()

  // Group exercises by group_label
  const groups: { [key: string]: any[] } = {}
  ;(planExercises || []).forEach((pe: any) => {
    const group = pe.group_label || 'Cviky'
    if (!groups[group]) {
      groups[group] = []
    }
    groups[group].push(pe)
  })

  // Create main sheet with plan overview
  const overviewData: any[][] = [
    ['TRÉNINKOVÝ PLÁN', '', '', '', '', ''],
    [''],
    ['Název:', plan.name, '', '', '', ''],
    ['Popis:', plan.description || '', '', '', '', ''],
    ['Vytvořeno:', new Date(plan.created_at).toLocaleDateString('cs-CZ'), '', '', '', ''],
    [''],
    [''],
  ]

  // Add header row
  overviewData.push(['CVIK', 'SVALOVÁ SKUPINA', 'SÉRIE', 'OPAKOVÁNÍ', 'ODPOČINEK', 'POZNÁMKY'])

  // Add exercises grouped
  Object.entries(groups).forEach(([groupName, exercises]) => {
    overviewData.push([''])
    overviewData.push([`--- ${groupName} ---`, '', '', '', '', ''])

    exercises.forEach((pe: any, index: number) => {
      overviewData.push([
        pe.exercise?.name || '',
        getMuscleGroupLabel(pe.exercise?.muscle_group),
        pe.sets,
        pe.reps,
        `${pe.rest_seconds}s`,
        pe.notes || '',
      ])
    })
  })

  const wsOverview = XLSX.utils.aoa_to_sheet(overviewData)

  // Set column widths
  wsOverview['!cols'] = [
    { wch: 30 }, // Cvik
    { wch: 15 }, // Svalová skupina
    { wch: 8 },  // Série
    { wch: 12 }, // Opakování
    { wch: 10 }, // Odpočinek
    { wch: 30 }, // Poznámky
  ]

  XLSX.utils.book_append_sheet(wb, wsOverview, 'Plán')

  // Create tracking sheet (like the template user showed)
  const trackingData: any[][] = [
    ['TÝDEN', 'DATUM', 'CVIK', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6'],
    [''],
  ]

  // Add 4 weeks of tracking
  for (let week = 1; week <= 4; week++) {
    trackingData.push([`TÝDEN ${week}`, '', '', '', '', '', '', '', ''])

    ;(planExercises || []).forEach((pe: any) => {
      trackingData.push([
        '',
        '',
        pe.exercise?.name || '',
        '',
        '',
        '',
        '',
        '',
        '',
      ])
    })

    trackingData.push(['']) // Empty row between weeks
  }

  const wsTracking = XLSX.utils.aoa_to_sheet(trackingData)

  // Set column widths for tracking sheet
  wsTracking['!cols'] = [
    { wch: 10 }, // Týden
    { wch: 12 }, // Datum
    { wch: 25 }, // Cvik
    { wch: 10 }, // S1
    { wch: 10 }, // S2
    { wch: 10 }, // S3
    { wch: 10 }, // S4
    { wch: 10 }, // S5
    { wch: 10 }, // S6
  ]

  XLSX.utils.book_append_sheet(wb, wsTracking, 'Sledování')

  // Generate buffer
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  // Return Excel file
  const filename = `${plan.name.replace(/[^a-zA-Z0-9čďěňřšťžýáíéúůČĎĚŇŘŠŤŽÝÁÍÉÚŮ ]/g, '_')}.xlsx`

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
    },
  })
}

function getMuscleGroupLabel(group: string): string {
  const labels: Record<string, string> = {
    chest: 'Prsa',
    back: 'Záda',
    legs: 'Nohy',
    shoulders: 'Ramena',
    arms: 'Ruce',
    core: 'Core',
    full_body: 'Celé tělo',
  }
  return labels[group] || group || ''
}
