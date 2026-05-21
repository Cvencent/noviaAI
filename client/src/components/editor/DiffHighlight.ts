import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

export interface DiffHighlightOptions {
  className?: string
}

export interface DiffRange {
  from: number
  to: number
  type: 'addition' | 'deletion'
  id: string
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    diffHighlight: {
      setDiffHighlights: (diffs: DiffRange[]) => ReturnType
      clearDiffHighlights: () => ReturnType
      acceptDiff: (id: string) => ReturnType
      rejectDiff: (id: string) => ReturnType
      acceptAllDiffs: () => ReturnType
      rejectAllDiffs: () => ReturnType
    }
  }
}

const diffHighlightPluginKey = new PluginKey('diffHighlight')

export const DiffHighlight = Extension.create<DiffHighlightOptions>({
  name: 'diffHighlight',

  addOptions() {
    return {
      className: 'diff-highlight',
    }
  },

  addStorage() {
    return {
      diffs: [] as DiffRange[],
    }
  },

  addCommands() {
    return {
      setDiffHighlights:
        (diffs: DiffRange[]) =>
        ({ editor }) => {
          const storage = editor.storage as any
          storage.diffHighlight.diffs = diffs
          const tr = editor.state.tr
          tr.setMeta('diffHighlight', true)
          editor.view.dispatch(tr)
          return true
        },
      clearDiffHighlights:
        () =>
        ({ editor }) => {
          const storage = editor.storage as any
          storage.diffHighlight.diffs = []
          const tr = editor.state.tr
          tr.setMeta('diffHighlight', true)
          editor.view.dispatch(tr)
          return true
        },
      acceptDiff:
        (id: string) =>
        ({ editor }) => {
          const storage = editor.storage as any
          const diffs = storage.diffHighlight.diffs as DiffRange[]
          const diff = diffs.find((d: DiffRange) => d.id === id)
          if (!diff) return false

          if (diff.type === 'addition') {
            const text = editor.state.doc.textBetween(diff.from, diff.to)
            editor.chain()
              .deleteRange({ from: diff.from, to: diff.to })
              .insertContentAt(diff.from, text)
              .run()
          } else {
            editor.chain()
              .deleteRange({ from: diff.from, to: diff.to })
              .run()
          }

          storage.diffHighlight.diffs = diffs.filter((d: DiffRange) => d.id !== id)
          const tr = editor.state.tr
          tr.setMeta('diffHighlight', true)
          editor.view.dispatch(tr)
          return true
        },
      rejectDiff:
        (id: string) =>
        ({ editor }) => {
          const storage = editor.storage as any
          const diffs = storage.diffHighlight.diffs as DiffRange[]
          const diff = diffs.find((d: DiffRange) => d.id === id)
          if (!diff) return false

          if (diff.type === 'deletion') {
            const text = editor.state.doc.textBetween(diff.from, diff.to)
            editor.chain()
              .deleteRange({ from: diff.from, to: diff.to })
              .insertContentAt(diff.from, text)
              .run()
          } else {
            editor.chain()
              .deleteRange({ from: diff.from, to: diff.to })
              .run()
          }

          storage.diffHighlight.diffs = diffs.filter((d: DiffRange) => d.id !== id)
          const tr = editor.state.tr
          tr.setMeta('diffHighlight', true)
          editor.view.dispatch(tr)
          return true
        },
      acceptAllDiffs:
        () =>
        ({ editor }) => {
          const storage = editor.storage as any
          const diffs = storage.diffHighlight.diffs as DiffRange[]
          const additions = diffs.filter((d: DiffRange) => d.type === 'addition')

          for (const diff of additions.reverse()) {
            const text = editor.state.doc.textBetween(diff.from, diff.to)
            editor.chain()
              .deleteRange({ from: diff.from, to: diff.to })
              .insertContentAt(diff.from, text)
              .run()
          }

          storage.diffHighlight.diffs = []
          const tr = editor.state.tr
          tr.setMeta('diffHighlight', true)
          editor.view.dispatch(tr)
          return true
        },
      rejectAllDiffs:
        () =>
        ({ editor }) => {
          const storage = editor.storage as any
          const diffs = storage.diffHighlight.diffs as DiffRange[]
          const deletions = diffs.filter((d: DiffRange) => d.type === 'deletion')

          for (const diff of deletions.reverse()) {
            const text = editor.state.doc.textBetween(diff.from, diff.to)
            editor.chain()
              .deleteRange({ from: diff.from, to: diff.to })
              .insertContentAt(diff.from, text)
              .run()
          }

          storage.diffHighlight.diffs = []
          const tr = editor.state.tr
          tr.setMeta('diffHighlight', true)
          editor.view.dispatch(tr)
          return true
        },
    }
  },

  addProseMirrorPlugins() {
    const extension = this

    return [
      new Plugin({
        key: diffHighlightPluginKey,
        props: {
          decorations(state) {
            const storage = extension.storage as any
            const diffs = storage.diffs as DiffRange[]
            if (!diffs || diffs.length === 0) return DecorationSet.empty

            const decorations: Decoration[] = []

            for (const diff of diffs) {
              if (diff.type === 'addition') {
                decorations.push(
                  Decoration.inline(diff.from, diff.to, {
                    class: 'diff-addition',
                    'data-diff-id': diff.id,
                  })
                )
              } else if (diff.type === 'deletion') {
                decorations.push(
                  Decoration.inline(diff.from, diff.to, {
                    class: 'diff-deletion',
                    'data-diff-id': diff.id,
                  })
                )
              }
            }

            return DecorationSet.create(state.doc, decorations)
          },
        },
      }),
    ]
  },
})

export default DiffHighlight
