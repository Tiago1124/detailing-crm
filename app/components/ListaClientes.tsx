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
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const proximo = new Date(fecha + 'T00:00:00')
  return Math.round((proximo.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
}

function Badge({ dias }: { dias: number }) {
  let bg, color, texto
  if (dias < 0) { bg = '#fef2f2'; color = '#dc2626'; texto = `Vencido hace ${Math.abs(dias)} días` }
  else if (dias <= 5) { bg = '#fffbeb'; color = '#d97706'; texto = `Vence en ${dias} días` }
  else { bg = '#f0fdf4'; color = '#16a34a'; texto = `${dias} días restantes` }
  return (
    <span style={{ background: bg, color, padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '500' }}>
      {texto}
    </span>
  )
}

export default function ListaClientes({ refresh }: { refresh: number }) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('todos')

  const cargar = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('clientes')
      .select('*')
      .order('proximo_recordatorio', { ascending: true })
    setClientes(data || [])
    setLoading(false)
  }

  useEffect(() => { cargar() }, [refresh])

  const filtrados = clientes.filter(c => {
    const dias = diasRestantes(c.proximo_recordatorio)
    if (filtro === 'vencidos') return dias < 0
    if (filtro === 'proximos') return dias >= 0 && dias <= 5
    if (filtro === 'ok') return dias > 5
    return true
  })

  const vencidos = clientes.filter(c => diasRestantes(c.proximo_recordatorio) < 0).length
  const proximos = clientes.filter(c => { const d = diasRestantes(c.proximo_recordatorio); return d >= 0 && d <= 5 }).length

  const wa = (c: Cliente) => {
    const msg = encodeURIComponent(`Hola ${c.nombre.split(' ')[0]} 👋, te recordamos que tu vehículo ${c.vehiculo} (${c.placa}) tiene pendiente su servicio de detailing. ¡Agéndalo con nosotros!`)
    return `https://wa.me/57${c.telefono}?text=${msg}`
  }

  const enviarRecordatorio = async (c: Cliente) => {
    const res = await fetch('/api/send-whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telefono: c.telefono,
        nombre: c.nombre,
        vehiculo: c.vehiculo,
        placa: c.placa
      })
    })
    const data = await res.json()
    if (data.ok) alert('✅ WhatsApp enviado')
    else alert('❌ Error: ' + data.error)
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total clientes', valor: clientes.length, color: '#111' },
          { label: 'Vencidos', valor: vencidos, color: '#dc2626' },
          { label: 'Por vencer', valor: proximos, color: '#d97706' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: '12px', padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '600', color: s.color }}>{s.valor}</div>
            <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
        {[
          { key: 'todos', label: 'Todos' },
          { key: 'vencidos', label: 'Vencidos' },
          { key: 'proximos', label: 'Por vencer' },
          { key: 'ok', label: 'Al día' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFiltro(f.key)}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '13px',
              border: '1px solid',
              borderColor: filtro === f.key ? '#111' : '#e5e5e5',
              background: filtro === f.key ? '#111' : 'white',
              color: filtro === f.key ? 'white' : '#666',
              cursor: 'pointer',
              fontWeight: filtro === f.key ? '500' : '400'
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && <p style={{ color: '#999', fontSize: '14px' }}>Cargando...</p>}

      {!loading && filtrados.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#999', fontSize: '14px' }}>
          No hay clientes en esta categoría
        </div>
      )}

      {filtrados.map(c => (
        <div key={c.id} style={{
          background: 'white',
          border: '1px solid #f0f0f0',
          borderRadius: '12px',
          padding: '1.25rem',
          marginBottom: '10px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontWeight: '600', fontSize: '15px', color: '#111' }}>{c.nombre}</div>
              <div style={{ fontSize: '13px', color: '#999', marginTop: '2px' }}>
                {[c.vehiculo, c.placa, c.tipo_servicio].filter(Boolean).join(' · ')}
              </div>
            </div>
            <Badge dias={diasRestantes(c.proximo_recordatorio)} />
          </div>

          <div style={{ fontSize: '12px', color: '#bbb', marginTop: '8px' }}>
            Próximo recordatorio: {new Date(c.proximo_recordatorio + 'T00:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>

          {c.notas && <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>{c.notas}</div>}

          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <a
              href={wa(c)}
              target="_blank"
              rel="noreferrer"
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                background: '#25D366',
                color: 'white',
                textDecoration: 'none',
                fontWeight: '500'
              }}
            >
              WhatsApp
            </a>
            <button
              onClick={() => enviarRecordatorio(c)}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '13px',
                background: '#f0f0f0',
                color: '#111',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Enviar recordatorio
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}