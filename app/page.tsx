'use client'
import { UserButton, useUser } from '@clerk/nextjs'
import { useState, useEffect } from 'react'
import FormularioCliente from './components/FormularioCliente'
import ListaClientes from './components/ListaClientes'
import Dashboard from './components/Dashboard'
import GestionDatos from './components/GestionDatos'

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
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const role = user?.publicMetadata?.role as string || 'sede'
  const empresa = user?.publicMetadata?.empresa as string || 'discol'
  const sede = user?.publicMetadata?.sede as string || null
  const isAdmin = role === 'admin'
  const NAV = isAdmin ? NAV_ADMIN : NAV_SEDE

  const switchTab = (key: string) => {
    setTab(key)
    setSidebarOpen(false)
  }

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const tabTitle: Record<string, string> = {
    clientes: 'Clientes',
    registrar: 'Registrar servicio',
    dashboard: 'Dashboard',
    datos: 'Gestión de datos',
  }

  const tabSubtitle: Record<string, string> = {
    clientes: 'Seguimiento de mantenimientos y recordatorios',
    registrar: 'Registra un nuevo servicio',
    dashboard: 'Indicadores por sede y asesor',
    datos: 'Visualiza y exporta los datos del sistema',
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* Mobile overlay */}
      <div
        className={`mobile-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Mobile header */}
      <div className="mobile-header">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            background: 'none', border: 'none', color: 'var(--text)',
            fontSize: '20px', cursor: 'pointer', padding: '8px',
          }}
        >
          {sidebarOpen ? '✕' : '☰'}
        </button>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '15px', fontWeight: '600' }}>
          {empresa === 'discol' ? 'Discolmotos' : 'Zagamotos'}
        </span>
        <UserButton appearance={{ elements: { avatarBox: { width: 28, height: 28 } } }} />
      </div>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
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

        <nav style={{ padding: '16px 12px', flex: 1, overflowY: 'auto' }}>
          <p style={{
            fontSize: '10px', fontWeight: '600', color: 'var(--text3)',
            letterSpacing: '0.12em', textTransform: 'uppercase',
            padding: '0 12px', marginBottom: '8px',
          }}>Módulos</p>

          {NAV.map(n => (
            <button key={n.key} onClick={() => switchTab(n.key)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px', borderRadius: '8px', border: 'none',
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

          <div style={{ marginTop: '24px', padding: '0 12px' }}>
            <p style={{
              fontSize: '10px', fontWeight: '600', color: 'var(--text3)',
              letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px',
            }}>Herramientas</p>
            <a href="/encuesta" target="_blank" rel="noreferrer" style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px', borderRadius: '8px',
              color: 'var(--text2)', fontSize: '14px', textDecoration: 'none',
            }}>
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
      <main className="main-content">
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: '24px',
            fontWeight: '700', letterSpacing: '-0.03em', lineHeight: 1.1,
          }}>
            {tabTitle[tab]}
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: '14px', marginTop: '4px' }}>
            {tabSubtitle[tab]}
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
        {tab === 'dashboard' && isAdmin && (
          <Dashboard empresa={empresa} />
        )}
        {tab === 'datos' && isAdmin && (
          <GestionDatos empresa={empresa} />
        )}
      </main>
    </div>
  )
}
