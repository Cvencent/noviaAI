import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, CheckCircle2, Clock, AlertTriangle, Target, Flag, X } from 'lucide-react'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Select } from './ui/Select'
import { Modal } from './ui/Modal'
import { Card } from './ui/Card'
import { LoadingSpinner } from './ui/LoadingSpinner'
import { chekhovsGunsApi, ChekhovsGun as ChekhovsGunType } from '../api/chekhovs-guns'
import { useToast } from '../contexts/ToastContext'

interface ChekhovsGun extends Omit<ChekhovsGunType, 'status' | 'importance' | 'tags'> {
  status: 'setup' | 'reminder' | 'payoff' | 'abandoned'
  importance: 'minor' | 'normal' | 'major' | 'critical'
  tags?: string[]
}

interface ChekhovsGunManagerProps {
  projectId: string
}

const STATUS_LABELS = {
  setup: { label: '已埋设', icon: <Clock className="w-4 h-4" />, color: 'text-blue-600 bg-blue-50' },
  reminder: { label: '提醒中', icon: <AlertTriangle className="w-4 h-4" />, color: 'text-yellow-600 bg-yellow-50' },
  payoff: { label: '已回收', icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-green-600 bg-green-50' },
  abandoned: { label: '已废弃', icon: <X className="w-4 h-4" />, color: 'text-gray-600 bg-gray-50' },
}

const IMPORTANCE_LABELS = {
  minor: { label: '次要', color: 'text-gray-600 bg-gray-50' },
  normal: { label: '普通', color: 'text-blue-600 bg-blue-50' },
  major: { label: '重要', color: 'text-orange-600 bg-orange-50' },
  critical: { label: '关键', color: 'text-red-600 bg-red-50' },
}

export function ChekhovsGunManager({ projectId }: ChekhovsGunManagerProps) {
  const [guns, setGuns] = useState<ChekhovsGun[]>([])
  const [filteredGuns, setFilteredGuns] = useState<ChekhovsGun[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [selectedImportance, setSelectedImportance] = useState<string>('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingGun, setEditingGun] = useState<ChekhovsGun | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { success, error } = useToast()

  useEffect(() => {
    loadGuns()
  }, [projectId])

  useEffect(() => {
    let filtered = guns
    if (searchTerm) {
      filtered = filtered.filter(gun =>
        gun.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        gun.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    if (selectedStatus) {
      filtered = filtered.filter(gun => gun.status === selectedStatus)
    }
    if (selectedImportance) {
      filtered = filtered.filter(gun => gun.importance === selectedImportance)
    }
    setFilteredGuns(filtered)
  }, [guns, searchTerm, selectedStatus, selectedImportance])

  const loadGuns = async () => {
    setIsLoading(true)
    try {
      const data = await chekhovsGunsApi.getAllWithoutPagination(projectId)
      const convertedGuns: ChekhovsGun[] = data.map(g => ({
        ...g,
        status: g.status as any,
        importance: g.importance as any,
        tags: g.tags ? g.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
      }))
      setGuns(convertedGuns)
    } catch (err) {
      error('加载伏笔失败')
      console.error('Failed to load Chekhovs guns:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (gunId: string) => {
    if (!confirm('确定要删除这个伏笔吗？')) return
    try {
      await chekhovsGunsApi.delete(projectId, gunId)
      setGuns(guns.filter(g => g.id !== gunId))
      success('伏笔已删除')
    } catch (err) {
      error('删除伏笔失败')
      console.error('Failed to delete Chekhovs gun:', err)
    }
  }

  const handleSave = async (data: Omit<ChekhovsGun, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>) => {
    try {
      const apiData = {
        ...data,
        tags: data.tags?.join(','),
      }
      if (editingGun) {
        const updated = await chekhovsGunsApi.update(projectId, editingGun.id, apiData)
        setGuns(guns.map(g => g.id === editingGun.id ? {
          ...updated,
          status: updated.status as any,
          importance: updated.importance as any,
          tags: updated.tags ? updated.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
        } as ChekhovsGun : g))
        success('伏笔已更新')
      } else {
        const created = await chekhovsGunsApi.create(projectId, apiData)
        const converted: ChekhovsGun = {
          ...created,
          status: created.status as any,
          importance: created.importance as any,
          tags: created.tags ? created.tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
        }
        setGuns([converted, ...guns])
        success('伏笔已埋设')
      }
      setIsCreateModalOpen(false)
      setEditingGun(null)
    } catch (err) {
      error('保存伏笔失败')
      console.error('Failed to save Chekhovs gun:', err)
    }
  }

  const stats = {
    total: guns.length,
    setup: guns.filter(g => g.status === 'setup').length,
    reminder: guns.filter(g => g.status === 'reminder').length,
    payoff: guns.filter(g => g.status === 'payoff').length,
    abandoned: guns.filter(g => g.status === 'abandoned').length,
  }

  return (
    <div className="h-full flex flex-col">
      {/* 头部工具栏 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Flag className="w-6 h-6 text-orange-600" />
            伏笔管理 (Chekhov's Gun)
          </h2>
          <Button onClick={() => {
            setEditingGun(null)
            setIsCreateModalOpen(true)
          }}>
            <Plus className="w-4 h-4 mr-2" />
            埋设伏笔
          </Button>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-5 gap-3 mb-4">
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-gray-700">{stats.total}</div>
            <div className="text-xs text-gray-500">总计</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.setup}</div>
            <div className="text-xs text-gray-500">已埋设</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.reminder}</div>
            <div className="text-xs text-gray-500">待回收</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.payoff}</div>
            <div className="text-xs text-gray-500">已回收</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-gray-500">{stats.abandoned}</div>
            <div className="text-xs text-gray-500">已废弃</div>
          </Card>
        </div>

        {/* 搜索和筛选 */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Input
              placeholder="搜索伏笔..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-40">
            <Select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">全部状态</option>
              <option value="setup">已埋设</option>
              <option value="reminder">提醒中</option>
              <option value="payoff">已回收</option>
              <option value="abandoned">已废弃</option>
            </Select>
          </div>
          <div className="w-40">
            <Select
              value={selectedImportance}
              onChange={(e) => setSelectedImportance(e.target.value)}
            >
              <option value="">全部重要性</option>
              <option value="minor">次要</option>
              <option value="normal">普通</option>
              <option value="major">重要</option>
              <option value="critical">关键</option>
            </Select>
          </div>
        </div>
      </div>

      {/* 伏笔列表 */}
      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : filteredGuns.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Target className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>暂无伏笔</p>
            <p className="text-sm">点击上方按钮埋下第一个伏笔</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredGuns.map((gun) => {
              const statusInfo = STATUS_LABELS[gun.status as keyof typeof STATUS_LABELS]
              const importanceInfo = IMPORTANCE_LABELS[gun.importance as keyof typeof IMPORTANCE_LABELS]
              return (
                <Card key={gun.id} className={`p-4 hover:shadow-md transition-shadow ${
                  gun.status === 'reminder' ? 'border-l-4 border-l-yellow-400' :
                  gun.importance === 'critical' ? 'border-l-4 border-l-red-400' : ''
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{gun.name}</h3>
                        <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded ${statusInfo.color}`}>
                          {statusInfo.icon}
                          {statusInfo.label}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${importanceInfo.color}`}>
                          {importanceInfo.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{gun.description}</p>
                      <div className="bg-gray-50 p-3 rounded mb-2">
                        <p className="text-xs text-gray-500 mb-1">埋设内容：</p>
                        <p className="text-sm text-gray-700">{gun.setupText}</p>
                      </div>
                      {gun.payoffText && (
                        <div className="bg-green-50 p-3 rounded mb-2">
                          <p className="text-xs text-green-600 mb-1">回收内容：</p>
                          <p className="text-sm text-gray-700">{gun.payoffText}</p>
                        </div>
                      )}
                      {gun.tags && gun.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {gun.tags.map((tag, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {gun.notes && (
                        <p className="text-xs text-gray-400 mt-2">笔记：{gun.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-1 ml-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingGun(gun)
                          setIsCreateModalOpen(true)
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(gun.id)}
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
      <ChekhovsGunModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false)
          setEditingGun(null)
        }}
        onSave={handleSave}
        initialData={editingGun}
      />
    </div>
  )
}

interface ChekhovsGunModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: Omit<ChekhovsGun, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>) => void
  initialData?: ChekhovsGun | null
}

function ChekhovsGunModal({ isOpen, onClose, onSave, initialData }: ChekhovsGunModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    setupText: '',
    setupChapterId: '',
    status: 'setup' as 'setup' | 'reminder' | 'payoff' | 'abandoned',
    payoffText: '',
    payoffChapterId: '',
    importance: 'normal' as 'minor' | 'normal' | 'major' | 'critical',
    tagInput: '',
    tags: [] as string[],
    notes: '',
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description,
        setupText: initialData.setupText,
        setupChapterId: initialData.setupChapterId || '',
        status: initialData.status,
        payoffText: initialData.payoffText || '',
        payoffChapterId: initialData.payoffChapterId || '',
        importance: initialData.importance,
        tagInput: '',
        tags: initialData.tags || [],
        notes: initialData.notes || '',
      })
    } else {
      setFormData({
        name: '',
        description: '',
        setupText: '',
        setupChapterId: '',
        status: 'setup',
        payoffText: '',
        payoffChapterId: '',
        importance: 'normal',
        tagInput: '',
        tags: [],
        notes: '',
      })
    }
  }, [initialData])

  const handleAddTag = () => {
    const tag = formData.tagInput.trim()
    if (tag && !formData.tags.includes(tag)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tag],
        tagInput: '',
      })
    }
  }

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag),
    })
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.description || !formData.setupText) {
      alert('请填写名称、描述和埋设内容')
      return
    }
    setIsSaving(true)
    try {
      await onSave({
        ...formData,
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? '编辑伏笔' : '埋设新伏笔'}
      size="lg"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving || !formData.name || !formData.description || !formData.setupText} isLoading={isSaving}>
            {initialData ? '更新' : '埋设'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              名称 *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="伏笔名称，如：墙上的枪"
            />
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              状态
            </label>
            <Select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            >
              <option value="setup">已埋设</option>
              <option value="reminder">提醒中</option>
              <option value="payoff">已回收</option>
              <option value="abandoned">已废弃</option>
            </Select>
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              重要性
            </label>
            <Select
              value={formData.importance}
              onChange={(e) => setFormData({ ...formData, importance: e.target.value as any })}
            >
              <option value="minor">次要</option>
              <option value="normal">普通</option>
              <option value="major">重要</option>
              <option value="critical">关键</option>
            </Select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              描述 *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="简单描述这个伏笔的用途"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              埋设内容 *
            </label>
            <textarea
              value={formData.setupText}
              onChange={(e) => setFormData({ ...formData, setupText: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="具体的埋设内容，如：他卧室的墙上挂着一把猎枪"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              回收内容
            </label>
            <textarea
              value={formData.payoffText}
              onChange={(e) => setFormData({ ...formData, payoffText: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="伏笔回收时的内容"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              标签
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                value={formData.tagInput}
                onChange={(e) => setFormData({ ...formData, tagInput: e.target.value })}
                placeholder="添加标签..."
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
              />
              <Button onClick={handleAddTag} variant="outline">添加</Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              笔记
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="个人笔记"
            />
          </div>
        </div>
      </div>
    </Modal>
  )
}
