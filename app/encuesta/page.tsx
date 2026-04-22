'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

type Sede = {
  id: string
  nombre: string
  ciudad: string
  empresa: string
}

const PREGUNTAS = [
  '¿Cómo califica la atención recibida por el asesor?',
  '¿Cómo califica el tiempo de espera en el taller?',
  '¿Cómo califica la calidad del servicio realizado?',
  '¿Cómo califica las instalaciones del taller?',
  '¿Qué tan probable es que nos recomiende?',
]

export default function Encuesta() {
  const [sedes, setSedes] = useState<Sede[]>([])
  const [empresa, setEmpresa] = useState('')
  const [form, setForm] = useState({
    sede: '', asesor: '', nombre: '', cedula: '',
    telefono: '', referencia_moto: '', placa: '',
    acepta_habeas_data: false,
  })
  const [respuestas, setRespuestas] = useState<Record<number, number>>({})
  const [paso, setPaso] = useState(1)
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!empresa) return
    supabase.from('sedes')
      .select('*')
      .eq('empresa', empresa)
      .eq('activa', true)
      .then(({ data }) => setSedes(data || []))
  }, [empresa])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setForm(f => ({
      ...f,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleEnviar = async () => {
    if (!form.acepta_habeas_data) {
      setError('Debes aceptar el tratamiento de datos para continuar')
      return
    }
    if (Object.keys(respuestas).length < PREGUNTAS.length) {
      setError('Por favor responde todas las preguntas')
      return
    }
    setLoading(true)
    const { error: err } = await supabase.from('encuestas').insert([{
      empresa,
      sede: form.sede,
      asesor: form.asesor,
      nombre: form.nombre,
      cedula: form.cedula,
      telefono: form.telefono,
      referencia_moto: form.referencia_moto,
      placa: form.placa.toUpperCase(),
      pregunta_1: respuestas[0],
      pregunta_2: respuestas[1],
      pregunta_3: respuestas[2],
      pregunta_4: respuestas[3],
      pregunta_5: respuestas[4],
      acepta_habeas_data: form.acepta_habeas_data,
    }])
    setLoading(false)
    if (err) { setError('Error al enviar: ' + err.message); return }
    setEnviado(true)
  }

  if (enviado) return (
    <div style={wrapStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div>
          <h2 style={{ ...titleStyle, marginBottom: '8px' }}>¡Gracias por tu opinión!</h2>
          <p style={{ color: 'var(--text2)', fontSize: '14px' }}>
            Tu respuesta ha sido registrada. Te contactaremos cuando sea momento de tu próximo mantenimiento.
          </p>
        </div>
      </div>
    </div>
  )

  return (
    <div style={wrapStyle}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: '700', letterSpacing: '-0.03em' }}>
          Encuesta de satisfacción
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: '14px', marginTop: '6px' }}>
          Tu opinión nos ayuda a mejorar
        </p>
      </div>

      {/* Paso 1 — Empresa y sede */}
      {paso === 1 && (
        <div style={cardStyle}>
          <p style={sectionLabel}>¿Con quién realizaste tu servicio?</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            {['discol', 'zagamotos'].map(e => (
              <button key={e} onClick={() => { setEmpresa(e); setForm(f => ({ ...f, sede: '' })) }} style={{
                padding: '16px', borderRadius: '10px', border: `1.5px solid ${empresa === e ? 'var(--accent)' : 'var(--border)'}`,
                background: empresa === e ? 'var(--accent-glow)' : 'var(--bg3)',
                color: empresa === e ? 'var(--accent2)' : 'var(--text2)',
                fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: '600',
                cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.15s',
              }}>
                {e === 'discol' ? 'Discolmotos' : 'Zagamotos'}
              </button>
            ))}
          </div>

          {empresa && (
            <>
              <label style={lbl}>Sede donde realizaste el servicio</label>
              <select name="sede" value={form.sede} onChange={handleChange} style={inp}>
                <option value="">Seleccionar sede...</option>
                {sedes.map(s => (
                  <option key={s.id} value={s.nombre}>{s.nombre} — {s.ciudad}</option>
                ))}
              </select>

              <label style={{ ...lbl, marginTop: '12px' }}>Nombre del asesor que te atendió</label>
              <input name="asesor" value={form.asesor} onChange={handleChange} placeholder="Nombre del asesor" style={inp} />
            </>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button
              onClick={() => { if (!empresa || !form.sede || !form.asesor) { setError('Completa todos los campos'); return }; setError(''); setPaso(2) }}
              style={btnPrimary}
            >Siguiente →</button>
          </div>
          {error && <p style={errorStyle}>{error}</p>}
        </div>
      )}

      {/* Paso 2 — Datos personales */}
      {paso === 2 && (
        <div style={cardStyle}>
          <p style={sectionLabel}>Tus datos</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={lbl}>Nombre completo</label>
              <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Juan Pérez" style={inp} />
            </div>
            <div>
              <label style={lbl}>Cédula</label>
              <input name="cedula" value={form.cedula} onChange={handleChange} placeholder="1234567890" style={inp} />
            </div>
            <div>
              <label style={lbl}>WhatsApp</label>
              <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="3001234567" style={inp} />
            </div>
            <div>
              <label style={lbl}>Placa de la moto</label>
              <input name="placa" value={form.placa} onChange={handleChange} placeholder="ABC123" style={inp} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Referencia de la moto</label>
              <input name="referencia_moto" value={form.referencia_moto} onChange={handleChange} placeholder="AKT NKD 125, Suzuki GN 125..." style={inp} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
            <button onClick={() => setPaso(1)} style={btnSecondary}>← Atrás</button>
            <button onClick={() => {
              if (!form.nombre || !form.cedula || !form.telefono) { setError('Completa nombre, cédula y teléfono'); return }
              setError(''); setPaso(3)
            }} style={btnPrimary}>Siguiente →</button>
          </div>
          {error && <p style={errorStyle}>{error}</p>}
        </div>
      )}

      {/* Paso 3 — Preguntas de satisfacción */}
      {paso === 3 && (
        <div style={cardStyle}>
          <p style={sectionLabel}>Califica tu experiencia</p>
          <p style={{ fontSize: '13px', color: 'var(--text3)', marginBottom: '20px' }}>
            1 = Muy malo · 5 = Excelente
          </p>

          {PREGUNTAS.map((pregunta, i) => (
            <div key={i} style={{ marginBottom: '20px' }}>
              <p style={{ fontSize: '14px', color: 'var(--text)', marginBottom: '10px' }}>{pregunta}</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setRespuestas(r => ({ ...r, [i]: n }))} style={{
                    width: '44px', height: '44px', borderRadius: '8px',
                    border: `1.5px solid ${respuestas[i] === n ? 'var(--accent)' : 'var(--border)'}`,
                    background: respuestas[i] === n ? 'var(--accent-glow)' : 'var(--bg3)',
                    color: respuestas[i] === n ? 'var(--accent2)' : 'var(--text2)',
                    fontSize: '15px', fontWeight: '600', cursor: 'pointer',
                    transition: 'all 0.15s', fontFamily: 'var(--font-body)',
                  }}>{n}</button>
                ))}
              </div>
            </div>
          ))}

          {/* Habeas data */}
          <div style={{
            background: 'var(--bg3)', border: '1px solid var(--border)',
            borderRadius: '8px', padding: '14px', marginTop: '8px',
          }}>
            <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', cursor: 'pointer' }}>
              <input
                type="checkbox" name="acepta_habeas_data"
                checked={form.acepta_habeas_data}
                onChange={handleChange}
                style={{ marginTop: '2px', accentColor: 'var(--accent)' }}
              />
              <span style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: 1.5 }}>
                Autorizo el tratamiento de mis datos personales conforme a la{' '}
                <a href="https://discolmotos.com/manual-de-tratamiento-de-datos-personales/"
                  target="_blank" rel="noreferrer"
                  style={{ color: 'var(--accent2)' }}>
                  política de tratamiento de datos
                </a>{' '}
                (Ley 1581 de 2012).
              </span>
            </label>
          </div>

          {error && <p style={errorStyle}>{error}</p>}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
            <button onClick={() => setPaso(2)} style={btnSecondary}>← Atrás</button>
            <button onClick={handleEnviar} disabled={loading} style={btnPrimary}>
              {loading ? 'Enviando...' : 'Enviar encuesta'}
            </button>
          </div>
        </div>
      )}

      {/* Indicador de pasos */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
        {[1, 2, 3].map(p => (
          <div key={p} style={{
            width: p === paso ? '24px' : '8px', height: '8px',
            borderRadius: '4px', transition: 'all 0.3s',
            background: p === paso ? 'var(--accent)' : p < paso ? 'var(--accent2)' : 'var(--border)',
          }} />
        ))}
      </div>
    </div>
  )
}

const wrapStyle: React.CSSProperties = {
  minHeight: '100vh', background: 'var(--bg)',
  padding: '40px 16px', maxWidth: '560px', margin: '0 auto',
}
const cardStyle: React.CSSProperties = {
  background: 'var(--bg2)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)', padding: '28px',
}
const titleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)', fontSize: '20px',
  fontWeight: '700', color: 'var(--text)',
}
const sectionLabel: React.CSSProperties = {
  fontFamily: 'var(--font-display)', fontSize: '13px',
  fontWeight: '600', color: 'var(--text3)',
  letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px',
}
const lbl: React.CSSProperties = {
  fontSize: '11px', fontWeight: '500', color: 'var(--text3)',
  display: 'block', marginBottom: '6px',
  textTransform: 'uppercase', letterSpacing: '0.08em',
}
const inp: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: '8px',
  border: '1px solid var(--border)', background: 'var(--bg3)',
  color: 'var(--text)', fontSize: '14px', outline: 'none',
  fontFamily: 'var(--font-body)',
}
const btnPrimary: React.CSSProperties = {
  padding: '10px 24px', borderRadius: '8px', background: 'var(--accent)',
  color: 'white', border: 'none', cursor: 'pointer',
  fontSize: '14px', fontWeight: '500', fontFamily: 'var(--font-body)',
}
const btnSecondary: React.CSSProperties = {
  padding: '10px 24px', borderRadius: '8px', background: 'transparent',
  color: 'var(--text2)', border: '1px solid var(--border)', cursor: 'pointer',
  fontSize: '14px', fontWeight: '400', fontFamily: 'var(--font-body)',
}
const errorStyle: React.CSSProperties = {
  fontSize: '13px', color: 'var(--red)', marginTop: '10px',
  background: 'var(--red-bg)', padding: '8px 12px', borderRadius: '6px',
}