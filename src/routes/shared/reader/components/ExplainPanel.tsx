// web/src/features/pdf-simulator/components/ExplainPanel.tsx

import React, { useEffect, useState } from 'react'
import { resolveSimBrief, type SimSpec } from '@sim/shared'
import { ChatMarkdown } from './ChatMarkdown.js'
import { CopyButton } from './CopyButton.js'

export interface ExplainPanelProps {
  spec: SimSpec | null
  quote?: string
  pageText?: string
  isSimAnimationVisible?: boolean
  onToggleSimAnimation?: () => void
  onChatAboutSim?: () => void
}

export const ExplainPanel: React.FC<ExplainPanelProps> = ({
  spec,
  quote,
  isSimAnimationVisible = true,
  onChatAboutSim,
}) => {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!isSimAnimationVisible) setIsOpen(true)
  }, [isSimAnimationVisible])

  if (!spec) return null

  const brief = resolveSimBrief(spec, quote || spec.quote)
  const fillSpace = !isSimAnimationVisible
  const showBody = isOpen || fillSpace

  return (
    <div className={`sim-brief${showBody ? ' is-open' : ''}${fillSpace ? ' is-fill' : ''}`}>
      {fillSpace ? (
        <div className="sim-brief__toggle" role="presentation">
          <span className="sim-brief__toggle-label">How this works</span>
        </div>
      ) : (
        <button
          type="button"
          className="sim-brief__toggle"
          onClick={() => setIsOpen((v) => !v)}
          aria-expanded={isOpen}
        >
          <span className="sim-brief__toggle-label">How this works</span>
          <span className="sim-brief__chevron" aria-hidden="true">
            {isOpen ? '▾' : '▸'}
          </span>
        </button>
      )}

      {showBody && (
        <div className="sim-brief__body">
          <section className="sim-brief__section">
            <div className="text-section__head">
              <h4 className="sim-brief__heading">What you are looking at</h4>
              <CopyButton text={brief.about} />
            </div>
            <ChatMarkdown>{brief.about}</ChatMarkdown>
          </section>
          <section className="sim-brief__section">
            <div className="text-section__head">
              <h4 className="sim-brief__heading">How to read it</h4>
              <CopyButton text={brief.howItWorks} />
            </div>
            <ChatMarkdown>{brief.howItWorks}</ChatMarkdown>
          </section>

          {onChatAboutSim && (
            <button type="button" className="sim-brief__chat-btn" onClick={onChatAboutSim}>
              Ask a question about this
            </button>
          )}
        </div>
      )}
    </div>
  )
}
