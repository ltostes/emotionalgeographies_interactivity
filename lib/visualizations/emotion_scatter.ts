import * as Plot from '@observablehq/plot'
import * as d3 from 'd3'
import type { ImageStats } from '@/lib/types/database'
import { valenceToColor, arousalToRadius  } from '@/lib/visualizations/scales'

export function generateScatterPlot(
    imageStats: ImageStats[],
    width: number,
    onDotClick?: (imageStats: ImageStats, event: MouseEvent) => void
) : [Element, string | null] {

    
    const overallPoint = [
        d3.sum(imageStats, d => (d.mean_valence || 0) * d.valence_contribution_count) / d3.sum(imageStats, d => d.valence_contribution_count),
        d3.sum(imageStats, d => (d.mean_arousal || 0) * d.arousal_contribution_count) / d3.sum(imageStats, d => d.arousal_contribution_count)
    ]

    const emotions = [
        // "Joy",
        "Happy",
        "Delighted",
        "Excited",
        // "Fully Aroused",
        "Tense",
        "Angry",
        "Frustrated",
        // "Fearful",
        "Depressed",
        "Bored",
        "Tired",
        // "Sleepy",
        "Calm",
        "Relaxed",
        "Content"
    ]

    const angleOffset : number = (Math.PI * 2) / emotions.length / 2;

    const emotionScale = d3
        .scaleQuantize(emotions)
        .domain([0, 2 * Math.PI])

    function angleToPoint(angle:number, radius:number) {
        return d3.pointRadial(angle + Math.PI / 2, radius);
    }

    function pointToAngle(x:number, y:number) {
        let angle = -(Math.atan2(x, y) + Math.PI / 2) + Math.PI;
        angle = angle < 0 ? angle + 2 * Math.PI : angle;
        return [angle, Math.hypot(x, y)];
    }
    const denormalizeFun = (n:number) => 3*n + 4;
    const normalizeFun = (n:number) => (n-4)/3;

    const emotionsCenterAngles = emotions.map((e) => d3.mean(emotionScale.invertExtent(e)))

    const emotionsCenterPoints = emotionsCenterAngles.map((d) => angleToPoint((d || 0), 1));

    const emotionsRangeAngles = emotionsCenterAngles.map((d) => [
        (d || 0) - angleOffset,
        (d || 0) + angleOffset
    ])

    const emotionsRangePoints = emotionsRangeAngles.map((d) =>
        d.map((a) => angleToPoint(a, 1))
    );

    const base_circle_radius_increment = 0.3;
    const text_radius = 0.52;

    const computedEmotion = emotionScale(pointToAngle(
        normalizeFun(overallPoint[0]),
        normalizeFun(overallPoint[1])
    )[0]);

    console.log({imageStats, computedEmotion, overallPoint, emotionsCenterPoints, emotionsRangePoints});

    const frameMarksOpacity = 0.1;

    const plot = Plot.plot({
        width,
        aspectRatio: 1,
        x: {
            domain: [1, 7],
            axis: null,
        },
        y: {
            domain: [1, 7],
            axis: null,
        },
        marks: [
            Plot.dot(imageStats, {
                x: 'mean_valence',
                y: 'mean_arousal',
                r: 3,
                fill: 'hsl(205 76.7% 63.3%)',
                fillOpacity: 0.5,
                // cursor: 'pointer'
            }),
            Plot.dot([overallPoint], {
                x: overallPoint[0],
                y: overallPoint[1],
                r: arousalToRadius(overallPoint[1]),
                fill: valenceToColor(overallPoint[0]),
            }),
            Plot.line(
                { length: 21 },
                {
                    x: (_, i) => d3.pointRadial((i * Math.PI) / 10, 3)[0] + 4,
                    y: (_, i) => d3.pointRadial((i * Math.PI) / 10, 3)[1] + 4,
                    curve: "natural",
                    marker: false,
                    opacity: frameMarksOpacity
                }
            ),
            Plot.link(emotionsRangePoints.flat().map(d => d.map(denormalizeFun)), {
                x1: 4,
                y1: 4,
                x2: (d) => d[0],
                y2: (d) => d[1],
                opacity: 0.2,
                strokeDasharray: "5,5"
            })
            , Plot.text(emotionsCenterPoints, {
                text: (d, i) => emotions[i],
                x: ([x,y]) =>
                    denormalizeFun(angleToPoint(
                    pointToAngle(x,y)[0],
                    text_radius + base_circle_radius_increment
                    )[0]),
                y: ([x,y]) =>
                    denormalizeFun(angleToPoint(
                    pointToAngle(x,y)[0],
                    text_radius + base_circle_radius_increment
                    )[1]),
                opacity: frameMarksOpacity + 0.2,
            }),
            Plot.link([0], {
                stroke: 'white',
                strokeWidth: 2,
                markerEnd: "arrow",
                x1: 1,
                x2: 6.9,
                y1: 4,
                y2: 4,
                opacity: 0.5
                }),
            Plot.text(['Valence'], {
                fill: 'white',
                frameAnchor: 'right',
                dy: -8,
                dx: -10,
                opacity: 0.5
            }),
            Plot.link([0], {
                stroke: 'white',
                strokeWidth: 2,
                markerEnd: "arrow",
                x1: 4,
                x2: 4,
                y1: 1,
                y2: 6.9,
                opacity: 0.7
            }),
            Plot.text(['Arousal'], {
                fill: 'white',
                frameAnchor: 'top',
                textAnchor: 'end',
                lineAnchor: 'bottom',
                dy: 12,
                dx: -3,
                rotate: -90,
                opacity: 0.7
            }),
        ]
    });

    // Add click handlers to individual dots if callback provided
    if (onDotClick) {
        d3.select(plot)
            .selectAll('circle')
            .each(function(this: d3.BaseType, d, i) {
                // Only handle the small dots (imageStats), not the overall point
                if (i < imageStats.length) {
                    const el = this as unknown as SVGCircleElement;
                    el.style.cursor = 'pointer';
                    el.addEventListener('click', (event: MouseEvent) => {
                        onDotClick(imageStats[i], event);
                    });
                }
            });
    }

    return [plot, computedEmotion];
}
