'use client'

import { useEffect, useRef, useState } from 'react'
import { Map, Marker, Popup } from 'react-map-gl/maplibre'
import { motion } from 'motion/react'
import type { ImageStats, RoomConfig } from '@/lib/types/database'
import { valenceToColor, arousalToRadius  } from '@/lib/visualizations/scales'
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
  const [popupInfo, setPopupInfo] = useState<PhotoLocation | null>(null)

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
                onClick={() => setPopupInfo(loc)}
                onMouseEnter={() => setPopupInfo(loc)}
                onMouseLeave={() => setPopupInfo(null)}
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

        {popupInfo && (
          <Popup
            latitude={popupInfo.latitude}
            longitude={popupInfo.longitude}
            anchor="bottom"
            onClose={() => setPopupInfo(null)}
            closeButton={false}
            className="dark-popup"
          >
            <div className="p-2 bg-gray-800 text-gray-100 rounded-lg min-w-[200px]">
              <img
                src={popupInfo.url}
                alt={popupInfo.image_id}
                className="w-full h-24 object-cover rounded mb-2"
              />
              <div className="text-xs space-y-1">
                <div className="font-semibold text-gray-300">
                  {popupInfo.contributionCount || 0} contribution(s)
                </div>
                {popupInfo.meanValence !== undefined && (
                  <div>
                    <span className="text-gray-400">Computed Valence:</span>{' '}
                    <span className="text-white">{popupInfo.meanValence.toFixed(2)}</span>
                  </div>
                )}
                {popupInfo.meanArousal !== undefined && (
                  <div>
                    <span className="text-gray-400">Computed Arousal:</span>{' '}
                    <span className="text-white">{popupInfo.meanArousal.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-gray-600 pt-1 mt-1">
                  {popupInfo.standardValence !== undefined && (
                    <div>
                      <span className="text-gray-500">Standard Valence:</span>{' '}
                      <span className="text-gray-300">{popupInfo.standardValence.toFixed(2)}</span>
                    </div>
                  )}
                  {popupInfo.standardArousal !== undefined && (
                    <div>
                      <span className="text-gray-500">Standard Arousal:</span>{' '}
                      <span className="text-gray-300">{popupInfo.standardArousal.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  )
}
