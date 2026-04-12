'use client'
import { UserButton } from '@clerk/nextjs'
import { useState } from 'react'
import FormularioCliente from './components/FormularioCliente'
import ListaClientes from './components/ListaClientes'

export default function Home() {
  const [refresh, setRefresh] = useState(0)

  return (
    <main style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Detailing CRM</h1>
        <UserButton />
      </div>
      <FormularioCliente onGuardado={() => setRefresh(r => r + 1)} />
      <ListaClientes refresh={refresh} />
    </main>
  )
}