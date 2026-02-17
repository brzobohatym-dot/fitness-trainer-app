import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createComgatePayment } from '@/lib/comgate'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { pricingPlanId, trainerId } = await request.json()

    // Get pricing plan
    const { data: plan, error: planError } = await supabase
      .from('pricing_plans')
      .select('*')
      .eq('id', pricingPlanId)
      .single() as { data: any, error: any }

    if (planError || !plan) {
      return NextResponse.json({ error: 'Pricing plan not found' }, { status: 404 })
    }

    // Get client profile
    const { data: client } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single() as { data: any }

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        client_id: user.id,
        trainer_id: trainerId,
        pricing_plan_id: pricingPlanId,
        amount: plan.price,
        currency: plan.currency,
        status: 'pending',
      } as any)
      .select()
      .single() as { data: any, error: any }

    if (paymentError) {
      console.error('Payment creation error:', paymentError)
      return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 })
    }

    // Create Comgate payment
    const comgateResponse = await createComgatePayment({
      price: Math.round(plan.price * 100), // Convert to haléře
      currency: plan.currency,
      label: `${plan.name} - Kondičák`,
      refId: payment.id,
      email: client?.email || user.email || '',
    })

    if (comgateResponse.code !== 0 && !comgateResponse.transId) {
      // Update payment as failed
      await (supabase
        .from('payments') as any)
        .update({ status: 'failed' })
        .eq('id', payment.id)

      return NextResponse.json({
        error: comgateResponse.message || 'Failed to create Comgate payment'
      }, { status: 500 })
    }

    // Update payment with Comgate transaction ID
    await (supabase
      .from('payments') as any)
      .update({ comgate_trans_id: comgateResponse.transId })
      .eq('id', payment.id)

    return NextResponse.json({
      paymentId: payment.id,
      redirectUrl: comgateResponse.redirect,
    })
  } catch (error: any) {
    console.error('Payment error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
