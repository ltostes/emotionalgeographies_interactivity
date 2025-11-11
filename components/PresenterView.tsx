'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { QRCodeSVG } from 'qrcode.react'
import type { Database } from '@/lib/types/database'

type Room = Database['public']['Tables']['rooms']['Row']
type Contribution = Database['public']['Tables']['contributions']['Row']

interface PresenterViewProps {
  room: Room
}

export default function PresenterView({ room }: PresenterViewProps) {
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [audienceUrl, setAudienceUrl] = useState('')
  const supabase = createClient()

  useEffect(() => {
    setAudienceUrl(`${window.location.origin}/${room.code}/audience`)
  }, [room.code])

  useEffect(() => {
    // Fetch initial contributions
    const fetchContributions = async () => {
      const { data } = await supabase
        .from('contributions')
        .select('*')
        .eq('room_id', room.id)
        .order('created_at', { ascending: true })

      if (data) {
        setContributions(data)
      }
    }

    fetchContributions()

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
        (payload) => {
          setContributions((prev) => [...prev, payload.new as Contribution])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [room.id, supabase])

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
              {contributions.length} contribution{contributions.length !== 1 ? 's' : ''}
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

          {/* Contributions Grid */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Audience Contributions
              </h2>
              {contributions.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    No contributions yet. Share the QR code with your audience!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                  {contributions.map((contribution) => {
                    const data = contribution.data as { color: string }
                    return (
                      <div
                        key={contribution.id}
                        className="aspect-square rounded-lg shadow-sm hover:scale-110 transition-transform cursor-pointer"
                        style={{ backgroundColor: data.color }}
                        title={`${contribution.identifier.substring(0, 15)}... - ${new Date(
                          contribution.created_at
                        ).toLocaleTimeString()}`}
                      />
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
