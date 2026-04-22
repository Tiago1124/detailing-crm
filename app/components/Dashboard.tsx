'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Encuesta = {
  id: string
  empresa: string
  sede: string
  asesor: string
  pregunta_1: number
  pregunta_2: number
  pregunta_3: number
  pregunta_4: number
  pregunta_5: number
  created_at: string
}

type Cliente = {
  id: string
  empresa: string
  sede: string
  proximo_recordatorio: string
}

function promedio(arr: number[]) {
  if (!arr.length) return 0
  return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10
}

function diasRestantes(fecha: string) {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const proximo = new Date(fecha + 'T00:00:00')
  return Math.round((proximo.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
}

function ScoreBadge({ valor }: { valor: number }) {
  const color = valor >= 4 ? 'var(--green)' : valor >= 3 ? 'var(--amber)' : 'var(--red)'
  const bg = valor >= 4 ? 'var(--green-bg)' : valor >= 3 ? 'var(--amber-bg)' : 'var(--red-bg)'
  return (
    <span style={{ background: bg, color, padding: '3px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: '600' }}>
      {valor}/5
    </span>
  )
}

function BarraProgreso({ valor, max = 5 }: { valor: number, max?: number }) {
  const pct = Math.round((valor / max) * 100)
  const color = valor >= 4 ? 'var(--green)' : valor >= 3 ? 'var(--amber)' : 'var(--red)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{ flex: 1, height: '6px', background: 'var(--bg4)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '3px', transition: 'width 0.5s' }} />
      </div>
      <span style={{ fontSize: '12px', color: 'var(--text3)', minWidth: '28px' }}>{valor}</span>
    </div>
  )
}

export default function Dashboard({ empresa }: { empresa: string }) {
  const [encuestas, setEncuestas] = useState<Encuesta[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [vistaActiva, setVistaActiva] = useState<'sedes' | 'asesores'>('sedes')

  useEffect(() => {
    const cargar = async () => {
      setLoading(true)
      const [{ data: enc }, { data: cli }] = await Promise.all([
        supabase.from('encuestas').select('*').eq('empresa', empresa),
        supabase.from('clientes').select('*').eq('empresa', empresa),
      ])
      setEncuestas(enc || [])
      setClientes(cli || [])
      setLoading(false)
    }
    cargar()
  }, [empresa])

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text3)', fontSize: '14px' }}>
      Cargando indicadores...
    </div>
  )

  const totalEncuestas = encuestas.length
  const promedioGeneral = promedio(encuestas.map(e =>
    promedio([e.pregunta_1, e.pregunta_2, e.pregunta_3, e.pregunta_4, e.pregunta_5])
  ))
  const totalClientes = clientes.length
  const vencidos = clientes.filter(c => diasRestantes(c.proximo_recordatorio) < 0).length
  const proximos = clientes.filter(c => { const d = diasRestantes(c.proximo_recordatorio); return d >= 0 && d <= 7 }).length

  const nps = Math.round(
    (encuestas.filter(e => e.pregunta_5 >= 4).length / (totalEncuestas || 1) * 100) -
    (encuestas.filter(e => e.pregunta_5 <= 2).length / (totalEncuestas || 1) * 100)
  )

  const PREGUNTAS_LABEL = [
    'Atención del asesor',
    'Tiempo de espera',
    'Calidad del servicio',
    'Instalaciones',
    'Recomendaría',
  ]

  const promediosPorPregunta = [1, 2, 3, 4, 5].map(i =>
    promedio(encuestas.map(e => e[`pregunta_${i}` as keyof Encuesta] as number).filter(Boolean))
  )

  const agrupar = (campo: 'sede' | 'asesor') => {
    const grupos: Record<string, Encuesta[]> = {}
    encuestas.forEach(e => {
      const key = e[campo] || 'Sin asignar'
      if (!grupos[key]) grupos[key] = []
      grupos[key].push(e)
    })
    return Object.entries(grupos)
      .map(([nombre, items]) => ({
        nombre,
        total: items.length,
        promedio: promedio(items.map(e =>
          promedio([e.pregunta_1, e.pregunta_2, e.pregunta_3, e.pregunta_4, e.pregunta_5])
        )),
        nps: Math.round(
          (items.filter(e => e.pregunta_5 >= 4).length / items.length * 100) -
          (items.filter(e => e.pregunta_5 <= 2).length / items.length * 100)
        )
      }))
      .sort((a, b) => b.promedio - a.promedio)
  }

  const grupos = agrupar(vistaActiva === 'sedes' ? 'sede' : 'asesor')

  return (
    <div>
      {/* KPIs principales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '28px' }}>
        {[
          { label: 'Total encuestas', valor: totalEncuestas, color: 'var(--text)', accent: 'var(--accent)' },
          { label: 'Satisfacción general', valor: `${promedioGeneral}/5`, color: promedioGeneral >= 4 ? 'var(--green)' : promedioGeneral >= 3 ? 'var(--amber)' : 'var(--red)', accent: 'var(--green)' },
          { label: 'NPS', valor: `${nps}%`, color: nps >= 50 ? 'var(--green)' : nps >= 0 ? 'var(--amber)' : 'var(--red)', accent: 'var(--amber)' },
          { label: 'Clientes activos', valor: totalClientes, color: 'var(--text)', accent: 'var(--accent)' },
          { label: 'Recordatorios vencidos', valor: vencidos, color: 'var(--red)', accent: 'var(--red)' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '18px 20px',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: s.accent, opacity: 0.6 }} />
            <div style={{ fontSize: '24px', fontWeight: '700', color: s.color, fontFamily: 'var(--font-display)', lineHeight: 1 }}>
              {s.valor}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        {/* Promedio por pregunta */}
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '24px',
        }}>
          <p style={sectionLabel}>Detalle por pregunta</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {PREGUNTAS_LABEL.map((label, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text2)' }}>{label}</span>
                  <ScoreBadge valor={promediosPorPregunta[i]} />
                </div>
                <BarraProgreso valor={promediosPorPregunta[i]} />
              </div>
            ))}
          </div>
        </div>

        {/* Proximos recordatorios */}
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '24px',
        }}>
          <p style={sectionLabel}>Estado mantenimientos</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: 'Al día', valor: totalClientes - vencidos - proximos, color: 'var(--green)', bg: 'var(--green-bg)' },
              { label: 'Vencen esta semana', valor: proximos, color: 'var(--amber)', bg: 'var(--amber-bg)' },
              { label: 'Vencidos', valor: vencidos, color: 'var(--red)', bg: 'var(--red-bg)' },
            ].map(s => (
              <div key={s.label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: s.bg, borderRadius: '8px', padding: '12px 16px',
              }}>
                <span style={{ fontSize: '13px', color: s.color, fontWeight: '500' }}>{s.label}</span>
                <span style={{ fontSize: '20px', fontWeight: '700', color: s.color, fontFamily: 'var(--font-display)' }}>
                  {s.valor}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabla por sede o asesor */}
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '24px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <p style={sectionLabel}>Ranking de satisfacción</p>
          <div style={{ display: 'flex', gap: '6px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '8px', padding: '4px' }}>
            {(['sedes', 'asesores'] as const).map(v => (
              <button key={v} onClick={() => setVistaActiva(v)} style={{
                padding: '5px 14px', borderRadius: '6px', border: 'none',
                background: vistaActiva === v ? 'var(--bg4)' : 'transparent',
                color: vistaActiva === v ? 'var(--text)' : 'var(--text3)',
                fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-body)',
                fontWeight: vistaActiva === v ? '500' : '400', transition: 'all 0.15s',
                textTransform: 'capitalize',
              }}>{v}</button>
            ))}
          </div>
        </div>

        {grupos.length === 0 ? (
          <p style={{ color: 'var(--text3)', fontSize: '14px', textAlign: 'center', padding: '24px' }}>
            No hay encuestas registradas aún
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {grupos.map((g, i) => (
              <div key={g.nombre} style={{
                display: 'grid', gridTemplateColumns: '28px 1fr 80px 80px 60px',
                alignItems: 'center', gap: '16px',
                padding: '12px 16px', borderRadius: '8px',
                background: i === 0 ? 'var(--accent-glow)' : 'var(--bg3)',
                border: `1px solid ${i === 0 ? 'rgba(124,106,247,0.2)' : 'var(--border)'}`,
              }}>
                <span style={{
                  fontSize: '13px', fontWeight: '700',
                  color: i === 0 ? 'var(--accent2)' : 'var(--text3)',
                  fontFamily: 'var(--font-display)',
                }}>#{i + 1}</span>
                <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text)' }}>{g.nombre}</span>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Promedio</div>
                  <ScoreBadge valor={g.promedio} />
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>NPS</div>
                  <span style={{
                    fontSize: '13px', fontWeight: '600',
                    color: g.nps >= 50 ? 'var(--green)' : g.nps >= 0 ? 'var(--amber)' : 'var(--red)',
                  }}>{g.nps}%</span>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Encuestas</div>
                  <span style={{ fontSize: '13px', color: 'var(--text2)' }}>{g.total}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const sectionLabel: React.CSSProperties = {
  fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: '600',
  color: 'var(--text3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px',
}