import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PresenterView from '@/components/PresenterView'

interface PresentationPageProps {
  params: Promise<{
    roomCode: string
  }>
}

export default async function PresentationPage({ params }: PresentationPageProps) {
  const { roomCode } = await params
  const supabase = await createClient()

  // Fetch room - no auth required, public access
  const { data: room, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('code', roomCode)
    .single()

  if (error || !room) {
    redirect('/home')
  }

  return <PresenterView room={room} />
}
