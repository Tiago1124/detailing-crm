'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { createSupabaseClient } from '@/lib/supabase'

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
  sede: string
  empresa: string
  recordatorio_15: boolean
  recordatorio_5: boolean
  recordatorio_1: boolean
  recordatorio_enviado: boolean
}

const SERVICIOS: Record<string, number> = {
  'Detailing completo': 2,
  'Lavado exterior': 1,
  'Pulida y encerada': 3,
  'Limpieza interior': 2,
  'Ceramic coating': 6,
  'Pendiente por asignar': 2,
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
    <span style={{ background: bg, color, padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '500', whiteSpace: 'nowrap' }}>
      {texto}
    </span>
  )
}

function RecordatoriosDots({ c }: { c: Cliente }) {
  const dias = diasRestantes(c.proximo_recordatorio)
  const dots = [
    { label: '15d', done: c.recordatorio_15, active: dias <= 15 },
    { label: '5d', done: c.recordatorio_5, active: dias <= 5 },
    { label: '1d', done: c.recordatorio_1, active: dias <= 1 },
    { label: 'Hoy', done: c.recordatorio_enviado, active: dias <= 0 },
  ]
  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
      {dots.map(d => (
        <div key={d.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: d.done ? 'var(--green)' : d.active ? 'var(--amber)' : 'var(--bg4)',
            border: `1px solid ${d.done ? 'var(--green)' : d.active ? 'var(--amber)' : 'var(--border)'}`,
          }} />
          <span style={{ fontSize: '9px', color: 'var(--text3)' }}>{d.label}</span>
        </div>
      ))}
    </div>
  )
}

const FILTROS = [
  { key: 'todos', label: 'Todos' },
  { key: 'vencidos', label: 'Vencidos' },
  { key: 'proximos', label: 'Esta semana' },
  { key: 'ok', label: 'Al día' },
]

export default function ListaClientes({ refresh, empresa, sede, isAdmin }: {
  refresh: number
  empresa?: string
  sede?: string | null
  isAdmin?: boolean
}) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [editando, setEditando] = useState<Cliente | null>(null)
  const [editForm, setEditForm] = useState({ tipo_servicio: '', fecha_servicio: '', meses_recordatorio: 2, notas: '' })
  const [savingEdit, setSavingEdit] = useState(false)

  const { getToken } = useAuth()

  const cargar = async () => {
    setLoading(true)
    try {
      const token = await getToken({ template: 'supabase' })
      if (!token) { setLoading(false); return }
      const client = createSupabaseClient(token)
      let query = client.from('clientes').select('*').order('proximo_recordatorio', { ascending: true })
      if (empresa) query = query.eq('empresa', empresa)
      if (sede) query = query.eq('sede', sede)
      const { data } = await query
      setClientes(data || [])
    } catch (e) {
      console.error('Error cargando clientes:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!empresa) return
    cargar()
  }, [refresh, empresa, sede])

  const abrirEditar = (c: Cliente) => {
    setEditando(c)
    setEditForm({
      tipo_servicio: c.tipo_servicio || '',
      fecha_servicio: c.fecha_servicio || '',
      meses_recordatorio: SERVICIOS[c.tipo_servicio] || 2,
      notas: c.notas || '',
    })
  }

  const guardarEdicion = async () => {
    if (!editando) return
    setSavingEdit(true)
    const token = await getToken({ template: 'supabase' })
    const client = createSupabaseClient(token)
    const fechaServicio = new Date(editForm.fecha_servicio)
    const proximoRecordatorio = new Date(fechaServicio)
    proximoRecordatorio.setMonth(proximoRecordatorio.getMonth() + editForm.meses_recordatorio)
    await client.from('clientes').update({
      tipo_servicio: editForm.tipo_servicio,
      fecha_servicio: editForm.fecha_servicio,
      notas: editForm.notas,
      proximo_recordatorio: proximoRecordatorio.toISOString().split('T')[0],
      recordatorio_15: false,
      recordatorio_5: false,
      recordatorio_1: false,
      recordatorio_enviado: false,
    }).eq('id', editando.id)
    setSavingEdit(false)
    setEditando(null)
    cargar()
  }

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
      return c.nombre.toLowerCase().includes(q) || c.placa?.toLowerCase().includes(q) || c.vehiculo?.toLowerCase().includes(q)
    })

  const vencidos = clientes.filter(c => diasRestantes(c.proximo_recordatorio) < 0).length
  const proximos = clientes.filter(c => { const d = diasRestantes(c.proximo_recordatorio); return d >= 0 && d <= 7 }).length

  const wa = (c: Cliente) => {
    const msg = encodeURIComponent(`Hola ${c.nombre.split(' ')[0]} 👋, te recordamos que tu moto ${c.vehiculo} (${c.placa}) tiene pendiente su servicio de mantenimiento. ¡Agéndalo aquí!`)
    return `https://wa.me/57${c.telefono}?text=${msg}`
  }

  const enviarRecordatorio = async (c: Cliente) => {
    const res = await fetch('/api/send-whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telefono: c.telefono, nombre: c.nombre, vehiculo: c.vehiculo, placa: c.placa, sede: c.sede, empresa: c.empresa })
    })
    const data = await res.json()
    alert(data.ok ? '✓ WhatsApp enviado' : '✗ Error: ' + data.error)
  }

  return (
    <div>
      {/* Modal editar */}
      {editando && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px',
        }}>
          <div style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '28px',
            width: '100%', maxWidth: '480px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', fontWeight: '600' }}>
                Editar servicio
              </h3>
              <button onClick={() => setEditando(null)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: '18px' }}>✕</button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '20px' }}>
              {editando.nombre} · {editando.vehiculo} {editando.placa ? `(${editando.placa})` : ''}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={lbl}>Tipo de servicio</label>
                <select
                  value={editForm.tipo_servicio}
                  onChange={e => setEditForm(f => ({ ...f, tipo_servicio: e.target.value, meses_recordatorio: SERVICIOS[e.target.value] || 2 }))}
                  style={inp}
                >
                  <option value="">Seleccionar...</option>
                  {Object.keys(SERVICIOS).filter(s => s !== 'Pendiente por asignar').map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label style={lbl}>Fecha del servicio</label>
                <input type="date" value={editForm.fecha_servicio}
                  onChange={e => setEditForm(f => ({ ...f, fecha_servicio: e.target.value }))}
                  style={inp}
                />
              </div>

              <div>
                <label style={lbl}>Próximo recordatorio (meses)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input type="number" min={1} max={24} value={editForm.meses_recordatorio}
                    onChange={e => setEditForm(f => ({ ...f, meses_recordatorio: Number(e.target.value) }))}
                    style={{ ...inp, width: '80px' }}
                  />
                  <span style={{ fontSize: '12px', color: 'var(--text3)' }}>
                    {editForm.tipo_servicio ? `Sugerido: ${SERVICIOS[editForm.tipo_servicio]} meses` : ''}
                  </span>
                </div>
              </div>

              <div>
                <label style={lbl}>Notas</label>
                <textarea rows={2} value={editForm.notas}
                  onChange={e => setEditForm(f => ({ ...f, notas: e.target.value }))}
                  style={{ ...inp, resize: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setEditando(null)} style={{
                padding: '9px 20px', borderRadius: '8px', border: '1px solid var(--border)',
                background: 'transparent', color: 'var(--text2)', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '14px',
              }}>Cancelar</button>
              <button onClick={guardarEdicion} disabled={savingEdit} style={{
                padding: '9px 20px', borderRadius: '8px', border: 'none',
                background: 'var(--accent)', color: 'white', cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontSize: '14px', fontWeight: '500',
              }}>{savingEdit ? 'Guardando...' : 'Guardar cambios'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid-3" style={{ marginBottom: '28px' }}>
        {[
          { label: 'Total clientes', valor: clientes.length, color: 'var(--text)', accent: 'var(--accent)' },
          { label: 'Vencidos', valor: vencidos, color: 'var(--red)', accent: 'var(--red)' },
          { label: 'Esta semana', valor: proximos, color: 'var(--amber)', accent: 'var(--amber)' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '20px 24px',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: s.accent, opacity: 0.6 }} />
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
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, placa o vehículo..."
            style={{ width: '100%', padding: '9px 12px 9px 32px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--text)', fontSize: '13px', fontFamily: 'var(--font-body)', outline: 'none' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '6px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '4px', flexWrap: 'wrap' }}>
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

      {loading && <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text3)', fontSize: '14px' }}>Cargando clientes...</div>}

      {!loading && filtrados.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 24px', background: 'var(--bg2)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.3 }}>◈</div>
          <p style={{ color: 'var(--text3)', fontSize: '14px' }}>No hay clientes en esta categoría</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filtrados.map(c => {
          const dias = diasRestantes(c.proximo_recordatorio)
          const urgente = dias < 0 || dias <= 7
          const pendiente = c.tipo_servicio === 'Pendiente por asignar'
          return (
            <div key={c.id} style={{
              background: 'var(--bg2)',
              border: `1px solid ${pendiente ? 'rgba(124,106,247,0.3)' : urgente && dias < 0 ? 'rgba(242,92,92,0.2)' : urgente ? 'rgba(245,166,35,0.15)' : 'var(--border)'}`,
              borderRadius: 'var(--radius)', padding: '18px 20px', transition: 'border-color 0.2s',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: '500', fontSize: '15px', color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
                      {c.nombre}
                    </span>
                    {c.placa && (
                      <span style={{ fontSize: '11px', color: 'var(--text3)', background: 'var(--bg3)', border: '1px solid var(--border)', padding: '2px 7px', borderRadius: '4px', letterSpacing: '0.05em' }}>
                        {c.placa}
                      </span>
                    )}
                    {isAdmin && c.sede && (
                      <span style={{ fontSize: '11px', color: 'var(--accent2)', background: 'var(--accent-glow)', border: '1px solid rgba(124,106,247,0.2)', padding: '2px 7px', borderRadius: '4px' }}>
                        {c.sede}
                      </span>
                    )}
                    {pendiente && (
                      <span style={{ fontSize: '11px', color: 'var(--accent2)', background: 'var(--accent-glow)', border: '1px solid rgba(124,106,247,0.3)', padding: '2px 7px', borderRadius: '4px' }}>
                        ⚠ Pendiente asignar
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text3)', marginTop: '3px' }}>
                    {[c.vehiculo, c.tipo_servicio].filter(Boolean).join(' · ')}
                  </div>
                  {c.notas && c.notas !== 'Registrado desde encuesta de satisfacción' && (
                    <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px', opacity: 0.7 }}>{c.notas}</div>
                  )}
                </div>
                <Badge dias={dias} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text3)' }}>
                    Próximo: {new Date(c.proximo_recordatorio + 'T00:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <RecordatoriosDots c={c} />
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <button onClick={() => abrirEditar(c)} style={{
                    padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '500',
                    background: 'var(--bg3)', color: 'var(--text2)',
                    border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'var(--font-body)',
                  }}>Editar</button>
                  <a href={wa(c)} target="_blank" rel="noreferrer" style={{
                    padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '500',
                    background: 'rgba(37,211,102,0.12)', color: '#25d366',
                    textDecoration: 'none', fontFamily: 'var(--font-body)',
                  }}>WhatsApp</a>
                  <button onClick={() => enviarRecordatorio(c)} style={{
                    padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '500',
                    background: 'var(--accent-glow)', color: 'var(--accent2)',
                    border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)',
                  }}>Recordatorio</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const lbl: React.CSSProperties = {
  fontSize: '11px', fontWeight: '500', color: 'var(--text3)',
  display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em',
}
const inp: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: '8px',
  border: '1px solid var(--border)', background: 'var(--bg3)',
  color: 'var(--text)', fontSize: '14px', outline: 'none',
  fontFamily: 'var(--font-body)',
}
