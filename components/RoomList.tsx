'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import RoomCard from './RoomCard'
import type { RoomWithCount } from '@/lib/types/database'

interface RoomListProps {
  initialRooms: RoomWithCount[]
}

export default function RoomList({ initialRooms }: RoomListProps) {
  const [rooms, setRooms] = useState<RoomWithCount[]>(initialRooms)
  const supabase = createClient()

  useEffect(() => {
    // Subscribe to new contributions to update counts in real-time
    const channel = supabase
      .channel('contribution-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'contributions',
        },
        async () => {
          // Refetch room counts when new contribution added
          const { data } = await supabase.rpc('get_user_rooms_with_counts')
          if (data) {
            setRooms(data)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  if (rooms.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">
          No rooms yet. Create your first room!
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {rooms.map((room) => (
        <RoomCard key={room.id} room={room} />
      ))}
    </div>
  )
}
