'use client'

import { useMemo } from 'react'
import type { ImageStats } from '@/lib/types/database'

interface ExplanationPanelProps {
  imageStats: ImageStats[]
  totalContributions: number
}

export default function ExplanationPanel({ imageStats, totalContributions }: ExplanationPanelProps) {
  const explanationText = useMemo(() => {
    if (totalContributions === 0) {
      return `**Emotional Geographies** — Waiting for audience contributions. Share the QR code to begin collecting emotional responses to the images.`
    }

    // Calculate statistics
    const imagesWithContributions = imageStats.filter(s =>
      s.contribution_count && Number(s.contribution_count) > 0
    ).length

    const totalImages = imagesWithContributions // Only count images that have at least one contribution

    // Calculate overall valence and arousal
    let totalValence = 0
    let totalArousal = 0
    let valenceCount = 0
    let arousalCount = 0

    imageStats.forEach(stat => {
      if (stat.mean_valence !== null) {
        totalValence += Number(stat.mean_valence) * Number(stat.contribution_count)
        valenceCount += Number(stat.contribution_count)
      }
      if (stat.mean_arousal !== null) {
        totalArousal += Number(stat.mean_arousal) * Number(stat.contribution_count)
        arousalCount += Number(stat.contribution_count)
      }
    })

    const overallValence = valenceCount > 0 ? (totalValence / valenceCount).toFixed(2) : 'N/A'
    const overallArousal = arousalCount > 0 ? (totalArousal / arousalCount).toFixed(2) : 'N/A'

    // Determine emotional tendency
    const valenceNum = parseFloat(overallValence)
    const arousalNum = parseFloat(overallArousal)
    let tendency = ''

    if (!isNaN(valenceNum) && !isNaN(arousalNum)) {
      if (valenceNum > 4.5 && arousalNum > 4.5) {
        tendency = 'excited and positive'
      } else if (valenceNum > 4.5 && arousalNum <= 4.5) {
        tendency = 'calm and content'
      } else if (valenceNum <= 4.5 && arousalNum > 4.5) {
        tendency = 'tense and agitated'
      } else {
        tendency = 'subdued and frustrated'
      }
    }

    const tendencyText = tendency ? ` Responses tend toward **${tendency}** emotions.` : ''

    return `**Emotional Geographies** — ${totalContributions} contribution${totalContributions !== 1 ? 's' : ''} across ${totalImages} image${totalImages !== 1 ? 's' : ''}. Overall valence: **${overallValence}**, arousal: **${overallArousal}**.${tendencyText}`
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
