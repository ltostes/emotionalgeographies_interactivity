import Link from 'next/link'
import type { RoomWithCount } from '@/lib/types/database'

interface RoomCardProps {
  room: RoomWithCount
}

export default function RoomCard({ room }: RoomCardProps) {
  const createdDate = new Date(room.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-800">{room.code}</h3>
          <p className="text-sm text-gray-500 mt-1">{createdDate}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-blue-600">
            {room.contribution_count}
          </div>
          <p className="text-xs text-gray-500">contributions</p>
        </div>
      </div>

      <Link
        href={`/${room.code}/presenter`}
        className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-center"
      >
        Open Presenter View
      </Link>
    </div>
  )
}
