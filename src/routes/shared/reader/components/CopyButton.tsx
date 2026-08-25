// web/src/features/pdf-simulator/components/CopyButton.tsx

import React, { useEffect, useState } from 'react'

export interface CopyButtonProps {
  text: string
  label?: string
  className?: string
}

export const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  label = 'Copy',
  className = '',
}) => {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const id = window.setTimeout(() => setCopied(false), 1500)
    return () => window.clearTimeout(id)
  }, [copied])

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const value = text.trim()
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
    } catch (err) {
      console.warn('[CopyButton] Clipboard write failed:', err)
    }
  }

  return (
    <button
      type="button"
      className={`copy-btn${copied ? ' is-copied' : ''}${className ? ` ${className}` : ''}`}
      onClick={handleCopy}
      disabled={!text.trim()}
      title={copied ? 'Copied' : label}
    >
      {copied ? 'Copied' : label}
    </button>
  )
}
