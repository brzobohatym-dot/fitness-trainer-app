import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Lazy initialization for supabase admin
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdmin()
    const formData = await request.formData()

    const transId = formData.get('transId') as string
    const refId = formData.get('refId') as string
    const status = formData.get('status') as string
    const secret = formData.get('secret') as string

    // Verify secret
    if (secret !== process.env.COMGATE_SECRET) {
      console.error('Invalid webhook secret')
      return new Response('code=1&message=Invalid secret', { status: 200 })
    }

    console.log('Comgate webhook:', { transId, refId, status })

    // Map Comgate status to our status
    let paymentStatus = 'pending'
    if (status === 'PAID') {
      paymentStatus = 'paid'
    } else if (status === 'CANCELLED' || status === 'EXPIRED') {
      paymentStatus = 'failed'
    }

    // Update payment
    const { data: payment, error } = await supabase
      .from('payments')
      .update({
        status: paymentStatus,
        comgate_trans_id: transId,
        paid_at: paymentStatus === 'paid' ? new Date().toISOString() : null,
      })
      .eq('id', refId)
      .select('*, pricing_plan:pricing_plans(*)')
      .single()

    if (error) {
      console.error('Payment update error:', error)
      return new Response('code=1&message=Payment not found', { status: 200 })
    }

    // If paid and it's a subscription plan, create/update subscription
    if (paymentStatus === 'paid' && payment.pricing_plan?.interval !== 'once') {
      const periodEnd = new Date()
      if (payment.pricing_plan?.interval === 'month') {
        periodEnd.setMonth(periodEnd.getMonth() + 1)
      } else if (payment.pricing_plan?.interval === 'year') {
        periodEnd.setFullYear(periodEnd.getFullYear() + 1)
      }

      // Check if subscription exists
      const { data: existingSub } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('client_id', payment.client_id)
        .eq('trainer_id', payment.trainer_id)
        .single()

      if (existingSub) {
        // Update existing subscription
        await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            pricing_plan_id: payment.pricing_plan_id,
            current_period_start: new Date().toISOString(),
            current_period_end: periodEnd.toISOString(),
          })
          .eq('id', existingSub.id)
      } else {
        // Create new subscription
        await supabase
          .from('subscriptions')
          .insert({
            client_id: payment.client_id,
            trainer_id: payment.trainer_id,
            pricing_plan_id: payment.pricing_plan_id,
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: periodEnd.toISOString(),
          })
      }
    }

    return new Response('code=0&message=OK', { status: 200 })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return new Response('code=1&message=Error', { status: 200 })
  }
}
