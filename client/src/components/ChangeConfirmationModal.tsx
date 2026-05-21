import { useState } from 'react'
import { Check, X, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from './ui/Button'
import { Modal } from './ui/Modal'
import { DiffViewer, SideBySideDiff } from './DiffViewer'
import { ContentChange } from '@/types/ai-changes'

interface ChangeConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  changes: ContentChange[]
  onConfirm: (selectedChanges: string[]) => void
  onReject: () => void
  title?: string
}

export function ChangeConfirmationModal({
  isOpen,
  onClose,
  changes,
  onConfirm,
  onReject,
  title = 'AI 建议的修改'
}: ChangeConfirmationModalProps) {
  const [selectedChanges, setSelectedChanges] = useState<Set<string>>(
    new Set(changes.map(c => c.id))
  )
  const [expandedChanges, setExpandedChanges] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'inline' | 'side-by-side'>('inline')

  const toggleChange = (changeId: string) => {
    const newSelected = new Set(selectedChanges)
    if (newSelected.has(changeId)) {
      newSelected.delete(changeId)
    } else {
      newSelected.add(changeId)
    }
    setSelectedChanges(newSelected)
  }

  const toggleExpand = (changeId: string) => {
    const newExpanded = new Set(expandedChanges)
    if (newExpanded.has(changeId)) {
      newExpanded.delete(changeId)
    } else {
      newExpanded.add(changeId)
    }
    setExpandedChanges(newExpanded)
  }

  const selectAll = () => {
    setSelectedChanges(new Set(changes.map(c => c.id)))
  }

  const deselectAll = () => {
    setSelectedChanges(new Set())
  }

  const handleConfirm = () => {
    onConfirm(Array.from(selectedChanges))
    onClose()
  }

  const handleReject = () => {
    onReject()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="xl">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={selectAll}>
              全选
            </Button>
            <Button variant="ghost" size="sm" onClick={deselectAll}>
              取消全选
            </Button>
            <span className="text-sm text-gray-500">
              已选择 {selectedChanges.size}/{changes.length} 项
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'inline' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('inline')}
            >
              内联视图
            </Button>
            <Button
              variant={viewMode === 'side-by-side' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('side-by-side')}
            >
              并排视图
            </Button>
          </div>
        </div>

        <div className="space-y-3 max-h-[50vh] overflow-y-auto">
          {changes.map((change) => (
            <div
              key={change.id}
              className={`border rounded-lg transition-colors ${
                selectedChanges.has(change.id)
                  ? 'border-blue-300 bg-blue-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div
                className="flex items-center gap-3 p-3 cursor-pointer"
                onClick={() => toggleChange(change.id)}
              >
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    selectedChanges.has(change.id)
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}
                >
                  {selectedChanges.has(change.id) && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {change.description || `修改 ${change.id}`}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      change.type === 'replace' ? 'bg-yellow-100 text-yellow-700' :
                      change.type === 'insert' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {change.type === 'replace' ? '替换' :
                       change.type === 'insert' ? '插入' : '删除'}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleExpand(change.id)
                  }}
                >
                  {expandedChanges.has(change.id) ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {expandedChanges.has(change.id) && (
                <div className="px-3 pb-3 border-t border-gray-100">
                  <div className="mt-3">
                    {viewMode === 'inline' ? (
                      <DiffViewer
                        original={change.original}
                        suggested={change.suggested}
                        mode="words"
                      />
                    ) : (
                      <SideBySideDiff
                        original={change.original}
                        suggested={change.suggested}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={handleReject}>
            <X className="w-4 h-4 mr-1" />
            拒绝所有
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedChanges.size === 0}
          >
            <Check className="w-4 h-4 mr-1" />
            应用选中 ({selectedChanges.size})
          </Button>
        </div>
      </div>
    </Modal>
  )
}
