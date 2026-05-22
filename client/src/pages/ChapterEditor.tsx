import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Save, 
  Sparkles, 
  AlertTriangle,
  BookOpen,
  Eye,
  Search,
  X,
  Check,
  Users,
  Link2,
  Palette,
  Flag,
  MessageSquare,
  GitBranch
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { aiApi } from '../api/ai'
import { chaptersApi } from '../api/chapters'
import { worldSettingsApi, WorldSetting, DetectedElement } from '../api/world-settings'
import { charactersApi, ComprehensiveAnalysis } from '../api/characters'
import { EnhancedWritingToolbar } from '../components/EnhancedWritingToolbar'
import { ProjectStyleSelector } from '../components/ProjectStyleSelector'
import { LorebookManager } from '../components/LorebookManager'
import { ChekhovsGunManager } from '../components/ChekhovsGunManager'
import { DialogueSandbox } from '../components/DialogueSandbox'
import { StorySystemPanel } from '../components/StorySystemPanel'
import { storySystemApi } from '../api/story-system'
import { RichTextEditor, RichTextEditorHandle } from '../components/editor/RichTextEditor'
import { ContextViewer } from '../components/ContextViewer'
import { StreamingCursor } from '../components/StreamingCursor'
import { useStreamCompletion } from '../hooks/useStreamCompletion'
import { useDebounce } from '../hooks/useDebounce'
import { ContentChange } from '../types/ai-changes'
import type { ContextPreview } from '../types/ai-context'
import { DiffRange } from '../components/editor/DiffHighlight'

interface WorldConflict {
  type: string
  severity: string
  title: string
  description: string
  content: string
  suggestion: string
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function ChapterEditor() {
  const { projectId, chapterId } = useParams<{ projectId: string; chapterId: string }>()
  const navigate = useNavigate()
  const editorRef = useRef<RichTextEditorHandle>(null)

  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  
  const [showWorldPanel, setShowWorldPanel] = useState(false)
  const [worldSettings, setWorldSettings] = useState<WorldSetting[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  
  const [conflicts, setConflicts] = useState<WorldConflict[]>([])
  const [showConflictModal, setShowConflictModal] = useState(false)
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false)

  const [showElementModal, setShowElementModal] = useState(false)
  const [extractedElements, setExtractedElements] = useState<DetectedElement[]>([])
  const [selectedElements, setSelectedElements] = useState<Set<string>>(new Set())
  const [showElementsAfterCharacters, setShowElementsAfterCharacters] = useState(false)
  const [autoOrganizeStatus, setAutoOrganizeStatus] = useState('')

  const [showCharacterRelationModal, setShowCharacterRelationModal] = useState(false)
  const [comprehensiveAnalysis, setComprehensiveAnalysis] = useState<ComprehensiveAnalysis | null>(null)
  const [selectedCharacters, setSelectedCharacters] = useState<Set<string>>(new Set())
  const [selectedRelationships, setSelectedRelationships] = useState<Set<string>>(new Set())

  const [showLorePanel, setShowLorePanel] = useState(false)
  const [showGunPanel, setShowGunPanel] = useState(false)
  const [showContextPanel, setShowContextPanel] = useState(false)
  const [showDialoguePanel, setShowDialoguePanel] = useState(false)
  const [showStorySystemPanel, setShowStorySystemPanel] = useState(false)
  const [contextPreview, setContextPreview] = useState<ContextPreview | null>(null)
  const [isLoadingContextPreview, setIsLoadingContextPreview] = useState(false)
  
  const [selectedText, setSelectedText] = useState('')
  const [showDiffControls, setShowDiffControls] = useState(false)
  const [isStoryWriting, setIsStoryWriting] = useState(false)
  const [storyWriteError, setStoryWriteError] = useState('')
  const [storyWriteText, setStoryWriteText] = useState('')
  const contentRef = useRef('')
  const lastSavedContentRef = useRef('')
  const aiOriginalContentRef = useRef('')
  const debouncedContent = useDebounce(content, 500)

  const updateContent = useCallback((newContent: string) => {
    contentRef.current = newContent
    setContent(newContent)
  }, [])

  const handleApplyAiChanges = useCallback((changes: ContentChange[]) => {
    const diffs: DiffRange[] = []
    let diffId = 1

    changes.forEach(change => {
      if (change.type === 'replace') {
        const allPositions: { from: number; to: number }[] = []
        let searchText = change.original
        let startPos = 0
        const plainText = contentRef.current.replace(/<[^>]*>/g, '')

        while (startPos < plainText.length) {
          const index = plainText.indexOf(searchText, startPos)
          if (index === -1) break
          allPositions.push({ from: index, to: index + searchText.length })
          startPos = index + 1
        }

        allPositions.forEach(pos => {
          diffs.push({
            from: pos.from,
            to: pos.to,
            type: 'deletion',
            id: `diff-${diffId++}`,
          })
          diffs.push({
            from: pos.from,
            to: pos.from + change.suggested.length,
            type: 'addition',
            id: `diff-${diffId++}`,
          })
        })
      } else if (change.type === 'delete') {
        const plainText = contentRef.current.replace(/<[^>]*>/g, '')
        let searchText = change.original
        let startPos = 0

        while (startPos < plainText.length) {
          const index = plainText.indexOf(searchText, startPos)
          if (index === -1) break
          diffs.push({
            from: index,
            to: index + searchText.length,
            type: 'deletion',
            id: `diff-${diffId++}`,
          })
          startPos = index + 1
        }
      } else if (change.type === 'insert') {
        const insertPos = change.startIndex ?? contentRef.current.replace(/<[^>]*>/g, '').length
        diffs.push({
          from: insertPos,
          to: insertPos + change.suggested.length,
          type: 'addition',
          id: `diff-${diffId++}`,
        })
      }
    })

    if (diffs.length > 0) {
      editorRef.current?.setDiffHighlights(diffs)
      setShowDiffControls(true)
    }
  }, [])

  useEffect(() => {
    const handleAiApplyChanges = (event: CustomEvent) => {
      handleApplyAiChanges(event.detail)
    }

    window.addEventListener('aiApplyChanges', handleAiApplyChanges as EventListener)
    return () => {
      window.removeEventListener('aiApplyChanges', handleAiApplyChanges as EventListener)
    }
  }, [handleApplyAiChanges])

  useEffect(() => {
    if (chapterId) {
      loadChapter()
    }
    loadWorldSettings()
  }, [chapterId, projectId])

  const loadChapter = async () => {
    if (!projectId || !chapterId) return
    try {
      const chapter = await chaptersApi.getById(projectId, chapterId)
      setTitle(chapter.title)
      const fullContent = chapter.contents?.map(c => c.content).join('\n') || ''
      lastSavedContentRef.current = fullContent
      updateContent(fullContent)
    } catch (error) {
      console.error('加载章节失败:', error)
    }
  }

  const loadWorldSettings = async () => {
    if (!projectId) return
    try {
      const settings = await worldSettingsApi.getAll(projectId)
      setWorldSettings(settings)
    } catch (error) {
      console.error('加载世界观设定失败:', error)
    }
  }

  const loadContextPreview = useCallback(async () => {
    if (!projectId) return
    setIsLoadingContextPreview(true)
    try {
      const plainText = contentRef.current.replace(/<[^>]*>/g, '')
      const preview = await aiApi.getContextPreview(projectId, {
        chapterId: chapterId || undefined,
        currentText: plainText || undefined,
      })
      setContextPreview(preview)
    } catch (error) {
      console.error('加载上下文预览失败:', error)
    } finally {
      setIsLoadingContextPreview(false)
    }
  }, [projectId, chapterId])

  useEffect(() => {
    if (projectId && chapterId) {
      loadContextPreview()
    }
  }, [projectId, chapterId, loadContextPreview])

  const checkConflicts = useCallback(async (text: string) => {
    if (!projectId || !text.trim()) {
      setConflicts([])
      setShowConflictModal(false)
      return
    }

    setIsCheckingConflicts(true)
    try {
      const result = await worldSettingsApi.detectConflicts(projectId, text)
      if (result.hasConflict && result.conflicts.length > 0) {
        setConflicts(result.conflicts)
        setShowConflictModal(true)
      } else {
        setConflicts([])
        setShowConflictModal(false)
      }
    } catch (error) {
      console.error('冲突检测失败:', error)
    } finally {
      setIsCheckingConflicts(false)
    }
  }, [projectId])

  const handleSave = async () => {
    if (!projectId || !chapterId) return
    setIsSaving(true)
    try {
      const paragraphs = content.split('\n\n').filter(p => p.trim())
      const contents = paragraphs.map((p, i) => ({
        content: p,
        order: i,
      }))
      
      await chaptersApi.updateContent(projectId, chapterId, { title, contents })
      lastSavedContentRef.current = content
      setLastSaved(new Date())
      await checkConflicts(content)
    } catch (error) {
      console.error('保存失败:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePostAiExtraction = useCallback(async (aiText: string, existingContent: string) => {
    if (!projectId) return

    try {
      setAutoOrganizeStatus('正在抽取人物、关系和世界观...')
      const [worldAnalysis, charAnalysis] = await Promise.all([
        worldSettingsApi.extractElements(projectId, aiText, existingContent),
        charactersApi.analyzeComprehensive(projectId, aiText)
      ])

      const hasNewElements = worldAnalysis.newElements && worldAnalysis.newElements.length > 0
      const hasNewCharacters = charAnalysis.newCharacters && charAnalysis.newCharacters.length > 0
      const hasNewRelationships = charAnalysis.newRelationships && charAnalysis.newRelationships.length > 0

      if (hasNewElements) {
        setExtractedElements(worldAnalysis.newElements)
        setSelectedElements(new Set(worldAnalysis.newElements.map((element: DetectedElement) => element.name)))
      } else {
        setExtractedElements([])
        setSelectedElements(new Set())
        setShowElementsAfterCharacters(false)
      }

      if (hasNewCharacters || hasNewRelationships) {
        setAutoOrganizeStatus('发现可整理的人物或关系，等待确认')
        setComprehensiveAnalysis(charAnalysis)
        if (charAnalysis.newCharacters) {
          setSelectedCharacters(new Set(charAnalysis.newCharacters.map(c => c.name)))
        }
        if (charAnalysis.newRelationships) {
          setSelectedRelationships(new Set(
            charAnalysis.newRelationships.map(r => `${r.character1}|${r.character2}|${r.relationship}`)
          ))
        }
        setShowElementsAfterCharacters(hasNewElements)
        setShowCharacterRelationModal(true)
        return
      }

      if (hasNewElements) {
        setAutoOrganizeStatus('发现可整理的世界观元素，等待确认')
        setShowElementsAfterCharacters(false)
        setShowElementModal(true)
      } else {
        setAutoOrganizeStatus('AI 已完成自动整理，未发现新的待确认项')
      }
    } catch (error) {
      console.error('分析失败:', error)
      setAutoOrganizeStatus('自动整理失败，可稍后手动重试')
    }
  }, [projectId])

  const appendAiText = useCallback(async (completion: string, originalContent: string) => {
    if (!completion.trim()) return

    const latestContent = contentRef.current
    const completionHtml = `<p>${escapeHtml(completion).replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br>')}</p>`
    const newContent = `${latestContent}${completionHtml}`
    updateContent(newContent)
    await handlePostAiExtraction(completion, originalContent)
    setAutoOrganizeStatus(prev => prev || '正在检测世界观冲突...')
    await checkConflicts(newContent)
  }, [checkConflicts, handlePostAiExtraction, updateContent])

  const {
    isStreaming,
    streamedText,
    error: streamingError,
  } = useStreamCompletion({
    onComplete: async (completion) => {
      await appendAiText(completion, aiOriginalContentRef.current)
    },
    onError: (error) => {
      console.error('AI 续写失败:', error)
    },
  })

  const handleAiWrite = async () => {
    const originalContent = contentRef.current
    if (!projectId || !chapterId || !originalContent.trim()) return

    if (isStoryWriting) {
      return
    }

    aiOriginalContentRef.current = originalContent
    setIsStoryWriting(true)
    setStoryWriteError('')
    setStoryWriteText('')
    try {
      const result = await storySystemApi.writeChapter(projectId, chapterId, {
        content: originalContent,
      })
      if (result.blocked) {
        setStoryWriteError(result.preflight.blockingReasons.join('；') || 'Story System 预检阻断')
        return
      }
      setStoryWriteText(result.completion)
      await appendAiText(result.completion, originalContent)
      await loadContextPreview()
    } catch (error) {
      console.error('Story System 续写失败:', error)
      setStoryWriteError(error instanceof Error ? error.message : 'Story System 续写失败')
    } finally {
      setIsStoryWriting(false)
    }
  }

  useEffect(() => {
    if (!projectId || !chapterId || !debouncedContent.trim()) return
    if (debouncedContent === lastSavedContentRef.current) return

    handleSave()
  }, [debouncedContent, projectId, chapterId])

  const handleSearch = async () => {
    if (!projectId || !searchQuery.trim()) {
      setSearchResults([])
      return
    }
    try {
      const results = await worldSettingsApi.search(projectId, searchQuery)
      setSearchResults(results)
    } catch (error) {
      console.error('搜索失败:', error)
    }
  }

  useEffect(() => {
    if (searchQuery.trim()) {
      const timer = setTimeout(handleSearch, 300)
      return () => clearTimeout(timer)
    } else {
      setSearchResults([])
    }
  }, [searchQuery, projectId])

  const insertSettingReference = (setting: WorldSetting) => {
    let referenceText = `\n【世界观引用 - ${setting.name}】\n`
    if (setting.description) {
      referenceText += setting.description + '\n'
    }
    if (setting.items && setting.items.length > 0) {
      referenceText += setting.items.map(item => `- ${item.name}: ${item.description || ''}`).join('\n')
    }
    referenceText += '\n'

    editorRef.current?.insertText(referenceText)
    setShowWorldPanel(false)
  }

  const handleBlurCheck = () => {
    if (content.trim() && content.length > 100) {
      checkConflicts(content)
    }
  }

  const handleInsertText = (newText: string) => {
    editorRef.current?.insertText(newText)
  }

  const showQueuedWorldElements = () => {
    const shouldShowElements = showElementsAfterCharacters && extractedElements.length > 0
    setShowElementsAfterCharacters(false)
    if (shouldShowElements) {
      setTimeout(() => setShowElementModal(true), 0)
    }
  }

  const closeElementModal = () => {
    setShowElementModal(false)
    setShowElementsAfterCharacters(false)
    setExtractedElements([])
    setSelectedElements(new Set())
  }

  const closeCharacterRelationModal = () => {
    setShowCharacterRelationModal(false)
    showQueuedWorldElements()
  }

  const handleAddCharactersAndRelations = async () => {
    if (!projectId || !comprehensiveAnalysis) return

    try {
      const charactersToAdd = comprehensiveAnalysis.newCharacters
        ?.filter(c => selectedCharacters.has(c.name))
        .map(c => ({
          name: c.name,
          role: c.role || '',
          description: c.description || '',
          appearance: '',
          personality: '',
          background: '',
          goals: '',
          flaws: '',
          arc: '',
          voice: '',
          notes: '',
        })) || []

      const newCharacterIds = new Map<string, string>()
      for (const charData of charactersToAdd) {
        const newChar = await charactersApi.create(projectId, charData)
        newCharacterIds.set(charData.name, newChar.id)
      }

      const allCharacters = await charactersApi.getAll(projectId)
      const charNameToId = new Map(allCharacters.map(c => [c.name, c.id]))
      newCharacterIds.forEach((id, name) => {
        charNameToId.set(name, id)
      })

      const relationsToAdd = comprehensiveAnalysis.newRelationships
        ?.filter(r => {
          const key = `${r.character1}|${r.character2}|${r.relationship}`
          return selectedRelationships.has(key)
        })
        .filter(r => {
          return charNameToId.has(r.character1) && charNameToId.has(r.character2)
        })
        .map(r => ({
          fromId: charNameToId.get(r.character1)!,
          toId: charNameToId.get(r.character2)!,
          relationship: r.relationship,
          description: r.description || '',
        })) || []

      for (const relationData of relationsToAdd) {
        await charactersApi.createRelationship(projectId, relationData)
      }

      await loadWorldSettings()
      closeCharacterRelationModal()
      setComprehensiveAnalysis(null)
      setSelectedCharacters(new Set())
      setSelectedRelationships(new Set())
    } catch (error) {
      console.error('添加失败:', error)
    }
  }

  const settingsByCategory = worldSettings.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = []
    }
    acc[setting.category].push(setting)
    return acc
  }, {} as Record<string, WorldSetting[]>)

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(`/projects/${projectId}/chapters`)}>
              返回
            </Button>
            <div className="h-6 w-px bg-gray-200" />
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-semibold border-none bg-transparent focus:bg-gray-50 px-2 py-1"
              placeholder="章节标题"
            />
          </div>
          <div className="flex items-center gap-3">
            {lastSaved && (
              <span className="text-sm text-gray-500">
                已保存 {lastSaved.toLocaleTimeString('zh-CN')}
              </span>
            )}
            {autoOrganizeStatus && (
              <span className="hidden lg:inline text-sm text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                {autoOrganizeStatus}
              </span>
            )}
            {projectId && <ProjectStyleSelector projectId={projectId} />}
            <Button variant="outline" size="sm" onClick={() => setShowWorldPanel(!showWorldPanel)}>
              <BookOpen className="w-4 h-4 mr-2" />
              世界观
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowLorePanel(!showLorePanel)}>
              <Palette className="w-4 h-4 mr-2" />
              Lorebook
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowGunPanel(!showGunPanel)}>
              <Flag className="w-4 h-4 mr-2" />
              伏笔
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowContextPanel(!showContextPanel)}>
              <Eye className="w-4 h-4 mr-2" />
              AI 视野
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowStorySystemPanel(!showStorySystemPanel)}>
              <GitBranch className="w-4 h-4 mr-2" />
              Story
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowDialoguePanel(!showDialoguePanel)}>
              <MessageSquare className="w-4 h-4 mr-2" />
              对话沙盒
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => checkConflicts(content)}
              disabled={isCheckingConflicts || !content.trim()}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              {isCheckingConflicts ? '检测中...' : '冲突检测'}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleAiWrite}
              disabled={isStoryWriting || !content.trim()}
            >
              {isStoryWriting ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Story 写作中
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Story 续写
                </>
              )}
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? '保存中...' : '保存'}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="px-6 pt-4">
            {projectId && (
              <EnhancedWritingToolbar 
                selectedText={selectedText} 
                onInsertText={handleInsertText} 
              />
            )}
          </div>
          <div className="flex-1 p-6 overflow-auto">
            <Card className="h-full">
              <RichTextEditor
                ref={editorRef}
                content={content}
                onChange={updateContent}
                onBlur={handleBlurCheck}
                onSelectionChange={setSelectedText}
                showDiffControls={showDiffControls}
                placeholder="开始写作...

你可以在这里输入小说内容。写完后可以：
- 点击「AI 续写」让 AI 帮你续写
- 点击「冲突检测」检查与世界观的一致性
- 点击「世界观」引用已设定的世界观内容
- 选中文字后使用增强写作工具"
                className="w-full h-full min-h-[500px]"
              />
            </Card>
            {(isStreaming || streamedText || streamingError || isStoryWriting || storyWriteText || storyWriteError) && (
              <Card className="mt-4 p-4">
                <div className="mb-2 text-sm text-gray-500">
                  {isStoryWriting
                    ? 'Story System 正在生成：'
                    : storyWriteError || streamingError
                      ? 'AI 生成失败'
                      : 'AI 生成结果'}
                </div>
                {storyWriteError || streamingError ? (
                  <div className="text-sm text-red-600">{storyWriteError || streamingError?.message}</div>
                ) : (
                  <div className="whitespace-pre-wrap text-gray-800">
                    {storyWriteText || streamedText}
                    <StreamingCursor isVisible={isStreaming || isStoryWriting} />
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>

        {showWorldPanel && (
          <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">世界观设定</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowWorldPanel(false)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索设定..."
                  className="pl-9"
                />
              </div>
            </div>

            {searchQuery.trim() && searchResults.length > 0 ? (
              <div className="p-2">
                <p className="text-xs text-gray-500 px-2 py-1 mb-2">搜索结果</p>
                {searchResults.map(setting => (
                  <Button
                    key={setting.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => insertSettingReference(setting as WorldSetting)}
                    className="w-full justify-start text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{setting.name}</span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        {setting.category}
                      </span>
                    </div>
                    {setting.matchedItems && setting.matchedItems.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        匹配: {setting.matchedItems.map((i: any) => i.name).join(', ')}
                      </p>
                    )}
                  </Button>
                ))}
              </div>
            ) : (
              <div className="p-2">
                {Object.entries(settingsByCategory).map(([category, settings]) => (
                  <div key={category} className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 px-2 py-1">{category}</h4>
                    {settings.map(setting => (
                      <Button
                        key={setting.id}
                        variant="ghost"
                        size="sm"
                        onClick={() => insertSettingReference(setting)}
                        className="w-full justify-start text-left p-2 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-gray-900">{setting.name}</span>
                      </Button>
                    ))}
                  </div>
                ))}
                
                {worldSettings.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p className="mb-2">还没有世界观设定</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigate(`/projects/${projectId}/world`)}
                    >
                      去创建
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {showLorePanel && projectId && (
          <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
            <div className="h-full">
              <LorebookManager projectId={projectId} />
            </div>
          </div>
        )}

        {showGunPanel && projectId && (
          <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
            <div className="h-full">
              <ChekhovsGunManager projectId={projectId} />
            </div>
          </div>
        )}

        {showContextPanel && (
          <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto p-4">
            <ContextViewer
              preview={contextPreview}
              isLoading={isLoadingContextPreview}
              onRefresh={loadContextPreview}
            />
          </div>
        )}

        {showDialoguePanel && projectId && (
          <div className="w-[48rem] bg-white border-l border-gray-200 overflow-y-auto">
            <DialogueSandbox
              projectId={projectId}
              chapterId={chapterId}
              onClose={() => setShowDialoguePanel(false)}
              onInsertText={handleInsertText}
            />
          </div>
        )}

        {showStorySystemPanel && projectId && chapterId && (
          <div className="w-[30rem] bg-white border-l border-gray-200 overflow-y-auto">
            <StorySystemPanel
              projectId={projectId}
              chapterId={chapterId}
              content={content}
              onClose={() => setShowStorySystemPanel(false)}
            />
          </div>
        )}
      </div>

      <Modal
        isOpen={showConflictModal}
        onClose={() => setShowConflictModal(false)}
        title="世界观冲突检测"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            检测到 {conflicts.length} 个可能的世界观冲突：
          </p>
          
          {conflicts.map((conflict, index) => (
            <div 
              key={index}
              className={`p-4 rounded-lg border-l-4 ${
                conflict.severity === 'critical' 
                  ? 'bg-red-50 border-red-500' 
                  : conflict.severity === 'warning'
                  ? 'bg-yellow-50 border-yellow-500'
                  : 'bg-blue-50 border-blue-500'
              }`}
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className={`w-5 h-5 ${
                  conflict.severity === 'critical' 
                    ? 'text-red-600' 
                    : conflict.severity === 'warning'
                    ? 'text-yellow-600'
                    : 'text-blue-600'
                }`} />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{conflict.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{conflict.description}</p>
                  <div className="mt-2 p-2 bg-white rounded text-sm">
                    <span className="text-gray-500">相关文本：</span>
                    <span className="text-gray-700">{conflict.content}</span>
                  </div>
                  <div className="mt-2 text-sm">
                    <span className="font-medium text-gray-700">建议：</span>
                    <span className="text-gray-600">{conflict.suggestion}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowConflictModal(false)}>
              忽略
            </Button>
            <Button onClick={() => {
              setShowConflictModal(false)
              navigate(`/projects/${projectId}/world`)
            }}>
              查看世界观设定
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showElementModal}
        onClose={closeElementModal}
        title="发现新世界观元素"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            AI 续写中发现了 {extractedElements.length} 个可能需要添加的世界观元素：
          </p>
          
          <div className="max-h-80 overflow-y-auto space-y-2">
            {extractedElements.map((element, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                  selectedElements.has(element.name)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
                onClick={() => {
                  const newSelected = new Set(selectedElements)
                  if (newSelected.has(element.name)) {
                    newSelected.delete(element.name)
                  } else {
                    newSelected.add(element.name)
                  }
                  setSelectedElements(newSelected)
                }}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 ${
                    selectedElements.has(element.name)
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedElements.has(element.name) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{element.name}</span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        {element.type === 'character' ? '人物' :
                         element.type === 'location' ? '地点' :
                         element.type === 'magic' ? '魔法/能力' :
                         element.type === 'organization' ? '组织' :
                         element.type === 'item' ? '物品' : '概念'}
                      </span>
                    </div>
                    {element.description && (
                      <p className="text-sm text-gray-500 mt-1">{element.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      原文：{element.context}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={closeElementModal}>
              忽略
            </Button>
            <Button onClick={async () => {
              if (!projectId) return
              const elementsToAdd = extractedElements
                .filter(e => selectedElements.has(e.name))
                .map(e => ({ type: e.type, name: e.name, description: e.description }))
              
              try {
                await worldSettingsApi.batchAddElements(projectId, elementsToAdd)
                await loadWorldSettings()
                closeElementModal()
              } catch (error) {
                console.error('添加元素失败:', error)
              }
            }}>
              添加到世界观 ({selectedElements.size})
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showCharacterRelationModal}
        onClose={closeCharacterRelationModal}
        title="发现新人物与关系"
      >
        <div className="space-y-6">
          {comprehensiveAnalysis?.newCharacters && comprehensiveAnalysis.newCharacters.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-gray-500" />
                <h3 className="font-medium text-gray-900">新人物</h3>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {comprehensiveAnalysis.newCharacters.map((char, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                      selectedCharacters.has(char.name)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                    onClick={() => {
                      const newSelected = new Set(selectedCharacters)
                      if (newSelected.has(char.name)) {
                        newSelected.delete(char.name)
                      } else {
                        newSelected.add(char.name)
                      }
                      setSelectedCharacters(newSelected)
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 ${
                        selectedCharacters.has(char.name)
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedCharacters.has(char.name) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{char.name}</span>
                          {char.role && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                              {char.role}
                            </span>
                          )}
                        </div>
                        {char.description && (
                          <p className="text-sm text-gray-500 mt-1">{char.description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          原文：{char.context}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {comprehensiveAnalysis?.newRelationships && comprehensiveAnalysis.newRelationships.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Link2 className="w-5 h-5 text-gray-500" />
                <h3 className="font-medium text-gray-900">新关系</h3>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {comprehensiveAnalysis.newRelationships.map((rel, index) => {
                  const key = `${rel.character1}|${rel.character2}|${rel.relationship}`
                  return (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                        selectedRelationships.has(key)
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                      onClick={() => {
                        const newSelected = new Set(selectedRelationships)
                        if (newSelected.has(key)) {
                          newSelected.delete(key)
                        } else {
                          newSelected.add(key)
                        }
                        setSelectedRelationships(newSelected)
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 ${
                          selectedRelationships.has(key)
                            ? 'border-green-500 bg-green-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedRelationships.has(key) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-gray-900">{rel.character1}</span>
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                              {rel.relationship}
                            </span>
                            <span className="font-medium text-gray-900">{rel.character2}</span>
                          </div>
                          {rel.description && (
                            <p className="text-sm text-gray-500 mt-1">{rel.description}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            原文：{rel.context}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => {
              closeCharacterRelationModal()
              setComprehensiveAnalysis(null)
              setSelectedCharacters(new Set())
              setSelectedRelationships(new Set())
            }}>
              忽略
            </Button>
            <Button 
              onClick={handleAddCharactersAndRelations}
              disabled={selectedCharacters.size === 0 && selectedRelationships.size === 0}
            >
              添加 ({selectedCharacters.size + selectedRelationships.size})
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
