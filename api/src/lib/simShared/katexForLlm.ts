// shared/katexForLlm.ts
// Convert textbook/PDF math into KaTeX so the LLM sees unambiguous equations.

const SUPER: Record<string, string> = {
  '⁰': '0',
  '¹': '1',
  '²': '2',
  '³': '3',
  '⁴': '4',
  '⁵': '5',
  '⁶': '6',
  '⁷': '7',
  '⁸': '8',
  '⁹': '9',
  '⁺': '+',
  '⁻': '-',
  '⁼': '=',
  'ⁿ': 'n',
  'ⁱ': 'i',
}

const SUB: Record<string, string> = {
  '₀': '0',
  '₁': '1',
  '₂': '2',
  '₃': '3',
  '₄': '4',
  '₅': '5',
  '₆': '6',
  '₇': '7',
  '₈': '8',
  '₉': '9',
  '₊': '+',
  '₋': '-',
  '₌': '=',
  'ₐ': 'a',
  'ₑ': 'e',
  'ₕ': 'h',
  'ᵢ': 'i',
  'ⱼ': 'j',
  'ₖ': 'k',
  'ₗ': 'l',
  'ₘ': 'm',
  'ₙ': 'n',
  'ₒ': 'o',
  'ₚ': 'p',
  'ᵣ': 'r',
  'ₛ': 's',
  'ₜ': 't',
  'ₓ': 'x',
}

const GREEK: Record<string, string> = {
  α: '\\alpha',
  β: '\\beta',
  γ: '\\gamma',
  δ: '\\delta',
  ε: '\\varepsilon',
  ζ: '\\zeta',
  η: '\\eta',
  θ: '\\theta',
  ι: '\\iota',
  κ: '\\kappa',
  λ: '\\lambda',
  μ: '\\mu',
  µ: '\\mu',
  ν: '\\nu',
  ξ: '\\xi',
  π: '\\pi',
  ρ: '\\rho',
  σ: '\\sigma',
  τ: '\\tau',
  υ: '\\upsilon',
  φ: '\\phi',
  χ: '\\chi',
  ψ: '\\psi',
  ω: '\\omega',
  Γ: '\\Gamma',
  Δ: '\\Delta',
  Θ: '\\Theta',
  Λ: '\\Lambda',
  Ξ: '\\Xi',
  Π: '\\Pi',
  Σ: '\\Sigma',
  Φ: '\\Phi',
  Ψ: '\\Psi',
  Ω: '\\Omega',
}

const SYMBOLS: Record<string, string> = {
  '×': '\\times',
  '÷': '\\div',
  '·': '\\cdot',
  '∙': '\\cdot',
  '−': '-',
  '–': '-',
  '√': '\\sqrt',
  '∞': '\\infty',
  '≤': '\\leq',
  '≥': '\\geq',
  '≠': '\\neq',
  '≈': '\\approx',
  '∝': '\\propto',
  '±': '\\pm',
  '→': '\\rightarrow',
  '←': '\\leftarrow',
  '⇒': '\\Rightarrow',
  '∈': '\\in',
  '∑': '\\sum',
  '∫': '\\int',
  '∂': '\\partial',
  '∇': '\\nabla',
  '∠': '\\angle',
  '°': '^{\\circ}',
  'ℏ': '\\hbar',
  'ℓ': '\\ell',
  '½': '\\frac{1}{2}',
  '⅓': '\\frac{1}{3}',
  '⅔': '\\frac{2}{3}',
  '¼': '\\frac{1}{4}',
  '¾': '\\frac{3}{4}',
}

const MATH_FNS = new Set([
  'sin',
  'cos',
  'tan',
  'cot',
  'sec',
  'csc',
  'log',
  'ln',
  'exp',
  'lim',
  'max',
  'min',
  'det',
  'arg',
  'sinh',
  'cosh',
  'tanh',
])

const STOP_WORDS = new Set([
  'and',
  'the',
  'for',
  'are',
  'but',
  'not',
  'its',
  'this',
  'that',
  'with',
  'from',
  'into',
  'when',
  'then',
  'than',
  'also',
  'such',
  'each',
  'both',
  'onto',
  'over',
  'is',
  'as',
  'of',
  'in',
  'on',
  'to',
  'or',
  'if',
  'by',
  'an',
  'we',
  'it',
  'be',
  'formula',
  'equation',
  'where',
  'which',
  'called',
  'using',
  'given',
  'hence',
  'thus',
  'shows',
  'states',
  'gives',
])

const MATH_SPLIT = /(\$\$[\s\S]*?\$\$|\$[^$\n]+\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g

function replaceCharMap(input: string, map: Record<string, string>): string {
  let out = ''
  for (const ch of input) {
    out += map[ch] ?? ch
  }
  return out
}

function collapseScriptRuns(input: string, map: Record<string, string>, wrap: (inner: string) => string): string {
  const chars = Object.keys(map)
    .map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('')
  if (!chars) return input
  return input.replace(new RegExp(`[${chars}]+`, 'g'), (run) => wrap(replaceCharMap(run, map)))
}

export function unicodeMathToLatex(input: string): string {
  let out = collapseScriptRuns(input, SUPER, (inner) => `^{${inner}}`)
  out = collapseScriptRuns(out, SUB, (inner) => `_{${inner}}`)
  let greekOut = ''
  for (let i = 0; i < out.length; i++) {
    const cmd = GREEK[out[i]!] // i is bounded by the loop condition above
    if (cmd) {
      const next = out[i + 1]
      greekOut += next && /[A-Za-z]/.test(next) ? `${cmd} ` : cmd
      continue
    }
    greekOut += out[i]
  }
  out = replaceCharMap(greekOut, SYMBOLS)
  out = out.replace(/√\s*\(([^)]+)\)/g, '\\sqrt{$1}')
  out = out.replace(/√\s*([A-Za-z0-9]+(?:_\{[^}]+\}|_\w+|[\^]\{[^}]+\}|\^\w+)?)/g, '\\sqrt{$1}')
  return out
}

function isMathFragmentLine(line: string): boolean {
  const t = line.trim()
  if (!t || t.length > 28) return false
  if (countLongEnglish(t) >= 1) return false
  if (t.length <= 3 && /[πΠθΘφαβγλμσωΔ°×÷+\-/=]/.test(t)) return true
  if (/^\d+°?$/.test(t)) return true
  return /^[\dA-Za-zπΠθΘφαβγλμσωΔ×÷·°+\-/=()\\{}^_ ]+$/.test(t) && /[πθ°×÷=+\-/\\]/.test(t)
}

function endsWithMathOperator(line: string): boolean {
  return /[×+\-/=*^]$/.test(line.trim())
}

/** Rejoin stacked PDF pastes such as `2πr ×\\nθ\\n360°` → `2πr × θ/360°`. */
export function joinStackedPdfMath(text: string): string {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const out: string[] = []
  for (const line of lines) {
    const t = line.trim()
    if (!t) {
      out.push('')
      continue
    }
    if (out.length > 0 && isMathFragmentLine(t)) {
      const prev = out[out.length - 1]! // guarded by out.length > 0 above
      const prevT = prev.trim()
      const isDenom = /^\d+°?$/.test(t)
      const prevEndsWithIdent = /[A-Za-zπΠθΘφαβγλμσω)]$/.test(prevT)
      const canJoin =
        isMathFragmentLine(prevT) ||
        endsWithMathOperator(prevT) ||
        (isDenom && prevEndsWithIdent)
      if (canJoin) {
        if (/^\d+°?$/.test(t) && /[A-Za-zπΠθΘφαβγλμσω)]$/.test(prevT)) {
          out[out.length - 1] = `${prevT}/${t}`
        } else {
          out[out.length - 1] = `${prevT} ${t}`
        }
        continue
      }
    }
    out.push(line)
  }
  return out.join('\n')
}

function wrapBareLatexExpr(line: string): string {
  if (line.includes('$')) return line
  const re = /(?:\d+\s*)?\\[A-Za-z]+/g
  let start = -1
  let match: RegExpExecArray | null
  while ((match = re.exec(line))) {
    const prev = line[match.index - 1]
    if (prev === '{' || prev === '^') continue
    start = match.index
    break
  }
  if (start < 0) return line
  let end = start
  while (end < line.length && /[A-Za-z0-9\\{}()[\]^_+\-/=.*,\s]/.test(line[end]!)) end += 1
  const span = line.slice(start, end).replace(/(?:\s+[A-Za-z]{3,})+$/g, '').trimEnd()
  if (span.length < 3 || !/\\/.test(span)) return line
  if (countLongEnglish(span) >= 2) return line
  return `${line.slice(0, start)}$${prepareEquationBody(span)}$${line.slice(start + span.length)}`
}

function prepareEquationBody(raw: string): string {
  let out = unicodeMathToLatex(raw.trim())
  out = out.replace(
    /(?<!\\)\b(sin|cos|tan|cot|sec|csc|log|ln|exp|lim|max|min|det|arg|sinh|cosh|tanh)\b/g,
    '\\$1'
  )
  out = out.replace(/\bsqrt\s*\(\s*([^)]+?)\s*\)/gi, '\\sqrt{$1}')
  out = out.replace(
    /(?<![A-Za-z\\])((?:\\[A-Za-z]+(?:\{[^}]+\})?|[A-Za-z0-9]+(?:_\{[^}]+\}|_\w+|\^\{[^}]+\}|\^\w+)?))\s*\/\s*((?:\\[A-Za-z]+(?:\{[^}]+\})?|[A-Za-z0-9]+(?:_\{[^}]+\}|_\w+|\^\{[^}]+\}|\^\w+)?))/g,
    '\\frac{$1}{$2}'
  )
  out = out.replace(/([A-Za-z0-9}])\^([A-Za-z0-9+-]+)(?![A-Za-z0-9{])/g, '$1^{$2}')
  out = out.replace(/([A-Za-z0-9}])_([A-Za-z0-9]+)(?![A-Za-z0-9{])/g, '$1_{$2}')
  return out.replace(/[ \t]+/g, ' ').trim()
}

function isMathToken(tok: string): boolean {
  const t = tok.trim()
  if (!t) return false
  const bare = t.replace(/^\\/, '').toLowerCase()
  if (MATH_FNS.has(bare) || STOP_WORDS.has(bare)) return MATH_FNS.has(bare)
  if (/^\\[A-Za-z]+(?:\{[^}]+\})?$/.test(t)) return true
  if (/^[+\-*/=≈()]+$/.test(t)) return true
  if (/^\\frac\{/.test(t)) return true
  if (/^\d+(\.\d+)?$/.test(t)) return true
  if (/^[A-Za-z][A-Za-z0-9]*$/.test(t) && t.length <= 4 && !STOP_WORDS.has(t.toLowerCase())) return true
  if (/^[A-Za-z0-9]+([_/^]\{?[\w+-]+\}?)+$/.test(t)) return true
  if (/^\\sqrt/.test(t)) return true
  return false
}

function countLongEnglish(text: string): number {
  const words = [...text.matchAll(/(?<![\\{])\b[A-Za-z]{4,}\b/g)].map((m) => m[0])
  return words.filter((w) => !MATH_FNS.has(w.toLowerCase()) && !STOP_WORDS.has(w.toLowerCase())).length
}

export function looksLikeMathLine(line: string): boolean {
  const t = line.trim()
  if (t.length < 3 || t.length > 240) return false
  if (t.startsWith('$')) return false
  const hasEq = /[=≈]/.test(t)
  const hasFrac = /[A-Za-z0-9]\s*\/\s*[A-Za-z0-9]/.test(t) || t.includes('\\frac')
  const hasOp = /[+\-×*^_]/.test(t) || t.includes('\\times')
  if (countLongEnglish(t) >= 1) return false
  if (hasEq && (hasFrac || hasOp || /[A-Za-z\\]\s*[=≈]/.test(t))) return true
  if (hasFrac && hasOp) return true
  return false
}

function wrapLineIfMath(line: string): string {
  const trimmed = line.trim()
  if (!trimmed || trimmed.includes('$')) return line
  if (looksLikeMathLine(trimmed)) {
    const lead = line.match(/^\s*/)?.[0] ?? ''
    const trail = line.match(/\s*$/)?.[0] ?? ''
    return `${lead}$${prepareEquationBody(trimmed)}$${trail}`
  }
  const withEq = wrapInlineEquations(line)
  if (withEq !== line) return withEq
  return wrapBareLatexExpr(line)
}

function wrapInlineEquations(line: string): string {
  if (!/[=≈]/.test(line) || line.includes('$')) return line
  const parts = line.split(/(\s+|(?<!\d)[.,;:!?]+(?!\d))/)
  const eqIdx: number[] = []
  parts.forEach((part, i) => {
    if (part === '=' || part === '≈') eqIdx.push(i)
  })
  if (eqIdx.length === 0) {
    // equals glued to tokens: F=ma
    return line.replace(
      /(?<!\$)\b([A-Za-z\\][A-Za-z0-9_{}\\^]*\s*=\s*[A-Za-z0-9\\{}^_+\-/*\s]{1,60}?)(?=\s+(?:and|or|the|is|are|was|when|which|that|this|with|from|for|to|then|so|because)\b|[.,;:!?)](?:\s|$)|$)/gi,
      (match) => {
        if (countLongEnglish(match) > 2) return match
        return `$${prepareEquationBody(match)}$`
      }
    )
  }

  const wrap = new Array(parts.length).fill(false)
  for (const i of eqIdx) {
    wrap[i] = true
    for (let L = i - 1; L >= 0; L--) {
      if (/^\s+$/.test(parts[L]!)) {
        wrap[L] = true
        continue
      }
      if (isMathToken(parts[L]!)) wrap[L] = true
      else break
    }
    for (let R = i + 1; R < parts.length; R++) {
      if (/^\s+$/.test(parts[R]!)) {
        wrap[R] = true
        continue
      }
      if (isMathToken(parts[R]!)) wrap[R] = true
      else break
    }
  }

  let out = ''
  let i = 0
  while (i < parts.length) {
    if (!wrap[i]) {
      out += parts[i]
      i += 1
      continue
    }
    let j = i
    while (j < parts.length && wrap[j]) j += 1
    const snippet = parts.slice(i, j).join('').trim()
    if (snippet.length >= 3 && /[=≈]/.test(snippet)) {
      const leadSpace = /^\s+$/.test(parts[i]!) ? parts[i] : ''
      const trailSpace = j > i && /^\s+$/.test(parts[j - 1]!) ? parts[j - 1] : ''
      const inner = parts
        .slice(leadSpace ? i + 1 : i, trailSpace ? j - 1 : j)
        .join('')
        .trim()
      out += `${leadSpace}$${prepareEquationBody(inner || snippet)}$${trailSpace}`
    } else {
      out += parts.slice(i, j).join('')
    }
    i = j
  }
  return out
}

function convertPlainRegion(plain: string): string {
  const joined = joinStackedPdfMath(plain)
  const withUnicode = unicodeMathToLatex(joined)
  return withUnicode
    .split('\n')
    .map((line) => wrapLineIfMath(line))
    .join('\n')
}

/**
 * Turn PDF/chat math into KaTeX ($...$ with LaTeX inside) for the LLM.
 * Already-delimited math is left as math; conversion is idempotent.
 */
export function toKatexForLlm(text?: string): string {
  if (!text) return text || ''
  const parts = text.split(MATH_SPLIT)
  return parts
    .map((part, idx) => {
      if (!part) return part
      const isMath = idx % 2 === 1
      if (!isMath) return convertPlainRegion(part)
      if (part.startsWith('$$') && part.endsWith('$$')) {
        return `$$${prepareEquationBody(part.slice(2, -2))}$$`
      }
      if (part.startsWith('$') && part.endsWith('$')) {
        return `$${prepareEquationBody(part.slice(1, -1))}$`
      }
      if (part.startsWith('\\[') && part.endsWith('\\]')) {
        return `$$${prepareEquationBody(part.slice(2, -2))}$$`
      }
      if (part.startsWith('\\(') && part.endsWith('\\)')) {
        return `$${prepareEquationBody(part.slice(2, -2))}$`
      }
      return part
    })
    .join('')
}
