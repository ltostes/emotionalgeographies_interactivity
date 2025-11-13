'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { generateRoomCode } from '@/lib/utils/room-code'
import Papa from 'papaparse'
import { z } from 'zod'
import type { ImageData, QuestionConfig } from '@/lib/types/database'

interface RoomCreationFormProps {
  userId: string
}

// Validation schemas
const ImageSchema = z.object({
  image_id: z.string().min(1, 'Image ID required'),
  url: z.string().url('Invalid URL'),
  details: z.string().transform((str) => {
    try {
      return JSON.parse(str.replace(/'/g, '"'))
    } catch {
      return {}
    }
  }),
})

const RangeQuestionSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  details: z.string(),
  type: z.literal('range'),
  implementation: z.tuple([z.number(), z.number()]),
})

const OpenQuestionSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  details: z.string(),
  type: z.literal('open'),
  implementation: z.preprocess((val) => (val === undefined ? null : val), z.null()),
})

const QuestionSchema = z.object({
  type: z.enum(['single-randomly-picked', 'series', 'simultaneous']),
  questions: z.array(z.discriminatedUnion('type', [RangeQuestionSchema, OpenQuestionSchema])),
})

export default function RoomCreationForm({ userId }: RoomCreationFormProps) {
  const router = useRouter()
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [questionJson, setQuestionJson] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const validateCsv = async (
    file: File
  ): Promise<{ valid: boolean; images?: ImageData[]; errors?: string[] }> => {
    return new Promise((resolve) => {
      Papa.parse(file, {
        header: true,
        complete: async (results) => {
          const errors: string[] = []
          const images: ImageData[] = []

          if (!results.data || results.data.length === 0) {
            errors.push('CSV file is empty')
            return resolve({ valid: false, errors })
          }

          for (let i = 0; i < results.data.length; i++) {
            const row = results.data[i] as Record<string, unknown>
            try {
              const parsed = ImageSchema.parse(row)
              images.push(parsed)

              // Validate URL is reachable
              // try {
              //   const response = await fetch(parsed.url, { method: 'HEAD' })
              //   if (!response.ok) {
              //     errors.push(`Row ${i + 1}: URL not reachable (${parsed.url})`)
              //   }
              // } catch {
              //   errors.push(`Row ${i + 1}: Failed to validate URL (${parsed.url})`)
              // }
            } catch (err) {
              if (err instanceof z.ZodError) {
                errors.push(`Row ${i + 1}: ${err.issues.map((e) => e.message).join(', ')}`)
              }
            }
          }

          if (errors.length > 0) {
            resolve({ valid: false, errors })
          } else {
            resolve({ valid: true, images })
          }
        },
        error: () => {
          resolve({ valid: false, errors: ['Failed to parse CSV file'] })
        },
      })
    })
  }

  const validateQuestions = (
    json: string
  ): { valid: boolean; config?: QuestionConfig; errors?: string[] } => {
    try {
      const parsed = JSON.parse(json)
      const validated = QuestionSchema.parse(parsed)
      return { valid: true, config: validated }
    } catch (err) {
      if (err instanceof z.ZodError) {
        return {
          valid: false,
          errors: err.issues.map((e) => `${e.path.join('.')}: ${e.message}`),
        }
      }
      return { valid: false, errors: ['Invalid JSON format'] }
    }
  }

  const createRoom = async () => {
    if (!csvFile || !questionJson) {
      setError('Please provide both CSV file and question configuration')
      return
    }

    setIsCreating(true)
    setError(null)
    setValidationErrors([])

    // Validate CSV
    const csvValidation = await validateCsv(csvFile)
    if (!csvValidation.valid) {
      setValidationErrors(csvValidation.errors || [])
      setIsCreating(false)
      return
    }

    // Validate Questions
    const questionValidation = validateQuestions(questionJson)
    if (!questionValidation.valid) {
      setValidationErrors(questionValidation.errors || [])
      setIsCreating(false)
      return
    }

    const supabase = createClient()
    let attempts = 0
    const maxAttempts = 5

    while (attempts < maxAttempts) {
      const code = generateRoomCode()

      const { data, error: insertError } = await supabase
        .from('rooms')
        .insert({
          code,
          config: {
            images: csvValidation.images,
            questions: questionValidation.config,
          },
          creator_user_id: userId,
        })
        .select()
        .single()

      if (!insertError && data) {
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
    <div>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Image Dataset (CSV)
        </label>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        <p className="text-xs text-gray-500 mt-1">
          Required columns: image_id, url, details
        </p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Question Configuration (JSON)
        </label>
        <textarea
          value={questionJson}
          onChange={(e) => setQuestionJson(e.target.value)}
          rows={10}
          className="w-full p-3 border border-gray-300 rounded-lg font-mono text-sm"
          placeholder={`{
  "type": "single-randomly-picked",
  "questions": [
    {
      "id": "valence",
      "prompt": "What is the valence?",
      "details": "Rate from 1-7...",
      "type": "range",
      "implementation": [1, 7]
    }
  ]
}`}
        />
      </div>

      {validationErrors.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md max-h-40 overflow-y-auto">
          <p className="text-sm font-medium text-yellow-800 mb-1">
            Validation Errors:
          </p>
          <ul className="text-xs text-yellow-700 list-disc list-inside space-y-1">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <button
        onClick={createRoom}
        disabled={isCreating || !csvFile || !questionJson}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors"
      >
        {isCreating ? 'Creating Room...' : 'Create Room'}
      </button>
    </div>
  )
}
