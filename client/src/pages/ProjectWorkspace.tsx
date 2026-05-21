import { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { 
  BookOpen, 
  Users, 
  MapPin, 
  FileText, 
  ChevronLeft, 
  Sparkles,
  Shield,
  GitBranch,
  Activity,
  Link2,
  Palette,
  MessageSquare,
  X,
  List,
  Zap,
  Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { projectsApi } from '@/api/projects'
import { AiAssistant } from '@/components/AiAssistant'
import { ContentChange } from '@/types/ai-changes'

interface ChapterContext {
  chapterId: string
  chapterContent: string
  chapterTitle: string
}

export const ProjectWorkspace = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const [showAssistant, setShowAssistant] = useState(false)
  const [chapterContext, setChapterContext] = useState<ChapterContext | undefined>()

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectId ? projectsApi.getById(projectId) : null,
    enabled: !!projectId
  })

  useEffect(() => {
    const handleChapterContextUpdate = (event: CustomEvent<ChapterContext | undefined>) => {
      setChapterContext(event.detail)
    }

    window.addEventListener('chapterContextUpdate', handleChapterContextUpdate as EventListener)
    return () => {
      window.removeEventListener('chapterContextUpdate', handleChapterContextUpdate as EventListener)
    }
  }, [])

  const handleApplyChanges = useCallback((changes: ContentChange[]) => {
    window.dispatchEvent(new CustomEvent('aiApplyChanges', { detail: changes }))
  }, [])

  const navItems = [
    { path: '', icon: BookOpen, label: '概览' },
    { path: 'characters', icon: Users, label: '人物' },
    { path: 'character-network', icon: Link2, label: '关系网络' },
    { path: 'plots', icon: GitBranch, label: '情节线' },
    { path: 'outlines', icon: List, label: '大纲' },
    { path: 'turning-points', icon: Zap, label: '转折点' },
    { path: 'timeline', icon: Calendar, label: '时间线' },
    { path: 'world', icon: MapPin, label: '世界观' },
    { path: 'chapters', icon: FileText, label: '章节' },
    { path: 'consistency-check', icon: Shield, label: '一致性检查' },
    { path: 'usage-logs', icon: Activity, label: '使用日志' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/projects')}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              返回
            </Button>
            <div className="h-6 w-px bg-gray-200" />
            <h1 className="font-semibold text-gray-900">{project?.title || '加载中...'}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant={showAssistant ? "primary" : "outline"} 
              size="sm"
              onClick={() => setShowAssistant(!showAssistant)}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              AI 对话助手
              {chapterContext && (
                <span className="ml-1 w-2 h-2 bg-green-500 rounded-full" />
              )}
            </Button>
            <Link to={`/projects/${projectId}/settings`}>
              <Button variant="ghost" size="sm">
                <Palette className="w-4 h-4 mr-2" />
                项目设置
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 border-r border-gray-200 bg-white min-h-[calc(100vh-56px)] sticky top-14">
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === `/projects/${projectId}/${item.path}` ||
                (item.path === '' && location.pathname === `/projects/${projectId}`)
              
              return (
                <Link
                  key={item.path}
                  to={`/projects/${projectId}/${item.path}`}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
          
          <div className="p-4 border-t border-gray-200 mt-4">
            <div className="bg-gradient-to-br from-indigo-50 to-amber-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <span className="font-medium text-gray-900 text-sm">AI 助手</span>
              </div>
              <p className="text-xs text-gray-600 mb-3">
                {chapterContext 
                  ? `当前章节：${chapterContext.chapterTitle || '未命名'}`
                  : '续写、检查一致性、生成摘要'
                }
              </p>
              <Button 
                className="w-full" 
                size="sm"
                onClick={() => setShowAssistant(true)}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                打开对话
              </Button>
            </div>
          </div>
        </aside>

        <main className="flex-1 flex">
          <div className={`flex-1 ${showAssistant ? 'mr-[400px]' : ''} transition-all duration-300`}>
            <Outlet />
          </div>
          
          {showAssistant && (
            <div className="fixed right-0 top-14 bottom-0 w-[400px] bg-white border-l border-gray-200 shadow-lg z-30">
              <div className="absolute top-2 right-2 z-10">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAssistant(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <AiAssistant
                chapterId={chapterContext?.chapterId}
                chapterContent={chapterContext?.chapterContent}
                chapterTitle={chapterContext?.chapterTitle}
                onApplyChanges={handleApplyChanges}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
