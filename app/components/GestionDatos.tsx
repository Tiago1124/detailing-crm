'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { createSupabaseClient } from '@/lib/supabase'
import * as XLSX from 'xlsx'

type Cliente = {
  id: string
  nombre: string
  telefono: string
  vehiculo: string
  placa: string
  tipo_servicio: string
  fecha_servicio: string
  proximo_recordatorio: string
  sede: string
  empresa: string
  notas: string
  created_at: string
}

type Encuesta = {
  id: string
  empresa: string
  sede: string
  asesor: string
  nombre: string
  cedula: string
  telefono: string
  referencia_moto: string
  placa: string
  pregunta_1: number
  pregunta_2: number
  pregunta_3: number
  pregunta_4: number
  pregunta_5: number
  created_at: string
}

export default function GestionDatos({ empresa }: { empresa: string }) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [encuestas, setEncuestas] = useState<Encuesta[]>([])
  const [loading, setLoading] = useState(true)
  const [vista, setVista] = useState<'clientes' | 'encuestas'>('clientes')
  const [busqueda, setBusqueda] = useState('')

  const { getToken } = useAuth()

  useEffect(() => {
    const cargar = async () => {
      setLoading(true)
      const token = await getToken({ template: 'supabase' })
      const client = createSupabaseClient(token)

      const [{ data: cli }, { data: enc }] = await Promise.all([
        client.from('clientes').select('*').eq('empresa', empresa).order('created_at', { ascending: false }),
        client.from('encuestas').select('*').eq('empresa', empresa).order('created_at', { ascending: false }),
      ])
      setClientes(cli || [])
      setEncuestas(enc || [])
      setLoading(false)
    }
    cargar()
  }, [empresa])

  const exportarClientes = () => {
    const datos = clientes.map(c => ({
      'Nombre': c.nombre,
      'Teléfono': c.telefono,
      'Vehículo': c.vehiculo,
      'Placa': c.placa,
      'Tipo servicio': c.tipo_servicio,
      'Fecha servicio': c.fecha_servicio,
      'Próximo recordatorio': c.proximo_recordatorio,
      'Sede': c.sede,
      'Empresa': c.empresa,
      'Notas': c.notas,
      'Registrado': new Date(c.created_at).toLocaleDateString('es-CO'),
    }))
    const ws = XLSX.utils.json_to_sheet(datos)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Clientes')
    XLSX.writeFile(wb, `clientes_${empresa}_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const exportarEncuestas = () => {
    const datos = encuestas.map(e => ({
      'Empresa': e.empresa,
      'Sede': e.sede,
      'Asesor': e.asesor,
      'Nombre cliente': e.nombre,
      'Cédula': e.cedula,
      'Teléfono': e.telefono,
      'Referencia moto': e.referencia_moto,
      'Placa': e.placa,
      'Atención asesor': e.pregunta_1,
      'Tiempo de espera': e.pregunta_2,
      'Calidad servicio': e.pregunta_3,
      'Instalaciones': e.pregunta_4,
      'Recomendaría': e.pregunta_5,
      'Promedio': Math.round(((e.pregunta_1 + e.pregunta_2 + e.pregunta_3 + e.pregunta_4 + e.pregunta_5) / 5) * 10) / 10,
      'Fecha': new Date(e.created_at).toLocaleDateString('es-CO'),
    }))
    const ws = XLSX.utils.json_to_sheet(datos)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Encuestas')
    XLSX.writeFile(wb, `encuestas_${empresa}_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const clientesFiltrados = clientes.filter(c => {
    if (!busqueda) return true
    const q = busqueda.toLowerCase()
    return c.nombre.toLowerCase().includes(q) ||
      c.placa?.toLowerCase().includes(q) ||
      c.sede?.toLowerCase().includes(q)
  })

  const encuestasFiltradas = encuestas.filter(e => {
    if (!busqueda) return true
    const q = busqueda.toLowerCase()
    return e.nombre.toLowerCase().includes(q) ||
      e.asesor?.toLowerCase().includes(q) ||
      e.sede?.toLowerCase().includes(q)
  })

  return (
    <div>
      {/* Header con exportar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '6px', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px', padding: '4px' }}>
          {(['clientes', 'encuestas'] as const).map(v => (
            <button key={v} onClick={() => { setVista(v); setBusqueda('') }} style={{
              padding: '6px 16px', borderRadius: '6px', border: 'none',
              background: vista === v ? 'var(--bg4)' : 'transparent',
              color: vista === v ? 'var(--text)' : 'var(--text3)',
              fontSize: '13px', cursor: 'pointer', fontFamily: 'var(--font-body)',
              fontWeight: vista === v ? '500' : '400', transition: 'all 0.15s',
              textTransform: 'capitalize',
            }}>{v} ({vista === v ? (v === 'clientes' ? clientesFiltrados.length : encuestasFiltradas.length) : (v === 'clientes' ? clientes.length : encuestas.length)})</button>
          ))}
        </div>

        <button
          onClick={vista === 'clientes' ? exportarClientes : exportarEncuestas}
          style={{
            padding: '9px 20px', borderRadius: '8px',
            background: 'var(--green-bg)', color: 'var(--green)',
            border: '1px solid rgba(45,217,143,0.2)',
            cursor: 'pointer', fontSize: '13px', fontWeight: '500',
            fontFamily: 'var(--font-body)',
          }}
        >
          Exportar Excel →
        </button>
      </div>

      {/* Buscador */}
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontSize: '14px' }}>⌕</span>
        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder={vista === 'clientes' ? 'Buscar por nombre, placa o sede...' : 'Buscar por nombre, asesor o sede...'}
          style={{
            width: '100%', padding: '9px 12px 9px 32px',
            borderRadius: '8px', border: '1px solid var(--border)',
            background: 'var(--bg2)', color: 'var(--text)',
            fontSize: '13px', fontFamily: 'var(--font-body)', outline: 'none',
          }}
        />
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text3)', fontSize: '14px' }}>
          Cargando datos...
        </div>
      )}

      {/* Tabla clientes */}
      {!loading && vista === 'clientes' && (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Nombre', 'Teléfono', 'Vehículo', 'Placa', 'Sede', 'Servicio', 'Próximo recordatorio'].map(h => (
                    <th key={h} style={{
                      padding: '12px 16px', textAlign: 'left',
                      color: 'var(--text3)', fontWeight: '500',
                      fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em',
                      whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clientesFiltrados.map((c, i) => (
                  <tr key={c.id} style={{
                    borderBottom: '1px solid var(--border)',
                    background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                  }}>
                    <td style={td}>{c.nombre}</td>
                    <td style={td}>{c.telefono}</td>
                    <td style={td}>{c.vehiculo || '—'}</td>
                    <td style={{ ...td, fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{c.placa || '—'}</td>
                    <td style={td}>{c.sede || '—'}</td>
                    <td style={td}>{c.tipo_servicio || '—'}</td>
                    <td style={td}>
                      {new Date(c.proximo_recordatorio + 'T00:00:00').toLocaleDateString('es-CO', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {clientesFiltrados.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text3)', fontSize: '14px' }}>
                No se encontraron clientes
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabla encuestas */}
      {!loading && vista === 'encuestas' && (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Nombre', 'Sede', 'Asesor', 'Moto', 'Atención', 'Espera', 'Calidad', 'Instalac.', 'Recomienda', 'Promedio', 'Fecha'].map(h => (
                    <th key={h} style={{
                      padding: '12px 16px', textAlign: 'left',
                      color: 'var(--text3)', fontWeight: '500',
                      fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em',
                      whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {encuestasFiltradas.map((e, i) => {
                  const prom = Math.round(((e.pregunta_1 + e.pregunta_2 + e.pregunta_3 + e.pregunta_4 + e.pregunta_5) / 5) * 10) / 10
                  const promColor = prom >= 4 ? 'var(--green)' : prom >= 3 ? 'var(--amber)' : 'var(--red)'
                  return (
                    <tr key={e.id} style={{
                      borderBottom: '1px solid var(--border)',
                      background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                    }}>
                      <td style={td}>{e.nombre}</td>
                      <td style={td}>{e.sede || '—'}</td>
                      <td style={td}>{e.asesor || '—'}</td>
                      <td style={td}>{e.referencia_moto || '—'}</td>
                      {[e.pregunta_1, e.pregunta_2, e.pregunta_3, e.pregunta_4, e.pregunta_5].map((p, j) => (
                        <td key={j} style={{ ...td, textAlign: 'center' }}>
                          <span style={{
                            color: p >= 4 ? 'var(--green)' : p >= 3 ? 'var(--amber)' : 'var(--red)',
                            fontWeight: '600',
                          }}>{p}</span>
                        </td>
                      ))}
                      <td style={{ ...td, textAlign: 'center' }}>
                        <span style={{ color: promColor, fontWeight: '700' }}>{prom}</span>
                      </td>
                      <td style={{ ...td, whiteSpace: 'nowrap', color: 'var(--text3)' }}>
                        {new Date(e.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {encuestasFiltradas.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text3)', fontSize: '14px' }}>
                No se encontraron encuestas
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const td: React.CSSProperties = {
  padding: '11px 16px',
  color: 'var(--text2)',
  whiteSpace: 'nowrap',
  maxWidth: '180px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}
