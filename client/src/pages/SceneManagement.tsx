import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  MapPin,
  Clock,
  Users,
  Grid3x3,
  List,
  ChevronRight,
  Film,
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Modal } from '../components/ui/Modal'
import { scenesApi } from '../api/scenes'
import type { Scene } from '../api/scenes'

interface SceneFormData {
  title: string
  summary: string
  location: string
  timePeriod: string
  characters: string
  content: string
}

export function SceneManagement() {
  const { projectId } = useParams<{ projectId: string }>()

  const [scenes, setScenes] = useState<Scene[]>([])
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const [formData, setFormData] = useState<SceneFormData>({
    title: '',
    summary: '',
    location: '',
    timePeriod: '',
    characters: '',
    content: '',
  })

  useEffect(() => {
    loadScenes()
  }, [projectId])

  const loadScenes = async () => {
    if (!projectId) return
    try {
      const data = await scenesApi.getAll(projectId)
      setScenes(data)
    } catch (error) {
      console.error('加载场景失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = () => {
    setModalMode('create')
    setFormData({
      title: '',
      summary: '',
      location: '',
      timePeriod: '',
      characters: '',
      content: '',
    })
    setIsModalOpen(true)
  }

  const handleEdit = (scene: Scene) => {
    setModalMode('edit')
    setSelectedScene(scene)
    setFormData({
      title: scene.title,
      summary: scene.summary || '',
      location: scene.location || '',
      timePeriod: scene.timePeriod || '',
      characters: scene.characters?.join('、') || '',
      content: scene.content || '',
    })
    setIsModalOpen(true)
  }

  const handleViewDetail = (scene: Scene) => {
    setSelectedScene(scene)
    setIsDetailModalOpen(true)
  }

  const handleDelete = async (scene: Scene) => {
    if (!projectId || !confirm(`确定要删除「${scene.title}」吗？`)) return
    try {
      await scenesApi.delete(projectId, scene.id)
      await loadScenes()
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  const handleSubmit = async () => {
    if (!projectId || !formData.title.trim()) return

    try {
      if (modalMode === 'create') {
        await scenesApi.create(projectId, {
          title: formData.title,
          summary: formData.summary || undefined,
          location: formData.location || undefined,
          timePeriod: formData.timePeriod || undefined,
          characters: formData.characters.trim() || undefined,
          content: formData.content || undefined,
        })
      } else if (selectedScene) {
        await scenesApi.update(projectId, selectedScene.id, {
          title: formData.title,
          summary: formData.summary || undefined,
          location: formData.location || undefined,
          timePeriod: formData.timePeriod || undefined,
          characters: formData.characters.trim() || undefined,
          content: formData.content || undefined,
        })
      }
      setIsModalOpen(false)
      await loadScenes()
    } catch (error) {
      console.error('保存失败:', error)
    }
  }

  const getFilteredScenes = () => {
    return scenes.filter(scene => {
      const matchesSearch = !searchQuery ||
        scene.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        scene.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        scene.location?.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesSearch
    })
  }

  const filteredScenes = getFilteredScenes()

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-700 bg-clip-text text-transparent">
              场景管理
            </h1>
            <p className="text-gray-600 mt-2">规划故事中的每个关键时刻</p>
          </div>
          <Button onClick={handleCreate} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
            <Plus className="w-4 h-4 mr-2" />
            创建场景
          </Button>
        </div>

        <div className="flex gap-4 mb-6 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索场景..."
              className="pl-10 w-full"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Grid3x3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${
                viewMode === 'list'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredScenes.map((scene, index) => (
              <Card
                key={scene.id}
                className="group overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer"
                style={{
                  animation: `fadeInUp 0.4s ease-out ${index * 0.05}s both`
                }}
                onClick={() => handleViewDetail(scene)}
              >
                <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {scene.title}
                      </h3>
                      {scene.timePeriod && (
                        <span className="inline-flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full mt-2">
                          <Clock className="w-3 h-3" />
                          {scene.timePeriod}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEdit(scene)
                        }}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(scene)
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {scene.summary && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {scene.summary}
                    </p>
                  )}

                  <div className="space-y-2">
                    {scene.location && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <MapPin className="w-4 h-4 text-indigo-500" />
                        <span>{scene.location}</span>
                      </div>
                    )}
                    {scene.characters && scene.characters.length > 0 && (
                      <div className="flex items-start gap-2 text-sm text-gray-500">
                        <Users className="w-4 h-4 text-purple-500 mt-0.5" />
                        <div className="flex flex-wrap gap-1">
                          {scene.characters.slice(0, 3).map((char: string, i: number) => (
                            <span key={i} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                              {char}
                            </span>
                          ))}
                          {scene.characters.length > 3 && (
                            <span className="text-gray-400">+{scene.characters.length - 3}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-xs text-gray-400">
                      场景 {scene.order + 1}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Card>
            ))}

            {filteredScenes.length === 0 && (
              <div className="col-span-full text-center py-20">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                  <Film className="w-12 h-12 text-indigo-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">还没有场景</h3>
                <p className="text-gray-500 mb-6">开始创建你的第一个故事场景吧</p>
                <Button onClick={handleCreate}>创建场景</Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredScenes.map((scene, index) => (
              <Card
                key={scene.id}
                className="hover:shadow-lg transition-all duration-200 cursor-pointer group"
                style={{
                  animation: `fadeInLeft 0.3s ease-out ${index * 0.03}s both`
                }}
                onClick={() => handleViewDetail(scene)}
              >
                <div className="p-6 flex items-center gap-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                    {scene.order + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {scene.title}
                      </h3>
                      {scene.timePeriod && (
                        <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                          {scene.timePeriod}
                        </span>
                      )}
                    </div>

                    {scene.summary && (
                      <p className="text-sm text-gray-600 line-clamp-1">
                        {scene.summary}
                      </p>
                    )}

                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      {scene.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-indigo-500" />
                          <span>{scene.location}</span>
                        </div>
                      )}
                      {scene.characters && scene.characters.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-purple-500" />
                          <span>{scene.characters.length}人</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEdit(scene)
                      }}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(scene)
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                </div>
              </Card>
            ))}

            {filteredScenes.length === 0 && (
              <div className="text-center py-20">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                  <Film className="w-12 h-12 text-indigo-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">还没有场景</h3>
                <p className="text-gray-500 mb-6">开始创建你的第一个故事场景吧</p>
                <Button onClick={handleCreate}>创建场景</Button>
              </div>
            )}
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? '创建场景' : '编辑场景'}
        size="lg"
      >
        <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              场景标题 <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="例如：相遇"
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                地点
              </label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="例如：森林深处"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                时间
              </label>
              <Input
                value={formData.timePeriod}
                onChange={(e) => setFormData({ ...formData, timePeriod: e.target.value })}
                placeholder="例如：深夜、三个月后"
                className="w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              涉及人物
            </label>
            <Input
              value={formData.characters}
              onChange={(e) => setFormData({ ...formData, characters: e.target.value })}
              placeholder="多个角色用顿号、分号或逗号分隔"
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              例如：张三、李四、王五
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              场景概述
            </label>
            <Textarea
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              placeholder="简要描述这个场景发生的故事..."
              rows={3}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              详细描写
            </label>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="详细描述场景中的动作、对话、情感..."
              rows={6}
              className="w-full"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t mt-6">
          <Button variant="outline" onClick={() => setIsModalOpen(false)}>
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!formData.title.trim()}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            {modalMode === 'create' ? '创建场景' : '保存修改'}
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={selectedScene?.title || ''}
        size="lg"
      >
        {selectedScene && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {selectedScene.location && (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-5 h-5 text-indigo-600" />
                    <h4 className="font-semibold text-gray-900">地点</h4>
                  </div>
                  <p className="text-gray-700">{selectedScene.location}</p>
                </div>
              )}
              {selectedScene.timePeriod && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-purple-600" />
                    <h4 className="font-semibold text-gray-900">时间</h4>
                  </div>
                  <p className="text-gray-700">{selectedScene.timePeriod}</p>
                </div>
              )}
            </div>

            {selectedScene.characters && selectedScene.characters.length > 0 && (
              <div className="bg-gradient-to-br from-pink-50 to-rose-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-5 h-5 text-pink-600" />
                  <h4 className="font-semibold text-gray-900">涉及人物</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedScene.characters.map((char, i) => (
                    <span
                      key={i}
                      className="bg-white text-gray-700 px-3 py-1.5 rounded-full text-sm shadow-sm"
                    >
                      {char}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedScene.summary && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">场景概述</h4>
                <p className="text-gray-700 leading-relaxed">{selectedScene.summary}</p>
              </div>
            )}

            {selectedScene.content && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">详细描写</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {selectedScene.content}
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t">
              <span className="text-sm text-gray-500">
                创建于 {new Date(selectedScene.createdAt).toLocaleDateString('zh-CN')}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDetailModalOpen(false)
                    handleEdit(selectedScene)
                  }}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  编辑
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (confirm(`确定要删除「${selectedScene.title}」吗？`)) {
                      handleDelete(selectedScene)
                      setIsDetailModalOpen(false)
                    }
                  }}
                  className="text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  删除
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  )
}
