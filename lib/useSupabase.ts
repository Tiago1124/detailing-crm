'use client'
import { useAuth } from '@clerk/nextjs'
import { useMemo } from 'react'
import { createSupabaseClient } from './supabase'

export function useSupabase() {
  const { getToken } = useAuth()

  const supabase = useMemo(() => {
    return createClient_()

    async function createClient_() {
      const token = await getToken({ template: 'supabase' })
      return createSupabaseClient(token)
    }
  }, [getToken])

  return supabase
}