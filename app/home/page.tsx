import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import RoomCreationForm from '@/components/RoomCreationForm'

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Interactive Presenter
        </h1>
        <p className="text-gray-600 mb-6">
          Create a new room to start collecting audience data
        </p>

        <RoomCreationForm userId={user.id} />

        <div className="mt-6 pt-6 border-t border-gray-200">
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
