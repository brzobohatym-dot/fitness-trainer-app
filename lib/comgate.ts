// Comgate API integration
// Docs: https://help.comgate.cz/docs/api-protokol

const COMGATE_URL = 'https://payments.comgate.cz/v1.0'

interface CreatePaymentParams {
  price: number // v haléřích (100 = 1 Kč)
  currency: string
  label: string
  refId: string
  email: string
  method?: string
}

interface CreatePaymentResponse {
  code: number
  message: string
  transId?: string
  redirect?: string
}

export async function createComgatePayment(params: CreatePaymentParams): Promise<CreatePaymentResponse> {
  const merchantId = process.env.COMGATE_MERCHANT_ID
  const secret = process.env.COMGATE_SECRET

  if (!merchantId || !secret) {
    throw new Error('Comgate credentials not configured')
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kondicak.netlify.app'

  const formData = new URLSearchParams({
    merchant: merchantId,
    secret: secret,
    price: params.price.toString(),
    curr: params.currency,
    label: params.label,
    refId: params.refId,
    email: params.email,
    prepareOnly: 'true',
    country: 'CZ',
    lang: 'cs',
    method: params.method || 'ALL',
    url_paid: `${baseUrl}/api/payments/callback?status=paid`,
    url_cancelled: `${baseUrl}/api/payments/callback?status=cancelled`,
    url_pending: `${baseUrl}/api/payments/callback?status=pending`,
  })

  const response = await fetch(`${COMGATE_URL}/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  })

  const text = await response.text()
  const result = parseComgateResponse(text)

  return result
}

export async function getComgatePaymentStatus(transId: string): Promise<any> {
  const merchantId = process.env.COMGATE_MERCHANT_ID
  const secret = process.env.COMGATE_SECRET

  if (!merchantId || !secret) {
    throw new Error('Comgate credentials not configured')
  }

  const formData = new URLSearchParams({
    merchant: merchantId,
    secret: secret,
    transId: transId,
  })

  const response = await fetch(`${COMGATE_URL}/status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  })

  const text = await response.text()
  return parseComgateResponse(text)
}

function parseComgateResponse(text: string): any {
  const params = new URLSearchParams(text)
  const result: any = {}

  params.forEach((value, key) => {
    result[key] = value
  })

  return result
}

export function formatPrice(amount: number, currency: string = 'CZK'): string {
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}
