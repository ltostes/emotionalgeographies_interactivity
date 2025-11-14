'use client'

import { useEffect, useRef, useState } from 'react'
import * as Plot from '@observablehq/plot'
import * as d3 from 'd3'
import { scaleLinear } from 'd3-scale'
import { interpolateRdYlGn } from 'd3-scale-chromatic'
import type { ImageStats } from '@/lib/types/database'
import { generateScatterPlot } from '@/lib/visualizations/emotion_scatter'
import ImageTooltip, { type TooltipData } from './ImageTooltip'

interface ValenceArousalScatterProps {
  imageStats: ImageStats[]
  config?: { images: Array<{ image_id: string; url: string }> }
}

export default function ValenceArousalScatter({ imageStats, config }: ValenceArousalScatterProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [computedEmotion, setComputedEmotion] = useState<string | null>(null)
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null)

  useEffect(() => {
    if (!containerRef.current || imageStats.length === 0) return

    const handleDotClick = (stats: ImageStats, event: MouseEvent) => {
      const imageConfig = config?.images.find(img => img.image_id === stats.image_id)
      if (!imageConfig) return

      const target = event.target as HTMLElement
      const rect = target.getBoundingClientRect()

      setTooltipData({
        imageUrl: imageConfig.url,
        imageId: stats.image_id,
        contributionCount: stats.contribution_count || 0,
        meanValence: stats.mean_valence ? Number(stats.mean_valence) : undefined,
        meanArousal: stats.mean_arousal ? Number(stats.mean_arousal) : undefined,
        position: {
          x: rect.left + rect.width / 2,
          y: rect.top
        }
      })
    }

    const [plot, emotion] = generateScatterPlot(
      imageStats,
      containerRef.current.clientWidth,
      config ? handleDotClick : undefined
    )
    setComputedEmotion(emotion)

    containerRef.current.innerHTML = ''
    containerRef.current.appendChild(plot)

    return () => {
      plot.remove()
    }
  }, [imageStats, config])

  return (
    <>
      {computedEmotion && (
        <div className="mb-2 text-center">
          <span className="text-sm font-semibold text-gray-400">Area Emotion: </span>
          <span className="text-sm text-white">{computedEmotion}</span>
        </div>
      )}
      <div ref={containerRef} className="w-full relative">
        {imageStats.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-500">
            No contributions yet
          </div>
        )}
      </div>

      <ImageTooltip
        data={tooltipData}
        onClose={() => setTooltipData(null)}
      />
    </>
  )
}
