'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { generateRoomCode } from '@/lib/utils/room-code'

interface RoomCreationFormProps {
  userId: string
}

const DEFAULT_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#FFA07A',
  '#98D8C8',
  '#F7DC6F',
  '#BB8FCE',
  '#85C1E2',
]

export default function RoomCreationForm({ userId }: RoomCreationFormProps) {
  const router = useRouter()
  const [selectedColors, setSelectedColors] = useState<string[]>(DEFAULT_COLORS)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color)
        ? prev.filter((c) => c !== color)
        : [...prev, color]
    )
  }

  const createRoom = async () => {
    if (selectedColors.length === 0) {
      setError('Select at least one color')
      return
    }

    setIsCreating(true)
    setError(null)

    const supabase = createClient()
    let attempts = 0
    const maxAttempts = 5

    while (attempts < maxAttempts) {
      const code = generateRoomCode()

      const { data, error: insertError } = await supabase
        .from('rooms')
        .insert({
          code,
          config: { colors: selectedColors },
          creator_user_id: userId,
        })
        .select()
        .single()

      if (!insertError && data) {
        router.push(`/${code}/presenter`)
        return
      }

      if (insertError?.code !== '23505') {
        // Not a unique constraint violation
        setError('Failed to create room')
        setIsCreating(false)
        return
      }

      attempts++
    }

    setError('Failed to generate unique room code. Please try again.')
    setIsCreating(false)
  }

  return (
    <div>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Available Colors for Audience
        </label>
        <div className="grid grid-cols-4 gap-3">
          {DEFAULT_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => toggleColor(color)}
              className={`w-full aspect-square rounded-lg transition-all ${
                selectedColors.includes(color)
                  ? 'ring-4 ring-blue-500 ring-offset-2'
                  : 'ring-2 ring-gray-200 opacity-50'
              }`}
              style={{ backgroundColor: color }}
              aria-label={`Toggle ${color}`}
            />
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {selectedColors.length} color{selectedColors.length !== 1 ? 's' : ''}{' '}
          selected
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <button
        onClick={createRoom}
        disabled={isCreating || selectedColors.length === 0}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors"
      >
        {isCreating ? 'Creating Room...' : 'Create Room'}
      </button>
    </div>
  )
}
