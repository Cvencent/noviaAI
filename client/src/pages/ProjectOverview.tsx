import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Users,
  Layout,
  Globe,
  Sparkles,
  Calendar,
  TrendingUp,
  Lightbulb,
  UserPlus,
  MapPin,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { projectsApi, type Project } from '../api/projects';
import { chaptersApi } from '../api/chapters';
import { charactersApi } from '../api/characters';
import { worldSettingsApi } from '../api/world-settings';
import { useToast } from '../contexts/ToastContext';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

export function ProjectOverview() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [characters, setCharacters] = useState<any[]>([]);
  const [settings, setSettings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);

  useEffect(() => {
    loadProjectData();
  }, [projectId]);

  const loadProjectData = async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const [projectData, chaptersData, charactersData, settingsData] = await Promise.all([
        projectsApi.getById(projectId),
        chaptersApi.getAll(projectId),
        charactersApi.getAll(projectId),
        worldSettingsApi.getAll(projectId),
      ]);
      setProject(projectData);
      setChapters(chaptersData);
      setCharacters(charactersData);
      setSettings(settingsData);
    } catch (err) {
      error('加载项目数据失败');
      console.error('加载项目数据失败:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAiSuggestions = async () => {
    if (!projectId) return;
    setIsGeneratingSuggestions(true);
    try {
      const suggestions = await projectsApi.aiGetSuggestions(projectId);
      setAiSuggestions(suggestions);
      success('AI 建议已生成！');
    } catch (err) {
      error('加载 AI 建议失败');
      console.error('加载 AI 建议失败:', err);
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  const getTotalWordCount = () => {
    return chapters.reduce((sum, chapter) => sum + (chapter.wordCount || 0), 0);
  };

  const getRecentlyUpdated = () => {
    const allItems = [
      ...chapters.map(c => ({ ...c, type: 'chapter' as const })),
      ...characters.map(c => ({ ...c, type: 'character' as const })),
      ...settings.map(s => ({ ...s, type: 'setting' as const })),
    ].filter(item => item.updatedAt);

    return allItems
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);
  };

  const getProgress = () => {
    if (!project) return 0;
    const completed = [
      !!project.synopsis,
      chapters.length > 0,
      characters.length > 0,
      settings.length > 0,
    ].filter(Boolean).length * 25;
    return Math.min(completed, 100);
  };

  const quickActions: QuickAction[] = [
    {
      id: 'new-chapter',
      title: '创建新章节',
      description: '开始写作新的一章',
      icon: BookOpen,
      href: `/projects/${projectId}/chapters/new`,
    },
    {
      id: 'add-character',
      title: '添加人物',
      description: '扩展你的角色库',
      icon: UserPlus,
      href: `/projects/${projectId}/characters`,
    },
    {
      id: 'build-world',
      title: '世界观设定',
      description: '完善世界观',
      icon: MapPin,
      href: `/projects/${projectId}/world`,
    },
    {
      id: 'ai-assistant',
      title: 'AI 助手',
      description: '获取创作帮助',
      icon: Sparkles,
      href: `/projects/${projectId}#ai-assistant`,
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project?.title}</h1>
            <p className="text-gray-600 mt-1">{project?.subtitle}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadAiSuggestions} disabled={isGeneratingSuggestions}>
              {isGeneratingSuggestions ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              AI 建议
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <Card className="col-span-4 lg:col-span-1">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-600">总字数</span>
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {getTotalWordCount().toLocaleString()}
              </div>
              <div className="text-sm text-gray-500 mt-1">字</div>
            </div>
          </Card>
          <Card className="col-span-4 lg:col-span-1">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-600">章节数</span>
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {chapters.length}
              </div>
              <div className="text-sm text-gray-500 mt-1">章</div>
            </div>
          </Card>
          <Card className="col-span-4 lg:col-span-1">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-gray-600">人物</span>
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {characters.length}
              </div>
              <div className="text-sm text-gray-500 mt-1">位</div>
            </div>
          </Card>
          <Card className="col-span-4 lg:col-span-1">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-orange-600" />
                  <span className="text-sm font-medium text-gray-600">世界观</span>
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {settings.length}
              </div>
              <div className="text-sm text-gray-500 mt-1">设定</div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {aiSuggestions && (
              <Card>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Lightbulb className="w-5 h-5 text-yellow-500" />
                    <h3 className="text-lg font-semibold text-gray-900">AI 创作建议</h3>
                  </div>

                  {aiSuggestions.nextSteps && aiSuggestions.nextSteps.length > 0 && (
                    <div className="mb-4">
                        <h4 className="font-medium text-gray-800 mb-2">下一步行动建议</h4>
                        <div className="space-y-2">
                          {aiSuggestions.nextSteps.map((step: string, index: number) => (
                            <div key={index} className="p-3 bg-blue-50 rounded-lg text-sm text-gray-700 flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                              {step}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}


                  <div className="grid grid-cols-1 gap-4">
                    {aiSuggestions.contentSuggestions && aiSuggestions.contentSuggestions.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">内容建议</h4>
                        <div className="space-y-1">
                          {aiSuggestions.contentSuggestions.map((suggestion: string, index: number) => (
                          <div key={index} className="p-2 bg-gray-50 rounded text-sm text-gray-600">
                            {suggestion}
                          </div>
                        ))}
                        </div>
                      </div>
                    )}

                    {aiSuggestions.characterSuggestions && aiSuggestions.characterSuggestions.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">角色相关建议</h4>
                        <div className="space-y-1">
                          {aiSuggestions.characterSuggestions.map((suggestion: string, index: number) => (
                          <div key={index} className="p-2 bg-gray-50 rounded text-sm text-gray-600">
                            {suggestion}
                          </div>
                        ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {aiSuggestions.worldSuggestions && aiSuggestions.worldSuggestions.length > 0 && (
                    <div className="mt-4">
                        <h4 className="font-medium text-gray-800 mb-2">世界观相关建议</h4>
                        <div className="space-y-1">
                          {aiSuggestions.worldSuggestions.map((suggestion: string, index: number) => (
                          <div key={index} className="p-2 bg-gray-50 rounded text-sm text-gray-600">
                            {suggestion}
                          </div>
                        ))}
                        </div>
                      </div>
                    )}

                    {aiSuggestions.plotSuggestions && aiSuggestions.plotSuggestions.length > 0 && (
                    <div className="mt-4">
                        <h4 className="font-medium text-gray-800 mb-2">剧情发展建议</h4>
                        <div className="space-y-1">
                          {aiSuggestions.plotSuggestions.map((suggestion: string, index: number) => (
                          <div key={index} className="p-2 bg-gray-50 rounded text-sm text-gray-600">
                            {suggestion}
                          </div>
                        ))}
                        </div>
                      </div>
                    )}
                  </div>
              </Card>
            )}

            <Card>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">快速操作</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {quickActions.map(action => {
                  const Icon = action.icon;
                  return (
                    <button
                        key={action.id}
                        onClick={() => navigate(action.href)}
                        className="p-4 text-left hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <Icon className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{action.title}</div>
                            <div className="text-sm text-gray-500">{action.description}</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">最近更新</h3>
                </div>
                <div className="space-y-3">
                  {getRecentlyUpdated().map(item => {
                  const Icon = item.type === 'chapter' ? BookOpen : item.type === 'character' ? Users : Globe;
                  const label = item.type === 'chapter' ? '章节' : item.type === 'character' ? '人物' : '设定';
                  return (
                    <div key={item.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <Icon className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{item.title || item.name}</div>
                          <div className="text-sm text-gray-500">{label}</div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-400">
                        {new Date(item.updatedAt).toLocaleDateString('zh-CN', {
                          month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-6">
            {project?.synopsis && (
              <Card>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                  <Layout className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900">故事大纲</h3>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                  {project.synopsis}
                </p>
                </div>
              </Card>
            )}
            <Card>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <h3 className="text-lg font-semibold text-gray-900">项目进度</h3>
                </div>
                <div className="space-y-3">
                  <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">完成度</span>
                    <span className="text-gray-900 font-medium">{getProgress()}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-700 h-2 rounded-full"
                      style={{ width: `${getProgress()}%` }}
                    ></div>
                  </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span>小说标题</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>故事大纲</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <div className="w-2 h-2 rounded-full bg-purple-500" />
                      <span>人物设定</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                      <span>世界观</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">项目信息</h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">类型</span>
                    <span className="text-gray-900">{project?.genre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">状态</span>
                    <span className="px-2 py-1 bg-gray-100 rounded text-gray-700">
                      {project?.status}
                    </span>
                  </div>
                  {project?.tags && (
                    <div>
                      <span className="text-gray-500">标签：</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {project.tags.split(',').map((tag: string, index: number) => (
                          <span
                            key={index}
                            className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
