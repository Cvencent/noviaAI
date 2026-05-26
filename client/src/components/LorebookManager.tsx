import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search, BookOpen, MapPin, Sword, Sparkles, Users, Building2, X } from 'lucide-react'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Select } from './ui/Select'
import { Modal } from './ui/Modal'
import { Card } from './ui/Card'
import { DeleteConfirmModal } from './DeleteConfirmModal'
import { lorebookApi, LoreEntry } from '../api/enhanced-writing'

interface LorebookManagerProps {
  projectId: string
}

const CATEGORIES = [
  { value: 'character', label: '人物', icon: <Users className="w-4 h-4" /> },
  { value: 'location', label: '地点', icon: <MapPin className="w-4 h-4" /> },
  { value: 'item', label: '物品', icon: <Sword className="w-4 h-4" /> },
  { value: 'magic', label: '魔法', icon: <Sparkles className="w-4 h-4" /> },
  { value: 'organization', label: '组织', icon: <Building2 className="w-4 h-4" /> },
  { value: 'other', label: '其他', icon: <BookOpen className="w-4 h-4" /> },
]

export function LorebookManager({ projectId }: LorebookManagerProps) {
  const [entries, setEntries] = useState<LoreEntry[]>([])
  const [filteredEntries, setFilteredEntries] = useState<LoreEntry[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<LoreEntry | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; entryId: string; entryName: string }>({ isOpen: false, entryId: '', entryName: '' })

  useEffect(() => {
    loadEntries()
  }, [projectId])

  useEffect(() => {
    let filtered = entries
    if (searchTerm) {
      filtered = filtered.filter(entry =>
        entry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.keywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }
    if (selectedCategory) {
      filtered = filtered.filter(entry => entry.category === selectedCategory)
    }
    setFilteredEntries(filtered)
  }, [entries, searchTerm, selectedCategory])

  const loadEntries = async () => {
    setIsLoading(true)
    try {
      const data = await lorebookApi.getEntries(projectId)
      setEntries(data)
    } catch (error) {
      console.error('加载Lore条目失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (entryId: string, entryName: string) => {
    setDeleteModal({ isOpen: true, entryId, entryName })
  }

  const handleConfirmDelete = async () => {
    if (!deleteModal.entryId) return
    try {
      await lorebookApi.deleteEntry(deleteModal.entryId)
      setEntries(entries.filter(e => e.id !== deleteModal.entryId))
    } catch (error) {
      console.error('删除失败:', error)
    } finally {
      setDeleteModal({ isOpen: false, entryId: '', entryName: '' })
    }
  }

  const handleSave = async (data: Omit<LoreEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingEntry) {
        const updated = await lorebookApi.updateEntry(editingEntry.id, data)
        setEntries(entries.map(e => e.id === updated.id ? updated : e))
      } else {
        const created = await lorebookApi.createEntry(projectId, data)
        setEntries([created, ...entries])
      }
      setIsCreateModalOpen(false)
      setEditingEntry(null)
    } catch (error) {
      console.error('保存失败:', error)
    }
  }

  const getCategoryInfo = (category: string) => {
    return CATEGORIES.find(c => c.value === category) || CATEGORIES[5]
  }

  return (
    <div className="h-full bg-[var(--bg-primary)] flex flex-col">
      {/* 头部工具栏 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            Lorebook 设定簿
          </h2>
          <Button onClick={() => {
            setEditingEntry(null)
            setIsCreateModalOpen(true)
          }}>
            <Plus className="w-4 h-4 mr-2" />
            新建条目
          </Button>
        </div>

        {/* 搜索和筛选 */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="搜索条目名称、描述或关键词..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="w-40">
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">全部分类</option>
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {/* 条目列表 */}
      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">加载中...</div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>暂无设定条目</p>
            <p className="text-sm">点击上方按钮创建第一个条目</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredEntries.map((entry) => {
              const categoryInfo = getCategoryInfo(entry.category)
              return (
                <Card key={entry.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        entry.category === 'character' ? 'bg-purple-100 text-purple-600' :
                        entry.category === 'location' ? 'bg-green-100 text-green-600' :
                        entry.category === 'item' ? 'bg-orange-100 text-orange-600' :
                        entry.category === 'magic' ? 'bg-blue-100 text-blue-600' :
                        entry.category === 'organization' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {categoryInfo.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{entry.name}</h3>
                          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                            {categoryInfo.label}
                          </span>
                          <span className="text-xs text-gray-400">
                            优先级: {entry.priority}
                          </span>
                          {!entry.isActive && (
                            <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded">
                              停用
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{entry.description}</p>
                        {entry.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {entry.keywords.slice(0, 5).map((keyword, i) => (
                              <span key={i} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                                {keyword}
                              </span>
                            ))}
                            {entry.keywords.length > 5 && (
                              <span className="text-xs text-gray-400">
                                +{entry.keywords.length - 5}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingEntry(entry)
                          setIsCreateModalOpen(true)
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(entry.id, entry.name)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* 创建/编辑弹窗 */}
      <LoreEntryModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false)
          setEditingEntry(null)
        }}
        onSave={handleSave}
        initialData={editingEntry}
      />

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, entryId: '', entryName: '' })}
        onConfirm={handleConfirmDelete}
        title={`确定要删除条目「${deleteModal.entryName}」吗？`}
        message="删除后将无法恢复，请谨慎操作"
      />
    </div>
  )
}

interface LoreEntryModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: Omit<LoreEntry, 'id' | 'createdAt' | 'updatedAt'>) => void
  initialData?: LoreEntry | null
}

function LoreEntryModal({ isOpen, onClose, onSave, initialData }: LoreEntryModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'character',
    description: '',
    content: '',
    keywords: [] as string[],
    keywordInput: '',
    priority: 50,
    isActive: true,
    order: 0,
    triggerCondition: '',
    relatedCharacterIds: [] as string[],
    relatedLocationIds: [] as string[],
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        category: initialData.category,
        description: initialData.description,
        content: initialData.content || '',
        keywords: initialData.keywords || [],
        keywordInput: '',
        priority: initialData.priority,
        isActive: initialData.isActive,
        order: initialData.order,
        triggerCondition: initialData.triggerCondition || '',
        relatedCharacterIds: initialData.relatedCharacterIds || [],
        relatedLocationIds: initialData.relatedLocationIds || [],
      })
    } else {
      setFormData({
        name: '',
        category: 'character',
        description: '',
        content: '',
        keywords: [],
        keywordInput: '',
        priority: 50,
        isActive: true,
        order: 0,
        triggerCondition: '',
        relatedCharacterIds: [],
        relatedLocationIds: [],
      })
    }
  }, [initialData])

  const handleAddKeyword = () => {
    const keyword = formData.keywordInput.trim()
    if (keyword && !formData.keywords.includes(keyword)) {
      setFormData({
        ...formData,
        keywords: [...formData.keywords, keyword],
        keywordInput: '',
      })
    }
  }

  const handleRemoveKeyword = (keyword: string) => {
    setFormData({
      ...formData,
      keywords: formData.keywords.filter(k => k !== keyword),
    })
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.description) {
      alert('请填写名称和描述')
      return
    }
    setIsSaving(true)
    try {
      await onSave({
        name: formData.name,
        category: formData.category,
        description: formData.description,
        content: formData.content,
        keywords: formData.keywords,
        priority: formData.priority,
        isActive: formData.isActive,
        order: formData.order,
        triggerCondition: formData.triggerCondition,
        relatedCharacterIds: formData.relatedCharacterIds,
        relatedLocationIds: formData.relatedLocationIds,
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? '编辑设定条目' : '新建设定条目'}
      size="xl"
    >
      <div className="space-y-4">
        {/* 基本信息 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1">名称 *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="例如：张三"
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">分类</label>
            <Select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </Select>
          </div>
        </div>

        {/* 描述 */}
        <div>
          <label className="text-sm font-medium block mb-1">简短描述 *</label>
          <Input
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="简洁的描述..."
          />
        </div>

        {/* 详细内容 */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
            详细内容
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            rows={6}
            className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
            placeholder="详细内容、设定说明..."
          />
        </div>

        {/* 关键词 */}
        <div>
          <label className="text-sm font-medium block mb-1">触发关键词</label>
          <div className="flex gap-2 mb-2">
            <Input
              value={formData.keywordInput}
              onChange={(e) => setFormData({ ...formData, keywordInput: e.target.value })}
              placeholder="输入关键词后按回车或点击添加"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddKeyword()
                }
              }}
            />
            <Button onClick={handleAddKeyword}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.keywords.map((keyword, i) => (
              <span key={i} className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                {keyword}
                <button onClick={() => handleRemoveKeyword(keyword)} className="hover:text-red-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* 高级设置 */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
          <div>
            <label className="text-sm font-medium block mb-1">优先级 (0-100)</label>
            <Input
              type="number"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
              min={0}
              max={100}
            />
            <p className="text-xs text-gray-500 mt-1">数值越高，优先级越高</p>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">排序</label>
            <Input
              type="number"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="rounded border-gray-300"
          />
          <label htmlFor="isActive" className="text-sm font-medium">启用此条目</label>
        </div>

        {/* 按钮 */}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? '保存中...' : '保存'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
