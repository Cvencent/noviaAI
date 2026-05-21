import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, CheckCircle2, Clock, AlertTriangle, Target, Flag, X } from 'lucide-react'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Select } from './ui/Select'
import { Modal } from './ui/Modal'
import { Card } from './ui/Card'

interface ChekhovsGun {
  id: string
  name: string
  description: string
  setupText: string
  setupChapterId?: string
  setupPosition?: number
  status: 'setup' | 'reminder' | 'payoff' | 'abandoned'
  payoffText?: string
  payoffChapterId?: string
  importance: 'minor' | 'normal' | 'major' | 'critical'
  tags?: string[]
  notes?: string
  createdAt: string
  updatedAt: string
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

  // 模拟数据 - 等有API后替换
  const mockGuns: ChekhovsGun[] = [
    {
      id: '1',
      name: '墙上的枪',
      description: '主角卧室墙上挂着的一把老式猎枪',
      setupText: '他卧室的墙上挂着一把猎枪，枪管生锈了，但看起来还能用。',
      status: 'setup',
      importance: 'major',
      tags: ['武器', '伏笔'],
      notes: '这个伏笔应该在高潮场景回收',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      name: '神秘信件',
      description: '主角收到的一封没有署名的信件',
      setupText: '他收到一封奇怪的信，信封上没有寄信人地址，只有一个奇怪的印章。',
      status: 'reminder',
      importance: 'critical',
      tags: ['信件', '神秘'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '3',
      name: '旧照片',
      description: '主角母亲留下的一张旧照片',
      setupText: '他翻出母亲的旧物，发现一张褪色的照片，背面有一行模糊的字。',
      payoffText: '他终于看清了照片背面的字："真相在老房子的阁楼里。"',
      status: 'payoff',
      importance: 'normal',
      tags: ['回忆', '照片'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]

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
    // TODO: 替换为真实API调用
    setTimeout(() => {
      setGuns(mockGuns)
      setIsLoading(false)
    }, 500)
  }

  const handleDelete = async (gunId: string) => {
    if (!confirm('确定要删除这个伏笔吗？')) return
    // TODO: API调用
    setGuns(guns.filter(g => g.id !== gunId))
  }

  const handleSave = async (data: Omit<ChekhovsGun, 'id' | 'createdAt' | 'updatedAt'>) => {
    // TODO: API调用
    if (editingGun) {
      setGuns(guns.map(g => g.id === editingGun.id ? { ...g, ...data, id: editingGun.id } as ChekhovsGun : g))
    } else {
      setGuns([{ ...data, id: Date.now().toString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...guns])
    }
    setIsCreateModalOpen(false)
    setEditingGun(null)
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
          <div className="text-center py-8 text-gray-500">加载中...</div>
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
  onSave: (data: Omit<ChekhovsGun, 'id' | 'createdAt' | 'updatedAt'>) => void
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
      size="xl"
    >
      <div className="space-y-4">
        {/* 基本信息 */}
        <div>
          <label className="text-sm font-medium block mb-1">伏笔名称 *</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="例如：墙上的枪"
          />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">简短描述 *</label>
          <Input
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="描述这个伏笔是什么..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1">状态</label>
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
          <div>
            <label className="text-sm font-medium block mb-1">重要性</label>
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
        </div>

        {/* 埋设内容 */}
        <div>
          <label className="text-sm font-medium block mb-1">埋设内容 (原文) *</label>
          <textarea
            value={formData.setupText}
            onChange={(e) => setFormData({ ...formData, setupText: e.target.value })}
            placeholder="伏笔下在哪里的原文..."
            rows={3}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        {/* 回收内容 */}
        {(formData.status === 'payoff' || formData.payoffText) && (
          <div>
            <label className="text-sm font-medium block mb-1">回收内容 (原文)</label>
            <textarea
              value={formData.payoffText}
              onChange={(e) => setFormData({ ...formData, payoffText: e.target.value })}
              placeholder="伏笔回收时的原文..."
              rows={3}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        )}

        {/* 标签 */}
        <div>
          <label className="text-sm font-medium block mb-1">标签</label>
          <div className="flex gap-2 mb-2">
            <Input
              value={formData.tagInput}
              onChange={(e) => setFormData({ ...formData, tagInput: e.target.value })}
              placeholder="输入标签后按回车或点击添加"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddTag()
                }
              }}
            />
            <Button onClick={handleAddTag}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag, i) => (
              <span key={i} className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                {tag}
                <button onClick={() => handleRemoveTag(tag)} className="hover:text-red-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* 笔记 */}
        <div>
          <label className="text-sm font-medium block mb-1">作者笔记</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="给自己看的笔记，比如回收计划..."
            rows={2}
            className="w-full px-3 py-2 border rounded-md"
          />
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
