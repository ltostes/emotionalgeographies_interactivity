import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import AudienceView from '@/components/AudienceView'

interface AudiencePageProps {
  params: Promise<{
    roomCode: string
    identifier: string
  }>
}

export default async function AudiencePage({ params }: AudiencePageProps) {
  const { roomCode, identifier } = await params
  const supabase = await createClient()

  // Fetch room (no auth required)
  const { data: room, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('code', roomCode)
    .single()

  if (error || !room) {
    notFound()
  }

  return <AudienceView room={room} identifier={identifier} />
}
