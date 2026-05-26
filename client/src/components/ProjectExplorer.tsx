import { useState } from 'react'
import { useLocation, useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { 
  BookOpen, 
  Users, 
  MapPin, 
  FileText, 
  ChevronDown,
  ChevronRight,
  ChevronUp,
  GitBranch,
  Activity,
  Link2,
  Calendar,
  LineChart,
  Network,
  List,
  Zap,
  Shield,
  Folder,
  FolderOpen,
  Plus,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { projectsApi } from '@/api/projects'
import { ConversationList } from './ConversationList'
import { CreateProjectModal } from './CreateProjectModal'

interface ProjectExplorerProps {
  onOpenRoute?: (path: string) => void
  currentConversationId?: string
  onSelectConversation?: (id: string) => void
  onCreateConversation?: () => void
}

const sections = [
  {
    label: '核心',
    items: [
      { path: '', icon: BookOpen, label: '概览' },
    ]
  },
  {
    label: '角色',
    items: [
      { path: 'characters', icon: Users, label: '人物' },
      { path: 'character-network', icon: Link2, label: '关系网络' },
    ]
  },
  {
    label: '世界观',
    items: [
      { path: 'world', icon: MapPin, label: '世界设定' },
    ]
  },
  {
    label: '剧情',
    items: [
      { path: 'chapters', icon: FileText, label: '章节管理' },
      { path: 'plots', icon: GitBranch, label: '情节线' },
      { path: 'scenes', icon: Activity, label: '场景' },
      { path: 'outlines', icon: List, label: '大纲' },
      { path: 'turning-points', icon: Zap, label: '转折点' },
      { path: 'timeline', icon: Calendar, label: '时间线' },
    ]
  },
  {
    label: '分析',
    items: [
      { path: 'consistency-check', icon: Shield, label: '一致性检查' },
      { path: 'reader-experience', icon: Users, label: '读者体验' },
      { path: 'story-graph', icon: Network, label: '故事图谱' },
      { path: 'usage-logs', icon: LineChart, label: '使用记录' },
    ]
  },
]

export const ProjectExplorer: React.FC<ProjectExplorerProps> = ({
  onOpenRoute,
  currentConversationId,
  onSelectConversation,
  onCreateConversation,
}) => {
  const { projectId } = useParams<{ projectId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['核心', '角色', '世界观', '剧情']))
  const [showProjectList, setShowProjectList] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getAll,
    enabled: showProjectList,
  })

  const toggleSection = (label: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(label)) {
        next.delete(label)
      } else {
        next.add(label)
      }
      return next
    })
  }

  const handleItemClick = (path: string) => {
    if (onOpenRoute) {
      onOpenRoute(path)
    } else {
      if (path === '') {
        navigate(`/projects/${projectId}`)
      } else {
        navigate(`/projects/${projectId}/${path}`)
      }
    }
    setShowProjectList(false)
  }

  const handleProjectSelect = (targetProjectId: string) => {
    navigate(`/projects/${targetProjectId}`)
    setShowProjectList(false)
  }

  return (
    <div className="h-full flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
        <button
          onClick={() => setShowProjectList(!showProjectList)}
          className="flex items-center gap-2 text-sm font-medium"
        >
          {showProjectList ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
          <span>项目</span>
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowProjectList(true)}
            className="p-1 hover:bg-[var(--bg-tertiary)] rounded transition-colors"
          >
            <FolderOpen className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="p-1 hover:bg-[var(--bg-tertiary)] rounded transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showProjectList && (
        <div className="border-b border-[var(--border-color)] max-h-48 overflow-y-auto">
          {isLoading ? (
            <div className="px-4 py-2 text-xs text-[var(--text-muted)]">加载中...</div>
          ) : (
            <div className="py-2">
              {projects?.map(project => (
                <button
                  key={project.id}
                  onClick={() => handleProjectSelect(project.id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-4 py-2 text-xs transition-colors",
                    project.id === projectId
                      ? "bg-[var(--bg-tertiary)] text-[var(--accent-color)]"
                      : "text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                  )}
                >
                  <Folder className="w-3.5 h-3.5" />
                  <span className="flex-1 text-left truncate">{project.title}</span>
                </button>
              ))}
              <button
                onClick={() => {
                  setShowProjectList(false)
                  setIsCreateModalOpen(true)
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors border-t border-[var(--border-color)]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="flex-1 text-left">新建项目</span>
              </button>
            </div>
          )}
        </div>
      )}
      
      <div className="border-b border-[var(--border-color)]">
        <ConversationList
          currentConversationId={currentConversationId}
          onSelectConversation={onSelectConversation || (() => {})}
          onCreateConversation={onCreateConversation || (() => {})}
        />
      </div>
      
      <div className="flex-1 overflow-y-auto py-1">
        {sections.map((section) => {
          const isExpanded = expandedSections.has(section.label)
          
          return (
            <div key={section.label} className="select-none">
              <button
                onClick={() => toggleSection(section.label)}
                className="w-full flex items-center gap-1.5 px-2 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
                <Folder className="w-3.5 h-3.5" />
                <span>{section.label}</span>
              </button>
              
              {isExpanded && (
                <div className="ml-4">
                  {section.items.map((item) => {
                    const isActive = location.pathname === `/projects/${projectId}/${item.path}` ||
                      (item.path === '' && location.pathname === `/projects/${projectId}`)
                    
                    return (
                      <button
                        key={item.path}
                        onClick={() => handleItemClick(item.path)}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors",
                          isActive
                            ? "bg-[var(--bg-tertiary)] text-[var(--accent-color)]"
                            : "text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
                        )}
                      >
                        <item.icon className="w-3.5 h-3.5" />
                        <span className="flex-1 text-left">{item.label}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  )
}
