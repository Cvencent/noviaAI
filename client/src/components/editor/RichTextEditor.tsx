import { forwardRef, useEffect, useImperativeHandle } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import CharacterCount from '@tiptap/extension-character-count'
import Highlight from '@tiptap/extension-highlight'
import Placeholder from '@tiptap/extension-placeholder'
import Typography from '@tiptap/extension-typography'
import { DiffHighlight, DiffRange } from './DiffHighlight'
import { EditorToolbar } from './EditorToolbar'
import { WordCount } from './WordCount'
import { Button } from '@/components/ui/Button'
import { CheckCheck, XCircle } from 'lucide-react'
import './editor.css'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
  autoFocus?: boolean
  onFocus?: () => void
  onBlur?: () => void
  onSelectionChange?: (selectedText: string) => void
  showDiffControls?: boolean
}

export interface RichTextEditorHandle {
  insertText: (text: string) => void
  focus: () => void
  setDiffHighlights: (diffs: DiffRange[]) => void
  clearDiffHighlights: () => void
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(function RichTextEditor({
  content,
  onChange,
  placeholder = '开始写作...',
  className = '',
  autoFocus = false,
  onFocus,
  onBlur,
  onSelectionChange,
  showDiffControls = false,
}, ref) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      CharacterCount,
      Highlight,
      Typography,
      DiffHighlight,
    ],
    content,
    autofocus: autoFocus,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    onFocus: () => onFocus?.(),
    onBlur: () => onBlur?.(),
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection
      onSelectionChange?.(editor.state.doc.textBetween(from, to, '\n'))
    },
  })

  useEffect(() => {
    if (!editor || editor.getHTML() === content) return
    editor.commands.setContent(content, { emitUpdate: false })
  }, [content, editor])

  useImperativeHandle(ref, () => ({
    insertText: (text: string) => {
      const html = escapeHtml(text).replace(/\n/g, '<br>')
      editor?.chain().focus().insertContent(html).run()
    },
    focus: () => {
      editor?.chain().focus().run()
    },
    setDiffHighlights: (diffs: DiffRange[]) => {
      editor?.chain().focus().setDiffHighlights(diffs).run()
    },
    clearDiffHighlights: () => {
      editor?.chain().focus().clearDiffHighlights().run()
    },
  }), [editor])

  const handleAcceptAll = () => {
    editor?.chain().focus().acceptAllDiffs().run()
  }

  const handleRejectAll = () => {
    editor?.chain().focus().rejectAllDiffs().run()
  }

  const hasDiffs = (editor?.storage as any)?.diffHighlight?.diffs?.length > 0

  if (!editor) return null

  return (
    <div className={`rich-text-editor ${className}`}>
      <EditorToolbar editor={editor} />
      <div className="editor-content">
        <EditorContent editor={editor} />
      </div>
      {showDiffControls && hasDiffs && (
        <div className="diff-controls">
          <Button variant="outline" size="sm" onClick={handleRejectAll}>
            <XCircle className="w-4 h-4 mr-1" />
            拒绝所有
          </Button>
          <Button size="sm" onClick={handleAcceptAll}>
            <CheckCheck className="w-4 h-4 mr-1" />
            接受所有
          </Button>
        </div>
      )}
      <WordCount editor={editor} />
    </div>
  )
})
