// web/src/features/pdf-simulator/sim/SimStage.tsx

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import type { SimStage as SimStageType } from '@sim/shared'
import { createCompiledSpec, evalSpec, type ResolvedStage } from './evalSpec.js'
import { ElementRenderer } from './elements/index.js'
import type { Point } from './elements/ActivePath.js'

export interface SimStageProps {
  stage: SimStageType
  autoPlay?: boolean
  initialSpeed?: number
  className?: string
  showControls?: boolean
  /** 1 = original framing. Higher values crop empty canvas so the drawing looks closer. */
  zoom?: number
}

function zoomViewBox(viewBox: string, zoom: number): string {
  const parts = viewBox.trim().split(/[\s,]+/).map(Number)
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n)) || zoom <= 1) {
    return viewBox
  }
  const [x, y, w, h] = parts
  const nw = w / zoom
  const nh = h / zoom
  // Keep top-left labels in frame; crop empty canvas on the right and bottom.
  const nx = x + (w - nw) * 0.08
  const ny = y + (h - nh) * 0.18
  return `${nx} ${ny} ${nw} ${nh}`
}

export const SimStage: React.FC<SimStageProps> = ({
  stage,
  autoPlay = true,
  initialSpeed = 1,
  className = '',
  showControls = true,
  zoom = 1,
}) => {
  const isPlaying = autoPlay
  const speed = initialSpeed
  const [time, setTime] = useState(0)

  // Pre-compile expressions once when stage definition changes
  const compiledStage = useMemo(() => createCompiledSpec(stage), [stage])

  // Track trajectories and active path histories (KP-7)
  const historyMapRef = useRef<Map<string, Point[]>>(new Map())
  const lastTimeRef = useRef<number>(0)
  const animFrameRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const timeOffsetRef = useRef<number>(0)

  // Reset history on stage change or explicit reset
  const resetSimulation = useCallback(() => {
    historyMapRef.current.clear()
    startTimeRef.current = null
    timeOffsetRef.current = 0
    setTime(0)
    lastTimeRef.current = 0
  }, [])

  useEffect(() => {
    resetSimulation()
  }, [stage, resetSimulation])

  // requestAnimationFrame loop
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
      }
      startTimeRef.current = null
      return
    }

    const loop = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp - (timeOffsetRef.current / speed) * 1000
      }

      const elapsed = ((timestamp - startTimeRef.current) / 1000) * speed
      timeOffsetRef.current = elapsed
      setTime(elapsed)

      animFrameRef.current = requestAnimationFrame(loop)
    }

    animFrameRef.current = requestAnimationFrame(loop)

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
      }
    }
  }, [isPlaying, speed])

  // Evaluate current frame.
  //
  // This deliberately mutates historyMapRef/lastTimeRef inside useMemo, and
  // reads historyMapRef.current during render below — both flagged by
  // react-hooks/refs, which assumes render purity. The trade-off is
  // intentional: trail history is per-animation-frame, append-only state
  // driven by a requestAnimationFrame loop already running outside React
  // (see the effect above), not by props/state a re-render could recompute
  // from scratch. Moving it to real React state would double the re-renders
  // per frame (once for `time`, once for the history update) and introduce
  // a one-frame lag in every rendered trail across every physics/motion
  // template — a real behavior change to sign off on, not a lint fix, for a
  // pattern ported working as-is from pdf-simulation-master.
  /* eslint-disable react-hooks/refs */
  const resolvedStage: ResolvedStage = useMemo(() => {
    const resolved = evalSpec(compiledStage, time)

    // Update history for projectile and active-path roles
    // If time wrapped or jumped backwards, clear history
    if (time < lastTimeRef.current - 0.5) {
      historyMapRef.current.clear()
    }
    lastTimeRef.current = time

    for (const elem of resolved.elements) {
      if (elem.role === 'projectile' || elem.type === 'active-path') {
        const x = Number(elem.props.cx ?? elem.props.x ?? 0)
        const y = Number(elem.props.cy ?? elem.props.y ?? 0)

        const points = historyMapRef.current.get(elem.id) || []
        points.push({ x, y })

        // Cap history at 100 points to prevent memory growth (KP-7)
        if (points.length > 100) {
          points.shift()
        }
        historyMapRef.current.set(elem.id, points)
      }
    }

    return resolved
  }, [compiledStage, time])

  // Find projectile history to pass to active-path elements if needed
  const primaryTrajectoryPoints = useMemo(() => {
    for (const [_id, points] of historyMapRef.current.entries()) {
      if (points.length > 0) return points
    }
    return []
  }, [resolvedStage])

  const zoomedViewBox = useMemo(
    () => zoomViewBox(resolvedStage.viewBox, zoom),
    [resolvedStage.viewBox, zoom]
  )

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: 0,
        display: 'flex',
        background: '#f8fafc',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      <svg
        viewBox={zoomedViewBox}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <defs>
          {/* Subtle grid pattern background */}
          <pattern
            id="sim-grid-pattern"
            width="25"
            height="25"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 25 0 L 0 0 0 25"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="1"
            />
          </pattern>
        </defs>

        <rect x="-1000" y="-1000" width="3000" height="3000" fill="#f8fafc" />
        <rect
          x="-1000"
          y="-1000"
          width="3000"
          height="3000"
          fill="url(#sim-grid-pattern)"
        />

        {/* Render elements */}
        {resolvedStage.elements.map((elem) => {
          const history = historyMapRef.current.get(elem.id) || primaryTrajectoryPoints
          return (
            <ElementRenderer
              key={elem.id}
              element={elem}
              historyPoints={history}
            />
          )
        })}
        {/* eslint-enable react-hooks/refs */}
      </svg>

      {showControls && (
        <button
          type="button"
          className="sim-stage__reset"
          onClick={resetSimulation}
          title="Reset simulation"
        >
          ↺
        </button>
      )}
    </div>
  )
}
