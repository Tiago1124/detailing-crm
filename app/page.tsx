'use client'
import { UserButton, useUser } from '@clerk/nextjs'
import { useState } from 'react'
import FormularioCliente from './components/FormularioCliente'
import ListaClientes from './components/ListaClientes'

const NAV_SEDE = [
  { key: 'clientes', label: 'Clientes', icon: '◈' },
  { key: 'registrar', label: 'Registrar', icon: '＋' },
]

const NAV_ADMIN = [
  { key: 'clientes', label: 'Clientes', icon: '◈' },
  { key: 'registrar', label: 'Registrar', icon: '＋' },
  { key: 'dashboard', label: 'Dashboard', icon: '◉' },
  { key: 'datos', label: 'Gestión datos', icon: '◫' },
]

export default function Home() {
  const { user } = useUser()
  const [tab, setTab] = useState('clientes')
  const [refresh, setRefresh] = useState(0)

  const role = user?.publicMetadata?.role as string || 'sede'
  const empresa = user?.publicMetadata?.empresa as string || 'discol'
  const sede = user?.publicMetadata?.sede as string || null
  const isAdmin = role === 'admin'
  const NAV = isAdmin ? NAV_ADMIN : NAV_SEDE

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* Sidebar */}
      <aside style={{
        width: '220px', background: 'var(--bg2)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 10,
      }}>
        <div style={{ padding: '28px 24px 24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{
            fontFamily: 'var(--font-display)', fontSize: '16px',
            fontWeight: '700', color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1.2,
          }}>
            {empresa === 'discol' ? 'Discolmotos' : 'Zagamotos'}
            <br />
            <span style={{ color: 'var(--accent2)', fontWeight: '400', fontSize: '13px' }}>
              {isAdmin ? 'Super admin' : `Sede ${sede || ''}`}
            </span>
          </div>
        </div>

        <nav style={{ padding: '16px 12px', flex: 1 }}>
          <p style={{
            fontSize: '10px', fontWeight: '600', color: 'var(--text3)',
            letterSpacing: '0.12em', textTransform: 'uppercase',
            padding: '0 12px', marginBottom: '8px',
          }}>Módulos</p>

          {NAV.map(n => (
            <button key={n.key} onClick={() => setTab(n.key)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
              padding: '9px 12px', borderRadius: '8px', border: 'none',
              background: tab === n.key ? 'var(--accent-glow)' : 'transparent',
              color: tab === n.key ? 'var(--accent2)' : 'var(--text2)',
              fontSize: '14px', fontWeight: tab === n.key ? '500' : '400',
              cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
              fontFamily: 'var(--font-body)', marginBottom: '2px',
            }}>
              <span style={{ fontSize: '16px', opacity: 0.8 }}>{n.icon}</span>
              {n.label}
            </button>
          ))}

          {/* Link encuesta */}
          <div style={{ marginTop: '24px', padding: '0 12px' }}>
            <p style={{
              fontSize: '10px', fontWeight: '600', color: 'var(--text3)',
              letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px',
            }}>Herramientas</p>
            <a
              href="/encuesta"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 12px', borderRadius: '8px',
                color: 'var(--text2)', fontSize: '14px',
                textDecoration: 'none', transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: '16px', opacity: 0.8 }}>◇</span>
              Ver encuesta
            </a>
          </div>
        </nav>

        <div style={{
          padding: '16px 24px', borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <UserButton appearance={{ elements: { avatarBox: { width: 30, height: 30 } } }} />
          <div>
            <p style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1 }}>
              {user?.firstName || 'Usuario'}
            </p>
            <p style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px' }}>
              {isAdmin ? 'Administrador' : 'Sede'}
            </p>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: '220px', flex: 1, padding: '40px 48px' }}>
        <div style={{ marginBottom: '36px' }}>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: '28px',
            fontWeight: '700', letterSpacing: '-0.03em', lineHeight: 1.1,
          }}>
            {tab === 'clientes' && 'Clientes'}
            {tab === 'registrar' && 'Registrar servicio'}
            {tab === 'dashboard' && 'Dashboard'}
            {tab === 'datos' && 'Gestión de datos'}
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: '14px', marginTop: '6px' }}>
            {tab === 'clientes' && 'Seguimiento de mantenimientos y recordatorios'}
            {tab === 'registrar' && 'Registra un nuevo servicio'}
            {tab === 'dashboard' && 'Indicadores por sede y asesor'}
            {tab === 'datos' && 'Visualiza y exporta los datos del sistema'}
          </p>
        </div>

        {tab === 'registrar' && (
          <FormularioCliente
            empresa={empresa}
            sede={sede}
            onGuardado={() => { setRefresh(r => r + 1); setTab('clientes') }}
          />
        )}
        {tab === 'clientes' && (
          <ListaClientes
            refresh={refresh}
            empresa={empresa}
            sede={isAdmin ? null : sede}
            isAdmin={isAdmin}
          />
        )}
        {tab === 'dashboard' && (
          <div style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '32px', textAlign: 'center',
            color: 'var(--text3)', fontSize: '14px',
          }}>
            Dashboard en construcción — próximo módulo
          </div>
        )}
        {tab === 'datos' && (
          <div style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: '32px', textAlign: 'center',
            color: 'var(--text3)', fontSize: '14px',
          }}>
            Gestión de datos en construcción — próximo módulo
          </div>
        )}
      </main>
    </div>
  )
}