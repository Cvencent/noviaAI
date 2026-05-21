import { Editor } from '@tiptap/react'
import {
  Bold,
  Code,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Quote,
  Redo,
  Strikethrough,
  Undo,
} from 'lucide-react'
import { Button } from '../ui/Button'

interface ToolbarButton {
  icon: typeof Bold
  label: string
  action: () => boolean
  active?: boolean
  disabled?: boolean
}

interface EditorToolbarProps {
  editor: Editor | null
  className?: string
}

export function EditorToolbar({ editor, className = '' }: EditorToolbarProps) {
  if (!editor) return null

  const groups: ToolbarButton[][] = [
    [
      {
        icon: Undo,
        label: '撤销',
        action: () => editor.chain().focus().undo().run(),
        disabled: !editor.can().undo(),
      },
      {
        icon: Redo,
        label: '重做',
        action: () => editor.chain().focus().redo().run(),
        disabled: !editor.can().redo(),
      },
    ],
    [
      {
        icon: Bold,
        label: '加粗',
        action: () => editor.chain().focus().toggleBold().run(),
        active: editor.isActive('bold'),
      },
      {
        icon: Italic,
        label: '斜体',
        action: () => editor.chain().focus().toggleItalic().run(),
        active: editor.isActive('italic'),
      },
      {
        icon: Strikethrough,
        label: '删除线',
        action: () => editor.chain().focus().toggleStrike().run(),
        active: editor.isActive('strike'),
      },
      {
        icon: Code,
        label: '行内代码',
        action: () => editor.chain().focus().toggleCode().run(),
        active: editor.isActive('code'),
      },
    ],
    [
      {
        icon: Heading1,
        label: '标题 1',
        action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
        active: editor.isActive('heading', { level: 1 }),
      },
      {
        icon: Heading2,
        label: '标题 2',
        action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        active: editor.isActive('heading', { level: 2 }),
      },
      {
        icon: Heading3,
        label: '标题 3',
        action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
        active: editor.isActive('heading', { level: 3 }),
      },
      {
        icon: Quote,
        label: '引用',
        action: () => editor.chain().focus().toggleBlockquote().run(),
        active: editor.isActive('blockquote'),
      },
      {
        icon: Code2,
        label: '代码块',
        action: () => editor.chain().focus().toggleCodeBlock().run(),
        active: editor.isActive('codeBlock'),
      },
    ],
    [
      {
        icon: List,
        label: '无序列表',
        action: () => editor.chain().focus().toggleBulletList().run(),
        active: editor.isActive('bulletList'),
      },
      {
        icon: ListOrdered,
        label: '有序列表',
        action: () => editor.chain().focus().toggleOrderedList().run(),
        active: editor.isActive('orderedList'),
      },
    ],
  ]

  return (
    <div className={`editor-toolbar flex flex-wrap items-center gap-1 border-b border-gray-200 bg-gray-50 p-2 ${className}`}>
      {groups.map((group, groupIndex) => (
        <div key={groupIndex} className="flex items-center gap-1 border-r border-gray-200 pr-2 last:border-r-0 last:pr-0">
          {group.map((item) => {
            const Icon = item.icon
            return (
              <Button
                key={item.label}
                type="button"
                variant="ghost"
                size="sm"
                onClick={item.action}
                disabled={item.disabled}
                className={`p-1.5 ${item.active ? 'bg-gray-200 text-gray-900' : 'text-gray-600'}`}
                title={item.label}
              >
                <Icon className="h-4 w-4" />
              </Button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
