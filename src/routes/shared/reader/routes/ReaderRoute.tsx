// web/src/features/pdf-simulator/routes/ReaderRoute.tsx

import React, { useState, useEffect, useMemo, useRef } from 'react'
// Code-split with this lazy-loaded route rather than imported globally —
// see reader.css's header comment for what was changed from upstream.
import '../reader.css'
import { simApiClient, getNotesUserId, type SimAnnotation, type NoteRecord, type NotePatch } from '../api.js'
import { PdfPane } from '../components/PdfPane.js'
import { SimFAB } from '../components/SimFAB.js'
import { SimDrawer } from '../components/SimDrawer.js'
import { SimPanel } from '../components/SimPanel.js'
import { ExplainPanel } from '../components/ExplainPanel.js'
import { SplitResizer } from '../components/SplitResizer.js'
import { RightPanel } from '../components/RightPanel.js'
import { ChatPane } from '../components/ChatPane.js'
import { NotebookPanel } from '../components/NotebookPanel.js'
import { TextSelectionExplainer } from '../components/TextSelectionExplainer.js'
import type { ChatMessage, RightTab } from '../types/chat.js'
import {
  buildSimExplainPrompt,
  CHAT_ERROR_CONTENT,
  coerceDomain,
  formatSelectionReply,
  toChatApiMessages,
} from '../utils/chatHelpers.js'
import { composeOutgoingText } from '../utils/capturePdfPage.js'
import { resolveChatPageImage, type ChatImageSource } from '@sim/shared'
import { formatPdfSelectionText } from '../utils/formatPdfSelection.js'
import { createWordStreamer, type WordStreamer } from '../utils/wordStreamer.js'

export interface ReaderRouteProps {
  bookId?: string
  pdfSource?: string | File | ArrayBuffer | null
  bookTitle?: string
  initialPage?: number
  onBack?: () => void
}

export const ReaderRoute: React.FC<ReaderRouteProps> = ({
  bookId,
  pdfSource = null,
  bookTitle,
  initialPage = 1,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(initialPage)
  const [pageText, setPageText] = useState('')
  const [pageTextPage, setPageTextPage] = useState(0)
  const [fullPageImage, setFullPageImage] = useState<string | null>(null)
  const [composerImage, setComposerImage] = useState<string | null>(null)
  const [allAnnotations, setAllAnnotations] = useState<SimAnnotation[]>([])
  const [showSimList, setShowSimList] = useState(true)
  const [selectedAnnotation, setSelectedAnnotation] = useState<SimAnnotation | null>(null)
  const [splitWidthPercentage, setSplitWidthPercentage] = useState<number>(60)
  const [isAnimationVisible, setIsAnimationVisible] = useState<boolean>(true)
  const [activeTab, setActiveTab] = useState<RightTab>('chat')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [notes, setNotes] = useState<NoteRecord[]>([])
  const notesUserId = useMemo(() => getNotesUserId(), [])
  const notesBookId = bookId || `local:${bookTitle || 'untitled'}`
  const chatInFlightRef = useRef(false)
  const chatAbortRef = useRef<AbortController | null>(null)
  const streamerRef = useRef<WordStreamer | null>(null)

  // Load annotations for the book into memory cache (KP-11 & Acceptance Gate 6)
  useEffect(() => {
    if (!bookId) return

    let isMounted = true

    simApiClient
      .fetchBookAnnotations(bookId)
      .then((annotations) => {
        if (isMounted) {
          setAllAnnotations(annotations)
        }
      })
      .catch((err) => {
        console.error('[ReaderRoute] Error fetching book annotations:', err)
      })

    return () => {
      isMounted = false
    }
  }, [bookId])

  useEffect(() => {
    let isMounted = true
    simApiClient
      .fetchNotes(notesBookId, notesUserId)
      .then((rows) => {
        if (isMounted) setNotes(rows)
      })
      .catch((err) => {
        console.error('[ReaderRoute] Error fetching notes:', err)
      })
    return () => {
      isMounted = false
    }
  }, [notesBookId, notesUserId])

  // Filter annotations for current page from cache
  const currentPageAnnotations = useMemo(() => {
    return allAnnotations.filter((a) => a.page_number === currentPage)
  }, [allAnnotations, currentPage])

  const syllabusTopics = useMemo(() => {
    const seen = new Set<string>()
    const topics: string[] = []
    const add = (value?: string) => {
      const text = value?.trim()
      if (!text) return
      const key = text.toLowerCase()
      if (seen.has(key)) return
      seen.add(key)
      topics.push(text)
    }
    for (const annotation of allAnnotations) {
      add(annotation.spec.title)
      add(annotation.spec.parentTopic)
      add(annotation.spec.subtitle)
    }
    return topics
  }, [allAnnotations])

  // If page changes and current selected annotation is not from this page, keep or clear
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    if (newPage !== pageTextPage) setPageText('')
    setFullPageImage(null)
  }

  const handlePageTextExtracted = (pageNumber: number, text: string) => {
    setPageTextPage(pageNumber)
    setPageText(text)
  }

  const handlePageImageCaptured = (pageNumber: number, dataUrl: string) => {
    if (pageNumber === currentPage) setFullPageImage(dataUrl)
  }

  const handleSnipCaptured = (dataUrl: string) => {
    setComposerImage(dataUrl)
    setActiveTab('chat')
  }

  const currentPageContext = pageTextPage === currentPage ? pageText : ''

  const handleSelectSimulation = (annotation: SimAnnotation) => {
    setSelectedAnnotation(annotation)
    setShowSimList(false)
    setActiveTab('sim')
  }

  const handleOpenSimList = () => {
    setActiveTab('sim')
    setShowSimList(true)
  }

  const handleFabClick = () => {
    if (activeTab === 'sim' && showSimList) {
      if (selectedAnnotation) {
        setShowSimList(false)
      } else {
        setActiveTab('chat')
      }
      return
    }
    handleOpenSimList()
  }

  const handleAnnotationAdded = (newAnnotation: SimAnnotation) => {
    setAllAnnotations((prev) => {
      const index = prev.findIndex((a) => a.id === newAnnotation.id)
      if (index >= 0) {
        const copy = [...prev]
        copy[index] = newAnnotation
        return copy
      }
      return [...prev, newAnnotation]
    })
  }

  const handleRegenerateCurrentSim = async () => {
    if (!selectedAnnotation) return
    const spec = selectedAnnotation.spec
    if (spec.templateId) return
    const result = await simApiClient.generateAiSimulation({
      prompt: spec.title,
      bookId,
      pageNumber: currentPage,
      annotationId: selectedAnnotation.id,
      existingSpec: spec,
    })
    const updatedAnn: SimAnnotation = {
      ...selectedAnnotation,
      spec: result.spec,
    }
    setSelectedAnnotation(updatedAnn)
    handleAnnotationAdded(updatedAnn)
  }

  const parentTopic = selectedAnnotation?.spec.parentTopic || bookTitle
  const domain = coerceDomain(selectedAnnotation?.spec.domain)

  const failLoadingMessage = (loadingId: string) => {
    setChatMessages((prev) =>
      prev.map((m) =>
        m.id === loadingId
          ? { ...m, isLoading: false, isError: true, content: CHAT_ERROR_CONTENT }
          : m
      )
    )
  }

  const handleSendChatMessage = async (text: string, image?: string) => {
    const explicitImage = image || composerImage
    const trimmed = composeOutgoingText(text, Boolean(explicitImage))
    if (!trimmed || isChatLoading || chatInFlightRef.current) return
    chatInFlightRef.current = true

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
      image: explicitImage || undefined,
    }
    const loadingId = crypto.randomUUID()
    const loadingMsg: ChatMessage = {
      id: loadingId,
      role: 'ai',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    }

    setChatMessages((prev) => [...prev, userMsg, loadingMsg])
    setIsChatLoading(true)
    setComposerImage(null)

    const abort = new AbortController()
    chatAbortRef.current = abort

    const recentHadImage = chatMessages.some((m) => m.role === 'user' && Boolean(m.image))
    const pageImage = resolveChatPageImage({
      question: trimmed,
      explicitImage,
      fullPageImage,
      recentHadImage,
    })
    const imageSource: ChatImageSource | undefined = explicitImage
      ? 'user'
      : pageImage
        ? 'auto'
        : undefined

    const streamer = createWordStreamer({
      onWord: (revealedText) => {
        setChatMessages((prev) =>
          prev.map((m) =>
            m.id === loadingId
              ? { ...m, isLoading: false, isStreaming: true, isError: false, content: revealedText }
              : m
          )
        )
      },
      wordDelayMs: 24,
    })
    streamerRef.current = streamer

    try {
      const result = await simApiClient.sendChatMessageStream(
        {
          messages: toChatApiMessages([...chatMessages, userMsg]),
          bookId,
          bookContext: {
            title: bookTitle,
            currentPage,
            parentTopic,
            domain,
            pageText: currentPageContext,
            pageImage,
            imageSource,
            recentHadImage,
            syllabusTopics,
            bookId,
          },
        },
        {
          signal: abort.signal,
          onDelta: (text) => {
            streamer.appendTarget(text)
          },
        }
      )
      const reply = result.reply?.trim()
      if (!reply) {
        streamer.cancel()
        failLoadingMessage(loadingId)
        return
      }

      await streamer.finish(reply)

      setChatMessages((prev) =>
        prev.map((m) =>
          m.id === loadingId
            ? {
                ...m,
                isLoading: false,
                isStreaming: false,
                isError: false,
                content: streamer.getRevealedText() || reply,
                relatedFormulas: result.relatedFormulas,
                keyTakeaways: result.keyTakeaways,
                llmPrompt: result.llmPrompt,
              }
            : m
        )
      )
    } catch (err) {
      streamer.cancel()
      if ((err as { name?: string })?.name === 'AbortError') return
      console.error('[ReaderRoute] Chat send failed:', err)
      failLoadingMessage(loadingId)
    } finally {
      if (streamerRef.current === streamer) streamerRef.current = null
      if (chatAbortRef.current === abort) chatAbortRef.current = null
      chatInFlightRef.current = false
      setIsChatLoading(false)
    }
  }

  const handleInjectToChat = async (selectedText: string, page: number, context: string) => {
    setActiveTab('chat')
    if (isChatLoading || chatInFlightRef.current) return
    chatInFlightRef.current = true

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: selectedText,
      timestamp: new Date(),
      sourceHighlight: { text: selectedText, page },
    }
    const loadingId = crypto.randomUUID()
    const loadingMsg: ChatMessage = {
      id: loadingId,
      role: 'ai',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    }

    setChatMessages((prev) => [...prev, userMsg, loadingMsg])
    setIsChatLoading(true)

    const streamer = createWordStreamer({
      onWord: (revealedText) => {
        setChatMessages((prev) =>
          prev.map((m) =>
            m.id === loadingId
              ? { ...m, isLoading: false, isStreaming: true, isError: false, content: revealedText }
              : m
          )
        )
      },
      wordDelayMs: 20,
    })
    streamerRef.current = streamer

    try {
      if (!bookId) throw new Error('No book is open')
      const result = await simApiClient.explainSelectionText({
        bookId,
        selectedText,
        surroundingContext: currentPageContext || context,
        pageText: currentPageContext || context,
        currentPage: page,
        parentTopic,
        domain,
        pageImage: fullPageImage || undefined,
      })
      const formatted = formatSelectionReply(result)
      await streamer.finish(formatted)

      setChatMessages((prev) =>
        prev.map((m) =>
          m.id === loadingId
            ? {
                ...m,
                isLoading: false,
                isStreaming: false,
                isError: false,
                content: streamer.getRevealedText() || formatted,
                relatedFormulas: result.relatedFormulas,
                keyTakeaways: result.keyTakeaways,
                conceptTitle: result.conceptTitle,
                selectedText,
                surroundingContext: context,
                llmPrompt: result.llmPrompt,
              }
            : m
        )
      )
    } catch (err) {
      streamer.cancel()
      console.error('[ReaderRoute] Highlight inject failed:', err)
      failLoadingMessage(loadingId)
    } finally {
      if (streamerRef.current === streamer) streamerRef.current = null
      chatInFlightRef.current = false
      setIsChatLoading(false)
    }
  }

  const handleStopStream = () => {
    streamerRef.current?.cancel()
    streamerRef.current = null
    chatAbortRef.current?.abort()
    chatAbortRef.current = null
    chatInFlightRef.current = false
    setIsChatLoading(false)
    // Mark the in-flight streaming message as done (not an error)
    setChatMessages((prev) =>
      prev.map((m) =>
        m.isStreaming || m.isLoading
          ? { ...m, isStreaming: false, isLoading: false }
          : m
      )
    )
  }

  const handleClearChat = () => {
    streamerRef.current?.cancel()
    streamerRef.current = null
    chatAbortRef.current?.abort()
    chatAbortRef.current = null
    chatInFlightRef.current = false
    setChatMessages([])
    setIsChatLoading(false)
    setComposerImage(null)
  }

  const handleAddNote = async (selectedText: string, page: number) => {
    setActiveTab('notes')
    try {
      const created = await simApiClient.createNote({
        bookId: notesBookId,
        userId: notesUserId,
        pageNumber: page,
        highlight: formatPdfSelectionText(selectedText),
        note: '',
      })
      setNotes((prev) => [created, ...prev.filter((n) => n.id !== created.id)])
    } catch (err) {
      console.error('[ReaderRoute] Failed to add note:', err)
    }
  }

  const handleAddBlankNote = () => {
    void handleAddNote('', currentPage)
  }

  const handleUpdateNote = async (noteId: string, patch: NotePatch) => {
    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteId ? { ...n, ...patch, updated_at: new Date().toISOString() } : n
      )
    )
    try {
      const updated = await simApiClient.updateNote(noteId, patch)
      setNotes((prev) => prev.map((n) => (n.id === noteId ? { ...n, ...updated } : n)))
    } catch (err) {
      if (typeof patch.starred !== 'boolean') {
        console.error('[ReaderRoute] Failed to update note:', err)
      }
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== noteId))
    try {
      await simApiClient.deleteNote(noteId)
    } catch (err) {
      console.error('[ReaderRoute] Failed to delete note:', err)
    }
  }

  const handleChatAboutSim = () => {
    if (!selectedAnnotation) return
    const prompt = buildSimExplainPrompt(selectedAnnotation.spec, selectedAnnotation.quote)
    setActiveTab('chat')
    void handleSendChatMessage(prompt)
  }

  const simTabContent =
    showSimList || !selectedAnnotation ? (
      <SimDrawer
        isOpen
        embedded
        annotations={currentPageAnnotations}
        pageNumber={currentPage}
        totalCount={allAnnotations.length}
        bookId={bookId}
        selectedAnnotationId={selectedAnnotation?.id || null}
        onSelectSimulation={handleSelectSimulation}
        onAnnotationAdded={handleAnnotationAdded}
      />
    ) : (
      <div className="sim-tab">
        <SimPanel
          spec={selectedAnnotation.spec}
          onClose={handleOpenSimList}
          onRegenerateWithAi={handleRegenerateCurrentSim}
          isAnimationVisible={isAnimationVisible}
          onToggleAnimation={() => setIsAnimationVisible((v) => !v)}
        >
          <ExplainPanel
            spec={selectedAnnotation.spec}
            quote={selectedAnnotation.quote}
            isSimAnimationVisible={isAnimationVisible}
            onToggleSimAnimation={() => setIsAnimationVisible((v) => !v)}
            onChatAboutSim={handleChatAboutSim}
          />
        </SimPanel>
      </div>
    )

  return (
    <div className="reader-layout">
      {/* Left: PDF Document View */}
      <div
        className="reader-pdf-container"
        style={{
          width: `${splitWidthPercentage}%`,
          transition: 'width 0.1s ease',
        }}
      >
        <PdfPane
          pdfSource={pdfSource}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onPageTextExtracted={handlePageTextExtracted}
          onPageImageCaptured={handlePageImageCaptured}
          onSnipCaptured={handleSnipCaptured}
          bookId={bookId}
          bookTitle={bookTitle}
        >
          <SimFAB
            count={currentPageAnnotations.length}
            onClick={handleFabClick}
            isOpen={activeTab === 'sim' && showSimList}
          />
        </PdfPane>
      </div>

      <SplitResizer
        onResize={(newWidth) => setSplitWidthPercentage(newWidth)}
        minPercentage={35}
        maxPercentage={75}
      />

      {/* Right: Chat / Sim / Notes workspace */}
      <div
        className="reader-sim-container"
        style={{
          width: `${100 - splitWidthPercentage}%`,
        }}
      >
        <RightPanel
          activeTab={activeTab}
          onTabChange={setActiveTab}
          chat={
            <ChatPane
              messages={chatMessages}
              isLoading={isChatLoading}
              bookTitle={bookTitle}
              attachedImage={composerImage}
              onAttachedImageChange={setComposerImage}
              onSendMessage={handleSendChatMessage}
              onClear={handleClearChat}
              onStop={handleStopStream}
            />
          }
          sim={simTabContent}
          notes={
            <NotebookPanel
              notes={notes}
              currentPage={currentPage}
              canAdd
              onAddBlank={handleAddBlankNote}
              onUpdate={handleUpdateNote}
              onDelete={handleDeleteNote}
              onGoToPage={handlePageChange}
            />
          }
        />
      </div>

      <TextSelectionExplainer
        currentPage={currentPage}
        onExplain={handleInjectToChat}
        onAddNote={handleAddNote}
      />
    </div>
  )
}
