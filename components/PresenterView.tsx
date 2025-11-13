'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { QRCodeSVG } from 'qrcode.react'
import type { Database, RoomConfig, ImageStats } from '@/lib/types/database'

type Room = Database['public']['Tables']['rooms']['Row']
type Contribution = Database['public']['Tables']['contributions']['Row']

interface PresenterViewProps {
  room: Room
}

export default function PresenterView({ room }: PresenterViewProps) {
  const [imageStats, setImageStats] = useState<ImageStats[]>([])
  const [audienceUrl, setAudienceUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const config = (room.config as unknown) as RoomConfig

  useEffect(() => {
    setAudienceUrl(`${window.location.origin}/${room.code}/audience`)
  }, [room.code])

  const fetchImageStats = async () => {
    const { data, error } = await supabase.rpc('get_room_image_stats', {
      p_room_id: room.id,
    })

    if (error) {
      console.error('Failed to fetch image stats:', error)
    } else if (data) {
      setImageStats(data as ImageStats[])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchImageStats()

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`room-${room.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'contributions',
          filter: `room_id=eq.${room.id}`,
        },
        () => {
          // Recalculate stats on new contribution
          fetchImageStats()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [room.id])

  const totalContributions = imageStats.reduce(
    (sum, stat) => sum + Number(stat.contribution_count),
    0
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Room: {room.code}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {totalContributions} contribution{totalContributions !== 1 ? 's' : ''}
            </p>
          </div>
          <a
            href="/home"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Home
          </a>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* QR Code Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Audience Access
              </h2>
              {audienceUrl ? (
                <>
                  <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                    <QRCodeSVG value={audienceUrl} size={200} className="w-full h-auto" />
                  </div>
                  <p className="text-xs text-gray-500 mt-3 text-center break-all">
                    {audienceUrl}
                  </p>
                </>
              ) : (
                <div className="h-[232px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
                </div>
              )}
            </div>
          </div>

          {/* Image Statistics Grid */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Image Statistics
              </h2>
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto"></div>
                </div>
              ) : imageStats.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    No contributions yet. Share the QR code with your audience!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {imageStats.map((stat) => {
                    const imageData = config.images.find(
                      (img) => img.image_id === stat.image_id
                    )
                    return (
                      <div
                        key={stat.image_id}
                        className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                      >
                        {imageData && (
                          <img
                            src={imageData.url}
                            alt={`Image ${stat.image_id}`}
                            className="w-full h-32 object-cover"
                            loading="lazy"
                          />
                        )}
                        <div className="p-4">
                          <p className="text-xs text-gray-500 font-mono mb-2">
                            ID: {stat.image_id}
                          </p>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Contributions:</span>
                              <span className="font-semibold text-gray-800">
                                {Number(stat.contribution_count)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Mean Valence:</span>
                              <span className="font-semibold text-purple-600">
                                {stat.mean_valence !== null
                                  ? Number(stat.mean_valence).toFixed(2)
                                  : 'N/A'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Mean Arousal:</span>
                              <span className="font-semibold text-blue-600">
                                {stat.mean_arousal !== null
                                  ? Number(stat.mean_arousal).toFixed(2)
                                  : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
