import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const user = await currentUser()
  const metadata = user?.publicMetadata || {}

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: user?.emailAddresses[0]?.emailAddress || '',
    options: {
      data: {
        role: metadata.role || 'sede',
        empresa: metadata.empresa || 'discol',
        sede: metadata.sede || null,
      }
    }
  })

  return NextResponse.json({ ok: true })
}