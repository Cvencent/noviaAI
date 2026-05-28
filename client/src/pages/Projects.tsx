import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, BookOpen, Settings, Sparkles, Trash2, FolderOpen } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { TabBar, useTabManager } from '@/components/TabBar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';
import { projectsApi } from '@/api/projects';
import { useAuthStore } from '@/store/auth';
import { useToast } from '@/contexts/ToastContext';
import type { CreateProjectDto, Project } from '@/types/project';
import { ProjectWorkspace } from './ProjectWorkspace';
import { Stagger } from '@/components/AnimatedContainer';

export const Projects = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout } = useAuthStore();
  const { error: showErrorToast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiDescription, setAiDescription] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  
  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    projectId: '',
    projectTitle: ''
  });
  const [newProject, setNewProject] = useState<CreateProjectDto>({
    title: '',
    subtitle: '',
    synopsis: '',
    genre: 'fantasy',
    tags: ''
  });

  // Tab management for project tabs
  const {
    tabs,
    activeTabId,
    setActiveTabId,
    openTab,
    closeTab,
    closeAllTabs,
    closeTabsToRight,
    reorderTabs,
    togglePinTab,
    getActiveTab,
  } = useTabManager(20);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getAll
  });

  const createMutation = useMutation({
    mutationFn: projectsApi.create,
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsCreateModalOpen(false);
      setNewProject({ title: '', subtitle: '', synopsis: '', genre: 'fantasy', tags: '' });
      // Open the newly created project as a tab
      handleOpenProject(project);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: projectsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  });

  // Open a project in a tab
  const handleOpenProject = useCallback((project: Project) => {
    const path = `/projects/${project.id}`;
    openTab(path, project.title, <BookOpen className="w-3.5 h-3.5" />);
    navigate(path);
  }, [openTab, navigate]);

  // Go back to project list view
  const handleShowProjectList = useCallback(() => {
    setActiveTabId(null);
    navigate('/projects');
  }, [setActiveTabId, navigate]);

  // Get active project ID from tab path
  const activeTab = getActiveTab();
  const activeProjectId = activeTab?.path?.startsWith('/projects/')
    ? activeTab.path.replace('/projects/', '')
    : null;

  // When all tabs are closed, show project list
  useEffect(() => {
    if (tabs.length === 0 && activeTabId !== null) {
      setActiveTabId(null);
    }
  }, [tabs.length, activeTabId, setActiveTabId]);

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(newProject);
  };

  const handleAiGenerate = async () => {
    if (!aiDescription.trim()) return;
    
    setIsAiGenerating(true);
    try {
      const project = await projectsApi.aiGenerate(aiDescription);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsAiModalOpen(false);
      setAiDescription('');
      // Open the AI-generated project as a tab instead of navigating
      handleOpenProject(project);
    } catch (error) {
      console.error('AI 生成失败:', error);
      showErrorToast('AI 生成失败，请检查 API Key 配置或稍后重试');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDeleteProject = (e: React.MouseEvent, projectId: string, projectTitle: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Close the tab if the deleted project is open
    const tabPath = `/projects/${projectId}`;
    const existingTab = tabs.find(t => t.path === tabPath);
    if (existingTab) {
      closeTab(existingTab.id);
    }

    setDeleteModal({
      isOpen: true,
      projectId,
      projectTitle
    });
  };

  const confirmDeleteProject = () => {
    deleteMutation.mutate(deleteModal.projectId);
    setDeleteModal({ isOpen: false, projectId: '', projectTitle: '' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-900/40 text-green-400';
      case 'IN_PROGRESS': return 'bg-blue-900/40 text-blue-400';
      default: return 'bg-gray-700/40 text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED': return '已完成';
      case 'IN_PROGRESS': return '进行中';
      default: return '构思中';
    }
  };

  const showProjectList = !activeProjectId;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[var(--bg-primary)]">
      {/* Compact header */}
      <header className="flex items-center justify-between h-9 px-3 shrink-0 glass border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-indigo-400 rounded-md flex items-center justify-center">
            <BookOpen className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold bg-gradient-to-r from-indigo-400 to-indigo-300 bg-clip-text text-transparent">
            NovelAI
          </span>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Link to="/ai-settings">
            <Button variant="ghost" size="sm" className="h-6 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]">
              <Settings className="w-3.5 h-3.5 mr-1" />
              AI 设置
            </Button>
          </Link>
          <span className="text-xs text-gray-400 mx-2">{user?.name || user?.email}</span>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="h-6 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]">
            退出
          </Button>
        </div>
      </header>

      {/* Tab bar area */}
      <div className="flex items-center shrink-0 bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
        {/* Home / Projects list button */}
        <button
          onClick={handleShowProjectList}
          className={`flex items-center justify-center w-10 h-8 border-r border-[var(--border-color)] transition-colors shrink-0 ${
            showProjectList
              ? 'bg-[var(--bg-primary)] text-[var(--accent-color)] border-b-2 border-b-[var(--accent-color)]'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[var(--bg-tertiary)]'
          }`}
          title="项目列表"
        >
          <FolderOpen className="w-3.5 h-3.5" />
        </button>
        <div className="flex-1 min-w-0">
          <TabBar
            tabs={tabs}
            activeTabId={activeTabId}
            onTabClick={(tabId) => setActiveTabId(tabId)}
            onTabClose={closeTab}
            onCloseAll={closeAllTabs}
            onCloseRight={closeTabsToRight}
            onReorderTab={reorderTabs}
            onTogglePin={togglePinTab}
            onTabChange={(path) => navigate(path)}
          />
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {showProjectList ? (
          /* Project list view */
          <div className="h-full overflow-auto bg-[var(--bg-primary)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-[var(--text-primary)]">我的小说</h1>
                  <p className="text-sm text-[var(--text-muted)] mt-1">管理您的创作项目</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsAiModalOpen(true)}>
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                    AI 智能创建
                  </Button>
                  <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    手动创建
                  </Button>
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <LoadingSpinner />
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-20 h-20 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center mx-auto mb-5 border border-[var(--border-color)]">
                    <BookOpen className="w-10 h-10 text-[var(--text-muted)]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">还没有小说项目</h3>
                  <p className="text-sm text-[var(--text-muted)] mb-5">点击上方按钮开始您的创作之旅</p>
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" size="sm" onClick={() => setIsAiModalOpen(true)}>
                      <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                      AI 智能创建
                    </Button>
                    <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>
                      <Plus className="w-3.5 h-3.5 mr-1.5" />
                      手动创建
                    </Button>
                  </div>
                </div>
              ) : (
                <Stagger type="slide-up" baseDelay={100} staggerDelay={80} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {projects.map((project) => (
                    <div key={project.id}>
                      <Card
                        hoverable
                        className="cursor-pointer group relative glass-card"
                        onClick={() => handleOpenProject(project)}
                      >
                        <CardHeader className="bg-gradient-to-br from-indigo-900/20 to-amber-900/10">
                          <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1">
                              <CardTitle className="line-clamp-1 text-sm">{project.title}</CardTitle>
                              {project.subtitle && (
                                <CardDescription className="line-clamp-1 text-xs">{project.subtitle}</CardDescription>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 ml-2 shrink-0">
                              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(project.status)}`}>
                                {getStatusText(project.status)}
                              </span>
                              <button
                                onClick={(e) => handleDeleteProject(e, project.id, project.title)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-900/40 rounded-md"
                                title="删除项目"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                              </button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="py-3">
                          {project.synopsis && (
                            <p className="text-xs text-[var(--text-muted)] line-clamp-2 mb-3">{project.synopsis}</p>
                          )}
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[var(--text-muted)]">{project.wordCount.toLocaleString()} 字</span>
                            <span className="text-[var(--text-secondary)]">
                              {new Date(project.updatedAt).toLocaleDateString('zh-CN')}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </Stagger>
              )}
            </div>
          </div>
        ) : activeProjectId ? (
          /* Project workspace (inline) */
          <ProjectWorkspace projectId={activeProjectId} />
        ) : null}
      </div>

      {/* Create project modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="创建新项目"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreateProject} isLoading={createMutation.isPending}>
              创建
            </Button>
          </div>
        }
      >
        <form id="create-form" onSubmit={handleCreateProject} className="space-y-4">
          <Input
            label="小说标题 *"
            placeholder="输入您的小说标题"
            value={newProject.title}
            onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
            required
          />
          <Input
            label="副标题"
            placeholder="一行简短的简介"
            value={newProject.subtitle}
            onChange={(e) => setNewProject({ ...newProject, subtitle: e.target.value })}
          />
          <Textarea
            label="故事大纲"
            placeholder="介绍您的小说故事..."
            value={newProject.synopsis}
            onChange={(e) => setNewProject({ ...newProject, synopsis: e.target.value })}
          />
          <Select
            label="题材"
            value={newProject.genre}
            onChange={(e) => setNewProject({ ...newProject, genre: e.target.value })}
          >
            <option value="fantasy">奇幻</option>
            <option value="romance">言情</option>
            <option value="scifi">科幻</option>
            <option value="mystery">悬疑</option>
            <option value="urban">都市</option>
            <option value="historical">历史</option>
            <option value="other">其他</option>
          </Select>
        </form>
      </Modal>

      {/* AI smart create modal */}
      <Modal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        title="AI 智能创建项目"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsAiModalOpen(false)}>
              取消
            </Button>
            <Button 
              onClick={handleAiGenerate} 
              isLoading={isAiGenerating}
              disabled={!aiDescription.trim()}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              生成项目
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              描述您想要的小说
            </label>
            <Textarea
              placeholder="例如：一个关于时间旅行的科幻小说，主角是一个年轻的物理学家，他意外发现了穿越时间的方法..."
              value={aiDescription}
              onChange={(e) => setAiDescription(e.target.value)}
              rows={4}
            />
            <p className="text-sm text-[var(--text-muted)] mt-2">
              AI 将根据您的描述自动生成小说标题、副标题、故事大纲等信息
            </p>
          </div>
          
          <div className="bg-[var(--bg-primary)] rounded-lg p-4 border border-[var(--border-color)]">
            <h4 className="text-sm font-medium text-blue-400 mb-2">💡 提示</h4>
            <ul className="text-sm text-blue-300/80 space-y-1">
              <li>• 描述越详细，生成的内容越符合您的期望</li>
              <li>• 可以包含题材、主角、背景、冲突等元素</li>
              <li>• 生成后您可以随时修改任何内容</li>
            </ul>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, projectId: '', projectTitle: '' })}
        onConfirm={confirmDeleteProject}
        title={`确定要删除项目「${deleteModal.projectTitle}」吗？`}
        message="此操作无法撤销。"
      />
    </div>
  );
};
