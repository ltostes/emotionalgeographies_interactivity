'use client'

import { motion, AnimatePresence } from 'motion/react'

export interface TooltipData {
  imageUrl: string
  imageId: string
  contributionCount: number
  meanValence?: number
  meanArousal?: number
  position: { x: number; y: number }
}

interface ImageTooltipProps {
  data: TooltipData | null
  onClose: () => void
}

export default function ImageTooltip({ data, onClose }: ImageTooltipProps) {
  if (!data) return null

  return (
    <AnimatePresence>
      {data && (
        <>
          {/* Overlay to catch outside clicks */}
          <div
            className="fixed inset-0 z-40"
            onClick={onClose}
          />

          {/* Tooltip */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="fixed z-50 pointer-events-none"
            style={{
              left: data.position.x,
              top: data.position.y,
              transform: 'translate(-50%, -100%) translateY(-12px)'
            }}
          >
            <div className="bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-2xl border border-gray-700/50 overflow-hidden">
              {/* Image */}
              <div className="relative">
                <img
                  src={data.imageUrl}
                  alt={data.imageId}
                  className="w-[300px] h-[300px] object-cover"
                />
              </div>

              {/* Info overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent p-4 pt-12">
                <div className="text-sm space-y-1">
                  <div className="font-semibold text-gray-200">
                    {data.contributionCount} contribution{data.contributionCount !== 1 ? 's' : ''}
                  </div>
                  {data.meanValence !== undefined && (
                    <div>
                      <span className="text-gray-400">Valence:</span>{' '}
                      <span className="text-white font-medium">{data.meanValence.toFixed(2)}</span>
                    </div>
                  )}
                  {data.meanArousal !== undefined && (
                    <div>
                      <span className="text-gray-400">Arousal:</span>{' '}
                      <span className="text-white font-medium">{data.meanArousal.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
