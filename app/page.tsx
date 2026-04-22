'use client'
import { UserButton } from '@clerk/nextjs'
import { useState } from 'react'
import FormularioCliente from './components/FormularioCliente'
import ListaClientes from './components/ListaClientes'

const NAV = [
  { key: 'clientes', label: 'Clientes', icon: '◈' },
  { key: 'registrar', label: 'Registrar', icon: '＋' },
  // DISCOL/ZAGAMOTOS — módulos futuros
  // { key: 'encuesta', label: 'Encuesta', icon: '◇' },
  // { key: 'citas', label: 'Citas', icon: '◫' },
  // { key: 'dashboard', label: 'Dashboard', icon: '◉' },
]

export default function Home() {
  const [tab, setTab] = useState('clientes')
  const [refresh, setRefresh] = useState(0)

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* Sidebar */}
      <aside style={{
        width: '220px',
        background: 'var(--bg2)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '0',
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{
          padding: '28px 24px 24px',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '18px',
            fontWeight: '700',
            color: 'var(--text)',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}>
            Detailing<br />
            <span style={{ color: 'var(--accent2)', fontWeight: '400', fontSize: '14px' }}>CRM Studio</span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '16px 12px', flex: 1 }}>
          <p style={{
            fontSize: '10px',
            fontWeight: '600',
            color: 'var(--text3)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            padding: '0 12px',
            marginBottom: '8px',
          }}>Principal</p>
          {NAV.map(n => (
            <button
              key={n.key}
              onClick={() => setTab(n.key)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 12px',
                borderRadius: '8px',
                border: 'none',
                background: tab === n.key ? 'var(--accent-glow)' : 'transparent',
                color: tab === n.key ? 'var(--accent2)' : 'var(--text2)',
                fontSize: '14px',
                fontWeight: tab === n.key ? '500' : '400',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
                fontFamily: 'var(--font-body)',
                marginBottom: '2px',
              }}
            >
              <span style={{ fontSize: '16px', opacity: 0.8 }}>{n.icon}</span>
              {n.label}
            </button>
          ))}

          {/* Sección futura Discol/Zagamotos */}
          <div style={{ marginTop: '24px' }}>
            <p style={{
              fontSize: '10px',
              fontWeight: '600',
              color: 'var(--text3)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              padding: '0 12px',
              marginBottom: '8px',
            }}>Próximamente</p>
            {[
              { label: 'Encuestas', icon: '◇' },
              { label: 'Agendamiento', icon: '◫' },
              { label: 'Dashboard', icon: '◉' },
              { label: 'Sedes', icon: '⬡' },
            ].map(n => (
              <div
                key={n.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  color: 'var(--text3)',
                  fontSize: '14px',
                  opacity: 0.5,
                  cursor: 'not-allowed',
                  marginBottom: '2px',
                }}
              >
                <span style={{ fontSize: '16px' }}>{n.icon}</span>
                {n.label}
              </div>
            ))}
          </div>
        </nav>

        {/* User */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <UserButton appearance={{
            elements: {
              avatarBox: { width: 30, height: 30 }
            }
          }} />
          <span style={{ fontSize: '13px', color: 'var(--text2)' }}>Mi cuenta</span>
        </div>
      </aside>

      {/* Main */}
      <main style={{
        marginLeft: '220px',
        flex: 1,
        padding: '40px 48px',
        maxWidth: 'calc(100vw - 220px)',
      }}>
        {/* Header */}
        <div style={{ marginBottom: '36px' }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '28px',
            fontWeight: '700',
            color: 'var(--text)',
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
          }}>
            {tab === 'clientes' ? 'Clientes' : 'Registrar servicio'}
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: '14px', marginTop: '6px' }}>
            {tab === 'clientes'
              ? 'Seguimiento de mantenimientos y recordatorios'
              : 'Registra un nuevo servicio de detailing'}
          </p>
        </div>

        {tab === 'registrar' && (
          <FormularioCliente onGuardado={() => { setRefresh(r => r + 1); setTab('clientes') }} />
        )}
        {tab === 'clientes' && (
          <ListaClientes refresh={refresh} />
        )}
      </main>
    </div>
  )
}
