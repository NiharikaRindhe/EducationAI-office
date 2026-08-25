// web/src/features/pdf-simulator/components/RightPanel.tsx

import React from 'react'
import type { RightTab } from '../types/chat.js'

export interface RightPanelProps {
  activeTab: RightTab
  onTabChange: (tab: RightTab) => void
  chat: React.ReactNode
  sim: React.ReactNode | null
  notes?: React.ReactNode
}

const TABS: { id: RightTab; label: string }[] = [
  { id: 'chat', label: 'Chat' },
  { id: 'sim', label: 'Simulation' },
  { id: 'notes', label: 'Notes' },
]

function PanelEmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="right-panel__empty-state">
      <p className="right-panel__empty-state-title">{title}</p>
      <p className="right-panel__empty-state-desc">{description}</p>
    </div>
  )
}

export const RightPanel: React.FC<RightPanelProps> = ({
  activeTab,
  onTabChange,
  chat,
  sim,
  notes,
}) => {
  const renderActiveContent = () => {
    switch (activeTab) {
      case 'chat':
        return chat
      case 'sim':
        return sim ?? (
          <PanelEmptyState
            title="No simulation selected"
            description="Click Simulate on the page to open this tab’s list."
          />
        )
      case 'notes':
        return (
          notes ?? (
            <PanelEmptyState
              title="No notes yet"
              description="Highlight text in the PDF to capture notes."
            />
          )
        )
      default:
        return null
    }
  }

  return (
    <div className="right-panel">
      <div className="right-panel__tab-bar" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`right-panel__tab-btn${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="right-panel__content" role="tabpanel">
        {renderActiveContent()}
      </div>
    </div>
  )
}
