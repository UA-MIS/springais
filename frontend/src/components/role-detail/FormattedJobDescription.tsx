import { useMemo } from 'react'

interface FormattedJobDescriptionProps {
  text: string
  textColor: string
  headingColor: string
  mutedColor: string
}

interface DescriptionBlock {
  type: 'heading' | 'paragraph' | 'list'
  content: string
  items?: string[]
}

/**
 * Common section header patterns in job descriptions.
 * - Lines ending with colon: "Requirements:", "What You'll Do:"
 * - Short Title Case lines (<=60 chars, <=8 words, no sentence-ending punct): "About the Role"
 * - Markdown bold: "**Key Responsibilities**"
 * - Markdown hash: "## Overview"
 */
const HEADING_WITH_COLON = /^[A-Z][A-Za-z\s&'/,-]*:$/
const HEADING_TITLE_CASE = /^[A-Z][A-Za-z\s&'/,-]*[A-Za-z]$/
const HEADING_MARKDOWN_BOLD = /^\*\*[^*]+\*\*:?$/
const HEADING_MARKDOWN_HASH = /^#{1,3}\s+.+$/

/**
 * Bullet/list item patterns: lines starting with -, *, or numbered items (1., 2.)
 */
const LIST_ITEM_PATTERN = /^\s*(?:[-*]|\d+[.)]\s)/

function isHeading(line: string): boolean {
  const trimmed = line.trim()
  if (!trimmed || trimmed.length > 80) return false
  if (HEADING_WITH_COLON.test(trimmed)) return true
  if (HEADING_MARKDOWN_BOLD.test(trimmed)) return true
  if (HEADING_MARKDOWN_HASH.test(trimmed)) return true
  // Short Title Case lines (max 60 chars, max 8 words) without sentence punctuation
  if (trimmed.length <= 60 && HEADING_TITLE_CASE.test(trimmed)) {
    const wordCount = trimmed.split(/\s+/).length
    if (wordCount <= 8 && !/[.!?]/.test(trimmed)) return true
  }
  return false
}

function isListItem(line: string): boolean {
  return LIST_ITEM_PATTERN.test(line)
}

function cleanListItem(line: string): string {
  return line.trim().replace(/^\s*(?:[-*]|\d+[.)]\s)\s*/, '')
}

function cleanHeading(line: string): string {
  return line.trim()
    .replace(/^#{1,3}\s+/, '')  // Remove markdown headers
    .replace(/^\*\*|\*\*$/g, '')  // Remove bold markers
    .replace(/:$/, '')  // Remove trailing colon
}

/**
 * Known section-boundary phrases commonly found in job postings.
 * When the input has no newlines, we insert breaks before these phrases.
 */
const SECTION_BOUNDARIES = [
  'Location:',
  'The Opportunity',
  'Your key responsibilities',
  'Key Responsibilities',
  'Responsibilities',
  'Requirements',
  'Qualifications',
  'Skills and attributes',
  'To qualify',
  'What we look for',
  'What we offer',
  "What you'll do",
  "What you\u2019ll do",
  "What you'll need",
  "What you\u2019ll need",
  'About the role',
  'About us',
  'Benefits',
  'The base salary',
  'Learn more',
  'EY |',
  'Join us in',
  'Our expectation',
  'If you have a disability',
  'EY provides equal',
  'Apply today',
  'For those living in',
]

/**
 * Pre-processes continuous text (no newlines) by inserting line breaks
 * at detected section boundaries and long sentence runs.
 */
function preprocessContinuousText(text: string): string {
  const lineCount = text.split('\n').filter(l => l.trim()).length
  if (lineCount > 3) return text

  let processed = text

  // Insert double newlines before known section boundary phrases
  // Match ". <Phrase>" or start-of-string "<Phrase>"
  for (const phrase of SECTION_BOUNDARIES) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    // After sentence-ending punctuation + space
    const pattern = new RegExp(`([.!?])\\s+(${escaped})`, 'gi')
    processed = processed.replace(pattern, '$1\n\n$2')
  }

  // Split very long remaining paragraphs at sentence boundaries
  // After inserting section breaks, split any block > 800 chars
  const parts = processed.split('\n\n')
  const result: string[] = []
  for (const part of parts) {
    if (part.trim().length > 800) {
      // Split at sentence boundaries (". " followed by uppercase letter)
      const sentences = part.replace(/(\.\s)([A-Z])/g, '$1\n$2')
      result.push(sentences)
    } else {
      result.push(part)
    }
  }

  return result.join('\n\n')
}

/**
 * Parses a plain-text job description into structured blocks
 * for rendering with proper formatting.
 */
export function parseJobDescription(text: string): DescriptionBlock[] {
  if (!text) return []

  const preprocessed = preprocessContinuousText(text)
  const lines = preprocessed.split(/\n/)
  const blocks: DescriptionBlock[] = []
  let currentParagraph: string[] = []
  let currentList: string[] = []

  const flushParagraph = () => {
    const joined = currentParagraph.join(' ').trim()
    if (joined) {
      blocks.push({ type: 'paragraph', content: joined })
    }
    currentParagraph = []
  }

  const flushList = () => {
    if (currentList.length > 0) {
      blocks.push({ type: 'list', content: '', items: [...currentList] })
      currentList = []
    }
  }

  for (const line of lines) {
    const trimmed = line.trim()

    // Empty line: flush current buffers
    if (!trimmed) {
      flushList()
      flushParagraph()
      continue
    }

    // Heading detection
    if (isHeading(trimmed)) {
      flushList()
      flushParagraph()
      blocks.push({ type: 'heading', content: cleanHeading(trimmed) })
      continue
    }

    // List item detection
    if (isListItem(line)) {
      flushParagraph()
      currentList.push(cleanListItem(line))
      continue
    }

    // If we were building a list and hit a non-list line, flush the list
    if (currentList.length > 0) {
      flushList()
    }

    // Regular paragraph text
    currentParagraph.push(trimmed)
  }

  // Flush remaining
  flushList()
  flushParagraph()

  return blocks
}

export default function FormattedJobDescription({
  text,
  textColor,
  headingColor,
  mutedColor,
}: FormattedJobDescriptionProps) {
  const blocks = useMemo(() => parseJobDescription(text), [text])

  if (blocks.length === 0) return null

  return (
    <div className="space-y-4">
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'heading':
            return (
              <h4
                key={index}
                className="text-base font-semibold mt-2"
                style={{ color: headingColor }}
              >
                {block.content}
              </h4>
            )
          case 'list':
            return (
              <ul key={index} className="space-y-1.5 pl-4">
                {block.items?.map((item, i) => (
                  <li
                    key={i}
                    className="text-sm leading-relaxed flex items-start gap-2"
                    style={{ color: textColor }}
                  >
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: mutedColor }} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )
          case 'paragraph':
            return (
              <p
                key={index}
                className="text-sm leading-relaxed"
                style={{ color: textColor }}
              >
                {block.content}
              </p>
            )
          default:
            return null
        }
      })}
    </div>
  )
}
