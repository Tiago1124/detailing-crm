'use client'
import { useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { createSupabaseClient } from '@/lib/supabase'

const SERVICIOS: Record<string, number> = {
  'Detailing completo': 2,
  'Lavado exterior': 1,
  'Pulida y encerada': 3,
  'Limpieza interior': 2,
  'Ceramic coating': 6,
}

export default function FormularioCliente({
  onGuardado, empresa, sede
}: {
  onGuardado?: () => void
  empresa?: string
  sede?: string | null
}) {
  const [form, setForm] = useState({
    nombre: '', telefono: '', vehiculo: '', placa: '',
    tipo_servicio: '', fecha_servicio: '', notas: '', meses_recordatorio: 2
  })
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState('')

  const { getToken } = useAuth()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (name === 'tipo_servicio') {
      setForm(f => ({ ...f, tipo_servicio: value, meses_recordatorio: SERVICIOS[value] || 2 }))
    } else {
      setForm(f => ({ ...f, [name]: value }))
    }
  }

  const handleSubmit = async () => {
    if (!form.nombre || !form.telefono || !form.fecha_servicio) {
      setMensaje('error:Completa nombre, teléfono y fecha')
      return
    }
    setLoading(true)
    const fechaServicio = new Date(form.fecha_servicio)
    const proximoRecordatorio = new Date(fechaServicio)
    proximoRecordatorio.setMonth(proximoRecordatorio.getMonth() + Number(form.meses_recordatorio))

    const token = await getToken({ template: 'supabase' })
    const client = createSupabaseClient(token)

    const { error } = await client.from('clientes').insert([{
      nombre: form.nombre,
      telefono: form.telefono,
      vehiculo: form.vehiculo,
      placa: form.placa.toUpperCase(),
      tipo_servicio: form.tipo_servicio,
      fecha_servicio: form.fecha_servicio,
      notas: form.notas,
      empresa: empresa || 'discol',
      sede: sede || null,
      proximo_recordatorio: proximoRecordatorio.toISOString().split('T')[0]
    }])

    setLoading(false)
    if (error) {
      setMensaje('error:' + error.message)
    } else {
      setMensaje('ok:Cliente registrado correctamente')
      setForm({ nombre: '', telefono: '', vehiculo: '', placa: '', tipo_servicio: '', fecha_servicio: '', notas: '', meses_recordatorio: 2 })
      setTimeout(() => { setMensaje(''); onGuardado?.() }, 1200)
    }
  }

  const isError = mensaje.startsWith('error:')
  const isOk = mensaje.startsWith('ok:')
  const msgText = mensaje.slice(mensaje.indexOf(':') + 1)

  return (
    <div style={{ maxWidth: '680px' }}>
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '32px', marginBottom: '16px',
      }}>
        <p style={sectionLabel}>Datos del cliente</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {[
            { label: 'Nombre completo', name: 'nombre', placeholder: 'Juan Pérez' },
            { label: 'WhatsApp', name: 'telefono', placeholder: '3001234567' },
            { label: 'Vehículo', name: 'vehiculo', placeholder: 'AKT NKD 125' },
            { label: 'Placa', name: 'placa', placeholder: 'ABC123' },
          ].map(f => (
            <div key={f.name}>
              <label style={lbl}>{f.label}</label>
              <input
                name={f.name}
                value={form[f.name as keyof typeof form] as string}
                onChange={handleChange}
                placeholder={f.placeholder}
                style={inp}
              />
            </div>
          ))}
        </div>
      </div>

      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '32px', marginBottom: '16px',
      }}>
        <p style={sectionLabel}>Servicio</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={lbl}>Tipo de servicio</label>
            <select name="tipo_servicio" value={form.tipo_servicio} onChange={handleChange} style={inp}>
              <option value="">Seleccionar...</option>
              {Object.keys(SERVICIOS).map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Fecha del servicio</label>
            <input name="fecha_servicio" type="date" value={form.fecha_servicio} onChange={handleChange} style={inp} />
          </div>
          <div>
            <label style={lbl}>Próximo recordatorio (meses)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                name="meses_recordatorio" type="number" min={1} max={24}
                value={form.meses_recordatorio} onChange={handleChange}
                style={{ ...inp, width: '80px' }}
              />
              <span style={{ fontSize: '13px', color: 'var(--text3)' }}>
                {form.tipo_servicio ? `Sugerido: ${SERVICIOS[form.tipo_servicio]} meses` : 'Selecciona un servicio'}
              </span>
            </div>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={lbl}>Notas</label>
            <textarea
              name="notas" value={form.notas} onChange={handleChange}
              rows={3} placeholder="Observaciones del servicio..."
              style={{ ...inp, resize: 'none' }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {mensaje ? (
          <span style={{
            fontSize: '13px',
            color: isOk ? 'var(--green)' : isError ? 'var(--red)' : 'var(--text2)',
            background: isOk ? 'var(--green-bg)' : isError ? 'var(--red-bg)' : 'transparent',
            padding: '6px 12px', borderRadius: '6px',
          }}>
            {isOk ? '✓ ' : '⚠ '}{msgText}
          </span>
        ) : <span />}
        <button onClick={handleSubmit} disabled={loading} style={{
          padding: '12px 32px', borderRadius: '10px',
          background: loading ? 'var(--bg4)' : 'var(--accent)',
          color: 'white', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '14px', fontWeight: '500', fontFamily: 'var(--font-body)', transition: 'all 0.2s',
        }}>
          {loading ? 'Guardando...' : 'Guardar cliente →'}
        </button>
      </div>
    </div>
  )
}

const sectionLabel: React.CSSProperties = {
  fontFamily: 'var(--font-display)', fontSize: '13px', fontWeight: '600',
  color: 'var(--text3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '24px',
}
const lbl: React.CSSProperties = {
  fontSize: '11px', fontWeight: '500', color: 'var(--text3)',
  display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em',
}
const inp: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: '8px',
  border: '1px solid var(--border)', background: 'var(--bg3)',
  color: 'var(--text)', fontSize: '14px', outline: 'none',
  fontFamily: 'var(--font-body)', transition: 'border-color 0.15s',
}
