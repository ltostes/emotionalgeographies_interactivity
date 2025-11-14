'use client'

import { useMemo } from 'react'
import type { ImageStats } from '@/lib/types/database'
import { calculateOverallEmotion } from '@/lib/visualizations/emotion_scatter'

interface ExplanationPanelProps {
  imageStats: ImageStats[]
  totalContributions: number
}

export default function ExplanationPanel({ imageStats, totalContributions }: ExplanationPanelProps) {
  const explanationText = useMemo(() => {
    if (totalContributions === 0) {
      return `**Emotional Geographies** — Waiting for audience contributions. Share the QR code to begin collecting emotional responses to the images.`
    }

    const [overallPoint, computedEmotion] = calculateOverallEmotion(imageStats);
    const overallValence = overallPoint[0].toFixed(2)
    const overallArousal = overallPoint[1].toFixed(2)

    const totalImages = imageStats.length

    return `**Emotional Geographies** — ${totalContributions} contribution${totalContributions !== 1 ? 's' : ''} across ${totalImages} evaluated image${totalImages !== 1 ? 's' : ''}. Overall valence: **${overallValence}**, arousal: **${overallArousal}**.\n\nAggregated area emotion is **${computedEmotion}**.`
  }, [imageStats, totalContributions])

  // Simple markdown parser for bold text
  const renderMarkdown = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-gray-100">{part.slice(2, -2)}</strong>
      }
      return <span key={i}>{part}</span>
    })
  }

  return (
    <div className="w-full h-full flex items-center px-4 text-sm text-gray-300 leading-relaxed">
      <p>
        {renderMarkdown(explanationText)}
      </p>
    </div>
  )
}
