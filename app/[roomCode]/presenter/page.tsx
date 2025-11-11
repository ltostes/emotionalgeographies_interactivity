import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PresenterView from '@/components/PresenterView'

interface PresenterPageProps {
  params: Promise<{
    roomCode: string
  }>
}

export default async function PresenterPage({ params }: PresenterPageProps) {
  const { roomCode } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch room and verify creator
  const { data: room, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('code', roomCode)
    .single()

  if (error || !room) {
    redirect('/home')
  }

  if (room.creator_user_id !== user.id) {
    redirect('/home')
  }

  return <PresenterView room={room} />
}
