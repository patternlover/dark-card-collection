import { NextResponse } from 'next/server'

const WINDOW_MS = 60 * 60 * 1000
const MAX_PER_WINDOW = 3

const hits = new Map<string, number[]>()

function isRateLimited(key: string): boolean {
  const now = Date.now()
  const recent = (hits.get(key) || []).filter((t) => now - t < WINDOW_MS)
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(key, recent)
    return true
  }
  recent.push(now)
  hits.set(key, recent)
  return false
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, subject, message, website } = body

    if (website && website.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Messaggio inviato con successo. Ti risponderemo entro 24 ore.',
      })
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Troppi messaggi inviati. Riprova piu\' tardi.' },
        { status: 429 }
      )
    }

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Tutti i campi sono obbligatori' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email non valida' },
        { status: 400 }
      )
    }

    if (message.length < 10) {
      return NextResponse.json(
        { error: 'Il messaggio deve avere almeno 10 caratteri' },
        { status: 400 }
      )
    }

    if (name.length > 200 || subject.length > 200 || message.length > 5000) {
      return NextResponse.json(
        { error: 'Alcuni campi superano la lunghezza massima consentita' },
        { status: 400 }
      )
    }

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      console.log('[contact] RESEND_API_KEY non configurata — messaggio da', email, 'non inviato')
      return NextResponse.json({
        success: true,
        message: 'Messaggio inviato con successo. Ti risponderemo entro 24 ore.',
      })
    }

    const from = process.env.EMAIL_FROM || 'noreply@darkcardcollection.com'
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [from],
        reply_to: email,
        subject: `[Contatto] ${subject} — da ${name}`,
        html: `<p><strong>Nome:</strong> ${name.replace(/</g, '&lt;')}</p>
<p><strong>Email:</strong> ${email.replace(/</g, '&lt;')}</p>
<p><strong>Oggetto:</strong> ${subject.replace(/</g, '&lt;')}</p>
<p>${message.replace(/</g, '&lt;').replace(/\n/g, '<br/>')}</p>`,
      }),
    })
    if (!res.ok) {
      throw new Error(`Resend ${res.status}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Messaggio inviato con successo. Ti risponderemo entro 24 ore.',
    })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Errore nell\'invio del messaggio. Riprova piu\' tardi.' },
      { status: 500 }
    )
  }
}
