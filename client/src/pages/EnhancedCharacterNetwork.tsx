import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import {
  Plus,
  Edit2,
  Trash2,
  Users,
  Sparkles,
  ZoomIn,
  ZoomOut,
  Layers,
  Search,
  Link2,
  Eye,
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Modal } from '../components/ui/Modal'
import { Select } from '../components/ui/Select'
import { charactersApi, Character } from '../api/characters'

// 关系类型配置 - 带颜色和图标
const RELATIONSHIP_CONFIGS = {
  family: {
    color: '#ef4444',
    icon: '👨‍👩‍👧',
    types: ['父亲', '母亲', '儿子', '女儿', '兄弟', '姐妹', '夫妻', '养父', '养女'],
    weight: 3,
  },
  romantic: {
    color: '#ec4899',
    icon: '💕',
    types: ['恋人', '情侣', '妻子', '丈夫', '伴侣'],
    weight: 2.5,
  },
  friendship: {
    color: '#22c55e',
    icon: '🤝',
    types: ['朋友', '伙伴', '盟友', '同门'],
    weight: 2,
  },
  hostile: {
    color: '#8b5cf6',
    icon: '⚔️',
    types: ['敌人', '对手', '宿敌', '仇人', '竞争者'],
    weight: 2,
  },
  professional: {
    color: '#3b82f6',
    icon: '🎯',
    types: ['导师', '学生', '上司', '下属'],
    weight: 1.5,
  },
  other: {
    color: '#6b7280',
    icon: '❓',
    types: ['恩人', '其他'],
    weight: 1,
  },
}

const ROLE_OPTIONS = [
  { value: 'protagonist', label: '主角', color: '#f59e0b' },
  { value: 'deuteragonist', label: '副主角', color: '#3b82f6' },
  { value: 'antagonist', label: '反派', color: '#ef4444' },
  { value: 'supporting', label: '配角', color: '#22c55e' },
  { value: 'minor', label: '次要角色', color: '#6b7280' },
  { value: 'mentor', label: '导师', color: '#8b5cf6' },
  { value: 'love_interest', label: '恋人', color: '#ec4899' },
  { value: 'friend', label: '朋友', color: '#10b981' },
  { value: 'rival', label: '对手', color: '#f97316' },
  { value: 'other', label: '其他', color: '#64748b' },
]

const ALL_RELATIONSHIP_TYPES = Object.values(RELATIONSHIP_CONFIGS).flatMap(c => c.types)

// 关系网络节点
interface GraphNode {
  id: string
  name: string
  role: string
  x: number
  y: number
  vx: number
  vy: number
  fx?: number
  fy?: number
  radius: number
  color: string
  group?: string
  importance: number
}

// 关系网络链接
interface GraphLink {
  id: string
  source: string
  target: string
  relationship: string
  description?: string
  config: typeof RELATIONSHIP_CONFIGS.family
  weight: number
}

// 分组配置
interface GroupConfig {
  id: string
  name: string
  color: string
  characterIds: string[]
}

export function EnhancedCharacterNetwork() {
  const { projectId } = useParams<{ projectId: string }>()
  const svgRef = useRef<SVGSVGElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragNode, setDragNode] = useState<string | null>(null)

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
  const [aiGeneratedCharacter, setAiGeneratedCharacter] = useState<any | null>(null)

  const [activeTab, setActiveTab] = useState<'list' | 'graph' | 'matrix' | 'timeline'>('graph')
  const [graphScale, setGraphScale] = useState(1)
  const [graphOffset] = useState({ x: 0, y: 0 })
  const [panMode] = useState(false)

  // 分组功能
  const [groups] = useState<GroupConfig[]>([
    { id: 'family', name: '主角家族', color: '#f59e0b', characterIds: [] },
    { id: 'enemies', name: '敌方阵营', color: '#ef4444', characterIds: [] },
    { id: 'allies', name: '盟友团队', color: '#22c55e', characterIds: [] },
  ])
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)

  // 显示/隐藏控制
  const [showLabels, setShowLabels] = useState(true)
  const [showMinorCharacters, setShowMinorCharacters] = useState(true)

  // 关系查询
  const [relationshipQuery, setRelationshipQuery] = useState('')
  const [queryResults, setQueryResults] = useState<any[]>([])
  const [showQuery, setShowQuery] = useState(false)

  const [formData, setFormData] = useState({
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

  // 获取关系配置
  const getRelationshipConfig = (type: string) => {
    for (const config of Object.values(RELATIONSHIP_CONFIGS)) {
      if (config.types.includes(type)) {
        return config
      }
    }
    return RELATIONSHIP_CONFIGS.other
  }

  // 获取角色颜色
  const getRoleColor = (role?: string | null) => {
    const option = ROLE_OPTIONS.find(o => o.value === role)
    return option?.color || '#64748b'
  }

  // 计算力导向布局
  const computeForceLayout = useCallback(
    (nodes: GraphNode[], links: GraphLink[], width = 800, height = 600) => {
      const k = 0.01
      const repulsion = 400
      const attraction = 0.5
      const damping = 0.9
      const iterations = 100

      const nodeMap = new Map(nodes.map(n => [n.id, n]))

      for (let iter = 0; iter < iterations; iter++) {
        // 相互排斥
        for (let i = 0; i < nodes.length; i++) {
          const node1 = nodes[i]
          for (let j = i + 1; j < nodes.length; j++) {
            const node2 = nodes[j]
            const dx = node1.x - node2.x
            const dy = node1.y - node2.y
            const distance = Math.sqrt(dx * dx + dy * dy) || 1
            const force = repulsion / (distance * distance)

            const fx = (dx / distance) * force
            const fy = (dy / distance) * force

            node1.vx += fx
            node1.vy += fy
            node2.vx -= fx
            node2.vy -= fy
          }
        }

        // 链接吸引
        for (const link of links) {
          const source = nodeMap.get(link.source)
          const target = nodeMap.get(link.target)
          if (!source || !target) continue

          const dx = source.x - target.x
          const dy = source.y - target.y
          const distance = Math.sqrt(dx * dx + dy * dy) || 1
          const force = (distance * attraction * link.weight) / 10

          const fx = (dx / distance) * force
          const fy = (dy / distance) * force

          source.vx -= fx
          source.vy -= fy
          target.vx += fx
          target.vy += fy
        }

        // 向中心吸引
        for (const node of nodes) {
          const dx = node.x - width / 2
          const dy = node.y - height / 2
          const distance = Math.sqrt(dx * dx + dy * dy) || 1

          node.vx -= (dx / distance) * k
          node.vy -= (dy / distance) * k
        }

        // 更新位置
        for (const node of nodes) {
          if (node.fx !== undefined || node.fy !== undefined) continue

          node.x += node.vx
          node.y += node.vy
          node.vx *= damping
          node.vy *= damping

          // 边界限制
          node.x = Math.max(50, Math.min(width - 50, node.x))
          node.y = Math.max(50, Math.min(height - 50, node.y))
        }
      }

      return { nodes, links }
    },
    []
  )

  // 准备图数据
  const { nodes, links } = useMemo(() => {
    let filteredChars = characters.filter(char => {
      const matchesSearch = !searchQuery || char.name.includes(searchQuery)
      const matchesRole = !filterRole || char.role === filterRole
      const isNotMinor = showMinorCharacters || char.role !== 'minor'
      return matchesSearch && matchesRole && isNotMinor
    })

    if (selectedGroup) {
      const group = groups.find(g => g.id === selectedGroup)
      if (group) {
        filteredChars = filteredChars.filter(c => group.characterIds.includes(c.id))
      }
    }

    const graphNodes: GraphNode[] = filteredChars.map((char, i) => {
      const angle = (2 * Math.PI * i) / filteredChars.length
      const radius = 150 + Math.min(filteredChars.length * 5, 100)

      // 计算重要性（关系数量+角色）
      const importance =
        ((char.relationshipsFrom?.length || 0) + (char.relationshipsTo?.length || 0)) * 10 +
        (char.role === 'protagonist' ? 100 : char.role === 'antagonist' ? 80 : 20)

      return {
        id: char.id,
        name: char.name,
        role: char.role || '',
        x: 400 + radius * Math.cos(angle),
        y: 300 + radius * Math.sin(angle),
        vx: 0,
        vy: 0,
        radius: Math.max(20, Math.min(40, 20 + importance / 10)),
        color: getRoleColor(char.role),
        importance,
      }
    })

    const graphLinks: GraphLink[] = []
    const linkSet = new Set<string>()

    filteredChars.forEach(char => {
      char.relationshipsFrom?.forEach(rel => {
        if (!filteredChars.find(c => c.id === rel.toId)) return
        const linkId = `${char.id}-${rel.toId}`
        const reverseId = `${rel.toId}-${char.id}`
        if (linkSet.has(linkId) || linkSet.has(reverseId)) return

        linkSet.add(linkId)
        const config = getRelationshipConfig(rel.relationship)
        graphLinks.push({
          id: linkId,
          source: char.id,
          target: rel.toId,
          relationship: rel.relationship,
          description: rel.description,
          config,
          weight: config.weight,
        })
      })
    })

    // 计算布局
    if (graphNodes.length > 0) {
      return computeForceLayout(graphNodes, graphLinks)
    }

    return { nodes: graphNodes, links: graphLinks }
  }, [characters, searchQuery, filterRole, showMinorCharacters, selectedGroup, computeForceLayout])

  // 关系查询功能
  const queryRelationships = (query: string) => {
    if (!query.trim()) {
      setQueryResults([])
      return
    }

    const results: any[] = []
    const queryLower = query.toLowerCase()

    characters.forEach(char => {
      const relationships: any[] = []

      char.relationshipsFrom?.forEach(rel => {
        if (
          rel.relationship.toLowerCase().includes(queryLower) ||
          (rel.toCharacter?.name.toLowerCase().includes(queryLower))
        ) {
          relationships.push({
            from: char.name,
            to: rel.toCharacter?.name,
            relationship: rel.relationship,
            description: rel.description,
          })
        }
      })

      char.relationshipsTo?.forEach(rel => {
        if (
          rel.relationship.toLowerCase().includes(queryLower) ||
          (rel.fromCharacter?.name.toLowerCase().includes(queryLower))
        ) {
          relationships.push({
            from: rel.fromCharacter?.name,
            to: char.name,
            relationship: rel.relationship,
            description: rel.description,
          })
        }
      })

      if (relationships.length > 0) {
        results.push({
          character: char.name,
          relationships,
        })
      }
    })

    setQueryResults(results)
  }

  // 交互处理
  const handleMouseDown = (_e: React.MouseEvent, nodeId?: string) => {
    if (nodeId) {
      setIsDragging(true)
      setDragNode(nodeId)
    } else if (panMode) {
      setIsDragging(true)
    }
  }

  const handleMouseMove = (_e: React.MouseEvent) => {
    if (!isDragging) return

    if (dragNode) {
      setCharacters(prev => prev)
    } else if (panMode) {
      // 实现平移逻辑
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setDragNode(null)
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
    if (!projectId) return
    if (confirm(`确定要删除 ${character.name} 吗？`)) {
      try {
        await charactersApi.delete(projectId, character.id)
        await loadCharacters()
      } catch (error) {
        console.error('删除失败:', error)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectId) return

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

  const handleAddRelation = async () => {
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
      console.error('添加关系失败:', error)
    }
  }

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return
    setIsAiGenerating(true)
    try {
      const result = await charactersApi.generateCharacter(aiPrompt)
      setAiGeneratedCharacter(result)
      setFormData({
        name: result.name,
        role: result.role,
        appearance: result.appearance,
        personality: result.personality,
        background: result.background,
        goals: result.goals,
        flaws: result.flaws,
        arc: '',
        voice: '',
        notes: '',
      })
    } catch (error) {
      console.error('AI生成失败:', error)
    } finally {
      setIsAiGenerating(false)
    }
  }

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
        {/* 头部 */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">人物关系网络</h1>
            <p className="text-gray-600 mt-1">
              可视化管理故事中的角色关系，支持力导向布局、分组、查询
            </p>
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

        {/* 工具栏 */}
        <Card className="mb-6 p-4">
          <div className="flex flex-wrap gap-4 items-center">
            {/* 搜索 */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="搜索人物..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* 角色筛选 */}
            <Select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-40"
            >
              <option value="">全部角色</option>
              {ROLE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </Select>

            {/* 分组筛选 */}
            <Select
              value={selectedGroup || ''}
              onChange={(e) => setSelectedGroup(e.target.value || null)}
              className="w-40"
            >
              <option value="">全部分组</option>
              {groups.map(group => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </Select>

            {/* 视图切换 */}
            <div className="flex border rounded-lg overflow-hidden">
              <button
                onClick={() => setActiveTab('list')}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'list' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'
                }`}
              >
                <Users className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveTab('graph')}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'graph' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'
                }`}
              >
                <Link2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveTab('matrix')}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  activeTab === 'matrix' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'
                }`}
              >
                <Layers className="w-4 h-4" />
              </button>
            </div>

            {/* 关系查询 */}
            <Button variant="outline" size="sm" onClick={() => setShowQuery(!showQuery)}>
              <Search className="w-4 h-4 mr-2" />
              查询关系
            </Button>

            {/* 显示选项 */}
            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => setShowLabels(!showLabels)}
                className={`p-2 rounded border transition-colors ${showLabels ? 'bg-blue-50 text-blue-600 border-blue-200' : 'border-gray-200 text-gray-400'}`}
                title="显示标签"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowMinorCharacters(!showMinorCharacters)}
                className={`p-2 rounded border transition-colors ${
                  showMinorCharacters ? 'bg-blue-50 text-blue-600 border-blue-200' : 'border-gray-200 text-gray-400'
                }`}
                title="显示次要角色"
              >
                <Users className="w-4 h-4" />
              </button>
            </div>

            {/* 缩放控制 */}
            <div className="flex items-center gap-2 border rounded-lg px-3 py-1">
              <button
                onClick={() => setGraphScale(s => Math.max(0.3, s - 0.1))}
                className="p-1 text-gray-600 hover:text-gray-800"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-600 w-12 text-center">
                {Math.round(graphScale * 100)}%
              </span>
              <button
                onClick={() => setGraphScale(s => Math.min(3, s + 0.1))}
                className="p-1 text-gray-600 hover:text-gray-800"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 关系查询面板 */}
          {showQuery && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex gap-3">
                <Input
                  placeholder="搜索关系类型或人物..."
                  value={relationshipQuery}
                  onChange={(e) => {
                    setRelationshipQuery(e.target.value)
                    queryRelationships(e.target.value)
                  }}
                  className="flex-1"
                />
              </div>
              {queryResults.length > 0 && (
                <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                  {queryResults.map((result, i) => (
                    <div key={i} className="p-2 bg-gray-50 rounded text-sm">
                      <div className="font-medium text-gray-900">{result.character}</div>
                      <div className="text-gray-600 mt-1 space-y-1">
                        {result.relationships.map((rel: any, j: number) => (
                          <div key={j} className="text-xs">
                            {rel.from} → {rel.to}: <span className="text-blue-600">{rel.relationship}</span>
                            {rel.description && <span className="text-gray-400 ml-2">({rel.description})</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>

        {/* 列表视图 */}
        {activeTab === 'list' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {characters.filter(char => {
              const matchesSearch = !searchQuery || char.name.includes(searchQuery)
              const matchesRole = !filterRole || char.role === filterRole
              return matchesSearch && matchesRole
            }).map(character => (
              <Card key={character.id} className="hover:shadow-md transition-shadow">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg text-gray-900">{character.name}</h3>
                        {character.role && (
                          <span
                            className="text-xs px-2 py-0.5 rounded"
                            style={{ backgroundColor: getRoleColor(character.role) + '20', color: getRoleColor(character.role) }}
                          >
                            {ROLE_OPTIONS.find(o => o.value === character.role)?.label}
                          </span>
                        )}
                      </div>
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
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{character.appearance}</p>
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
                    {(() => {
                      const relations: any[] = []
                      character.relationshipsFrom?.forEach(rel => {
                        if (rel.toCharacter) {
                          relations.push({
                            id: rel.id,
                            character: rel.toCharacter,
                            relationship: rel.relationship,
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
                            direction: 'to',
                          })
                        }
                      })

                      return relations.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {relations.slice(0, 4).map((rel, i) => (
                            <span
                              key={i}
                              className="text-xs px-2 py-0.5 rounded"
                              style={{
                                backgroundColor: getRelationshipConfig(rel.relationship).color + '20',
                                color: getRelationshipConfig(rel.relationship).color,
                              }}
                            >
                              {getRelationshipConfig(rel.relationship).icon} {rel.character.name}（{rel.relationship}）
                            </span>
                          ))}
                          {relations.length > 4 && (
                            <span className="text-xs text-gray-400">+{relations.length - 4} 更多</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">暂无关系</span>
                      )
                    })()}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* 力导向图视图 */}
        {activeTab === 'graph' && (
          <Card className="overflow-hidden">
            <svg
              ref={svgRef}
              className="w-full h-[700px] bg-gradient-to-br from-gray-50 to-gray-100 cursor-grab active:cursor-grabbing"
              viewBox="0 0 800 600"
              style={{
                transform: `scale(${graphScale}) translate(${graphOffset.x}px, ${graphOffset.y}px)`,
                transformOrigin: 'center',
              }}
              onMouseDown={(e) => handleMouseDown(e)}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <defs>
                {/* 箭头标记 */}
                {Object.entries(RELATIONSHIP_CONFIGS).map(([key, config]) => (
                  <marker
                    key={key}
                    id={`arrowhead-${key}`}
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3.5, 0 7" fill={config.color} />
                  </marker>
                ))}

                {/* 节点光晕 */}
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* 关系连线 */}
              {links.map((link) => {
                const source = nodes.find(n => n.id === link.source)
                const target = nodes.find(n => n.id === link.target)
                if (!source || !target) return null

                const dx = target.x - source.x
                const dy = target.y - source.y
                const distance = Math.sqrt(dx * dx + dy * dy)

                const sourceX = source.x + (dx / distance) * source.radius
                const sourceY = source.y + (dy / distance) * source.radius
                const targetX = target.x - (dx / distance) * target.radius
                const targetY = target.y - (dy / distance) * target.radius

                const midX = (sourceX + targetX) / 2
                const midY = (sourceY + targetY) / 2

                // 贝塞尔曲线控制点
                const curveAmount = Math.min(50, distance / 3)
                const controlX = midX + (dy / distance) * curveAmount
                const controlY = midY - (dx / distance) * curveAmount

                return (
                  <g key={link.id}>
                    <path
                      d={`M ${sourceX} ${sourceY} Q ${controlX} ${controlY} ${targetX} ${targetY}`}
                      fill="none"
                      stroke={link.config.color}
                      strokeWidth={2 + link.weight * 0.5}
                      strokeOpacity={0.7}
                      markerEnd={`url(#arrowhead-${Object.keys(RELATIONSHIP_CONFIGS).find(k => RELATIONSHIP_CONFIGS[k as keyof typeof RELATIONSHIP_CONFIGS] === link.config)})`}
                    />
                    {showLabels && (
                      <text
                        x={midX}
                        y={midY - 8}
                        textAnchor="middle"
                        className="text-xs fill-gray-700 font-medium"
                        style={{ fontSize: '11px' }}
                      >
                        {link.relationship}
                      </text>
                    )}
                  </g>
                )
              })}

              {/* 节点 */}
              {nodes.map(node => {
                const isSelected = selectedCharacter?.id === node.id
                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    className="cursor-pointer"
                    onClick={() => {
                      const char = characters.find(c => c.id === node.id)
                      if (char) handleEdit(char)
                    }}
                  >
                    {/* 节点外圈 */}
                    <circle
                      r={node.radius + 3}
                      fill={isSelected ? '#3b82f6' : node.color}
                      opacity={0.2}
                    />

                    {/* 节点 */}
                    <circle
                      r={node.radius}
                      fill={node.color}
                      filter="url(#glow)"
                      className="transition-all duration-300 hover:r-3"
                      style={{ r: node.radius }}
                    />

                    {/* 节点边框 */}
                    <circle
                      r={node.radius - 1}
                      fill="white"
                      stroke={node.color}
                      strokeWidth={2}
                    />

                    {/* 节点标签 */}
                    {showLabels && (
                      <text
                        y={node.radius + 16}
                        textAnchor="middle"
                        className="text-sm font-medium fill-gray-700"
                        style={{ fontSize: '12px' }}
                      >
                        {node.name.length > 8 ? node.name.slice(0, 8) + '…' : node.name}
                      </text>
                    )}

                    {/* 角色标签 */}
                    <text
                      textAnchor="middle"
                      dy="0.3em"
                      className="text-xs font-bold"
                      style={{
                        fill: node.color,
                        fontSize: Math.min(12, node.radius * 0.5) + 'px',
                      }}
                    >
                      {node.role === 'protagonist' ? '主' :
                       node.role === 'antagonist' ? '反' :
                       node.role === 'mentor' ? '师' :
                       node.role === 'deuteragonist' ? '副' :
                       node.name.charAt(0)}
                    </text>
                  </g>
                )
              })}
            </svg>

            {/* 图例 */}
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
              <div className="text-xs font-medium text-gray-700 mb-2">关系类型</div>
              <div className="space-y-1">
                {Object.entries(RELATIONSHIP_CONFIGS).map(([key, config]) => (
                  <div key={key} className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config.color }} />
                    <span className="text-gray-600">{config.icon} {config.types[0]}等</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 关系统计 */}
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
              <div className="text-xs font-medium text-gray-700 mb-2">网络统计</div>
              <div className="space-y-1 text-xs text-gray-600">
                <div>人物: {nodes.length}</div>
                <div>关系: {links.length}</div>
                <div>密度: {((2 * links.length) / (nodes.length * (nodes.length - 1)) * 100).toFixed(1)}%</div>
              </div>
            </div>
          </Card>
        )}

        {/* 矩阵视图 */}
        {activeTab === 'matrix' && (
          <Card className="overflow-x-auto">
            <div className="p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">关系矩阵</h3>
              {nodes.length > 0 ? (
                <div className="overflow-auto">
                  <table className="border-collapse">
                    <thead>
                      <tr>
                        <th className="border p-2 bg-gray-50 sticky left-0 z-10"></th>
                        {nodes.map(node => (
                          <th key={node.id} className="border p-2 bg-gray-50 text-xs font-medium">
                            {node.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {nodes.map(sourceNode => (
                        <tr key={sourceNode.id}>
                          <td className="border p-2 bg-gray-50 sticky left-0 z-10 text-xs font-medium">
                            {sourceNode.name}
                          </td>
                          {nodes.map(targetNode => {
                            const link = links.find(
                              l =>
                                (l.source === sourceNode.id && l.target === targetNode.id) ||
                                (l.target === sourceNode.id && l.source === targetNode.id)
                            )

                            if (sourceNode.id === targetNode.id) {
                              return (
                                <td key={targetNode.id} className="border p-1 bg-gray-100 w-8 h-8" />
                              )
                            }

                            if (link) {
                              return (
                                <td
                                  key={targetNode.id}
                                  className="border p-1 w-8 h-8 text-center cursor-pointer"
                                  style={{ backgroundColor: link.config.color + '30' }}
                                  title={link.relationship}
                                >
                                  <span style={{ color: link.config.color }}>
                                    {link.config.icon}
                                  </span>
                                </td>
                              )
                            }

                            return (
                              <td
                                key={targetNode.id}
                                className="border p-1 w-8 h-8 hover:bg-gray-50 cursor-pointer"
                                title="点击添加关系"
                              />
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  添加人物后显示关系矩阵
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* 创建/编辑人物弹窗 */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? '创建人物' : '编辑人物'}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} form="character-form">
              {modalMode === 'create' ? '创建' : '保存'}
            </Button>
          </div>
        }
      >
        <form id="character-form" onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="姓名 *"
            placeholder="角色名称"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Select
            label="角色"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          >
            <option value="">选择角色</option>
            {ROLE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
          <Textarea
            label="外貌"
            placeholder="角色的外貌特征"
            value={formData.appearance}
            onChange={(e) => setFormData({ ...formData, appearance: e.target.value })}
            rows={2}
          />
          <Textarea
            label="性格"
            placeholder="角色的性格特点"
            value={formData.personality}
            onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
            rows={2}
          />
          <Textarea
            label="背景"
            placeholder="角色的背景故事"
            value={formData.background}
            onChange={(e) => setFormData({ ...formData, background: e.target.value })}
            rows={3}
          />
          <div className="grid grid-cols-2 gap-4">
            <Textarea
              label="目标"
              placeholder="角色的目标"
              value={formData.goals}
              onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
              rows={2}
            />
            <Textarea
              label="缺陷"
              placeholder="角色的缺陷"
              value={formData.flaws}
              onChange={(e) => setFormData({ ...formData, flaws: e.target.value })}
              rows={2}
            />
          </div>
        </form>
      </Modal>

      {/* 添加关系弹窗 */}
      <Modal
        isOpen={showRelationModal}
        onClose={() => setShowRelationModal(false)}
        title="添加关系"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowRelationModal(false)}>
              取消
            </Button>
            <Button onClick={handleAddRelation}>
              添加
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {selectedCharacter && (
            <div className="text-sm text-gray-600">
              为 <span className="font-medium text-gray-900">{selectedCharacter.name}</span> 添加关系
            </div>
          )}
          <Select
            label="目标人物"
            value={relationTarget}
            onChange={(e) => setRelationTarget(e.target.value)}
          >
            <option value="">选择目标人物</option>
            {characters.filter(c => c.id !== selectedCharacter?.id).map(char => (
              <option key={char.id} value={char.id}>{char.name}</option>
            ))}
          </Select>
          <Select
            label="关系类型"
            value={relationType}
            onChange={(e) => setRelationType(e.target.value)}
          >
            <option value="">选择关系类型</option>
            {ALL_RELATIONSHIP_TYPES.map(type => (
              <option key={type} value={type}>
                {getRelationshipConfig(type).icon} {type}
              </option>
            ))}
          </Select>
          <Textarea
            label="描述（可选）"
            placeholder="关于这个关系的更多细节"
            value={relationDescription}
            onChange={(e) => setRelationDescription(e.target.value)}
            rows={2}
          />
        </div>
      </Modal>

      {/* AI生成弹窗 */}
      <Modal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        title="AI 生成人物"
        size="lg"
        footer={
          <div className="flex justify-between">
            {aiGeneratedCharacter ? (
              <Button onClick={() => {
                setFormData(aiGeneratedCharacter)
                setShowAiModal(false)
                setIsModalOpen(true)
                setModalMode('create')
              }}>
                应用到创建表单
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowAiModal(false)}>
                取消
              </Button>
              <Button onClick={handleAiGenerate} isLoading={isAiGenerating}>
                生成
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <Textarea
            label="描述你想要的角色"
            placeholder="例如：一个勇敢的年轻骑士，性格冲动但忠诚，有一段神秘的过去..."
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            rows={4}
          />
          {aiGeneratedCharacter && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-gray-900">生成结果</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">姓名:</span>{' '}
                  <span className="font-medium">{aiGeneratedCharacter.name}</span>
                </div>
                <div>
                  <span className="text-gray-500">角色:</span>{' '}
                  <span className="font-medium">{aiGeneratedCharacter.role}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500">外貌:</span>{' '}
                  <span>{aiGeneratedCharacter.appearance}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500">性格:</span>{' '}
                  <span>{aiGeneratedCharacter.personality}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500">背景:</span>{' '}
                  <span>{aiGeneratedCharacter.background}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}