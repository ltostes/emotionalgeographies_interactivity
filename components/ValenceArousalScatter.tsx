'use client'

import { useEffect, useRef, useState } from 'react'
import * as Plot from '@observablehq/plot'
import * as d3 from 'd3'
import { scaleLinear } from 'd3-scale'
import { interpolateRdYlGn } from 'd3-scale-chromatic'
import type { ImageStats } from '@/lib/types/database'
import { generateScatterPlot } from '@/lib/visualizations/emotion_scatter'

interface ValenceArousalScatterProps {
  imageStats: ImageStats[]
}

export default function ValenceArousalScatter({ imageStats }: ValenceArousalScatterProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [computedEmotion, setComputedEmotion] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || imageStats.length === 0) return

    const [plot, emotion] = generateScatterPlot(imageStats, containerRef.current.clientWidth);
    setComputedEmotion(emotion);

    containerRef.current.innerHTML = ''
    containerRef.current.appendChild(plot)

    return () => {
      plot.remove()
    }
  }, [imageStats])

  return (
    <>
      {computedEmotion && (
        <div className="mb-2 text-center">
          <span className="text-sm font-semibold text-gray-400">Area Emotion: </span>
          <span className="text-sm text-white">{computedEmotion}</span>
        </div>
      )}
    <div ref={containerRef} className="w-full">
      {imageStats.length === 0 && (
        <div className="flex items-center justify-center h-full text-gray-500">
          No contributions yet
        </div>
      )}
    </div>
    </>
  )
}
