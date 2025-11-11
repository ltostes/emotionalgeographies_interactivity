'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getOrCreateIdentifier } from '@/lib/utils/identifier'
import { createClient } from '@/lib/supabase/client'

export default function AudienceRedirectPage() {
  const params = useParams()
  const router = useRouter()
  const roomCode = params.roomCode as string
  const [isValidating, setIsValidating] = useState(true)

  useEffect(() => {
    const validateAndRedirect = async () => {
      const supabase = createClient()

      // Check if room exists
      const { data: room, error } = await supabase
        .from('rooms')
        .select('id')
        .eq('code', roomCode)
        .single()

      if (error || !room) {
        // Room doesn't exist, show 404
        router.replace('/404')
        return
      }

      // Room exists, proceed with redirect
      const identifier = getOrCreateIdentifier(roomCode)
      router.replace(`/${roomCode}/audience/${identifier}`)
    }

    validateAndRedirect()
  }, [roomCode, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  )
}
