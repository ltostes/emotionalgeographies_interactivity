'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import * as Dialog from '@radix-ui/react-dialog'
import { createClient } from '@/lib/supabase/client'
import { generateRoomCode } from '@/lib/utils/room-code'

interface RoomCreationModalProps {
  userId: string
  onRoomCreated?: () => void
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

export default function RoomCreationModal({ userId, onRoomCreated }: RoomCreationModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
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
        setOpen(false)
        setSelectedColors(DEFAULT_COLORS)
        setError(null)
        onRoomCreated?.()
        router.push(`/${code}/presenter`)
        return
      }

      if (insertError?.code !== '23505') {
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
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
          Create New Room
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 max-h-[85vh] w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-8 shadow-xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <Dialog.Title className="text-2xl font-bold text-gray-800 mb-2">
            Create New Room
          </Dialog.Title>
          <Dialog.Description className="text-gray-600 mb-6">
            Select available colors for your audience
          </Dialog.Description>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Available Colors
            </label>
            <div className="grid grid-cols-4 gap-3">
              {DEFAULT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => toggleColor(color)}
                  disabled={isCreating}
                  className={`w-full aspect-square rounded-lg transition-all ${
                    selectedColors.includes(color)
                      ? 'ring-4 ring-blue-500 ring-offset-2'
                      : 'ring-2 ring-gray-200 opacity-50'
                  } disabled:cursor-not-allowed disabled:opacity-30`}
                  style={{ backgroundColor: color }}
                  aria-label={`Toggle ${color}`}
                />
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {selectedColors.length} color{selectedColors.length !== 1 ? 's' : ''} selected
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Dialog.Close asChild>
              <button
                disabled={isCreating}
                className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </Dialog.Close>
            <button
              onClick={createRoom}
              disabled={isCreating || selectedColors.length === 0}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              {isCreating ? 'Creating...' : 'Create Room'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
