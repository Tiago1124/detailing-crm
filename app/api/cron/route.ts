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

async function enviarWA(telefono: string, mensaje: string) {
  await twilioClient.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM,
    to: `whatsapp:+57${telefono}`,
    body: mensaje,
  })
}

function getLinkSede(empresa: string, sede: string, sedes: any[]) {
  const s = sedes.find(x => x.nombre === sede && x.empresa === empresa)
  if (s?.link_citas) return s.link_citas
  return empresa === 'discol'
    ? 'https://discolmotos.com/citas-taller/'
    : 'https://zagamotos.com/citas-taller/'
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const { data: clientes, error } = await supabase
    .from('clientes')
    .select('*')

  if (error) return NextResponse.json({ ok: false, error: error.message })
  if (!clientes?.length) return NextResponse.json({ ok: true, enviados: 0 })

  const { data: sedes } = await supabase.from('sedes').select('*')

  let enviados = 0
  const errores: string[] = []

  for (const c of clientes) {
    const proximo = new Date(c.proximo_recordatorio + 'T00:00:00')
    const diff = Math.round((proximo.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
    const nombre = c.nombre.split(' ')[0]
    const moto = c.vehiculo || 'tu moto'
    const placa = c.placa ? `(${c.placa})` : ''
    const empresa = c.empresa === 'discol' ? 'Discolmotos' : 'Zagamotos'
    const link = getLinkSede(c.empresa, c.sede, sedes || [])

    try {
      if (diff === 15 && !c.recordatorio_15) {
        await enviarWA(c.telefono, `Hola ${nombre} 👋\n\nEn *15 días* tu moto *${moto}* ${placa} necesita su mantenimiento con *${empresa}*.\n\nAgenda con tiempo aquí:\n${link}\n\n¡Te esperamos! 🏍`)
        await supabase.from('clientes').update({ recordatorio_15: true }).eq('id', c.id)
        enviados++
      } else if (diff === 5 && !c.recordatorio_5) {
        await enviarWA(c.telefono, `Hola ${nombre} ⏰\n\nFaltan *5 días* para el mantenimiento de tu moto *${moto}* ${placa} con *${empresa}*.\n\n¿Ya agendaste tu cita?\n${link}`)
        await supabase.from('clientes').update({ recordatorio_5: true }).eq('id', c.id)
        enviados++
      } else if (diff === 1 && !c.recordatorio_1) {
        await enviarWA(c.telefono, `Hola ${nombre} 🔔\n\n*Mañana* vence el mantenimiento de tu moto *${moto}* ${placa} con *${empresa}*.\n\nÚltimo aviso — agenda aquí:\n${link}`)
        await supabase.from('clientes').update({ recordatorio_1: true }).eq('id', c.id)
        enviados++
      } else if (diff === 0 && !c.recordatorio_enviado) {
        await enviarWA(c.telefono, `Hola ${nombre} 🚨\n\n*Hoy* vence el mantenimiento de tu moto *${moto}* ${placa} con *${empresa}*.\n\nAgenda aquí:\n${link}`)
        await supabase.from('clientes').update({ recordatorio_enviado: true }).eq('id', c.id)
        enviados++
      }
    } catch (e: any) {
      errores.push(`${c.nombre} (día ${diff}): ${e.message}`)
    }
  }

  return NextResponse.json({ ok: true, enviados, errores })
}
