import { Editor } from '@tiptap/react'

interface WordCountProps {
  editor: Editor | null
  className?: string
}

export function WordCount({ editor, className = '' }: WordCountProps) {
  if (!editor) return null

  const text = editor.getText()
  const characters = text.replace(/\s/g, '').length
  const words = text.trim() ? text.trim().split(/\s+/).length : 0
  const paragraphs = editor
    .getJSON()
    .content?.filter((node) => node.type === 'paragraph' || node.type === 'heading').length ?? 0

  return (
    <div className={`word-count flex items-center gap-4 border-t border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-500 ${className}`}>
      <span>{characters.toLocaleString()} 字</span>
      <span>{words.toLocaleString()} 词</span>
      <span>{paragraphs.toLocaleString()} 段</span>
    </div>
  )
}
