'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Cliente = {
  id: string
  nombre: string
  telefono: string
  vehiculo: string
  placa: string
  tipo_servicio: string
  fecha_servicio: string
  proximo_recordatorio: string
  notas: string
}

function diasRestantes(fecha: string) {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const proximo = new Date(fecha + 'T00:00:00')
  return Math.round((proximo.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
}

function Badge({ dias }: { dias: number }) {
  let bg, color, texto
  if (dias < 0) { bg = 'var(--red-bg)'; color = 'var(--red)'; texto = `Vencido ${Math.abs(dias)}d` }
  else if (dias === 0) { bg = 'var(--amber-bg)'; color = 'var(--amber)'; texto = 'Vence hoy' }
  else if (dias <= 7) { bg = 'var(--amber-bg)'; color = 'var(--amber)'; texto = `${dias}d restantes` }
  else { bg = 'var(--green-bg)'; color = 'var(--green)'; texto = `${dias}d restantes` }
  return (
    <span style={{
      background: bg, color, padding: '4px 10px', borderRadius: '6px',
      fontSize: '12px', fontWeight: '500', whiteSpace: 'nowrap',
    }}>{texto}</span>
  )
}

const FILTROS = [
  { key: 'todos', label: 'Todos' },
  { key: 'vencidos', label: 'Vencidos' },
  { key: 'proximos', label: 'Esta semana' },
  { key: 'ok', label: 'Al día' },
]

export default function ListaClientes({ refresh }: { refresh: number }) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('todos')
  const [busqueda, setBusqueda] = useState('')

  const cargar = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('clientes').select('*')
      .order('proximo_recordatorio', { ascending: true })
    setClientes(data || [])
    setLoading(false)
  }

  useEffect(() => { cargar() }, [refresh])

  const filtrados = clientes
    .filter(c => {
      const dias = diasRestantes(c.proximo_recordatorio)
      if (filtro === 'vencidos') return dias < 0
      if (filtro === 'proximos') return dias >= 0 && dias <= 7
      if (filtro === 'ok') return dias > 7
      return true
    })
    .filter(c => {
      if (!busqueda) return true
      const q = busqueda.toLowerCase()
      return c.nombre.toLowerCase().includes(q) ||
        c.placa?.toLowerCase().includes(q) ||
        c.vehiculo?.toLowerCase().includes(q)
    })

  const vencidos = clientes.filter(c => diasRestantes(c.proximo_recordatorio) < 0).length
  const proximos = clientes.filter(c => { const d = diasRestantes(c.proximo_recordatorio); return d >= 0 && d <= 7 }).length

  const wa = (c: Cliente) => {
    const msg = encodeURIComponent(`Hola ${c.nombre.split(' ')[0]} 👋, te recordamos que tu vehículo ${c.vehiculo} (${c.placa}) tiene pendiente su servicio de mantenimiento. ¡Agéndalo aquí!`)
    return `https://wa.me/57${c.telefono}?text=${msg}`
  }

  const enviarRecordatorio = async (c: Cliente) => {
    const res = await fetch('/api/send-whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telefono: c.telefono, nombre: c.nombre, vehiculo: c.vehiculo, placa: c.placa })
    })
    const data = await res.json()
    alert(data.ok ? '✓ WhatsApp enviado' : '✗ Error: ' + data.error)
  }

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '28px' }}>
        {[
          { label: 'Total clientes', valor: clientes.length, color: 'var(--text)', accent: 'var(--accent)' },
          { label: 'Vencidos', valor: vencidos, color: 'var(--red)', accent: 'var(--red)' },
          { label: 'Esta semana', valor: proximos, color: 'var(--amber)', accent: 'var(--amber)' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '20px 24px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
              background: s.accent, opacity: 0.6,
            }} />
            <div style={{ fontSize: '28px', fontWeight: '700', color: s.color, fontFamily: 'var(--font-display)', lineHeight: 1 }}>
              {s.valor}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontSize: '14px' }}>⌕</span>
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, placa o vehículo..."
            style={{
              width: '100%', padding: '9px 12px 9px 32px',
              borderRadius: '8px', border: '1px solid var(--border)',
              background: 'var(--bg2)', color: 'var(--text)',
              fontSize: '13px', fontFamily: 'var(--font-body)', outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '4px' }}>
          {FILTROS.map(f => (
            <button key={f.key} onClick={() => setFiltro(f.key)} style={{
              padding: '5px 12px', borderRadius: '6px', border: 'none',
              background: filtro === f.key ? 'var(--bg4)' : 'transparent',
              color: filtro === f.key ? 'var(--text)' : 'var(--text3)',
              fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-body)',
              fontWeight: filtro === f.key ? '500' : '400', transition: 'all 0.15s',
            }}>{f.label}</button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text3)', fontSize: '14px' }}>
          Cargando clientes...
        </div>
      )}

      {!loading && filtrados.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '60px 24px',
          background: 'var(--bg2)', borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.3 }}>◈</div>
          <p style={{ color: 'var(--text3)', fontSize: '14px' }}>No hay clientes en esta categoría</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filtrados.map(c => {
          const dias = diasRestantes(c.proximo_recordatorio)
          const urgente = dias < 0 || dias <= 7
          return (
            <div key={c.id} style={{
              background: 'var(--bg2)',
              border: `1px solid ${urgente && dias < 0 ? 'rgba(242,92,92,0.2)' : urgente ? 'rgba(245,166,35,0.15)' : 'var(--border)'}`,
              borderRadius: 'var(--radius)',
              padding: '18px 20px',
              transition: 'border-color 0.2s',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontWeight: '500', fontSize: '15px', color: 'var(--text)',
                      fontFamily: 'var(--font-display)',
                    }}>{c.nombre}</span>
                    {c.placa && (
                      <span style={{
                        fontSize: '11px', color: 'var(--text3)',
                        background: 'var(--bg3)', border: '1px solid var(--border)',
                        padding: '2px 7px', borderRadius: '4px', letterSpacing: '0.05em',
                      }}>{c.placa}</span>
                    )}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text3)', marginTop: '3px' }}>
                    {[c.vehiculo, c.tipo_servicio].filter(Boolean).join(' · ')}
                  </div>
                  {c.notas && (
                    <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px', opacity: 0.7 }}>
                      {c.notas}
                    </div>
                  )}
                </div>
                <Badge dias={dias} />
              </div>

              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginTop: '14px', paddingTop: '12px',
                borderTop: '1px solid var(--border)',
              }}>
                <span style={{ fontSize: '12px', color: 'var(--text3)' }}>
                  Próximo: {new Date(c.proximo_recordatorio + 'T00:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <a href={wa(c)} target="_blank" rel="noreferrer" style={{
                    padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '500',
                    background: 'rgba(37,211,102,0.12)', color: '#25d366',
                    textDecoration: 'none', fontFamily: 'var(--font-body)',
                  }}>WhatsApp</a>
                  <button onClick={() => enviarRecordatorio(c)} style={{
                    padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '500',
                    background: 'var(--accent-glow)', color: 'var(--accent2)',
                    border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)',
                  }}>Enviar recordatorio</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
