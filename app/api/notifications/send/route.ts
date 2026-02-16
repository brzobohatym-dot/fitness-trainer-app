import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendPushNotification } from '@/lib/notifications/webPush'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is a trainer
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single() as { data: { role: string } | null }

    if (profile?.role !== 'trainer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, title, body: messageBody, url } = body

    if (!userId || !title || !messageBody) {
      return NextResponse.json(
        { error: 'userId, title, and body are required' },
        { status: 400 }
      )
    }

    // Verify target user is trainer's client
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('trainer_id')
      .eq('id', userId)
      .single() as { data: { trainer_id: string } | null }

    if (targetProfile?.trainer_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get user's push subscriptions
    const { data: subscriptions } = await (supabase
      .from('push_subscriptions') as any)
      .select('*')
      .eq('user_id', userId) as { data: any[] | null }

    if (!subscriptions || subscriptions.length === 0) {
      // No push subscriptions, just save notification
      await (supabase.from('notifications') as any).insert({
        user_id: userId,
        title,
        body: messageBody,
        link: url || null,
      })

      return NextResponse.json({
        success: true,
        pushed: 0,
        message: 'User has no push subscriptions',
      })
    }

    // Send push notifications
    let successCount = 0
    const failedEndpoints: string[] = []

    for (const sub of subscriptions) {
      const success = await sendPushNotification(
        {
          endpoint: sub.endpoint,
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
        {
          title,
          body: messageBody,
          data: { url: url || '/' },
        }
      )

      if (success) {
        successCount++
      } else {
        failedEndpoints.push(sub.endpoint)
      }
    }

    // Remove failed subscriptions
    if (failedEndpoints.length > 0) {
      await (supabase
        .from('push_subscriptions') as any)
        .delete()
        .eq('user_id', userId)
        .in('endpoint', failedEndpoints)
    }

    // Save notification to database
    await (supabase.from('notifications') as any).insert({
      user_id: userId,
      title,
      body: messageBody,
      link: url || null,
    })

    return NextResponse.json({
      success: true,
      pushed: successCount,
      failed: failedEndpoints.length,
    })
  } catch (error) {
    console.error('Send notification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
