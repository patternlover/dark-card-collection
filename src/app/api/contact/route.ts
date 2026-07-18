import { NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, subject, message } = body

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

    const payload = await getPayloadClient()

    await payload.create({
      collection: 'messages',
      data: {
        name,
        email,
        subject,
        message,
      },
    })

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
