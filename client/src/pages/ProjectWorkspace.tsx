import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Activity,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Cpu,
  FileText,
  Folder,
  FolderOpen,
  GitBranch,
  Link2,
  List,
  MapPin,
  MessageSquare,
  Network,
  Palette,
  Settings,
  Shield,
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
import { AiAssistant } from '@/components/AiAssistant';
import { ConversationList } from '@/components/ConversationList';
import { TabBar, useTabManager } from '@/components/TabBar';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ResizablePanel } from '@/components/ResizablePanel';
import { cn } from '@/utils/cn';
import type { ContentChange } from '@/types/ai-changes';

const ProjectOverview = lazy(() => import('./ProjectOverview').then(m => ({ default: m.ProjectOverview })));
const CharacterManagement = lazy(() => import('./CharacterManagement').then(m => ({ default: m.CharacterManagement })));
const ChapterManagement = lazy(() => import('./ChapterManagement').then(m => ({ default: m.ChapterManagement })));
const ChapterEditor = lazy(() => import('./ChapterEditor').then(m => ({ default: m.ChapterEditor })));
const WorldSettings = lazy(() => import('./WorldSettings').then(m => ({ default: m.WorldSettings })));
const PlotManagement = lazy(() => import('./PlotManagement').then(m => ({ default: m.PlotManagement })));
const OutlineManagement = lazy(() => import('./OutlineManagement').then(m => ({ default: m.OutlineManagement })));
const EnhancedCharacterNetwork = lazy(() => import('./EnhancedCharacterNetwork').then(m => ({ default: m.EnhancedCharacterNetwork })));
const ConsistencyCheck = lazy(() => import('./ConsistencyCheck').then(m => ({ default: m.ConsistencyCheck })));
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
  { path: 'consistency-check', label: '一致性检查', icon: <Shield className="w-3.5 h-3.5" />, component: ConsistencyCheck },
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

export const ProjectWorkspace = ({ projectId: projectIdProp }: ProjectWorkspaceProps = {}) => {
  const { projectId: routeProjectId } = useParams<{ projectId: string }>();
  const projectId = projectIdProp || routeProjectId;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [chapterContext, setChapterContext] = useState<ChapterContext | undefined>();
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>();
  const [expandedNavFolders, setExpandedNavFolders] = useState<Set<string>>(() => new Set(['characters', 'world', 'chapters', 'plots', 'outlines']));
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

  useEffect(() => {
    if (projectId && tabs.length === 0) {
      openTab('', '概览', <BookOpen className="w-3.5 h-3.5" />);
    }
  }, [projectId, tabs.length, openTab]);

  useEffect(() => {
    const handleChapterContextUpdate = (event: CustomEvent<ChapterContext | undefined>) => {
      setChapterContext(event.detail);
    };

    window.addEventListener('chapterContextUpdate', handleChapterContextUpdate as EventListener);
    return () => window.removeEventListener('chapterContextUpdate', handleChapterContextUpdate as EventListener);
  }, []);

  useEffect(() => {
    if (!projectId) return;

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
    };

    window.addEventListener('projectTreeChanged', refreshProjectTree);
    window.addEventListener('outlineCreatedFromAssistant', refreshProjectTree);
    return () => {
      window.removeEventListener('projectTreeChanged', refreshProjectTree);
      window.removeEventListener('outlineCreatedFromAssistant', refreshProjectTree);
    };
  }, [projectId, queryClient]);

  const handleApplyChanges = useCallback((changes: ContentChange[]) => {
    window.dispatchEvent(new CustomEvent('aiApplyChanges', { detail: changes }));
  }, []);

  const handleOpenRoute = (path: string) => {
    const basePath = path.split('/')[0];
    const route = routes.find(item => item.path === basePath || item.path === path);
    if (!route) return;

    const tabId = path.includes('/') ? path : route.path;
    openTab(tabId, route.label, route.icon);
  };

  const handleOpenChapter = (chapterId: string, title: string) => {
    openTab(`chapters/${chapterId}`, title || '未命名章节', <FileText className="w-3.5 h-3.5" />);
  };

  const handleOpenOutline = (outlineId: string, title: string) => {
    openTab(`outlines/${outlineId}`, title || '未命名大纲', <List className="w-3.5 h-3.5" />);
  };

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
    openTab('settings', '项目设置', <Settings className="w-3.5 h-3.5" />);
  };

  const handleCreateConversation = useCallback(() => {
    setSelectedConversationId(undefined);
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
        active: activeTab?.path === 'characters',
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
        active: activeTab?.path === 'world',
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
          onClick: () => handleOpenChapter(chapter.id, chapter.title),
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
        active: activeTab?.path === 'plots',
      })),
    },
    outlines: {
      isLoading: isLoadingOutlines,
      emptyText: '暂无大纲',
      items: sortedOutlines.map(outline => ({
        id: outline.id,
        label: outline.title || '未命名大纲',
        icon: <List className="w-3.5 h-3.5 shrink-0" />,
        onClick: () => handleOpenOutline(outline.id, outline.title),
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
          <nav className="p-3 space-y-1">
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
            <div className="w-40 shrink-0 border-r border-[var(--border-color)] bg-[var(--bg-primary)]">
              <ConversationList
                currentConversationId={selectedConversationId}
                onSelectConversation={setSelectedConversationId}
                onCreateConversation={handleCreateConversation}
              />
            </div>
            <div className="flex-1 min-w-0">
              <AiAssistant
                projectId={projectId || ''}
                chapterId={chapterContext?.chapterId}
                chapterContent={chapterContext?.chapterContent}
                chapterTitle={chapterContext?.chapterTitle}
                onApplyChanges={handleApplyChanges}
                onOpenRoute={handleOpenRoute}
                onOpenAISettings={() => openTab('ai-settings', 'AI 设置', <Cpu className="w-3.5 h-3.5" />)}
                conversationId={selectedConversationId}
                onConversationCreated={setSelectedConversationId}
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
            onTabClose={closeTab}
            onCloseAll={closeAllTabs}
            onCloseRight={closeTabsToRight}
            onReorderTab={reorderTabs}
            onTogglePin={togglePinTab}
          />
          <ErrorBoundary>
            <div className="flex-1 overflow-auto bg-[var(--bg-primary)]">
              {ActiveComponent ? (
                <Suspense fallback={<div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}>
                  <ActiveComponent projectId={projectId || ''} onOpenRoute={handleOpenRoute} {...extraProps} />
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
