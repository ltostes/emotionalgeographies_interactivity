'use client'

import { useEffect, useRef, useState } from 'react'
import { Map, Marker } from 'react-map-gl/maplibre'
import { motion } from 'motion/react'
import type { ImageStats, RoomConfig } from '@/lib/types/database'
import { valenceToColor, arousalToRadius  } from '@/lib/visualizations/scales'
import ImageTooltip, { type TooltipData } from './ImageTooltip'
import 'maplibre-gl/dist/maplibre-gl.css'

interface MapVisualizationProps {
  config: RoomConfig
  imageStats: ImageStats[]
}

interface PhotoLocation {
  image_id: string
  latitude: number
  longitude: number
  url: string
  standardValence: any
  standardArousal: any
  meanValence: number | undefined
  meanArousal: number | undefined
  contributionCount: number
}

export default function MapVisualization({ config, imageStats }: MapVisualizationProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null)

  // Extract photo locations from config with lat/lon
  const photoLocations: PhotoLocation[] = config.images
    .map(img => {
      const details = img.details as any
      if (details?.latitude && details?.longitude) {
        const stats = imageStats.find(s => s.image_id === img.image_id)
        return {
          image_id: img.image_id,
          latitude: Number(details.latitude),
          longitude: Number(details.longitude),
          url: img.url,
          standardValence: details.valence,
          standardArousal: details.arousal,
          meanValence: stats?.mean_valence ? Number(stats.mean_valence) : undefined,
          meanArousal: stats?.mean_arousal ? Number(stats.mean_arousal) : undefined,
          contributionCount: stats?.contribution_count ? Number(stats.contribution_count) : 0
        }
      }
      return null
    })
    .filter((loc): loc is PhotoLocation => loc !== null) as PhotoLocation[]

  // Calculate bounds to fit all locations
  const bounds = photoLocations.reduce(
    (acc, loc) => ({
      minLat: Math.min(acc.minLat, loc.latitude),
      maxLat: Math.max(acc.maxLat, loc.latitude),
      minLon: Math.min(acc.minLon, loc.longitude),
      maxLon: Math.max(acc.maxLon, loc.longitude)
    }),
    { minLat: Infinity, maxLat: -Infinity, minLon: Infinity, maxLon: -Infinity }
  )

  const centerLat = (bounds.minLat + bounds.maxLat) / 2
  const centerLon = (bounds.minLon + bounds.maxLon) / 2

  const getPointStyle = (loc: PhotoLocation) => {
    const hasValence = loc.meanValence !== undefined
    const hasArousal = loc.meanArousal !== undefined

    if (!hasValence && !hasArousal) {
      // No contributions - grey placeholder
      return {
        radius: 4,
        color: 'rgb(107, 114, 128)'
      }
    }

    let color: string
    let radius: number

    if (hasValence && hasArousal) {
      // Both values present
      color = valenceToColor(loc.meanValence!)
      radius = arousalToRadius(loc.meanArousal!)
    } else if (hasValence) {
      // Valence only - use middle arousal scale
      color = valenceToColor(loc.meanValence!)
      radius = arousalToRadius(4) // Middle of arousal scale
    } else {
      // Arousal only - use faint blue
      color = 'rgb(96, 165, 250)' // Tailwind blue-400
      radius = arousalToRadius(loc.meanArousal!)
    }

    return { radius, color, opacity: 1 }
  }

  const handleMarkerClick = (e: React.MouseEvent, loc: PhotoLocation) => {
    e.stopPropagation()
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    setTooltipData({
      imageUrl: loc.url,
      imageId: loc.image_id,
      contributionCount: loc.contributionCount || 0,
      meanValence: loc.meanValence,
      meanArousal: loc.meanArousal,
      position: {
        x: rect.left + rect.width / 2,
        y: rect.top
      }
    })
  }

  return (
    <div ref={mapContainerRef} className="w-full h-full relative">
      <Map
        mapLib={import('maplibre-gl')}
        initialViewState={{
          latitude: centerLat,
          longitude: centerLon,
          zoom: 12,
          pitch: 0,
          bearing: 0
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
      >
        {photoLocations.map((loc) => {
          const style = getPointStyle(loc)

          return (
            <Marker
              key={loc.image_id}
              latitude={loc.latitude}
              longitude={loc.longitude}
              anchor="center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5 }}
                className="cursor-pointer"
                onClick={(e) => handleMarkerClick(e, loc)}
                style={{
                  width: style.radius * 2,
                  height: style.radius * 2,
                  borderRadius: '50%',
                  backgroundColor: style.color,
                  opacity: style.opacity,
                  transition: 'all 0.5s ease'
                }}
              />
            </Marker>
          )
        })}
      </Map>

      <ImageTooltip
        data={tooltipData}
        onClose={() => setTooltipData(null)}
      />
    </div>
  )
}
