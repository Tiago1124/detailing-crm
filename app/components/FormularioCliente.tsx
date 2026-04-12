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
      setMensaje('❌ Error al guardar: ' + error.message)
    } else {
      setMensaje('✅ Cliente guardado correctamente')
      setForm({ nombre: '', telefono: '', vehiculo: '', placa: '', tipo_servicio: '', fecha_servicio: '', notas: '' })
    }
  }

  return (
    <div style={{ background: 'white', border: '0.5px solid #e5e5e5', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem' }}>
      <h2 style={{ fontSize: '1rem', fontWeight: '500', marginBottom: '1rem' }}>Registrar servicio</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>Nombre completo</label>
          <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Juan Pérez" style={{ width: '100%' }} />
        </div>
        <div>
          <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>Teléfono WhatsApp</label>
          <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="3001234567" style={{ width: '100%' }} />
        </div>
        <div>
          <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>Vehículo</label>
          <input name="vehiculo" value={form.vehiculo} onChange={handleChange} placeholder="Toyota Corolla 2022" style={{ width: '100%' }} />
        </div>
        <div>
          <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>Placa</label>
          <input name="placa" value={form.placa} onChange={handleChange} placeholder="ABC123" style={{ width: '100%' }} />
        </div>
        <div>
          <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>Tipo de servicio</label>
          <select name="tipo_servicio" value={form.tipo_servicio} onChange={handleChange} style={{ width: '100%' }}>
            <option value="">Seleccionar...</option>
            <option>Detailing completo</option>
            <option>Lavado exterior</option>
            <option>Pulida y encerada</option>
            <option>Limpieza interior</option>
            <option>Ceramic coating</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>Fecha del servicio</label>
          <input name="fecha_servicio" type="date" value={form.fecha_servicio} onChange={handleChange} style={{ width: '100%' }} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '4px' }}>Notas</label>
          <textarea name="notas" value={form.notas} onChange={handleChange} rows={2} placeholder="Observaciones del servicio..." style={{ width: '100%' }} />
        </div>
      </div>
      {mensaje && <p style={{ fontSize: '13px', marginTop: '12px' }}>{mensaje}</p>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
        <button onClick={handleSubmit} disabled={loading} style={{ padding: '9px 24px', borderRadius: '8px', background: 'black', color: 'white', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
          {loading ? 'Guardando...' : 'Guardar cliente'}
        </button>
      </div>
    </div>
  )
}