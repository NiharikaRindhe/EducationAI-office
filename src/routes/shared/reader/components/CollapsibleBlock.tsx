// web/src/features/pdf-simulator/components/CollapsibleBlock.tsx

import React, { useEffect, useRef, useState } from 'react'

export interface CollapseRuleButtonProps {
  open: boolean
  onToggle: () => void
  expandLabel?: string
  collapseLabel?: string
}

export function CollapseRuleButton({
  open,
  onToggle,
  expandLabel = 'Show more',
  collapseLabel = 'Show less',
}: CollapseRuleButtonProps) {
  return (
    <button
      type="button"
      className={`collapse-rule${open ? ' is-open' : ''}`}
      onClick={onToggle}
      aria-expanded={open}
      aria-label={open ? collapseLabel : expandLabel}
      title={open ? collapseLabel : expandLabel}
    >
      <span className="collapse-rule__line" aria-hidden="true" />
      <span className="collapse-rule__dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span className="collapse-rule__line" aria-hidden="true" />
    </button>
  )
}

export interface CollapsibleBlockProps {
  children: React.ReactNode
  maxHeight?: number
  className?: string
}

export const CollapsibleBlock: React.FC<CollapsibleBlockProps> = ({
  children,
  maxHeight = 132,
  className = '',
}) => {
  const bodyRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [canCollapse, setCanCollapse] = useState(false)

  useEffect(() => {
    const el = bodyRef.current
    if (!el) return

    const measure = () => {
      setCanCollapse(el.scrollHeight > maxHeight + 12)
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [children, maxHeight])

  return (
    <div
      className={`text-collapse${open ? ' is-open' : ''}${canCollapse && !open ? ' is-clipped' : ''}${
        className ? ` ${className}` : ''
      }`}
    >
      <div
        ref={bodyRef}
        className="text-collapse__body"
        style={open ? undefined : { maxHeight }}
      >
        {children}
      </div>
      {canCollapse && (
        <CollapseRuleButton open={open} onToggle={() => setOpen((v) => !v)} />
      )}
    </div>
  )
}
