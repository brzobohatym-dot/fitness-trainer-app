import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const refId = searchParams.get('refId') || searchParams.get('id')

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kondicak.netlify.app'

  // Redirect to appropriate page based on status
  if (status === 'paid') {
    return NextResponse.redirect(`${baseUrl}/client/payments?success=true`)
  } else if (status === 'cancelled') {
    return NextResponse.redirect(`${baseUrl}/client/payments?cancelled=true`)
  } else {
    return NextResponse.redirect(`${baseUrl}/client/payments?pending=true`)
  }
}
