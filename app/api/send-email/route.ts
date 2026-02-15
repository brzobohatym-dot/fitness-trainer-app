import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { to, clientName, planName, trainerName } = await request.json()

    if (!to || !clientName || !planName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data, error } = await resend.emails.send({
      from: 'Fitness Trainer <onboarding@resend.dev>',
      to: [to],
      subject: `Nový tréninkový plán: ${planName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f7fa; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(30, 74, 141, 0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #1e4a8d 0%, #2d5a9e 100%); padding: 40px 40px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                        Nový tréninkový plán
                      </h1>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                        Dobrý den, <strong>${clientName}</strong>!
                      </p>

                      <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                        ${trainerName ? `Váš trenér <strong>${trainerName}</strong> vám` : 'Byl vám'} přiřadil nový tréninkový plán.
                      </p>

                      <!-- Plan Card -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f5ff; border-radius: 12px; margin-bottom: 30px;">
                        <tr>
                          <td style="padding: 24px;">
                            <p style="color: #1e4a8d; font-size: 14px; font-weight: 600; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.5px;">
                              Název plánu
                            </p>
                            <p style="color: #1e4a8d; font-size: 24px; font-weight: 700; margin: 0;">
                              ${planName}
                            </p>
                          </td>
                        </tr>
                      </table>

                      <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                        Přihlaste se do aplikace a prohlédněte si svůj nový tréninkový plán s detailními instrukcemi a videi.
                      </p>

                      <!-- CTA Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <a href="https://kondicak.netlify.app/login" style="display: inline-block; background: linear-gradient(135deg, #1e4a8d 0%, #2d5a9e 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(30, 74, 141, 0.3);">
                              Zobrazit plán
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8fafc; padding: 24px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
                      <p style="color: #94a3b8; font-size: 14px; margin: 0;">
                        Tento email byl odeslán automaticky z aplikace Fitness Trainer.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Email send error:', error)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}
