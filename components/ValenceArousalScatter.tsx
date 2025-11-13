'use client'

import { useEffect, useRef } from 'react'
import * as Plot from '@observablehq/plot'
import { scaleLinear } from 'd3-scale'
import { interpolateRdYlGn } from 'd3-scale-chromatic'
import type { ImageStats } from '@/lib/types/database'

interface ValenceArousalScatterProps {
  imageStats: ImageStats[]
}

export default function ValenceArousalScatter({ imageStats }: ValenceArousalScatterProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || imageStats.length === 0) return

    // Calculate overall mean valence and arousal (across all contributions)
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

    const overallMeanValence = valenceCount > 0 ? totalValence / valenceCount : null
    const overallMeanArousal = arousalCount > 0 ? totalArousal / arousalCount : null

    // Prepare data for per-image points (grey background)
    const imagePoints = imageStats
      .filter(stat => stat.mean_valence !== null || stat.mean_arousal !== null)
      .map(stat => ({
        valence: stat.mean_valence !== null ? Number(stat.mean_valence) : 4,
        arousal: stat.mean_arousal !== null ? Number(stat.mean_arousal) : 4,
        type: 'image'
      }))

    // Prepare data for overall mean point (distinguished)
    const overallPoint = overallMeanValence !== null && overallMeanArousal !== null
      ? [{
          valence: overallMeanValence,
          arousal: overallMeanArousal,
          type: 'overall'
        }]
      : []

    // Scales for styling the overall point
    const arousalToRadius = scaleLinear().domain([1, 7]).range([3, 10])
    const valenceToColor = (valence: number) => {
      const normalized = (valence - 1) / 6
      return interpolateRdYlGn(normalized)
    }

    const overallRadius = overallMeanArousal !== null
      ? arousalToRadius(overallMeanArousal) * 1.5 // Boost size
      : 8
    const overallColor = overallMeanValence !== null
      ? valenceToColor(overallMeanValence)
      : 'rgb(96, 165, 250)'

    const plot = Plot.plot({
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      marginTop: 30,
      marginRight: 30,
      marginBottom: 40,
      marginLeft: 50,
      style: {
        background: 'transparent',
        color: '#9ca3af',
        fontSize: '11px'
      },
      x: {
        label: 'Valence →',
        domain: [1, 7],
        grid: true,
        tickSize: 0
      },
      y: {
        label: '↑ Arousal',
        domain: [1, 7],
        grid: true,
        tickSize: 0
      },
      marks: [
        // Background image points (grey, fixed size)
        Plot.dot(imagePoints, {
          x: 'valence',
          y: 'arousal',
          r: 3,
          fill: '#6b7280',
          fillOpacity: 0.5
        }),
        // Overall mean point (distinguished with color and size)
        Plot.dot(overallPoint, {
          x: 'valence',
          y: 'arousal',
          r: overallRadius,
          fill: overallColor,
          fillOpacity: 1,
          stroke: '#fff',
          strokeWidth: 1.5
        })
      ]
    })

    containerRef.current.innerHTML = ''
    containerRef.current.appendChild(plot)

    return () => {
      plot.remove()
    }
  }, [imageStats])

  return (
    <div ref={containerRef} className="w-full h-full">
      {imageStats.length === 0 && (
        <div className="flex items-center justify-center h-full text-gray-500">
          No contributions yet
        </div>
      )}
    </div>
  )
}
