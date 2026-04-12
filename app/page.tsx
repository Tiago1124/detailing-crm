import { UserButton } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import FormularioCliente from './components/FormularioCliente'

export default async function Home() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  return (
    <main style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '500' }}>Detailing CRM</h1>
        <UserButton />
      </div>
      <FormularioCliente />
    </main>
  )
}