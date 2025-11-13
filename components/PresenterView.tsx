'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { QRCodeSVG } from 'qrcode.react'
import type { Database, RoomConfig, ImageStats } from '@/lib/types/database'
import MapVisualization from './MapVisualization'
import ValenceArousalScatter from './ValenceArousalScatter'
import ExplanationPanel from './ExplanationPanel'

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
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* 4-Quadrant Grid Layout */}
      <div className="h-screen grid grid-cols-[1fr_400px] grid-rows-[1fr_120px] gap-4 p-4">
        {/* Top-left: Map Visualization (largest area) */}
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          <MapVisualization config={config} imageStats={imageStats} />
        </div>

        {/* Top-right: Valence/Arousal Scatter Plot */}
        <div className="bg-gray-900 rounded-lg p-4 overflow-hidden">
          <ValenceArousalScatter imageStats={imageStats} />
        </div>

        {/* Bottom-left: Explanation Panel */}
        <div className="bg-gray-900 rounded-lg p-4 overflow-hidden">
          <ExplanationPanel imageStats={imageStats} totalContributions={totalContributions} />
        </div>

        {/* Bottom-right: QR Code */}
        <div className="bg-gray-900 rounded-lg p-4 flex flex-col items-center justify-center">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Audience Access</h3>
          {audienceUrl ? (
            <>
              <div className="bg-white p-3 rounded-lg">
                <QRCodeSVG value={audienceUrl} size={150} />
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                {totalContributions} contribution{totalContributions !== 1 ? 's' : ''}
              </p>
            </>
          ) : (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
          )}
        </div>
      </div>
    </div>
  )
}
