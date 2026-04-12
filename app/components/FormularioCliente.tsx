'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function FormularioCliente() {
  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    vehiculo: '',
    placa: '',
    tipo_servicio: '',
    fecha_servicio: '',
    notas: ''
  })
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async () => {
    if (!form.nombre || !form.telefono || !form.fecha_servicio) {
      setMensaje('⚠ Completa nombre, teléfono y fecha')
      return
    }
    setLoading(true)
    const fechaServicio = new Date(form.fecha_servicio)
    const proximoRecordatorio = new Date(fechaServicio)
    proximoRecordatorio.setMonth(proximoRecordatorio.getMonth() + 2)

    const { error } = await supabase.from('clientes').insert([{
      ...form,
      proximo_recordatorio: proximoRecordatorio.toISOString().split('T')[0]
    }])

    setLoading(false)
    if (error) {
      setMensaje('❌ Error: ' + error.message)
    } else {
      setMensaje('✅ Cliente guardado')
      setForm({ nombre: '', telefono: '', vehiculo: '', placa: '', tipo_servicio: '', fecha_servicio: '', notas: '' })
      setTimeout(() => setMensaje(''), 3000)
    }
  }

  return (
    <div style={{
      background: 'white',
      border: '1px solid #f0f0f0',
      borderRadius: '16px',
      padding: '2rem',
      marginBottom: '2rem',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
    }}>
      <h2 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1.5rem', color: '#111' }}>
        Registrar nuevo servicio
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {[
          { label: 'Nombre completo', name: 'nombre', placeholder: 'Juan Pérez' },
          { label: 'Teléfono WhatsApp', name: 'telefono', placeholder: '3001234567' },
          { label: 'Vehículo', name: 'vehiculo', placeholder: 'Toyota Corolla 2022' },
          { label: 'Placa', name: 'placa', placeholder: 'ABC123' },
        ].map(f => (
          <div key={f.name}>
            <label style={labelStyle}>{f.label}</label>
            <input
              name={f.name}
              value={form[f.name as keyof typeof form]}
              onChange={handleChange}
              placeholder={f.placeholder}
              style={inputStyle}
            />
          </div>
        ))}

        <div>
          <label style={labelStyle}>Tipo de servicio</label>
          <select name="tipo_servicio" value={form.tipo_servicio} onChange={handleChange} style={inputStyle}>
            <option value="">Seleccionar...</option>
            <option>Detailing completo</option>
            <option>Lavado exterior</option>
            <option>Pulida y encerada</option>
            <option>Limpieza interior</option>
            <option>Ceramic coating</option>
          </select>
        </div>

        <div>
          <label style={labelStyle}>Fecha del servicio</label>
          <input
            name="fecha_servicio"
            type="date"
            value={form.fecha_servicio}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Notas</label>
          <textarea
            name="notas"
            value={form.notas}
            onChange={handleChange}
            rows={3}
            placeholder="Observaciones del servicio..."
            style={{ ...inputStyle, resize: 'none' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
        {mensaje
          ? <span style={{ fontSize: '13px', color: mensaje.includes('✅') ? '#16a34a' : '#dc2626' }}>{mensaje}</span>
          : <span />
        }
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            padding: '10px 28px',
            borderRadius: '8px',
            background: loading ? '#999' : '#111',
            color: 'white',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'background 0.2s'
          }}
        >
          {loading ? 'Guardando...' : 'Guardar cliente'}
        </button>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: '500',
  color: '#666',
  display: 'block',
  marginBottom: '6px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid #e5e5e5',
  fontSize: '14px',
  color: '#111',
  background: '#fafafa',
  outline: 'none',
  fontFamily: 'inherit'
}