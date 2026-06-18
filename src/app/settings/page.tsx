'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'

export default function SettingsPage() {
  const router = useRouter()

  useEffect(() => {
    router.push('/settings/mapper')
  }, [router])

  return (
    <MainLayout>
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400 text-sm">Redirigiendo...</div>
      </div>
    </MainLayout>
  )
}
