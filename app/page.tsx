'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    router.push('/login')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="text-center">
        <div className="text-4xl font-bold mb-4 text-blue-900">HRMS Portal</div>
        <p className="text-gray-600">Redirecting to login...</p>
      </div>
    </div>
  )
}
