// web/src/features/pdf-simulator/components/ChatPane.tsx

import React, { useCallback, useEffect, useRef, useState } from 'react'
import type { ChatMessage } from '../types/chat.js'
import {
  aiMessageCopyText,
  formulaToMarkdown,
  splitMarkdownSections,
} from '../utils/chatHelpers.js'
import { ChatMarkdown } from './ChatMarkdown.js'
import { CopyButton } from './CopyButton.js'
import { blobToJpegDataUrl, composeOutgoingText, firstClipboardImage } from '../utils/capturePdfPage.js'

export interface ChatPaneProps {
  messages: ChatMessage[]
  isLoading: boolean
  bookTitle?: string
  attachedImage?: string | null
  onAttachedImageChange?: (image: string | null) => void
  onSendMessage: (text: string, image?: string) => void
  onClear: () => void
  onStop?: () => void
}

const STARTERS = [
  'Explain the main idea on this page',
  'Walk me through the key formula',
  'Give a short worked example',
]

function UserBubble({ message }: { message: ChatMessage }) {
  return (
    <div className="chat-bubble-user">
      <span className="chat-bubble-label">You</span>
      {message.image ? (
        <img className="chat-bubble-thumb" src={message.image} alt="Attached figure" />
      ) : null}
      <div className="chat-bubble-body">{message.content}</div>
    </div>
  )
}

function ChatThinking() {
  return (
    <div
      className="chat-bubble-ai chat-thinking"
      aria-busy="true"
      aria-live="polite"
      aria-label="Assistant is thinking"
    >
      <span className="chat-thinking__label">Thinking</span>
      <span className="chat-thinking__dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
    </div>
  )
}

function AiBubble({ message }: { message: ChatMessage }) {
  if ((message.isLoading || message.isStreaming) && !message.content) {
    return <ChatThinking />
  }

  const streaming = Boolean(message.isStreaming)
  const sections = splitMarkdownSections(message.content)
  const showSectionList = !message.isError && !streaming && sections.length > 1
  const takeaways = message.keyTakeaways ?? []
  const formulas = message.relatedFormulas ?? []
  const copyAllText = aiMessageCopyText(message)

  return (
    <div className={`chat-bubble-ai${message.isError ? ' error' : ''}${streaming ? ' is-streaming' : ''}`}>
      <div className="chat-bubble-ai__bar">
        <span className="chat-bubble-label">Assistant</span>
        {!message.isError && !streaming && <CopyButton text={copyAllText} label="Copy" />}
      </div>
      {message.isError ? (
        <div className="chat-bubble-body">{message.content}</div>
      ) : showSectionList ? (
        <div className="text-section-list">
          {sections.map((section, idx) => (
            <section key={`${section.heading ?? 'intro'}-${idx}`} className="text-section">
              <h4 className="text-section__title">{section.heading ?? 'Overview'}</h4>
              {section.body ? <ChatMarkdown>{section.body}</ChatMarkdown> : null}
            </section>
          ))}
        </div>
      ) : (
        <div className="chat-stream-body">
          <ChatMarkdown>{message.content}</ChatMarkdown>
          {streaming ? <span className="chat-stream-caret" aria-hidden="true" /> : null}
        </div>
      )}
      {!message.isError && !streaming && formulas.length > 0 && (
        <section className="text-section">
          <h4 className="text-section__title">Formulas</h4>
          <div className="chat-formula-list">
            {formulas.map((formula, idx) => (
              <ChatMarkdown key={`${formula}-${idx}`}>{formulaToMarkdown(formula)}</ChatMarkdown>
            ))}
          </div>
        </section>
      )}
      {!message.isError && !streaming && takeaways.length > 0 && (
        <section className="text-section">
          <h4 className="text-section__title">Key takeaways</h4>
          <ul className="chat-takeaways">
            {takeaways.map((item, idx) => (
              <li key={`${idx}-${item}`}>
                <ChatMarkdown>{item}</ChatMarkdown>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function ChatMessageItem({ message }: { message: ChatMessage }) {
  if (message.role === 'system' || message.role === 'user') {
    return <UserBubble message={message} />
  }
  return <AiBubble message={message} />
}

export const ChatPane: React.FC<ChatPaneProps> = ({
  messages,
  isLoading,
  bookTitle,
  attachedImage,
  onAttachedImageChange,
  onSendMessage,
  onClear,
  onStop,
}) => {
  const [draft, setDraft] = useState('')
  const [localImage, setLocalImage] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const userScrolledUpRef = useRef(false)
  const pendingImage = attachedImage !== undefined ? attachedImage : localImage

  const setPendingImage = (next: string | null) => {
    if (attachedImage === undefined) setLocalImage(next)
    onAttachedImageChange?.(next)
  }

  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [])

  useEffect(() => {
    resizeTextarea()
  }, [draft, resizeTextarea])

  const handleScroll = () => {
    const el = listRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    userScrolledUpRef.current = distanceFromBottom > 80
  }

  useEffect(() => {
    if (userScrolledUpRef.current) return
    const last = messages[messages.length - 1]
    const streaming = Boolean(last?.isStreaming)
    bottomRef.current?.scrollIntoView({ behavior: streaming ? 'auto' : 'smooth' })
  }, [messages])

  const attachImageFile = async (file: File | null) => {
    if (!file) return
    const dataUrl = await blobToJpegDataUrl(file)
    if (dataUrl) setPendingImage(dataUrl)
  }

  const submit = (textToSend?: string) => {
    const text = composeOutgoingText(textToSend ?? draft, Boolean(pendingImage))
    if ((!text && !pendingImage) || isLoading) return
    onSendMessage(text, pendingImage || undefined)
    setDraft('')
    setPendingImage(null)
    userScrolledUpRef.current = false
    requestAnimationFrame(resizeTextarea)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const hasMessages = messages.length > 0

  return (
    <div className="chat-pane">
      <header className="chat-pane__header">
        <div>
          <h2 className="chat-pane__title">Study assistant</h2>
          <p className="chat-pane__subtitle">
            {bookTitle
              ? `Questions about ${bookTitle} only`
              : 'Ask about the chapter you are reading — this book only'}
          </p>
        </div>
        {hasMessages && (
          <button
            type="button"
            className="chat-clear-btn"
            onClick={onClear}
            disabled={isLoading}
          >
            New chat
          </button>
        )}
      </header>

      <div
        ref={listRef}
        className={`chat-messages-list${hasMessages ? '' : ' is-empty'}`}
        onScroll={handleScroll}
      >
        {!hasMessages ? (
          <div className="chat-empty-state">
            <h3 className="chat-empty-state__title">How can I help you learn?</h3>
            <p className="chat-empty-state__desc">
              I only answer questions from this textbook
              {bookTitle ? ` (${bookTitle})` : ''}. Highlight a passage, or start with a question
              below.
            </p>
            <div className="chat-empty-state__starters">
              {STARTERS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="chat-starter"
                  onClick={() => submit(prompt)}
                  disabled={isLoading}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessageItem key={message.id} message={message} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div
        className="chat-input-footer"
        onDragOver={(e) => {
          if (firstClipboardImage(e.dataTransfer)) {
            e.preventDefault()
            e.dataTransfer.dropEffect = 'copy'
          }
        }}
        onDrop={(e) => {
          const file = firstClipboardImage(e.dataTransfer)
          if (!file) return
          e.preventDefault()
          void attachImageFile(file)
        }}
      >
        <div className="chat-composer">
          {pendingImage ? (
            <div className="chat-attach-chip">
              <img src={pendingImage} alt="Pending attachment" />
              <button
                type="button"
                className="chat-attach-chip__remove"
                onClick={() => setPendingImage(null)}
                aria-label="Remove attached image"
              >
                ×
              </button>
            </div>
          ) : null}
          <textarea
            ref={textareaRef}
            className="chat-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={(e) => {
              const file = firstClipboardImage(e.clipboardData)
              if (!file) return
              e.preventDefault()
              void attachImageFile(file)
            }}
            placeholder="Ask about this textbook…"
            rows={1}
            disabled={isLoading}
            aria-label="Chat message input"
          />
        </div>
        {isLoading && onStop ? (
          <button
            type="button"
            className="chat-stop-btn"
            onClick={onStop}
            aria-label="Stop generating"
          >
            <span className="chat-stop-btn__icon" aria-hidden="true" />
            Stop
          </button>
        ) : (
          <button
            type="button"
            className="chat-send-btn"
            onClick={() => submit()}
            disabled={isLoading || (!draft.trim() && !pendingImage)}
          >
            Send
          </button>
        )}
      </div>
    </div>
  )
}
