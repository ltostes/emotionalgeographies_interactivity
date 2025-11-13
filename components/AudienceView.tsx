'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import * as Dialog from '@radix-ui/react-dialog'
import type { Database, RoomConfig, ImageData, Question } from '@/lib/types/database'

type Room = Database['public']['Tables']['rooms']['Row']

interface AudienceViewProps {
  room: Room
  identifier: string
}

export default function AudienceView({ room, identifier }: AudienceViewProps) {
  const [currentImage, setCurrentImage] = useState<ImageData | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [answer, setAnswer] = useState<number | string>('')
  const [isSending, setIsSending] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  )
  const [detailsOpen, setDetailsOpen] = useState(false)

  const supabase = createClient()
  const config = (room.config as unknown) as RoomConfig

  // Pick random image and question
  const pickNewContribution = () => {
    if (!config?.images || !config?.questions) return

    // Random image
    const randomImage = config.images[Math.floor(Math.random() * config.images.length)]
    setCurrentImage(randomImage)

    // Pick question based on type
    const questionConfig = config.questions
    if (questionConfig.type === 'single-randomly-picked') {
      const randomQuestion =
        questionConfig.questions[Math.floor(Math.random() * questionConfig.questions.length)]
      setCurrentQuestion(randomQuestion)
    }
    // TODO: implement 'series' and 'simultaneous' types

    setAnswer('')
  }

  useEffect(() => {
    pickNewContribution()
  }, [])

  const handleSubmit = async () => {
    if (!currentImage || !currentQuestion || !answer) return

    setIsSending(true)
    setMessage(null)

    const { error } = await supabase.from('contributions').insert({
      room_id: room.id,
      identifier,
      data: {
        image_id: currentImage.image_id,
        question_id: currentQuestion.id,
        answer:
          currentQuestion.type === 'range' ? Number(answer) : String(answer),
      },
    })

    if (error) {
      console.error('Contribution error:', error)
      setMessage({
        type: 'error',
        text: error.message || 'Failed to send. Please try again.',
      })
      setIsSending(false)
    } else {
      setMessage({ type: 'success', text: 'Submitted successfully!' })
      setIsSending(false)

      // Clear success message and load new contribution
      setTimeout(() => {
        setMessage(null)
        pickNewContribution()
      }, 1000)
    }
  }

  if (!currentImage || !currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  const isRange = currentQuestion.type === 'range'
  const [minVal, maxVal] = isRange
    ? (currentQuestion.implementation as [number, number])
    : [0, 0]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex flex-col">
      {/* Image Section - Top */}
      <div className="flex-shrink-0 w-full flex items-center justify-center p-4">
        <img
          src={currentImage.url}
          alt={`Image ${currentImage.image_id}`}
          className="max-w-full max-h-[50vh] object-contain rounded-lg shadow-lg"
          loading="lazy"
        />
      </div>

      {/* Question Section - Bottom */}
      <div className="flex-1 flex items-start justify-center p-4 pt-0">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
          <div className="mb-4">
            <div className="flex items-start gap-2">
              <h2 className="text-lg font-bold text-gray-800 flex-1">
                {currentQuestion.prompt}
              </h2>
              <Dialog.Root open={detailsOpen} onOpenChange={setDetailsOpen}>
                <Dialog.Trigger asChild>
                  <button
                    className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center hover:bg-blue-600 transition-colors"
                    aria-label="More information"
                  >
                    i
                  </button>
                </Dialog.Trigger>
                <Dialog.Portal>
                  <Dialog.Overlay className="fixed inset-0 bg-black/50" />
                  <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
                    <Dialog.Title className="text-lg font-bold text-gray-800 mb-3">
                      {currentQuestion.prompt}
                    </Dialog.Title>
                    <Dialog.Description className="text-sm text-gray-600 mb-4">
                      {currentQuestion.details}
                    </Dialog.Description>
                    <Dialog.Close asChild>
                      <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                        Close
                      </button>
                    </Dialog.Close>
                  </Dialog.Content>
                </Dialog.Portal>
              </Dialog.Root>
            </div>
          </div>

          {/* Answer Input */}
          <div className="mb-4">
            {isRange ? (
              <div className="space-y-3">
                <input
                  type="range"
                  min={minVal}
                  max={maxVal}
                  value={answer || minVal}
                  onChange={(e) => setAnswer(Number(e.target.value))}
                  disabled={isSending}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600 disabled:opacity-50"
                />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{minVal}</span>
                  <span className="font-bold text-purple-600 text-lg">
                    {answer || minVal}
                  </span>
                  <span>{maxVal}</span>
                </div>
              </div>
            ) : (
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={isSending}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
                rows={4}
                placeholder="Type your answer..."
              />
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

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!answer || isSending}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            {isSending ? 'Submitting...' : 'Submit'}
          </button>

          {/* Identifier Info */}
          <p className="text-xs text-gray-400 mt-4 text-center">
            Room {room.code} • ID: {identifier.substring(0, 8)}...
          </p>
        </div>
      </div>
    </div>
  )
}
