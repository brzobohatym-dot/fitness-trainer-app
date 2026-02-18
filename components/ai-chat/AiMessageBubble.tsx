'use client'

interface AiMessageBubbleProps {
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
}

export default function AiMessageBubble({ role, content, isStreaming }: AiMessageBubbleProps) {
  const isUser = role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mr-2 mt-1">
          <AiSparklesIcon className="w-4 h-4 text-white" />
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-primary-600 text-white rounded-br-md'
            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md shadow-sm border border-gray-100 dark:border-gray-700'
        }`}
      >
        <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
          {renderSimpleMarkdown(content)}
          {isStreaming && (
            <span className="inline-block w-1.5 h-4 ml-0.5 bg-current animate-pulse rounded-sm" />
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Simple markdown renderer — bold, italic, code, lists.
 * Keeps it lightweight without pulling in a full markdown library.
 */
function renderSimpleMarkdown(text: string) {
  if (!text) return null

  const lines = text.split('\n')
  const elements: React.ReactNode[] = []

  lines.forEach((line, i) => {
    // Heading (### text)
    if (line.startsWith('### ')) {
      elements.push(<strong key={i} className="block text-base mt-2 mb-1">{line.slice(4)}</strong>)
      return
    }
    if (line.startsWith('## ')) {
      elements.push(<strong key={i} className="block text-base mt-2 mb-1">{line.slice(3)}</strong>)
      return
    }

    // Bullet list
    if (line.match(/^[-*]\s/)) {
      elements.push(
        <div key={i} className="flex gap-2 ml-2">
          <span className="text-gray-400 dark:text-gray-500">•</span>
          <span>{formatInlineMarkdown(line.slice(2))}</span>
        </div>
      )
      return
    }

    // Numbered list
    if (line.match(/^\d+\.\s/)) {
      const num = line.match(/^(\d+)\.\s/)![1]
      elements.push(
        <div key={i} className="flex gap-2 ml-2">
          <span className="text-gray-400 dark:text-gray-500 min-w-[1.2em]">{num}.</span>
          <span>{formatInlineMarkdown(line.replace(/^\d+\.\s/, ''))}</span>
        </div>
      )
      return
    }

    // Code block marker
    if (line.startsWith('```')) {
      // Skip code fence lines
      return
    }

    // Empty line = paragraph break
    if (line.trim() === '') {
      elements.push(<div key={i} className="h-2" />)
      return
    }

    // Normal line
    elements.push(<span key={i}>{formatInlineMarkdown(line)}{i < lines.length - 1 ? '\n' : ''}</span>)
  })

  return elements
}

/**
 * Format inline markdown: **bold**, *italic*, `code`
 */
function formatInlineMarkdown(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  let remaining = text
  let key = 0

  while (remaining.length > 0) {
    // Bold: **text**
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/)
    // Inline code: `text`
    const codeMatch = remaining.match(/`(.+?)`/)
    // Italic: *text*
    const italicMatch = remaining.match(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/)

    // Find the earliest match
    const matches = [
      boldMatch ? { type: 'bold', match: boldMatch } : null,
      codeMatch ? { type: 'code', match: codeMatch } : null,
      italicMatch ? { type: 'italic', match: italicMatch } : null,
    ].filter(Boolean).sort((a, b) => (a!.match.index || 0) - (b!.match.index || 0))

    if (matches.length === 0) {
      parts.push(remaining)
      break
    }

    const first = matches[0]!
    const idx = first.match.index!

    if (idx > 0) {
      parts.push(remaining.slice(0, idx))
    }

    if (first.type === 'bold') {
      parts.push(<strong key={key++}>{first.match[1]}</strong>)
    } else if (first.type === 'code') {
      parts.push(
        <code key={key++} className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">
          {first.match[1]}
        </code>
      )
    } else {
      parts.push(<em key={key++}>{first.match[1]}</em>)
    }

    remaining = remaining.slice(idx + first.match[0].length)
  }

  return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : parts
}

function AiSparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  )
}
