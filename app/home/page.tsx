import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import RoomCreationModal from '@/components/RoomCreationModal'
import RoomList from '@/components/RoomList'
import type { RoomWithCount } from '@/lib/types/database'

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch rooms with contribution counts
  const { data: rooms } = await supabase.rpc('get_user_rooms_with_counts')

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              My Presentation Rooms
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {rooms?.length || 0} room{rooms?.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <RoomCreationModal userId={user.id} />
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Room List */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <RoomList initialRooms={(rooms as RoomWithCount[]) || []} />
      </main>
    </div>
  )
}
