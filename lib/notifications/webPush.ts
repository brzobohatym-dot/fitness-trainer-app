import webpush from 'web-push'

// VAPID keys are loaded lazily to avoid build-time errors
let vapidInitialized = false

function initializeVapid() {
  if (vapidInitialized) return true

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
  const vapidEmail = process.env.VAPID_EMAIL || 'mailto:admin@example.com'

  if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey)
    vapidInitialized = true
    return true
  }
  return false
}

export interface PushPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  data?: {
    url?: string
    [key: string]: any
  }
}

export interface PushSubscriptionData {
  endpoint: string
  p256dh: string
  auth: string
}

export async function sendPushNotification(
  subscription: PushSubscriptionData,
  payload: PushPayload
): Promise<boolean> {
  if (!initializeVapid()) {
    console.error('VAPID keys not configured')
    return false
  }

  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  }

  try {
    await webpush.sendNotification(
      pushSubscription,
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/logo.png',
        badge: payload.badge || '/logo.png',
        data: payload.data || {},
      })
    )
    return true
  } catch (error: any) {
    console.error('Error sending push notification:', error)

    // If subscription is expired/invalid, return false
    if (error.statusCode === 410 || error.statusCode === 404) {
      return false
    }

    throw error
  }
}

export function getVapidPublicKey(): string | undefined {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
}

// Generate VAPID keys (run once to get keys)
// Uncomment and run: npx ts-node lib/notifications/webPush.ts
// export function generateVapidKeys() {
//   const keys = webpush.generateVAPIDKeys()
//   console.log('Public Key:', keys.publicKey)
//   console.log('Private Key:', keys.privateKey)
//   return keys
// }
