import { useEffect, useMemo, useState } from 'react'
import { MessageSquare, Pause, Play, Plus, Send, Trash2, X } from 'lucide-react'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { Input } from './ui/Input'
import { Textarea } from './ui/Textarea'
import { Select } from './ui/Select'
import { charactersApi, Character } from '../api/characters'
import {
  CreateDialogueSessionDto,
  DialogueCandidate,
  DialogueQualityReport,
  DialogueSession,
  dialogueSessionsApi,
} from '../api/dialogue-sessions'

interface DialogueSandboxProps {
  projectId: string
  chapterId?: string
  onClose: () => void
  onInsertText: (text: string) => void
}

export function DialogueSandbox({ projectId, chapterId, onClose, onInsertText }: DialogueSandboxProps) {
  const [sessions, setSessions] = useState<DialogueSession[]>([])
  const [characters, setCharacters] = useState<Character[]>([])
  const [selectedSession, setSelectedSession] = useState<DialogueSession | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isImproving, setIsImproving] = useState(false)
  const [instruction, setInstruction] = useState('')
  const [qualityReports, setQualityReports] = useState<DialogueQualityReport[]>([])
  const [improvedCandidate, setImprovedCandidate] = useState<DialogueCandidate | null>(null)
  const [rounds, setRounds] = useState(2)
  const [formData, setFormData] = useState<CreateDialogueSessionDto>({
    title: '',
    chapterId,
    characterIds: [],
    location: '',
    conflict: '',
    goal: '',
    mood: '',
    allowSecretReveal: false,
    length: 'medium',
  })

  useEffect(() => {
    loadData()
  }, [projectId, chapterId])

  const loadData = async () => {
    const [sessionData, characterData] = await Promise.all([
      dialogueSessionsApi.getAll(projectId, chapterId),
      charactersApi.getAll(projectId),
    ])
    setSessions(sessionData)
    setCharacters(characterData)
    if (!selectedSession && sessionData.length > 0) {
      setSelectedSession(sessionData[0])
      void loadQualityReports(sessionData[0].id)
    }
  }

  const loadQualityReports = async (sessionId: string) => {
    const reports = await dialogueSessionsApi.getQualityReports(projectId, sessionId).catch(() => [])
    setQualityReports(reports)
  }

  const selectedCharacterNames = useMemo(() => {
    const selected = new Set(formData.characterIds)
    return characters.filter((character) => selected.has(character.id)).map((character) => character.name)
  }, [characters, formData.characterIds])

  const toggleCharacter = (characterId: string) => {
    const selected = new Set(formData.characterIds)
    if (selected.has(characterId)) {
      selected.delete(characterId)
    } else if (selected.size < 4) {
      selected.add(characterId)
    }
    setFormData({ ...formData, characterIds: [...selected] })
  }

  const createSession = async () => {
    if (!formData.title.trim() || formData.characterIds.length < 2 || !formData.conflict.trim() || !formData.goal.trim()) {
      return
    }
    setIsCreating(true)
    try {
      const created = await dialogueSessionsApi.create(projectId, {
        ...formData,
        chapterId,
      })
      setSessions([created, ...sessions])
      setSelectedSession(created)
      setFormData({
        title: '',
        chapterId,
        characterIds: [],
        location: '',
        conflict: '',
        goal: '',
        mood: '',
        allowSecretReveal: false,
        length: 'medium',
      })
    } catch (error) {
      console.error('创建对话会话失败:', error)
      alert('创建对话会话失败，请检查角色数量和必填项')
    } finally {
      setIsCreating(false)
    }
  }

  const continueSession = async () => {
    if (!selectedSession) return
    setIsGenerating(true)
    try {
      const updated = await dialogueSessionsApi.continue(projectId, selectedSession.id, {
        instruction,
        rounds,
      })
      replaceSession(updated)
      setSelectedSession(updated)
      await loadQualityReports(updated.id)
      setImprovedCandidate(null)
      setInstruction('')
    } catch (error) {
      console.error('继续对话失败:', error)
      alert('继续对话失败，请检查 AI 设置或稍后重试')
    } finally {
      setIsGenerating(false)
    }
  }

  const pauseOrResume = async () => {
    if (!selectedSession) return
    const updated = selectedSession.status === 'ACTIVE'
      ? await dialogueSessionsApi.pause(projectId, selectedSession.id)
      : await dialogueSessionsApi.resume(projectId, selectedSession.id)
    replaceSession(updated)
    setSelectedSession(updated)
  }

  const improveFromReport = async () => {
    if (!selectedSession) return
    setIsImproving(true)
    try {
      const candidate = await dialogueSessionsApi.improve(projectId, selectedSession.id, {
        instruction: instruction.trim() || undefined,
      })
      setImprovedCandidate(candidate)
    } catch (error) {
      console.error('生成改写候选失败:', error)
      alert('生成改写候选失败，请检查 AI 设置或稍后重试')
    } finally {
      setIsImproving(false)
    }
  }

  const deleteSession = async () => {
    if (!selectedSession || !confirm(`确定要删除「${selectedSession.title}」吗？`)) return
    await dialogueSessionsApi.delete(projectId, selectedSession.id)
    const nextSessions = sessions.filter((session) => session.id !== selectedSession.id)
    setSessions(nextSessions)
    setSelectedSession(nextSessions[0] || null)
  }

  const replaceSession = (updated: DialogueSession) => {
    setSessions((prev) => prev.map((session) => (session.id === updated.id ? updated : session)))
  }

  const formatDialogue = (session: DialogueSession) => {
    return session.messages
      .filter((message) => message.type === 'DIALOGUE')
      .map((message) => `${message.speaker}：${message.content}`)
      .join('\n')
  }

  const warnings = selectedSession?.messages
    .flatMap((message) => {
      if (!message.metadata) return []
      try {
        const parsed = JSON.parse(message.metadata)
        return Array.isArray(parsed.oocWarnings) ? parsed.oocWarnings : []
      } catch {
        return []
      }
    })
    .filter((warning, index, all) => all.indexOf(warning) === index) || []

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            对话沙盒
          </h3>
          <p className="text-xs text-gray-500 mt-1">保存会话，按轮继续生成角色对话</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="p-1">
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="grid grid-cols-5 flex-1 min-h-0">
        <div className="col-span-2 border-r border-gray-200 overflow-y-auto p-3 space-y-3">
          <Card className="p-3 space-y-3">
            <Input
              label="会话标题"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="例如：旧港质问"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">参与角色（2-4个）</label>
              <div className="max-h-36 overflow-y-auto border rounded-lg divide-y">
                {characters.map((character) => (
                  <label key={character.id} className="flex items-center gap-2 p-2 text-sm cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.characterIds.includes(character.id)}
                      onChange={() => toggleCharacter(character.id)}
                    />
                    <span>{character.name}</span>
                  </label>
                ))}
              </div>
              {selectedCharacterNames.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">{selectedCharacterNames.join('、')}</p>
              )}
            </div>
            <Input
              label="地点"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="当前场景地点"
            />
            <Textarea
              label="当前冲突"
              value={formData.conflict}
              onChange={(e) => setFormData({ ...formData, conflict: e.target.value })}
              rows={2}
              placeholder="角色之间正在争夺、隐瞒或试探什么"
            />
            <Textarea
              label="对话目标"
              value={formData.goal}
              onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
              rows={2}
              placeholder="这段对话要推进到哪里"
            />
            <Input
              label="情绪基调"
              value={formData.mood}
              onChange={(e) => setFormData({ ...formData, mood: e.target.value })}
              placeholder="克制、紧张、暧昧..."
            />
            <div className="grid grid-cols-2 gap-2">
              <Select
                label="长度"
                value={formData.length}
                onChange={(e) => setFormData({ ...formData, length: e.target.value as any })}
              >
                <option value="short">短</option>
                <option value="medium">中</option>
                <option value="long">长</option>
              </Select>
              <label className="flex items-center gap-2 text-sm pt-7">
                <input
                  type="checkbox"
                  checked={formData.allowSecretReveal}
                  onChange={(e) => setFormData({ ...formData, allowSecretReveal: e.target.checked })}
                />
                可暴露秘密
              </label>
            </div>
            <Button
              onClick={createSession}
              isLoading={isCreating}
              disabled={formData.characterIds.length < 2 || !formData.title.trim() || !formData.conflict.trim() || !formData.goal.trim()}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              创建会话
            </Button>
          </Card>

          <div className="space-y-2">
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => {
                  setSelectedSession(session)
                  setImprovedCandidate(null)
                  void loadQualityReports(session.id)
                }}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedSession?.id === session.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <div className="font-medium text-sm text-gray-900">{session.title}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {session.status === 'ACTIVE' ? '进行中' : '已暂停'} · {session.messages.length} 条
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="col-span-3 flex flex-col min-h-0">
          {selectedSession ? (
            <>
              <div className="p-3 border-b border-gray-200">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-gray-900">{selectedSession.title}</h4>
                    <p className="text-xs text-gray-500 mt-1">{selectedSession.conflict}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={pauseOrResume}>
                      {selectedSession.status === 'ACTIVE' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onInsertText(formatDialogue(selectedSession))}>
                      插入
                    </Button>
                    <Button variant="ghost" size="sm" onClick={deleteSession}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {selectedSession.messages.map((message) => (
                  <div
                    key={message.id || `${message.order}-${message.speaker}`}
                    className={`p-3 rounded-lg ${
                      message.type === 'INSTRUCTION' ? 'bg-amber-50 border border-amber-100' : 'bg-gray-50'
                    }`}
                  >
                    <div className="text-xs font-medium text-gray-500 mb-1">{message.speaker}</div>
                    <div className="text-sm text-gray-900 whitespace-pre-wrap">{message.content}</div>
                  </div>
                ))}
                {selectedSession.messages.length === 0 && (
                  <div className="text-sm text-gray-500 text-center py-10">点击继续生成第一轮对话</div>
                )}
              </div>

              {warnings.length > 0 && (
                <div className="px-3 py-2 border-t border-gray-200 bg-yellow-50">
                  {warnings.map((warning, index) => (
                    <p key={index} className="text-xs text-yellow-800">{warning}</p>
                  ))}
                </div>
              )}

              {qualityReports.length > 0 && (
                <div className="px-3 py-2 border-t border-gray-200 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-medium text-gray-700">
                      质量报告 · {qualityReports[0].status}
                    </div>
                    <Button variant="outline" size="sm" onClick={improveFromReport} isLoading={isImproving}>
                      按报告改写
                    </Button>
                  </div>
                  {qualityReports[0].summary && (
                    <p className="text-xs text-gray-500">{qualityReports[0].summary}</p>
                  )}
                  {(qualityReports[0].issues || []).slice(0, 4).map((issue) => (
                    <div key={issue.id} className="text-xs text-yellow-800">
                      [{issue.category}/{issue.severity}] {issue.message}
                    </div>
                  ))}
                </div>
              )}

              {improvedCandidate && (
                <div className="px-3 py-2 border-t border-indigo-100 bg-indigo-50">
                  <div className="text-xs font-medium text-indigo-900 mb-2">改写候选</div>
                  <div className="space-y-1">
                    {improvedCandidate.messages.map((message, index) => (
                      <div key={index} className="text-xs text-indigo-950">
                        {message.speaker || '旁白'}：{message.content || ''}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-3 border-t border-gray-200 space-y-2">
                <Textarea
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  rows={2}
                  placeholder="追加指令：让某个角色更强势、沉默、试探或转移话题..."
                />
                <div className="flex items-center justify-between gap-2">
                  <Select value={rounds} onChange={(e) => setRounds(Number(e.target.value))} className="w-28">
                    <option value={1}>1 轮</option>
                    <option value={2}>2 轮</option>
                    <option value={3}>3 轮</option>
                  </Select>
                  <Button
                    onClick={continueSession}
                    isLoading={isGenerating}
                    disabled={selectedSession.status !== 'ACTIVE'}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    继续
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-gray-500">
              创建或选择一个对话会话
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
