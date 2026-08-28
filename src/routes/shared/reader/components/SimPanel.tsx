// web/src/features/pdf-simulator/components/SimPanel.tsx

import React, { useEffect, useMemo, useState } from 'react'
import {
  bindTemplate,
  isTemplateId,
  randomizeTemplateParams,
  TEMPLATE_CATALOG,
  type ParamDef,
  type SimSpec,
} from '@sim/shared'
import { SimStage } from '../sim/SimStage.js'

export interface SimPanelProps {
  spec: SimSpec | null
  onClose?: () => void
  onRegenerateWithAi?: () => Promise<void>
  isAnimationVisible?: boolean
  onToggleAnimation?: () => void
  children?: React.ReactNode
}

const RESULT_META: Record<string, { label: string; unit?: string }> = {
  W: { label: 'W', unit: 'J' },
  H: { label: 'H', unit: 'J' },
  Req: { label: 'Req', unit: 'Ω' },
  I: { label: 'I', unit: 'A' },
  I1: { label: 'I₁', unit: 'A' },
  I2: { label: 'I₂', unit: 'A' },
  P: { label: 'P' },
  t: { label: 't', unit: 's' },
  v: { label: 'v' },
  m: { label: 'm' },
  real: { label: 'Real' },
  period: { label: 'T', unit: 's' },
  omega: { label: 'ω', unit: 'rad/s' },
  range: { label: 'R', unit: 'm' },
  flightTime: { label: 'T', unit: 's' },
  impactSpeed: { label: 'v', unit: 'm/s' },
  acceleration: { label: 'a', unit: 'm/s²' },
  theta2: { label: 'θ₂', unit: '°' },
  magnification: { label: 'm' },
  volume: { label: 'V', unit: 'm³' },
  field: { label: 'B' },
  delta: { label: 'δ', unit: '°' },
  energyLoss: { label: 'ΔE', unit: 'J' },
  keAfter: { label: 'KE', unit: 'J' },
  centripetal: { label: 'aᶜ', unit: 'm/s²' },
  speed: { label: 'v', unit: 'm/s' },
  wavelength: { label: 'λ', unit: 'm' },
  vertex: { label: 'vertex' },
  sMax: { label: 's', unit: 'm' },
  vEnd: { label: 'v', unit: 'm/s' },
  state: { label: 'state' },
  phase: { label: 'phase' },
  duration: { label: 't', unit: 's' },
  lcm: { label: 'First common multiple' },
  gcd: { label: 'Common factor' },
  hcf: { label: 'Largest square tile' },
  mean: { label: 'Typical value' },
  kg: { label: 'Mass', unit: 'kg' },
  eachSack: { label: 'Each sack', unit: 'kg' },
  angleSum: { label: 'Angle sum', unit: '°' },
  product: { label: 'Product' },
  sameValue: { label: 'Same value' },
  area: { label: 'Area' },
  perimeter: { label: 'Perimeter' },
  quotient: { label: 'Each group' },
  remainder: { label: 'Left over' },
  totalGrams: { label: 'Total', unit: 'g' },
  totalMl: { label: 'Total', unit: 'ml' },
  percentFresh: { label: 'Fresh water', unit: '%' },
  tessellates: { label: 'No gaps' },
  looksSame: { label: 'Looks the same' },
  indiaInDay: { label: 'India in day' },
  cycleSeconds: { label: 'Cycle', unit: 's' },
}

function formatMetricKey(key: string): string {
  if (key.length <= 3) return key
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function isUsefulMetric(value: number | string | boolean): boolean {
  if (typeof value === 'string') return value.trim().length > 0
  if (typeof value === 'number') return Number.isFinite(value)
  return typeof value === 'boolean'
}

function formatMetricValue(value: number | string | boolean): string {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return String(value)
    return Math.abs(value) >= 100 ? value.toFixed(1) : value.toFixed(2)
  }
  return String(value)
}

function nudgeParam(def: ParamDef, current: number, dir: -1 | 1): number {
  const step = def.step > 0 ? def.step : 1
  const raw = current + dir * step
  const snapped = def.min + Math.round((raw - def.min) / step) * step
  const digits = step < 1 ? Math.min(6, String(step).split('.')[1]?.length ?? 2) : 0
  const rounded = Number(snapped.toFixed(digits))
  return Math.min(def.max, Math.max(def.min, rounded))
}

function metricLabel(key: string, paramDefs: ParamDef[]): { label: string; unit?: string } {
  const def = paramDefs.find((d) => d.key === key)
  if (def) return { label: def.label, unit: def.unit || undefined }
  return RESULT_META[key] ?? { label: formatMetricKey(key) }
}

function textbookParams(spec: SimSpec): Record<string, number> {
  const out: Record<string, number> = {}
  for (const [k, v] of Object.entries(spec.params || {})) {
    const n = typeof v === 'number' ? v : Number(v)
    if (Number.isFinite(n)) out[k] = n
  }
  return out
}

function EyeOpenIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2.1 12.3a1 1 0 0 1 0-.6A10.8 10.8 0 0 1 12 5c4.2 0 7.8 2.5 9.9 6.7a1 1 0 0 1 0 .6A10.8 10.8 0 0 1 12 19c-4.2 0-7.8-2.5-9.9-6.7Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function EyeClosedIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3.27 3.27 21 21"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M9.9 5.2A10.7 10.7 0 0 1 12 5c4.2 0 7.8 2.5 9.9 6.7a1 1 0 0 1 0 .6 10.8 10.8 0 0 1-2.1 3.1M6.1 6.1A10.8 10.8 0 0 0 2.1 11.7a1 1 0 0 0 0 .6A10.8 10.8 0 0 0 12 19c1.4 0 2.7-.2 3.9-.7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function BackArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M19 12H5M11 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ResetIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function RandomIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" />
      <circle cx="15.5" cy="8.5" r="1.2" fill="currentColor" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
      <circle cx="8.5" cy="15.5" r="1.2" fill="currentColor" />
      <circle cx="15.5" cy="15.5" r="1.2" fill="currentColor" />
    </svg>
  )
}

export const SimPanel: React.FC<SimPanelProps> = ({
  spec,
  onClose,
  onRegenerateWithAi,
  isAnimationVisible = true,
  onToggleAnimation,
  children,
}) => {
  const [isRegenerating, setIsRegenerating] = useState(false)
  const templated = Boolean(spec?.templateId && isTemplateId(spec.templateId))
  const [sliderParams, setSliderParams] = useState<Record<string, number>>({})

  useEffect(() => {
    if (spec) setSliderParams(textbookParams(spec))
  }, [spec])

  const bound = useMemo(() => {
    if (!spec?.templateId || !isTemplateId(spec.templateId)) return null
    return bindTemplate(spec.templateId, sliderParams, spec)
  }, [spec, sliderParams])

  const stage = bound?.spec.stage ?? spec?.stage
  const playable = Boolean(spec && (stage || templated))

  const handleRegenerate = async () => {
    if (!onRegenerateWithAi) return
    try {
      setIsRegenerating(true)
      await onRegenerateWithAi()
    } finally {
      setIsRegenerating(false)
    }
  }

  if (!spec || !playable || !stage) {
    return (
      <div className="sim-empty">
        <h4 className="sim-empty__title">No simulation selected</h4>
        <p className="sim-empty__desc">
          Open a page in the textbook, then use <strong>Simulate</strong> to launch an interactive demo for that topic.
        </p>
      </div>
    )
  }

  const paramDefs =
    templated && spec.templateId && isTemplateId(spec.templateId)
      ? TEMPLATE_CATALOG[spec.templateId].params
      : []
  const metrics = bound?.metrics ?? {}
  const inputKeys = new Set(paramDefs.map((d) => d.key))
  const displayEntries = Object.entries(metrics).filter(
    ([k, v]) => !inputKeys.has(k) && isUsefulMetric(v)
  )
  const warnings = bound?.warnings ?? []
  const showSliders = templated && paramDefs.length > 0

  const sliderActions = showSliders ? (
    <div className="sim-controls__actions">
      <button
        type="button"
        onClick={() => setSliderParams(textbookParams(spec))}
        className="sim-tool-btn sim-tool-btn--icon"
        title="Restore numbers from the textbook"
        aria-label="Reset values"
      >
        <ResetIcon />
      </button>
      <button
        type="button"
        onClick={() => {
          if (spec.templateId && isTemplateId(spec.templateId)) {
            setSliderParams(randomizeTemplateParams(spec.templateId))
          }
        }}
        className="sim-tool-btn sim-tool-btn--icon"
        title="Try random values in a valid range"
        aria-label="Random values"
      >
        <RandomIcon />
      </button>
    </div>
  ) : null

  return (
    <div className={`sim-panel${isAnimationVisible ? '' : ' is-canvas-hidden'}`}>
      <header className="sim-panel__header">
        <div className="sim-panel__heading">
          <h3 className="sim-panel__title" title={spec.title}>
            {spec.title}
          </h3>
          {displayEntries.length > 0 && (
            <div className="sim-readout" aria-label="Simulation results">
              {displayEntries.map(([k, v]) => {
                const meta = metricLabel(k, paramDefs)
                return (
                  <span key={k} className="sim-readout__item">
                    <span className="sim-readout__key">{meta.label}</span>
                    <span className="sim-readout__value">
                      {formatMetricValue(v)}
                      {meta.unit ? <span className="sim-readout__unit">{meta.unit}</span> : null}
                    </span>
                  </span>
                )
              })}
            </div>
          )}
        </div>

        <div className="sim-panel__actions">
          {onToggleAnimation && (
            <button
              type="button"
              onClick={onToggleAnimation}
              className={`sim-tool-btn sim-tool-btn--icon${isAnimationVisible ? '' : ' is-active'}`}
              title={isAnimationVisible ? 'Hide animation' : 'Show animation'}
              aria-label={isAnimationVisible ? 'Hide animation' : 'Show animation'}
              aria-pressed={!isAnimationVisible}
            >
              {isAnimationVisible ? <EyeOpenIcon /> : <EyeClosedIcon />}
            </button>
          )}

          {onRegenerateWithAi && !templated && (
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="sim-tool-btn is-accent"
              title="Ask AI to re-generate this simulation"
            >
              {isRegenerating ? 'Generating…' : 'Re-animate'}
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="sim-tool-btn sim-tool-btn--icon"
              title="Back to list"
              aria-label="Back to list"
            >
              <BackArrowIcon />
            </button>
          )}
        </div>
      </header>

      {warnings.length > 0 && (
        <div className="sim-result-warn">{warnings.join(' · ')}</div>
      )}

      {isAnimationVisible ? (
        <div className="sim-panel__body">
          <div className="sim-panel__stage-wrap">
            <div className="sim-panel__stage">
              <SimStage
                key={spec.templateId || spec.title}
                stage={stage}
                autoPlay={true}
                initialSpeed={1}
                showControls={true}
                zoom={1}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="sim-panel__body sim-panel__body--brief">{children}</div>
      )}

      {isAnimationVisible && showSliders && (
        <div className="sim-controls">
          <div className="sim-controls__head">
            <div className="sim-controls__title">Try different values</div>
            {sliderActions}
          </div>
          {paramDefs.map((def) => {
            const raw = sliderParams[def.key] ?? def.defaultValue
            const setValue = (next: number) =>
              setSliderParams((prev) => ({ ...prev, [def.key]: next }))

            if (def.options?.length) {
              const selected = def.options.reduce((best, opt) =>
                Math.abs(opt.value - raw) < Math.abs(best.value - raw) ? opt : best
              ).value
              const useSelect = def.options.length > 5
              return (
                <div key={def.key} className="sim-param sim-param--choice">
                  <span className="sim-param__label">{def.label}</span>
                  {useSelect ? (
                    <select
                      className="sim-choice-select"
                      value={selected}
                      onChange={(e) => setValue(Number(e.target.value))}
                    >
                      {def.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="sim-choice" role="group" aria-label={def.label}>
                      {def.options.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          className="sim-choice__btn"
                          aria-pressed={opt.value === selected}
                          onClick={() => setValue(opt.value)}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            }

            const atMin = raw <= def.min
            const atMax = raw >= def.max
            return (
              <div key={def.key} className="sim-param">
                <span className="sim-param__row">
                  <span className="sim-param__label">
                    {def.label}
                    {def.unit ? <span className="sim-param__unit">{def.unit}</span> : null}
                  </span>
                  <span className="sim-param__stepper">
                    <button
                      type="button"
                      className="sim-step-btn"
                      onClick={() => setValue(nudgeParam(def, raw, -1))}
                      disabled={atMin}
                      title={`Decrease ${def.label}`}
                      aria-label={`Decrease ${def.label}`}
                    >
                      −
                    </button>
                    <span className="sim-param__value">
                      {raw.toFixed(def.step < 1 ? Math.min(3, String(def.step).split('.')[1]?.length ?? 2) : 0)}
                    </span>
                    <button
                      type="button"
                      className="sim-step-btn"
                      onClick={() => setValue(nudgeParam(def, raw, 1))}
                      disabled={atMax}
                      title={`Increase ${def.label}`}
                      aria-label={`Increase ${def.label}`}
                    >
                      +
                    </button>
                  </span>
                </span>
                <input
                  type="range"
                  min={def.min}
                  max={def.max}
                  step={def.step}
                  value={raw}
                  onChange={(e) => setValue(Number(e.target.value))}
                />
              </div>
            )
          })}
        </div>
      )}

      {isAnimationVisible ? children : null}
    </div>
  )
}
