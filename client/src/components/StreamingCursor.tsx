interface StreamingCursorProps {
  isVisible: boolean
  className?: string
}

export function StreamingCursor({ isVisible, className = '' }: StreamingCursorProps) {
  if (!isVisible) return null

  return <span className={`streaming-cursor ${className}`} />
}
