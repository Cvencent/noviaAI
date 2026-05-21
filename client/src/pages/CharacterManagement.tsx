import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import {
  Plus,
  Edit2,
  Trash2,
  Users,
  Sparkles,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Modal } from '../components/ui/Modal'
import { Select } from '../components/ui/Select'
import { charactersApi, Character } from '../api/characters'
import { aiApi } from '../api/ai'

const ROLE_OPTIONS = [
  { value: 'protagonist', label: '主角' },
  { value: 'deuteragonist', label: '副主角' },
  { value: 'antagonist', label: '反派' },
  { value: 'supporting', label: '配角' },
  { value: 'minor', label: '次要角色' },
  { value: 'mentor', label: '导师' },
  { value: 'love_interest', label: '恋人' },
  { value: 'friend', label: '朋友' },
  { value: 'rival', label: '对手' },
  { value: 'other', label: '其他' },
]

const RELATIONSHIP_TYPES = [
  '父亲', '母亲', '儿子', '女儿', '兄弟', '姐妹', '夫妻', '恋人',
  '朋友', '敌人', '导师', '学生', '上司', '下属', '搭档', '同门',
  '青梅竹马', '养父', '养女', '宿敌', '恩人', '仇人', '竞争者'
]

interface CharacterFormData {
  name: string
  role: string
  appearance: string
  personality: string
  background: string
  goals: string
  flaws: string
  arc: string
  voice: string
  notes: string
}

interface GraphNode {
  id: string
  name: string
  role: string
  x: number
  y: number
  fx?: number
  fy?: number
}

interface GraphLink {
  source: string
  target: string
  relationship: string
}

export function CharacterManagement() {
  const { projectId } = useParams<{ projectId: string }>()
  const svgRef = useRef<SVGSVGElement>(null)

  const [characters, setCharacters] = useState<Character[]>([])
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState('')

  const [showRelationModal, setShowRelationModal] = useState(false)
  const [relationTarget, setRelationTarget] = useState('')
  const [relationType, setRelationType] = useState('')
  const [relationDescription, setRelationDescription] = useState('')

  const [showAiModal, setShowAiModal] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [isAiGenerating, setIsAiGenerating] = useState(false)
  const [aiGeneratedCharacter, setAiGeneratedCharacter] = useState<CharacterFormData | null>(null)

  const [activeTab, setActiveTab] = useState<'list' | 'graph'>('list')
  const [graphScale, setGraphScale] = useState(1)

  const [formData, setFormData] = useState<CharacterFormData>({
    name: '',
    role: '',
    appearance: '',
    personality: '',
    background: '',
    goals: '',
    flaws: '',
    arc: '',
    voice: '',
    notes: '',
  })

  useEffect(() => {
    loadCharacters()
  }, [projectId])

  const loadCharacters = async () => {
    if (!projectId) return
    try {
      const data = await charactersApi.getAll(projectId)
      setCharacters(data)
    } catch (error) {
      console.error('加载人物失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = () => {
    setModalMode('create')
    setFormData({
      name: '',
      role: '',
      appearance: '',
      personality: '',
      background: '',
      goals: '',
      flaws: '',
      arc: '',
      voice: '',
      notes: '',
    })
    setIsModalOpen(true)
  }

  const handleEdit = (character: Character) => {
    setModalMode('edit')
    setSelectedCharacter(character)
    setFormData({
      name: character.name,
      role: character.role || '',
      appearance: character.appearance || '',
      personality: character.personality || '',
      background: character.background || '',
      goals: character.goals || '',
      flaws: character.flaws || '',
      arc: character.arc || '',
      voice: character.voice || '',
      notes: character.notes || '',
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (character: Character) => {
    if (!projectId || !confirm(`确定要删除「${character.name}」吗？`)) return
    try {
      await charactersApi.delete(projectId, character.id)
      await loadCharacters()
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  const handleSubmit = async () => {
    if (!projectId || !formData.name.trim()) return

    try {
      if (modalMode === 'create') {
        await charactersApi.create(projectId, formData)
      } else if (selectedCharacter) {
        await charactersApi.update(projectId, selectedCharacter.id, formData)
      }
      setIsModalOpen(false)
      await loadCharacters()
    } catch (error) {
      console.error('保存失败:', error)
    }
  }

  const handleCreateRelation = async () => {
    if (!projectId || !selectedCharacter || !relationTarget || !relationType) return

    try {
      await charactersApi.createRelationship(projectId, {
        fromId: selectedCharacter.id,
        toId: relationTarget,
        relationship: relationType,
        description: relationDescription,
      })
      setShowRelationModal(false)
      setRelationTarget('')
      setRelationType('')
      setRelationDescription('')
      await loadCharacters()
    } catch (error) {
      console.error('创建关系失败:', error)
    }
  }

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return
    setIsAiGenerating(true)
    try {
      const result = await aiApi.chat({
        projectId: projectId!,
        message: `请根据以下描述生成一个详细的人物设定（返回JSON格式，包含name, role, appearance, personality, background, goals, flaws, arc, voice字段）：\n\n${aiPrompt}`,
      })

      try {
        const jsonMatch = result.response.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          setAiGeneratedCharacter(parsed)
        }
      } catch {
        console.error('解析AI返回失败')
      }
    } catch (error) {
      console.error('AI生成失败:', error)
    } finally {
      setIsAiGenerating(false)
    }
  }

  const handleApplyAiCharacter = () => {
    if (aiGeneratedCharacter) {
      setFormData(aiGeneratedCharacter)
      setShowAiModal(false)
      setModalMode('create')
      setIsModalOpen(true)
      setAiPrompt('')
      setAiGeneratedCharacter(null)
    }
  }

  const getRoleLabel = (role: string) => {
    return ROLE_OPTIONS.find(r => r.value === role)?.label || role
  }

  const getFilteredCharacters = () => {
    return characters.filter(char => {
      const matchesSearch = !searchQuery ||
        char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        char.personality?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesRole = !filterRole || char.role === filterRole
      return matchesSearch && matchesRole
    })
  }

  const filteredCharacters = getFilteredCharacters()

  const getRelationships = (character: Character) => {
    const relations: Array<{
      id: string
      character: { id: string; name: string }
      relationship: string
      description?: string
      direction: 'from' | 'to'
    }> = []

    character.relationshipsFrom?.forEach(rel => {
      if (rel.toCharacter) {
        relations.push({
          id: rel.id,
          character: rel.toCharacter,
          relationship: rel.relationship,
          description: rel.description || undefined,
          direction: 'from',
        })
      }
    })

    character.relationshipsTo?.forEach(rel => {
      if (rel.fromCharacter) {
        relations.push({
          id: rel.id,
          character: rel.fromCharacter,
          relationship: rel.relationship,
          description: rel.description || undefined,
          direction: 'to',
        })
      }
    })

    return relations
  }

  const getGraphData = useCallback(() => {
    const nodes: GraphNode[] = filteredCharacters.map((char, i) => {
      const angle = (2 * Math.PI * i) / filteredCharacters.length
      const radius = 200
      return {
        id: char.id,
        name: char.name,
        role: char.role || '',
        x: 400 + radius * Math.cos(angle),
        y: 300 + radius * Math.sin(angle),
      }
    })

    const links: GraphLink[] = []
    filteredCharacters.forEach(char => {
      char.relationshipsFrom?.forEach(rel => {
        if (filteredCharacters.find(c => c.id === rel.toId)) {
          links.push({
            source: char.id,
            target: rel.toId,
            relationship: rel.relationship,
          })
        }
      })
    })

    return { nodes, links }
  }, [filteredCharacters])

  const { nodes: graphNodes, links: graphLinks } = getGraphData()

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">人物档案</h1>
            <p className="text-gray-600 mt-1">管理故事中的所有角色及其关系</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowAiModal(true)}>
              <Sparkles className="w-4 h-4 mr-2" />
              AI 生成
            </Button>
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              添加人物
            </Button>
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索人物..."
              className="w-full"
            />
          </div>
          <Select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="w-48"
          >
            <option value="">全部角色</option>
            {ROLE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
          <div className="flex border rounded-lg overflow-hidden">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'list' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'
              }`}
            >
              列表
            </button>
            <button
              onClick={() => setActiveTab('graph')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'graph' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'
              }`}
            >
              关系图谱
            </button>
          </div>
        </div>

        {activeTab === 'list' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCharacters.map(character => (
              <Card key={character.id} className="hover:shadow-md transition-shadow">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{character.name}</h3>
                      {character.role && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded mt-1 inline-block">
                          {getRoleLabel(character.role)}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(character)}
                        className="p-1 text-gray-400 hover:text-blue-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(character)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {character.appearance && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {character.appearance}
                    </p>
                  )}

                  {character.personality && (
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                      <span className="font-medium">性格：</span>{character.personality}
                    </p>
                  )}

                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">关系</span>
                      <button
                        onClick={() => {
                          setSelectedCharacter(character)
                          setShowRelationModal(true)
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        + 添加
                      </button>
                    </div>
                    {getRelationships(character).length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {getRelationships(character).slice(0, 3).map((rel, i) => (
                          <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            {rel.character.name}（{rel.relationship}）
                          </span>
                        ))}
                        {getRelationships(character).length > 3 && (
                          <span className="text-xs text-gray-400">
                            +{getRelationships(character).length - 3} 更多
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">暂无关系</span>
                    )}
                  </div>
                </div>
              </Card>
            ))}

            {filteredCharacters.length === 0 && (
              <div className="col-span-full text-center py-12">
                <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">还没有人物</h3>
                <p className="text-gray-500 mb-4">开始创建你的第一个角色吧</p>
                <Button onClick={handleCreate}>创建人物</Button>
              </div>
            )}
          </div>
        ) : (
          <Card className="overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-white">
              <span className="text-sm text-gray-500">按住节点拖动可调整位置</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setGraphScale(s => Math.max(0.5, s - 0.1))}>
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-500 px-2 py-1">{Math.round(graphScale * 100)}%</span>
                <Button variant="outline" size="sm" onClick={() => setGraphScale(s => Math.min(2, s + 0.1))}>
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <svg
              ref={svgRef}
              className="w-full h-[600px] bg-gray-50"
              viewBox="0 0 800 600"
              style={{ transform: `scale(${graphScale})`, transformOrigin: 'center' }}
            >
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280" />
                </marker>
              </defs>

              {graphLinks.map((link, i) => {
                const source = graphNodes.find(n => n.id === link.source)
                const target = graphNodes.find(n => n.id === link.target)
                if (!source || !target) return null

                const midX = (source.x + target.x) / 2
                const midY = (source.y + target.y) / 2

                return (
                  <g key={i}>
                    <line
                      x1={source.x}
                      y1={source.y}
                      x2={target.x}
                      y2={target.y}
                      stroke="#9ca3af"
                      strokeWidth={2}
                      markerEnd="url(#arrowhead)"
                    />
                    <text
                      x={midX}
                      y={midY - 10}
                      textAnchor="middle"
                      className="text-xs fill-gray-600"
                      style={{ fontSize: '10px' }}
                    >
                      {link.relationship}
                    </text>
                  </g>
                )
              })}

              {graphNodes.map(node => (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  className="cursor-pointer"
                  onClick={() => {
                    const char = characters.find(c => c.id === node.id)
                    if (char) handleEdit(char)
                  }}
                >
                  <circle
                    r="30"
                    fill={node.role === 'protagonist' ? '#3b82f6' :
                          node.role === 'antagonist' ? '#ef4444' :
                          node.role === 'mentor' ? '#8b5cf6' : '#6b7280'}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                  <text
                    textAnchor="middle"
                    dy="4"
                    fill="#fff"
                    style={{ fontSize: '12px', fontWeight: 'bold' }}
                  >
                    {node.name.slice(0, 2)}
                  </text>
                  <text
                    y="45"
                    textAnchor="middle"
                    className="fill-gray-700"
                    style={{ fontSize: '11px' }}
                  >
                    {node.name}
                  </text>
                </g>
              ))}
            </svg>
          </Card>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? '创建人物' : '编辑人物'}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">姓名 *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="角色姓名"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">角色定位</label>
            <Select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full"
            >
              <option value="">选择角色定位</option>
              {ROLE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">外貌特征</label>
            <Textarea
              value={formData.appearance}
              onChange={(e) => setFormData({ ...formData, appearance: e.target.value })}
              placeholder="描述角色的外貌特征..."
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">性格特点</label>
            <Textarea
              value={formData.personality}
              onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
              placeholder="描述角色的性格..."
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">背景故事</label>
            <Textarea
              value={formData.background}
              onChange={(e) => setFormData({ ...formData, background: e.target.value })}
              placeholder="角色的过去和背景..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">目标</label>
              <Input
                value={formData.goals}
                onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                placeholder="角色的主要目标"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">缺陷/弱点</label>
              <Input
                value={formData.flaws}
                onChange={(e) => setFormData({ ...formData, flaws: e.target.value })}
                placeholder="角色的缺陷或弱点"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">人物弧光</label>
            <Textarea
              value={formData.arc}
              onChange={(e) => setFormData({ ...formData, arc: e.target.value })}
              placeholder="角色在故事中的成长变化..."
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">语言风格</label>
            <Input
              value={formData.voice}
              onChange={(e) => setFormData({ ...formData, voice: e.target.value })}
              placeholder="角色的说话风格、口头禅等"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="其他备注信息..."
              rows={2}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t mt-4">
          <Button variant="outline" onClick={() => setIsModalOpen(false)}>取消</Button>
          <Button onClick={handleSubmit} disabled={!formData.name.trim()}>
            {modalMode === 'create' ? '创建' : '保存'}
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={showRelationModal}
        onClose={() => setShowRelationModal(false)}
        title="添加人物关系"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              选择人物（与「{selectedCharacter?.name}」的关系）
            </label>
            <Select
              value={relationTarget}
              onChange={(e) => setRelationTarget(e.target.value)}
              className="w-full"
            >
              <option value="">选择人物...</option>
              {characters
                .filter(c => c.id !== selectedCharacter?.id)
                .map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">关系类型</label>
            <Select
              value={relationType}
              onChange={(e) => setRelationType(e.target.value)}
              className="w-full"
            >
              <option value="">选择关系...</option>
              {RELATIONSHIP_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">关系描述</label>
            <Textarea
              value={relationDescription}
              onChange={(e) => setRelationDescription(e.target.value)}
              placeholder="描述这段关系的具体情况..."
              rows={2}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t mt-4">
          <Button variant="outline" onClick={() => setShowRelationModal(false)}>取消</Button>
          <Button onClick={handleCreateRelation} disabled={!relationTarget || !relationType}>
            添加关系
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={showAiModal}
        onClose={() => {
          setShowAiModal(false)
          setAiPrompt('')
          setAiGeneratedCharacter(null)
        }}
        title="AI 生成人物"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              描述你想要的人物
            </label>
            <Textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="例如：一个年轻的武侠小说主角，性格内向但内心坚定，身世成谜..."
              rows={4}
            />
          </div>

          <Button onClick={handleAiGenerate} disabled={isAiGenerating || !aiPrompt.trim()}>
            <Sparkles className="w-4 h-4 mr-2" />
            {isAiGenerating ? '生成中...' : '生成人物设定'}
          </Button>

          {aiGeneratedCharacter && (
            <div className="border rounded-lg p-4 bg-gray-50 space-y-2">
              <h4 className="font-medium text-gray-900">{aiGeneratedCharacter.name}</h4>
              <p className="text-sm text-gray-600">
                <span className="font-medium">角色：</span>{getRoleLabel(aiGeneratedCharacter.role)}
              </p>
              {aiGeneratedCharacter.appearance && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">外貌：</span>{aiGeneratedCharacter.appearance}
                </p>
              )}
              {aiGeneratedCharacter.personality && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">性格：</span>{aiGeneratedCharacter.personality}
                </p>
              )}
              {aiGeneratedCharacter.background && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">背景：</span>{aiGeneratedCharacter.background}
                </p>
              )}
              <Button onClick={handleApplyAiCharacter} className="w-full mt-2">
                使用此设定创建人物
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
