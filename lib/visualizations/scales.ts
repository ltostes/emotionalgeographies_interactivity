import { scaleLinear } from 'd3-scale'
import { interpolateRdYlGn } from 'd3-scale-chromatic'

  // Scales for styling
export const arousalToRadius = scaleLinear().domain([1, 7]).range([3, 10])

  // Color scale: valence 1=red (0), 4=blue (0.5), 7=green (1)
export const valenceToColor = (valence: number) => {
    // Normalize to 0-1 range, where 1→0, 4→0.5, 7→1
    const normalized = (valence - 1) / 6
    return interpolateRdYlGn(normalized)
}