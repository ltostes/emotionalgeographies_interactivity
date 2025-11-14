'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import * as Dialog from '@radix-ui/react-dialog'
import type { Database, RoomConfig, ImageData, Question, ContributionData } from '@/lib/types/database'
import { valenceToColor, arousalToRadius  } from '@/lib/visualizations/scales'

type Room = Database['public']['Tables']['rooms']['Row']

interface AudienceViewProps {
  room: Room
  identifier: string
}

export default function AudienceView({ room, identifier }: AudienceViewProps) {
  const [currentImage, setCurrentImage] = useState<ImageData | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [answer, setAnswer] = useState<number | null>(null)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  )
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [completedContributions, setCompletedContributions] = useState<Set<string>>(new Set())

  const supabase = createClient()
  const config = (room.config as unknown) as RoomConfig

  // Fetch existing contributions for this identifier
  useEffect(() => {
    const fetchContributions = async () => {
      const { data } = await supabase
        .from('contributions')
        .select('data')
        .eq('room_id', room.id)
        .eq('identifier', identifier)

      if (data) {
        const completed = new Set<string>()
        data.forEach((contrib) => {
          const contribData = contrib.data as ContributionData
          const key = `${contribData.image_id}:${contribData.question_id}`
          completed.add(key)
        })
        setCompletedContributions(completed)
      }
    }

    fetchContributions()
  }, [room.id, identifier])

  // Pick random image and question that haven't been completed
  const pickNewContribution = () => {
    if (!config?.images || !config?.questions) return

    const questionConfig = config.questions
    const availableQuestions = questionConfig.questions

    // Build list of available combinations
    const availableCombos: Array<{ image: ImageData; question: Question }> = []

    config.images.forEach((image) => {
      availableQuestions.forEach((question) => {
        const key = `${image.image_id}:${question.id}`
        if (!completedContributions.has(key)) {
          availableCombos.push({ image, question })
        }
      })
    })

    if (availableCombos.length === 0) {
      // All combinations completed
      setCurrentImage(null)
      setCurrentQuestion(null)
      return
    }

    // Pick random available combination
    const randomCombo = availableCombos[Math.floor(Math.random() * availableCombos.length)]
    setCurrentImage(randomCombo.image)
    setCurrentQuestion(randomCombo.question)
    setAnswer(null)
    setHasInteracted(false)
  }

  useEffect(() => {
    if (completedContributions.size >= 0) {
      pickNewContribution()
    }
  }, [completedContributions])

  const handleSubmit = async () => {
    if (!currentImage || !currentQuestion || answer === null) return

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

      // Add to completed contributions
      const key = `${currentImage.image_id}:${currentQuestion.id}`
      setCompletedContributions(prev => new Set([...prev, key]))

      setIsSending(false)

      // Clear success message and load new contribution
      setTimeout(() => {
        setMessage(null)
        pickNewContribution()
      }, 1000)
    }
  }

  // Parse range implementation
  const getRangeConfig = () => {
    if (currentQuestion?.type !== 'range') return { min: 0, max: 0, labels: {} }

    const impl = currentQuestion.implementation
    if (Array.isArray(impl)) {
      return { min: impl[0], max: impl[1], labels: {} }
    }
    return { min: impl.min, max: impl.max, labels: impl.labels || {} }
  }

  const rangeConfig = currentQuestion?.type === 'range' ? getRangeConfig() : null

  // Helper to get label for value
  const getLabel = (value: number): string => {
    if (!rangeConfig || !rangeConfig.labels) return String(value)
    return rangeConfig.labels[value] || String(value)
  }

  // Markdown renderer for details
  const renderMarkdown = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|\n)/g)
    return parts.map((part, i) => {
      if (part === '\n') return <br key={i} />
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
      }
      return <span key={i}>{part}</span>
    })
  }

  if (!currentImage || !currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <p className="text-gray-400">
          {completedContributions.size > 0 && config?.images && config?.questions
            ? 'All contributions completed! Thank you.'
            : 'Loading...'}
        </p>
      </div>
    )
  }

  const isRange = currentQuestion.type === 'range'
  const midPoint = rangeConfig ? Math.round((rangeConfig.min + rangeConfig.max) / 2) : 0
  const selectorColor = currentQuestion.id == 'valence' ? valenceToColor(Number(answer) ?? 0) : 'oklch(62.3% 0.214 259.815)';
  const selectorSize = (currentQuestion.id == 'arousal' && answer) ? arousalToRadius(Number(answer)) * 3 : 20;

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
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
        <div className="bg-gray-900 rounded-lg shadow-xl p-6 max-w-md w-full">
          <div className="mb-4">
            <div className="flex items-start gap-2">
              <h2 className="text-lg font-bold text-gray-100 flex-1">
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
                  <Dialog.Overlay className="fixed inset-0 bg-black/70" />
                  <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-900 rounded-lg shadow-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
                    <Dialog.Title className="text-lg font-bold text-gray-100 mb-3">
                      {currentQuestion.prompt}
                    </Dialog.Title>
                    <Dialog.Description className="text-sm text-gray-300 mb-4 leading-relaxed">
                      {renderMarkdown(currentQuestion.details)}
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
            {isRange && rangeConfig ? (
              <div className="space-y-3">
                <input
                  type="range"
                  min={rangeConfig.min}
                  max={rangeConfig.max}
                  value={answer ?? midPoint}
                  onChange={(e) => {
                    setAnswer(Number(e.target.value))
                    setHasInteracted(true)
                  }}
                  disabled={isSending}
                  className={`custom-range w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50 ${
                    hasInteracted ? '' : 'accent-gray-500'
                    // hasInteracted ? `accent-]` : 'accent-gray-500'
                  }`}
                    style={{
                      ['--thumb-size']: `${selectorSize}px`,
                      ['--thumb-color']: hasInteracted ? selectorColor : '#6b7280', // gray-500 fallback
                    }}
                />
                <div className="flex justify-between text-sm text-gray-400">
                  <div className='min-w-[100px] text-start'>{getLabel(rangeConfig.min)}</div>
                  <div className={`font-bold basis-2 text-center text-lg ${hasInteracted ? 'text-purple-400' : 'text-gray-500'}`}>
                    {/* {answer !== null ? getLabel(Number(answer)) : '—'} // Previous implemenation, with the label here */}
                    {answer !== null ? answer : '—'}
                  </div>
                  <div className='min-w-[100px] text-end'>{getLabel(rangeConfig.max)}</div>
                </div>
              </div>
            ) : (
              <textarea
                value={answer ?? ''}
                onChange={(e) => {
                  setAnswer(Number(e.target.value))
                  setHasInteracted(true)
                }}
                disabled={isSending}
                className="w-full p-3 bg-gray-800 border border-gray-700 text-gray-100 rounded-lg text-sm disabled:opacity-50 placeholder-gray-500"
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
                  ? 'bg-green-900/30 border border-green-700'
                  : 'bg-red-900/30 border border-red-700'
              }`}
            >
              <p
                className={`text-sm ${
                  message.type === 'success' ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {message.text}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={answer === null || !hasInteracted || isSending}
            className={`w-full font-semibold py-3 px-4 rounded-lg transition-colors ${
              answer !== null && hasInteracted
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSending ? 'Submitting...' : 'Submit'}
          </button>

          {/* Identifier Info */}
          <p className="text-xs text-gray-600 mt-4 text-center">
            Room {room.code} • ID: {identifier.substring(0, 8)}...
          </p>
        </div>
      </div>
    </div>
  )
}
