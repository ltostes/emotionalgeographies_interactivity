'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database, RoomConfig } from '@/lib/types/database'

type Room = Database['public']['Tables']['rooms']['Row']

interface AudienceViewProps {
  room: Room
  identifier: string
}

export default function AudienceView({ room, identifier }: AudienceViewProps) {
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  )

  const supabase = createClient()
  const config = (room.config as unknown) as RoomConfig
  const colors = config?.colors || []

  const handleSend = async () => {
    if (!selectedColor) return

    setIsSending(true)
    setMessage(null)

    const { error } = await supabase.from('contributions').insert({
      room_id: room.id,
      identifier,
      data: { color: selectedColor },
    })

    if (error) {
      console.error('Contribution error:', error)
      setMessage({
        type: 'error',
        text: error.message || 'Failed to send. Please try again.'
      })
      setIsSending(false)
    } else {
      setMessage({ type: 'success', text: 'Sent successfully!' })
      setSelectedColor(null)
      setIsSending(false)

      // Clear success message after 2 seconds
      setTimeout(() => setMessage(null), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Room {room.code}
          </h1>
          <p className="text-gray-600">Select a color and send your contribution</p>
        </div>

        {/* Color Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Choose Your Color
          </label>
          <div className="grid grid-cols-4 gap-3">
            {colors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setSelectedColor(color)}
                disabled={isSending}
                className={`w-full aspect-square rounded-lg transition-all ${
                  selectedColor === color
                    ? 'ring-4 ring-purple-500 ring-offset-2 scale-105'
                    : 'ring-2 ring-gray-200 hover:ring-purple-300'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                style={{ backgroundColor: color }}
                aria-label={`Select ${color}`}
              />
            ))}
          </div>
          {selectedColor && (
            <p className="text-sm text-gray-600 mt-3 text-center">
              Selected: {selectedColor}
            </p>
          )}
        </div>

        {/* Messages */}
        {message && (
          <div
            className={`mb-4 p-3 rounded-md ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <p
              className={`text-sm ${
                message.type === 'success' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {message.text}
            </p>
          </div>
        )}

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!selectedColor || isSending}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors"
        >
          {isSending ? 'Sending...' : 'Send'}
        </button>

        {/* Identifier Info */}
        <p className="text-xs text-gray-400 mt-6 text-center">
          Your ID: {identifier.substring(0, 20)}...
        </p>
      </div>
    </div>
  )
}
