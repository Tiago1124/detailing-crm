import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import twilio from 'twilio'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const hoy = new Date().toISOString().split('T')[0]

  const { data: clientes, error } = await supabase
    .from('clientes')
    .select('*, sedes(link_citas)')
    .eq('proximo_recordatorio', hoy)
    .eq('recordatorio_enviado', false)

  if (error) return NextResponse.json({ ok: false, error: error.message })
  if (!clientes || clientes.length === 0) {
    return NextResponse.json({ ok: true, enviados: 0, mensaje: 'Sin recordatorios hoy' })
  }

  let enviados = 0
  const errores: string[] = []

  for (const c of clientes) {
    try {
      const linkSede = c.sedes?.link_citas || 
        (c.empresa === 'discol' ? 'https://discolmotos.com/citas-taller/' : 'https://zagamotos.com/citas-taller/')

      const empresa = c.empresa === 'discol' ? 'Discolmotos' : 'Zagamotos'

      const mensaje = `Hola ${c.nombre.split(' ')[0]} 👋

Tu moto *${c.vehiculo || 'vehículo'}* (${c.placa || ''}) tiene pendiente su servicio de mantenimiento con *${empresa}*.

Agenda tu cita aquí:
${linkSede}

¡Te esperamos! 🏍`

      await twilioClient.messages.create({
        from: process.env.TWILIO_WHATSAPP_FROM,
        to: `whatsapp:+57${c.telefono}`,
        body: mensaje
      })

      await supabase
        .from('clientes')
        .update({ recordatorio_enviado: true })
        .eq('id', c.id)

      enviados++
    } catch (e: any) {
      errores.push(`${c.nombre}: ${e.message}`)
      console.error('Error enviando a', c.telefono, e)
    }
  }

  return NextResponse.json({ ok: true, enviados, errores })
}