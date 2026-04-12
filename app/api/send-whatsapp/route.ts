import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export async function POST(req: NextRequest) {
  const { telefono, nombre, vehiculo, placa } = await req.json()

  try {
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: `whatsapp:+57${telefono}`,
      body: `Hola ${nombre.split(' ')[0]} 👋, te recordamos que tu vehículo ${vehiculo} (${placa}) tiene pendiente su servicio de detailing. ¡Agéndalo con nosotros!`
    })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}