import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'brzobohatym@seznam.cz'

// Lazy initialization for web-push
let webPushInstance: any = null

function getWebPush() {
  if (!webPushInstance) {
    const webPush = require('web-push')
    if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      try {
        webPush.setVapidDetails(
          'mailto:' + ADMIN_EMAIL,
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
          process.env.VAPID_PRIVATE_KEY
        )
        webPushInstance = webPush
      } catch (error) {
        console.error('Failed to initialize web-push:', error)
        return null
      }
    }
  }
  return webPushInstance
}

export async function POST(request: Request) {
  try {
    const { trainerName, trainerEmail } = await request.json()

    const results = {
      email: { success: false, error: null as string | null },
      push: { success: false, error: null as string | null },
    }

    // Send email notification
    try {
      await resend.emails.send({
        from: 'Kondičák <noreply@kondicnikometa.cz>',
        to: ADMIN_EMAIL,
        subject: 'Nový trenér čeká na schválení',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e4a8d;">Nový trenér čeká na schválení</h2>
            <p>V aplikaci Kondičák se zaregistroval nový trenér:</p>
            <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p style="margin: 0;"><strong>Jméno:</strong> ${trainerName || 'Neuvedeno'}</p>
              <p style="margin: 8px 0 0;"><strong>Email:</strong> ${trainerEmail}</p>
            </div>
            <p>Pro schválení trenéra:</p>
            <ol>
              <li>Přihlaste se do <a href="https://supabase.com/dashboard">Supabase Dashboard</a></li>
              <li>Jděte do Table Editor → profiles</li>
              <li>Najděte trenéra podle emailu</li>
              <li>Změňte <code>is_approved</code> na <code>true</code></li>
            </ol>
          </div>
        `,
      })
      results.email.success = true
    } catch (emailError: any) {
      console.error('Email notification error:', emailError)
      results.email.error = emailError.message
    }

    // Send push notification to admin
    // We need to get admin's push subscription from database
    try {
      const webPush = getWebPush()
      if (!webPush) {
        results.push.error = 'Web push not configured'
      } else {
        const { createClient } = await import('@/lib/supabase/server')
        const supabase = createClient()

        // Find admin user (the first approved trainer or specific email)
        const { data: adminProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', ADMIN_EMAIL)
          .single() as { data: any }

        if (adminProfile) {
          // Get admin's push subscriptions
          const { data: subscriptions } = await supabase
            .from('push_subscriptions')
            .select('*')
            .eq('user_id', adminProfile.id) as { data: any[] | null }

          if (subscriptions && subscriptions.length > 0) {
            const payload = JSON.stringify({
              title: 'Nový trenér čeká na schválení',
              body: `${trainerName || trainerEmail} se zaregistroval jako trenér`,
              icon: '/icons/icon-192x192.png',
              data: {
                url: 'https://supabase.com/dashboard',
              },
            })

            for (const sub of subscriptions) {
              try {
                await webPush.sendNotification(
                  {
                    endpoint: sub.endpoint,
                    keys: {
                      p256dh: sub.p256dh,
                      auth: sub.auth,
                    },
                  },
                  payload
                )
                results.push.success = true
              } catch (pushError: any) {
                console.error('Push notification error:', pushError)
                results.push.error = pushError.message
              }
            }
          } else {
            results.push.error = 'No push subscriptions found for admin'
          }
        } else {
          results.push.error = 'Admin profile not found'
        }
      }
    } catch (pushError: any) {
      console.error('Push notification error:', pushError)
      results.push.error = pushError.message
    }

    return NextResponse.json({
      success: results.email.success || results.push.success,
      results,
    })
  } catch (error: any) {
    console.error('Admin notification error:', error)
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    )
  }
}
