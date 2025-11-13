import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import RoomCreationForm from '@/components/RoomCreationForm'
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
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
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Room Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Create New Room
              </h2>
              <RoomCreationForm userId={user.id} />
            </div>
          </div>

          {/* Room List Section */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Your Rooms
            </h2>
            <RoomList initialRooms={(rooms as RoomWithCount[]) || []} />
          </div>
        </div>
      </main>
    </div>
  )
}
