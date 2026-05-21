import { useMemo } from 'react'
import { diffWords, diffLines, Change } from 'diff'

interface DiffViewerProps {
  original: string
  suggested: string
  mode?: 'words' | 'lines'
  className?: string
}

export function DiffViewer({ original, suggested, mode = 'words', className = '' }: DiffViewerProps) {
  const diffResult = useMemo(() => {
    if (mode === 'lines') {
      return diffLines(original, suggested)
    }
    return diffWords(original, suggested)
  }, [original, suggested, mode])

  const getChangeStyle = (change: Change): string => {
    if (change.added) {
      return 'bg-green-100 text-green-900'
    }
    if (change.removed) {
      return 'bg-red-100 text-red-900 line-through'
    }
    return ''
  }

  return (
    <div className={`diff-viewer font-mono text-sm leading-relaxed ${className}`}>
      {diffResult.map((part, index) => (
        <span
          key={index}
          className={`${getChangeStyle(part)} ${part.added || part.removed ? 'px-0.5 rounded' : ''}`}
        >
          {part.value}
        </span>
      ))}
    </div>
  )
}

interface SideBySideDiffProps {
  original: string
  suggested: string
  className?: string
}

export function SideBySideDiff({ original, suggested, className = '' }: SideBySideDiffProps) {
  return (
    <div className={`grid grid-cols-2 gap-4 ${className}`}>
      <div>
        <div className="text-xs font-medium text-gray-500 mb-2">原文</div>
        <div className="p-3 bg-red-50 rounded-lg border border-red-200 text-sm whitespace-pre-wrap">
          {original}
        </div>
      </div>
      <div>
        <div className="text-xs font-medium text-gray-500 mb-2">修改后</div>
        <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-sm whitespace-pre-wrap">
          {suggested}
        </div>
      </div>
    </div>
  )
}
