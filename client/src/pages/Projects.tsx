import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, BookOpen, Settings, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { projectsApi } from '@/api/projects';
import { useAuthStore } from '@/store/auth';
import type { CreateProjectDto } from '@/types/project';

export const Projects = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout } = useAuthStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiDescription, setAiDescription] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [newProject, setNewProject] = useState<CreateProjectDto>({
    title: '',
    subtitle: '',
    synopsis: '',
    genre: 'fantasy',
    tags: ''
  });

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getAll
  });

  const createMutation = useMutation({
    mutationFn: projectsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsCreateModalOpen(false);
      setNewProject({ title: '', subtitle: '', synopsis: '', genre: 'fantasy', tags: '' });
    }
  });

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
      navigate(`/projects/${project.id}`);
    } catch (error) {
      console.error('AI 生成失败:', error);
      alert('AI 生成失败，请检查 API Key 配置或稍后重试');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-700';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED': return '已完成';
      case 'IN_PROGRESS': return '进行中';
      default: return '构思中';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-indigo-400 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent">
                NovelAI
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/ai-settings">
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  AI 设置
                </Button>
              </Link>
              <span className="text-sm text-gray-600">欢迎，{user?.name || user?.email}</span>
              <Button variant="ghost" onClick={handleLogout}>
                退出
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">我的小说</h1>
            <p className="text-gray-500 mt-1">管理您的创作项目</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setIsAiModalOpen(true)}>
              <Sparkles className="w-4 h-4 mr-2" />
              AI 智能创建
            </Button>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              手动创建
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="h-32 bg-gray-100" />
                <CardContent className="space-y-3">
                  <div className="h-6 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">还没有小说项目</h3>
            <p className="text-gray-500 mb-6">点击上方按钮开始您的创作之旅</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setIsAiModalOpen(true)}>
                <Sparkles className="w-4 h-4 mr-2" />
                AI 智能创建
              </Button>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                手动创建
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card key={project.id} hoverable className="cursor-pointer">
                <Link to={`/projects/${project.id}`}>
                  <CardHeader className="bg-gradient-to-br from-indigo-50 to-amber-50">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="line-clamp-1">{project.title}</CardTitle>
                        {project.subtitle && (
                          <CardDescription className="line-clamp-1">{project.subtitle}</CardDescription>
                        )}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                        {getStatusText(project.status)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {project.synopsis && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-4">{project.synopsis}</p>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">{project.wordCount.toLocaleString()} 字</span>
                      <span className="text-gray-400">
                        {new Date(project.updatedAt).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* 手动创建项目模态框 */}
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

      {/* AI 智能创建模态框 */}
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              描述您想要的小说
            </label>
            <Textarea
              placeholder="例如：一个关于时间旅行的科幻小说，主角是一个年轻的物理学家，他意外发现了穿越时间的方法..."
              value={aiDescription}
              onChange={(e) => setAiDescription(e.target.value)}
              rows={4}
            />
            <p className="text-sm text-gray-500 mt-2">
              AI 将根据您的描述自动生成小说标题、副标题、故事大纲等信息
            </p>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">💡 提示</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 描述越详细，生成的内容越符合您的期望</li>
              <li>• 可以包含题材、主角、背景、冲突等元素</li>
              <li>• 生成后您可以随时修改任何内容</li>
            </ul>
          </div>
        </div>
      </Modal>
    </div>
  );
};
