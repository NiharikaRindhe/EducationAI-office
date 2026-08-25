// web/src/features/pdf-simulator/components/SimFAB.tsx

import React from 'react'

export interface SimFABProps {
  count: number
  onClick: () => void
  isOpen?: boolean
}

export const SimFAB: React.FC<SimFABProps> = ({ count, onClick, isOpen = false }) => {
  if (count <= 0) return null

  const label = isOpen ? 'Close' : 'Simulate'
  const description = isOpen
    ? 'Close simulations'
    : `${count} simulation${count === 1 ? '' : 's'} on this page`

  return (
    <button
      type="button"
      className={`sim-fab${isOpen ? ' is-open' : ''}${count > 0 && !isOpen ? ' has-count' : ''}`}
      onClick={onClick}
      aria-label={description}
      title={description}
    >
      <span className="sim-fab__label">{label}</span>
      {count > 0 && !isOpen && <span className="sim-fab__badge">{count}</span>}
    </button>
  )
}
