import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'
import { createClient } from '@supabase/supabase-js'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  const { telefono, nombre, vehiculo, placa, sede, empresa } = await req.json()

  let linkSede = empresa === 'discol'
    ? 'https://discolmotos.com/citas-taller/'
    : 'https://zagamotos.com/citas-taller/'

  if (sede) {
    const { data } = await supabase
      .from('sedes')
      .select('link_citas')
      .eq('nombre', sede)
      .eq('empresa', empresa)
      .single()
    if (data?.link_citas) linkSede = data.link_citas
  }

  const nombreEmpresa = empresa === 'discol' ? 'Discolmotos' : 'Zagamotos'

  const body = `Hola ${nombre.split(' ')[0]} 👋

Tu moto *${vehiculo || 'vehículo'}* (${placa || ''}) tiene pendiente su servicio de mantenimiento con *${nombreEmpresa}*.

Agenda tu cita aquí:
${linkSede}

¡Te esperamos! 🏍`

  try {
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: `whatsapp:+57${telefono}`,
      body
    })
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }
}