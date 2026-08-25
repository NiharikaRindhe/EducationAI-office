// web/src/features/pdf-simulator/utils/chatHelpers.ts

import { toKatexForLlm, type SimSpec } from '@sim/shared'
import type { SelectionExplanation } from '../api.js'
import type { ChatMessage } from '../types/chat.js'

const DOMAINS = ['physics', 'chemistry', 'math', 'general'] as const
export type ChatDomain = (typeof DOMAINS)[number]

export function formatSelectionReply(result: SelectionExplanation): string {
  const parts = [result.summary, ...result.detailedExplanation].filter(Boolean)
  if (result.realWorldExample) {
    parts.push(`**Everyday example:** ${result.realWorldExample}`)
  }
  return parts.join('\n\n')
}

function stripInnerDollars(inner: string): string {
  return inner.replace(/\$/g, '').trim()
}

/**
 * Models often nest delimiters ($$ $F=ma$ $$, \\( $F=ma$ \\)).
 * KaTeX then errors with: Can't use function '$' in math mode.
 */
export function flattenNestedDollars(text: string): string {
  let result = ''
  let i = 0
  const n = text.length

  while (i < n) {
    if (text[i] === '\\' && i + 1 < n) {
      result += text[i] + text[i + 1]
      i += 2
      continue
    }

    if (text.startsWith('$$', i)) {
      let j = i + 2
      let found = -1
      while (j < n - 1) {
        if (text[j] === '\\') {
          j += 2
          continue
        }
        if (text.startsWith('$$', j)) {
          found = j
          break
        }
        j += 1
      }
      if (found === -1) {
        result += '\\$\\$'
        i += 2
        continue
      }
      const inner = stripInnerDollars(text.slice(i + 2, found))
      if (inner) result += `$$${inner}$$`
      i = found + 2
      continue
    }

    if (text[i] === '$') {
      let j = i + 1
      let found = -1
      while (j < n) {
        if (text[j] === '\\') {
          j += 2
          continue
        }
        if (text[j] === '$') {
          found = j
          break
        }
        j += 1
      }
      if (found === -1) {
        result += '\\$'
        i += 1
        continue
      }
      const inner = stripInnerDollars(text.slice(i + 1, found))
      if (inner) result += `$${inner}$`
      i = found + 1
      continue
    }

    result += text[i]
    i += 1
  }

  return result
}

export function unwrapMathDelimiters(formula: string): string {
  let t = formula.trim()
  if (!t) return ''
  for (let k = 0; k < 6; k += 1) {
    const next = t
      .replace(/^\$\$([\s\S]*)\$\$$/, '$1')
      .replace(/^\$([\s\S]*)\$$/, '$1')
      .replace(/^\\\(([\s\S]*)\\\)$/, '$1')
      .replace(/^\\\[([\s\S]*)\\\]$/, '$1')
      .replace(/\$/g, '')
      .trim()
    if (next === t) break
    t = next
  }
  return t
}

/** Convert \(...\) / \[...\] / ```latex blocks into $ / $$ so KaTeX can render them. */
export function normalizeChatMath(text: string): string {
  const converted = text
    .replace(/```(?:latex|tex|math)\s*\n([\s\S]*?)```/gi, (_, inner: string) => `\n\n$$\n${stripInnerDollars(inner)}\n$$\n\n`)
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, inner: string) => `\n\n$$\n${stripInnerDollars(inner)}\n$$\n\n`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, inner: string) => {
      const body = stripInnerDollars(inner)
      return body ? `$${body}$` : ''
    })
  return flattenNestedDollars(converted)
}

export function formulaToMarkdown(formula: string): string {
  const unwrapped = unwrapMathDelimiters(formula)
  if (!unwrapped) return ''
  return `$$${unwrapped}$$`
}

export function getLastAiMessage(msgs: ChatMessage[]): ChatMessage | undefined {
  return [...msgs].reverse().find(
    (m) => m.role === 'ai' && !m.isLoading && !m.isError && Boolean(m.content)
  )
}

export function coerceDomain(value?: string): ChatDomain {
  if (value && (DOMAINS as readonly string[]).includes(value)) {
    return value as ChatDomain
  }
  return 'physics'
}

export function buildSimExplainPrompt(spec: SimSpec, quote?: string): string {
  const title = spec.title?.trim() || 'this simulation'
  const parts = [title]
  if (spec.subtitle?.trim()) parts.push(spec.subtitle.trim())
  if (spec.topicExplanation?.trim()) parts.push(spec.topicExplanation.trim())
  const excerpt = (quote || spec.quote || '').trim()
  if (excerpt) parts.push(`textbook: "${excerpt}"`)
  if (spec.equations && spec.equations.length > 0) {
    parts.push(`equations: ${spec.equations.join('; ')}`)
  }
  const inner = parts.join('. ')
  return `explain me (${inner})`
}

export function buildFollowupSpec(
  lastAi: ChatMessage,
  parentTopic: string,
  domain: ChatDomain
): SimSpec {
  const summary = lastAi.content.split('\n\n')[0] || lastAi.content
  return {
    version: '2.0',
    title: lastAi.conceptTitle || 'Follow-up',
    domain,
    isSimulatable: false,
    topicExplanation: summary,
    parentTopic,
    subtitle: summary,
    caption: '',
    quote: lastAi.selectedText || '',
    equations: lastAi.relatedFormulas || [],
    reasonIfNotSimulatable: '',
  }
}

export const CHAT_ERROR_CONTENT = 'Could not get a response. Please try again.'

export interface TextSection {
  heading: string | null
  body: string
}

export function splitMarkdownSections(markdown: string): TextSection[] {
  const text = markdown.replace(/\r\n/g, '\n').trim()
  if (!text) return []

  const headingRe = /^(#{1,3})\s+(.+)$/gm
  const matches = [...text.matchAll(headingRe)]
  if (matches.length === 0) {
    return [{ heading: null, body: text }]
  }

  const sections: TextSection[] = []
  const firstIdx = matches[0].index ?? 0
  if (firstIdx > 0) {
    const preamble = text.slice(0, firstIdx).trim()
    if (preamble) sections.push({ heading: null, body: preamble })
  }

  matches.forEach((match, i) => {
    const start = (match.index ?? 0) + match[0].length
    const end = i + 1 < matches.length ? (matches[i + 1].index ?? text.length) : text.length
    sections.push({
      heading: match[2].trim(),
      body: text.slice(start, end).trim(),
    })
  })

  return sections
}

export function sectionCopyText(section: TextSection): string {
  return [section.heading, section.body].filter(Boolean).join('\n\n')
}

export function aiMessageCopyText(message: ChatMessage): string {
  const parts: string[] = []
  if (message.content.trim()) parts.push(message.content.trim())
  if (message.relatedFormulas && message.relatedFormulas.length > 0) {
    parts.push(message.relatedFormulas.map((f) => f.trim()).filter(Boolean).join('\n'))
  }
  if (message.keyTakeaways && message.keyTakeaways.length > 0) {
    parts.push(message.keyTakeaways.map((item) => `• ${item.trim()}`).join('\n'))
  }
  return parts.join('\n\n')
}

export function toChatApiMessages(msgs: ChatMessage[]): Array<{ role: 'user' | 'assistant'; content: string }> {
  return msgs
    .filter((m) => !m.isLoading && !m.isError && Boolean(m.content?.trim()))
    .map((m) => {
      if (m.role === 'ai') {
        return { role: 'assistant' as const, content: m.content.trim() }
      }
      if (m.role === 'system') {
        const page = m.sourceHighlight?.page
        const text = (m.sourceHighlight?.text || m.content).trim()
        const prefix = typeof page === 'number' ? `[PDF highlight, page ${page}] ` : '[PDF highlight] '
        return { role: 'user' as const, content: `${prefix}${toKatexForLlm(text)}` }
      }
      return { role: 'user' as const, content: toKatexForLlm(m.content.trim()) }
    })
}
