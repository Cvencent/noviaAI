import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Activity,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Clock,
  Cpu,
  Drama,
  FileText,
  Folder,
  FolderOpen,
  GitBranch,
  Milestone,
  Link2,
  List,
  MapPin,
  MessageSquare,
  Network,
  Palette,
  Settings,
  Shield,
  Sparkles,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { projectsApi } from '@/api/projects';
import { chaptersApi } from '@/api/chapters';
import { charactersApi } from '@/api/characters';
import { worldSettingsApi } from '@/api/world-settings';
import { plotsApi } from '@/api/plots';
import { outlinesApi } from '@/api/outlines';
import { storySystemApi } from '@/api/story-system';
import { AiAssistant } from '@/components/AiAssistant';
import { ConversationList } from '@/components/ConversationList';
import { CardGallery } from '@/components/CardGallery';
import { TabBar, useTabManager } from '@/components/TabBar';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ResizablePanel } from '@/components/ResizablePanel';
import { cn } from '@/utils/cn';
import type { ContentChange } from '@/types/ai-changes';
import type { ConversationFocusTarget } from '@/types/conversation';

const ProjectOverview = lazy(() => import('./ProjectOverview').then(m => ({ default: m.ProjectOverview })));
const CharacterManagement = lazy(() => import('./CharacterManagement').then(m => ({ default: m.CharacterManagement })));
const ChapterManagement = lazy(() => import('./ChapterManagement').then(m => ({ default: m.ChapterManagement })));
const ChapterEditor = lazy(() => import('./ChapterEditor').then(m => ({ default: m.ChapterEditor })));
const WorldSettings = lazy(() => import('./WorldSettings').then(m => ({ default: m.WorldSettings })));
const PlotManagement = lazy(() => import('./PlotManagement').then(m => ({ default: m.PlotManagement })));
const OutlineManagement = lazy(() => import('./OutlineManagement').then(m => ({ default: m.OutlineManagement })));
const SceneManagement = lazy(() => import('./SceneManagement').then(m => ({ default: m.SceneManagement })));
const TurningPointManagement = lazy(() => import('./TurningPointManagement').then(m => ({ default: m.TurningPointManagement })));
const TimelineManagement = lazy(() => import('./TimelineManagement').then(m => ({ default: m.TimelineManagement })));
const EnhancedCharacterNetwork = lazy(() => import('./EnhancedCharacterNetwork').then(m => ({ default: m.EnhancedCharacterNetwork })));
const ConsistencyCheck = lazy(() => import('./ConsistencyCheck').then(m => ({ default: m.ConsistencyCheck })));
const ReaderExperience = lazy(() => import('./ReaderExperience').then(m => ({ default: m.ReaderExperience })));
const StoryGraphWorkbench = lazy(() => import('./StoryGraphWorkbench').then(m => ({ default: m.StoryGraphWorkbench })));
const UsageLogs = lazy(() => import('./UsageLogs').then(m => ({ default: m.UsageLogs })));
const AISettingsPage = lazy(() => import('./AISettings').then(m => ({ default: m.AISettingsPage })));
const ProjectSettings = lazy(() => import('./ProjectSettings').then(m => ({ default: m.ProjectSettings })));

interface TabRoute {
  path: string;
  label: string;
  icon: React.ReactNode;
  component: React.LazyExoticComponent<any>;
}

const routes: TabRoute[] = [
  { path: '', label: '概览', icon: <BookOpen className="w-3.5 h-3.5" />, component: ProjectOverview },
  { path: 'characters', label: '人物', icon: <Users className="w-3.5 h-3.5" />, component: CharacterManagement },
  { path: 'character-network', label: '关系网络', icon: <Link2 className="w-3.5 h-3.5" />, component: EnhancedCharacterNetwork },
  { path: 'world', label: '世界观', icon: <MapPin className="w-3.5 h-3.5" />, component: WorldSettings },
  { path: 'chapters', label: '章节', icon: <FileText className="w-3.5 h-3.5" />, component: ChapterManagement },
  { path: 'plots', label: '情节线', icon: <GitBranch className="w-3.5 h-3.5" />, component: PlotManagement },
  { path: 'outlines', label: '大纲', icon: <List className="w-3.5 h-3.5" />, component: OutlineManagement },
  { path: 'scenes', label: '场景', icon: <Drama className="w-3.5 h-3.5" />, component: SceneManagement },
  { path: 'turning-points', label: '转折点', icon: <Milestone className="w-3.5 h-3.5" />, component: TurningPointManagement },
  { path: 'timeline', label: '时间线', icon: <Clock className="w-3.5 h-3.5" />, component: TimelineManagement },
  { path: 'consistency-check', label: '一致性检查', icon: <Shield className="w-3.5 h-3.5" />, component: ConsistencyCheck },
  { path: 'reader-experience', label: '读者体验', icon: <BookOpen className="w-3.5 h-3.5" />, component: ReaderExperience },
  { path: 'story-graph', label: 'Story Graph', icon: <Network className="w-3.5 h-3.5" />, component: StoryGraphWorkbench },
  { path: 'usage-logs', label: '使用日志', icon: <Activity className="w-3.5 h-3.5" />, component: UsageLogs },
  { path: 'ai-settings', label: 'AI 设置', icon: <Cpu className="w-3.5 h-3.5" />, component: AISettingsPage },
  { path: 'settings', label: '项目设置', icon: <Settings className="w-3.5 h-3.5" />, component: ProjectSettings },
];

interface ChapterContext {
  chapterId: string;
  chapterContent: string;
  chapterTitle: string;
}

interface ProjectWorkspaceProps {
  projectId?: string;
}

type NavTreeItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  active?: boolean;
};

const normalizeWorkspacePath = (path?: string) => (path || '').replace(/^\/+|\/+$/g, '');

const buildWorkspaceUrl = (projectId: string, path: string) =>
  path ? `/projects/${projectId}/${path}` : `/projects/${projectId}`;

export const ProjectWorkspace = ({ projectId: projectIdProp }: ProjectWorkspaceProps = {}) => {
  const { projectId: routeProjectId, '*': routeWorkspacePath } = useParams<{ projectId: string; '*': string }>();
  const projectId = projectIdProp || routeProjectId;
  const workspacePath = normalizeWorkspacePath(routeWorkspacePath);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [chapterContext, setChapterContext] = useState<ChapterContext | undefined>();
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>();
  const [conversationFocusTarget, setConversationFocusTarget] = useState<ConversationFocusTarget | undefined>();
  const [sidebarView, setSidebarView] = useState<'conversations' | 'cards'>('conversations');
  const [pendingPrompt, setPendingPrompt] = useState<string | undefined>();
  const [autoSubmitPrompt, setAutoSubmitPrompt] = useState(false);
  const [expandedNavFolders, setExpandedNavFolders] = useState<Set<string>>(() => new Set(['characters', 'world', 'chapters', 'plots', 'outlines']));
  const storyGraphRefreshTimerRef = useRef<number | null>(null);
  const { tabs, activeTabId, setActiveTabId, openTab, closeTab, closeAllTabs, closeTabsToRight, reorderTabs, togglePinTab, getActiveTab } = useTabManager(20);

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectId ? projectsApi.getById(projectId) : null,
    enabled: !!projectId,
  });

  const { data: chapters = [], isLoading: isLoadingChapters } = useQuery({
    queryKey: ['chapters', projectId],
    queryFn: () => projectId ? chaptersApi.getAll(projectId) : [],
    enabled: !!projectId,
  });

  const { data: characters = [], isLoading: isLoadingCharacters } = useQuery({
    queryKey: ['characters', projectId],
    queryFn: () => projectId ? charactersApi.getAll(projectId) : [],
    enabled: !!projectId,
  });

  const { data: worldSettings = [], isLoading: isLoadingWorldSettings } = useQuery({
    queryKey: ['worldSettings', projectId],
    queryFn: () => projectId ? worldSettingsApi.getAll(projectId) : [],
    enabled: !!projectId,
  });

  const { data: plots = [], isLoading: isLoadingPlots } = useQuery({
    queryKey: ['plots', projectId],
    queryFn: () => projectId ? plotsApi.getAll(projectId) : [],
    enabled: !!projectId,
  });

  const { data: outlines = [], isLoading: isLoadingOutlines } = useQuery({
    queryKey: ['outlines', projectId],
    queryFn: () => projectId ? outlinesApi.getAll(projectId) : [],
    enabled: !!projectId,
  });

  const getTabMeta = useCallback((path: string) => {
    const normalizedPath = normalizeWorkspacePath(path);
    const [basePath, id] = normalizedPath.split('/');
    const route = routes.find(item => item.path === normalizedPath || item.path === basePath);
    if (!route) return null;

    if (basePath === 'chapters' && id) {
      const chapter = chapters.find(item => item.id === id);
      return {
        path: normalizedPath,
        label: chapter?.title || '章节编辑',
        icon: <FileText className="w-3.5 h-3.5" />,
      };
    }

    if (basePath === 'outlines' && id) {
      const outline = outlines.find(item => item.id === id);
      return {
        path: normalizedPath,
        label: outline?.title || '大纲编辑',
        icon: <List className="w-3.5 h-3.5" />,
      };
    }

    return {
      path: route.path,
      label: route.label,
      icon: route.icon,
    };
  }, [chapters, outlines]);

  const openWorkspaceTab = useCallback((path: string, options: { navigateToTab?: boolean; replace?: boolean } = {}) => {
    if (!projectId) return;
    const tabMeta = getTabMeta(path);
    if (!tabMeta) return;

    openTab(tabMeta.path, tabMeta.label, tabMeta.icon);
    if (options.navigateToTab) {
      navigate(buildWorkspaceUrl(projectId, tabMeta.path), { replace: options.replace });
    }
  }, [getTabMeta, navigate, openTab, projectId]);

  const initialSyncDoneRef = useRef(false);
  useEffect(() => {
    if (!projectId) return;
    const targetPath = workspacePath || '';
    const tabExists = tabs.some(t => t.path === targetPath) || targetPath === '';
    if (tabExists) {
      initialSyncDoneRef.current = true;
      if (getTabMeta(targetPath)) {
        openWorkspaceTab(targetPath, { replace: true });
      } else {
        openWorkspaceTab('', { navigateToTab: true, replace: true });
      }
    } else if (!initialSyncDoneRef.current) {
      initialSyncDoneRef.current = true;
      if (getTabMeta(targetPath)) {
        openWorkspaceTab(targetPath, { replace: true });
      } else {
        openWorkspaceTab('', { navigateToTab: true, replace: true });
      }
    }
  }, [workspacePath, projectId]);

  useEffect(() => {
    const handleChapterContextUpdate = (event: CustomEvent<ChapterContext | undefined>) => {
      setChapterContext(event.detail);
    };

    window.addEventListener('chapterContextUpdate', handleChapterContextUpdate as EventListener);
    return () => window.removeEventListener('chapterContextUpdate', handleChapterContextUpdate as EventListener);
  }, []);

  useEffect(() => {
    if (!projectId) return;

    const scheduleStoryGraphRefresh = () => {
      if (storyGraphRefreshTimerRef.current) {
        window.clearTimeout(storyGraphRefreshTimerRef.current);
      }

      storyGraphRefreshTimerRef.current = window.setTimeout(async () => {
        try {
          await storySystemApi.createProjectionJob(projectId, { scope: 'ALL' });
          queryClient.invalidateQueries({ queryKey: ['storyGraph', projectId] });
          queryClient.invalidateQueries({ queryKey: ['story-graph', projectId] });
          queryClient.invalidateQueries({ queryKey: ['projectionJobs', projectId] });
          window.dispatchEvent(new CustomEvent('storyGraphChanged', { detail: { projectId } }));
        } catch (error) {
          console.warn('Story Graph 自动同步失败:', error);
        }
      }, 800);
    };

    const refreshProjectTree = () => {
      [
        'project',
        'chapters',
        'characters',
        'worldSettings',
        'plots',
        'outlines',
        'scenes',
        'timeline',
        'turning-points',
        'chekhovs-guns',
      ].forEach(key => {
        queryClient.invalidateQueries({ queryKey: [key, projectId] });
      });
      scheduleStoryGraphRefresh();
    };

    window.addEventListener('projectTreeChanged', refreshProjectTree);
    window.addEventListener('outlineCreatedFromAssistant', refreshProjectTree);
    return () => {
      if (storyGraphRefreshTimerRef.current) {
        window.clearTimeout(storyGraphRefreshTimerRef.current);
      }
      window.removeEventListener('projectTreeChanged', refreshProjectTree);
      window.removeEventListener('outlineCreatedFromAssistant', refreshProjectTree);
    };
  }, [projectId, queryClient]);

  const handleApplyChanges = useCallback((changes: ContentChange[]) => {
    window.dispatchEvent(new CustomEvent('aiApplyChanges', { detail: changes }));
  }, []);

  const handleOpenRoute = useCallback((path: string) => {
    openWorkspaceTab(path, { navigateToTab: true });
  }, [openWorkspaceTab]);

  const handleOpenChapter = useCallback((chapterId: string) => {
    handleOpenRoute(`chapters/${chapterId}`);
  }, [handleOpenRoute]);

  const handleOpenOutline = useCallback((outlineId: string) => {
    handleOpenRoute(`outlines/${outlineId}`);
  }, [handleOpenRoute]);

  const handleCloseTab = useCallback((tabId: string) => {
    const currentIndex = tabs.findIndex(t => t.id === tabId);
    const remaining = tabs.filter(t => t.id !== tabId);
    closeTab(tabId);
    if (activeTabId === tabId && remaining.length > 0) {
      const nextActive = remaining[currentIndex > 0 ? currentIndex - 1 : 0];
      if (nextActive && projectId) {
        navigate(buildWorkspaceUrl(projectId, nextActive.path), { replace: true });
      }
    } else if (remaining.length === 0 && projectId) {
      navigate(buildWorkspaceUrl(projectId, ''), { replace: true });
    }
  }, [closeTab, tabs, activeTabId, projectId, navigate]);

  const toggleNavFolder = (path: string) => {
    setExpandedNavFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleOpenProjectSettings = () => {
    handleOpenRoute('settings');
  };

  const handleCreateConversation = useCallback(() => {
    setSelectedConversationId(undefined);
  }, []);

  const handleAskAI = useCallback((prompt: string) => {
    setSidebarView('conversations');
    setSelectedConversationId(undefined);
    setPendingPrompt(prompt);
    setAutoSubmitPrompt(true);
  }, []);

  const activeTab = getActiveTab();
  let ActiveComponent: React.ComponentType<any> | null = null;
  let extraProps: Record<string, any> = {};

  if (activeTab) {
    const exactRoute = routes.find(route => route.path === activeTab.path);
    if (exactRoute) {
      ActiveComponent = exactRoute.component;
    } else {
      const [basePath, id] = activeTab.path.split('/');
      const dynamicRoute = routes.find(route => route.path === basePath);
      if (dynamicRoute) {
        if (basePath === 'chapters' && id) {
          ActiveComponent = ChapterEditor;
          extraProps = { chapterId: id };
        } else if (basePath === 'outlines' && id) {
          ActiveComponent = OutlineManagement;
          extraProps = { outlineId: id };
        } else {
          ActiveComponent = dynamicRoute.component;
        }
      }
    }
  }

  const navItems = routes.filter(route => route.path !== 'ai-settings' && route.path !== 'settings');
  const sortedChapters = [...chapters].sort((a, b) => a.order - b.order);
  const sortedCharacters = [...characters].sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
  const sortedWorldSettings = [...worldSettings].sort((a, b) => {
    const categoryCompare = a.category.localeCompare(b.category, 'zh-CN');
    return categoryCompare || a.name.localeCompare(b.name, 'zh-CN');
  });
  const sortedPlots = [...plots].sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'));
  const sortedOutlines = [...outlines].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const expandableNavData: Record<string, { items: NavTreeItem[]; isLoading: boolean; emptyText: string }> = {
    characters: {
      isLoading: isLoadingCharacters,
      emptyText: '暂无人物',
      items: sortedCharacters.map(character => ({
        id: character.id,
        label: character.name || '未命名人物',
        icon: <Users className="w-3.5 h-3.5 shrink-0" />,
        onClick: () => handleOpenRoute('characters'),
      })),
    },
    world: {
      isLoading: isLoadingWorldSettings,
      emptyText: '暂无世界观',
      items: sortedWorldSettings.map(setting => ({
        id: setting.id,
        label: setting.category ? `${setting.category} / ${setting.name}` : setting.name,
        icon: <MapPin className="w-3.5 h-3.5 shrink-0" />,
        onClick: () => handleOpenRoute('world'),
      })),
    },
    chapters: {
      isLoading: isLoadingChapters,
      emptyText: '暂无章节',
      items: sortedChapters.map(chapter => {
        const chapterPath = `chapters/${chapter.id}`;
        return {
          id: chapter.id,
          label: chapter.title || `第 ${chapter.order} 章`,
          icon: <FileText className="w-3.5 h-3.5 shrink-0" />,
          onClick: () => handleOpenChapter(chapter.id),
          active: activeTab?.path === chapterPath,
        };
      }),
    },
    plots: {
      isLoading: isLoadingPlots,
      emptyText: '暂无情节线',
      items: sortedPlots.map(plot => ({
        id: plot.id,
        label: plot.title || '未命名情节线',
        icon: <GitBranch className="w-3.5 h-3.5 shrink-0" />,
        onClick: () => handleOpenRoute('plots'),
      })),
    },
    outlines: {
      isLoading: isLoadingOutlines,
      emptyText: '暂无大纲',
      items: sortedOutlines.map(outline => ({
        id: outline.id,
        label: outline.title || '未命名大纲',
        icon: <List className="w-3.5 h-3.5 shrink-0" />,
        onClick: () => handleOpenOutline(outline.id),
        active: activeTab?.path === `outlines/${outline.id}`,
      })),
    },
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[var(--bg-primary)]">
      <header className="flex items-center justify-between h-10 px-3 shrink-0 bg-[var(--bg-secondary)] text-[var(--text-primary)] border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="sm" onClick={() => navigate('/projects')}>
            项目
          </Button>
          <span className="text-sm truncate">{project?.title || '项目'}</span>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={handleOpenProjectSettings}>
            <Palette className="w-3.5 h-3.5 mr-1" />
            项目设置
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* 项目导航区 - 可拖动调整宽度和折叠 */}
        <ResizablePanel
          title="项目导航"
          defaultWidth={224}
          minWidth={48}
          maxWidth={320}
        >
          <nav className="p-3 space-y-1 h-full overflow-y-auto scrollbar-thin">
            {navItems.map(route => {
              const treeData = expandableNavData[route.path];
              const isExpanded = expandedNavFolders.has(route.path);
              const isActive = activeTab?.path === route.path || activeTab?.path.startsWith(`${route.path}/`);

              if (!treeData) {
                return (
                  <button
                    key={route.path}
                    onClick={() => handleOpenRoute(route.path)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 rounded text-sm text-left transition-colors',
                      isActive
                        ? 'bg-[var(--bg-hover)] text-[var(--text-primary)]'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]',
                    )}
                  >
                    <span className="w-3.5 h-3.5 flex items-center justify-center">{route.icon}</span>
                    <span className="truncate">{route.label}</span>
                  </button>
                );
              }

              return (
                <div key={route.path} className="space-y-1">
                  <div
                    className={cn(
                      'group flex items-center rounded transition-colors',
                      isActive
                        ? 'bg-[var(--bg-hover)] text-[var(--text-primary)]'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]',
                    )}
                  >
                    <button
                      onClick={() => toggleNavFolder(route.path)}
                      className="h-8 w-8 shrink-0 flex items-center justify-center"
                      aria-label={isExpanded ? `收起${route.label}` : `展开${route.label}`}
                    >
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleOpenRoute(route.path)}
                      className="flex-1 min-w-0 flex items-center gap-2 py-2 pr-3 text-sm text-left"
                    >
                      {isExpanded ? <FolderOpen className="w-3.5 h-3.5 shrink-0" /> : <Folder className="w-3.5 h-3.5 shrink-0" />}
                      <span className="truncate">{route.label}</span>
                      <span className="ml-auto text-[10px] text-[var(--text-muted)]">{treeData.items.length}</span>
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="ml-4 pl-3 border-l border-[var(--border-color)] space-y-1">
                      {treeData.isLoading ? (
                        <div className="px-2 py-2 text-xs text-[var(--text-muted)]">加载{route.label}...</div>
                      ) : treeData.items.length === 0 ? (
                        <button
                          onClick={() => handleOpenRoute(route.path)}
                          className="w-full px-2 py-2 rounded text-xs text-left text-[var(--text-muted)] hover:bg-[var(--bg-hover)]"
                        >
                          {treeData.emptyText}
                        </button>
                      ) : (
                        treeData.items.map(item => (
                          <button
                            key={item.id}
                            onClick={item.onClick}
                            className={cn(
                              'w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-left transition-colors',
                              item.active
                                ? 'bg-[var(--accent-color)] text-[var(--text-primary)]'
                                : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]',
                            )}
                          >
                            {item.icon}
                            <span className="truncate">{item.label}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </ResizablePanel>

        {/* AI 对话区 - 可拖动调整宽度和折叠 */}
        <ResizablePanel
          title="AI 对话"
          titleIcon={<MessageSquare className="w-3.5 h-3.5" />}
          defaultWidth={520}
          minWidth={48}
          maxWidth={700}
        >
          <div className="h-full overflow-hidden flex">
            <div className="w-48 shrink-0 border-r border-[var(--border-color)] bg-[var(--bg-primary)] flex flex-col">
              {/* Sidebar header with toggle */}
              <div className="flex border-b border-[var(--border-color)]">
                <button
                  onClick={() => setSidebarView('conversations')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-medium transition-colors',
                    sidebarView === 'conversations'
                      ? 'text-[var(--accent-color)] border-b-2 border-[var(--accent-color)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  )}
                >
                  <MessageSquare className="w-3 h-3" />
                  对话
                </button>
                <button
                  onClick={() => setSidebarView('cards')}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-medium transition-colors',
                    sidebarView === 'cards'
                      ? 'text-[var(--accent-color)] border-b-2 border-[var(--accent-color)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  )}
                >
                  <Sparkles className="w-3 h-3" />
                  卡片库
                </button>
              </div>
              {/* Sidebar content */}
              <div className="flex-1 overflow-hidden">
                {sidebarView === 'conversations' ? (
                  <ConversationList
                    currentConversationId={selectedConversationId}
                    onSelectConversation={setSelectedConversationId}
                    onCreateConversation={handleCreateConversation}
                  />
                ) : (
                  <CardGallery
                    projectId={projectId || ''}
                    onNavigateToConversation={(target) => {
                      setSelectedConversationId(target.conversationId)
                      setConversationFocusTarget(target)
                      setSidebarView('conversations')
                    }}
                    onAutoSubmitPrompt={(conversationId, prompt) => {
                      setSelectedConversationId(conversationId)
                      setSidebarView('conversations')
                      setPendingPrompt(prompt)
                      setAutoSubmitPrompt(true)
                    }}
                    onOpenRoute={handleOpenRoute}
                  />
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0 h-full">
              <AiAssistant
                projectId={projectId || ''}
                chapterId={chapterContext?.chapterId}
                chapterContent={chapterContext?.chapterContent}
                chapterTitle={chapterContext?.chapterTitle}
                onApplyChanges={handleApplyChanges}
                onOpenRoute={handleOpenRoute}
                onOpenAISettings={() => handleOpenRoute('ai-settings')}
                conversationId={selectedConversationId}
                focusTarget={conversationFocusTarget}
                onConversationCreated={setSelectedConversationId}
                pendingPrompt={pendingPrompt}
                autoSubmit={autoSubmitPrompt}
                onPendingPromptUsed={() => {
                  setPendingPrompt(undefined)
                  setAutoSubmitPrompt(false)
                }}
              />
            </div>
          </div>
        </ResizablePanel>

        {/* 预览区 - 主内容区域 */}
        <section className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <TabBar
            tabs={tabs}
            activeTabId={activeTabId}
            onTabClick={setActiveTabId}
            onTabClose={handleCloseTab}
            onCloseAll={closeAllTabs}
            onCloseRight={closeTabsToRight}
            onReorderTab={reorderTabs}
            onTogglePin={togglePinTab}
            onTabChange={(path) => {
              if (projectId) {
                navigate(buildWorkspaceUrl(projectId, normalizeWorkspacePath(path)));
              }
            }}
          />
          <ErrorBoundary>
            <div className="flex-1 overflow-auto bg-[var(--bg-primary)]">
              {ActiveComponent ? (
                <Suspense fallback={<div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}>
                  <ActiveComponent projectId={projectId || ''} onOpenRoute={handleOpenRoute} onAskAI={handleAskAI} {...extraProps} />
                </Suspense>
              ) : (
                <div className="flex items-center justify-center h-full text-[var(--text-muted)]">选择一个页面开始</div>
              )}
            </div>
          </ErrorBoundary>
        </section>
      </div>
    </div>
  );
};
