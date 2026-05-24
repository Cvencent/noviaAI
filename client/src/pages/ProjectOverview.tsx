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
  Check,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import {
  projectsApi,
  type Project,
  type ProjectAiSuggestionJob,
  type ProjectAiSuggestions,
} from '../api/projects';
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

type SuggestionGroupKey = keyof ProjectAiSuggestions;

const suggestionGroups: Array<{
  key: SuggestionGroupKey;
  title: string;
  applyLabel: string;
}> = [
  { key: 'nextSteps', title: '下一步行动建议', applyLabel: '生成章节草稿' },
  { key: 'contentSuggestions', title: '内容建议', applyLabel: '生成章节草稿' },
  { key: 'characterSuggestions', title: '角色相关建议', applyLabel: '创建人物草稿' },
  { key: 'worldSuggestions', title: '世界观相关建议', applyLabel: '创建设定条目' },
  { key: 'plotSuggestions', title: '剧情发展建议', applyLabel: '生成剧情规划' },
];

function parseSuggestionJobResult(job?: ProjectAiSuggestionJob | null): ProjectAiSuggestions | null {
  if (!job?.result) return null;
  try {
    return JSON.parse(job.result) as ProjectAiSuggestions;
  } catch {
    return null;
  }
}

function getSuggestionTitle(text: string, fallback: string) {
  const quoted = text.match(/[“"「](.+?)[”"」]/)?.[1];
  if (quoted) return quoted.slice(0, 40);
  const cleaned = text.replace(/[。！？.!?].*$/, '').replace(/^(开始|为|制定|创建|扩展|设定|引入)/, '').trim();
  return (cleaned || fallback).slice(0, 40);
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
  const [aiSuggestions, setAiSuggestions] = useState<ProjectAiSuggestions | null>(null);
  const [aiSuggestionJob, setAiSuggestionJob] = useState<ProjectAiSuggestionJob | null>(null);
  const [appliedSuggestions, setAppliedSuggestions] = useState<Record<string, boolean>>({});
  const [applyingSuggestionKey, setApplyingSuggestionKey] = useState<string | null>(null);

  useEffect(() => {
    loadProjectData();
  }, [projectId]);

  useEffect(() => {
    refreshAiSuggestionJobs().catch((err) => {
      console.error('加载 AI 建议任务失败:', err);
    });
  }, [projectId]);

  useEffect(() => {
    if (!aiSuggestionJob || !['PENDING', 'RUNNING'].includes(aiSuggestionJob.status)) return;

    const timer = window.setInterval(() => {
      refreshAiSuggestionJobs().catch((err) => {
        console.error('刷新 AI 建议任务失败:', err);
      });
    }, 2500);

    return () => window.clearInterval(timer);
  }, [aiSuggestionJob, projectId]);

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
      const job = await projectsApi.createAiSuggestionJob(projectId);
      setAiSuggestionJob(job);
      setAiSuggestions(null);
      success('AI 建议任务已开始，离开页面也会继续生成');
    } catch (err) {
      error('加载 AI 建议失败');
      console.error('加载 AI 建议失败:', err);
      setIsGeneratingSuggestions(false);
    }
  };

  const refreshAiSuggestionJobs = async () => {
    if (!projectId) return null;
    const jobs = await projectsApi.listAiSuggestionJobs(projectId);
    const latestJob = jobs[0] || null;
    setAiSuggestionJob(latestJob);

    if (!latestJob) {
      setIsGeneratingSuggestions(false);
      return null;
    }

    setIsGeneratingSuggestions(['PENDING', 'RUNNING'].includes(latestJob.status));

    if (latestJob.status === 'DONE') {
      const result = parseSuggestionJobResult(latestJob);
      setAiSuggestions(result);
    } else if (latestJob.status === 'FAILED') {
      error(latestJob.error || 'AI 建议生成失败');
    }

    return latestJob;
  };

  const applySuggestion = async (group: SuggestionGroupKey, suggestion: string, index: number) => {
    if (!projectId) return;

    const key = `${group}-${index}-${suggestion}`;
    setApplyingSuggestionKey(key);
    try {
      if (group === 'characterSuggestions') {
        await charactersApi.create(projectId, {
          name: getSuggestionTitle(suggestion, `建议人物 ${characters.length + 1}`),
          role: '待完善',
          notes: suggestion,
        });
        success('已创建人物草稿');
      } else if (group === 'worldSuggestions') {
        await worldSettingsApi.create(projectId, {
          category: 'AI 建议',
          name: getSuggestionTitle(suggestion, `设定 ${settings.length + 1}`),
          description: suggestion,
        });
        success('已创建世界观设定');
      } else {
        await chaptersApi.create(projectId, {
          title: getSuggestionTitle(suggestion, group === 'plotSuggestions' ? '剧情规划' : 'AI 建议章节'),
          summary: suggestion,
          status: 'DRAFT',
        });
        success(group === 'plotSuggestions' ? '已创建剧情规划章节' : '已创建章节草稿');
      }

      setAppliedSuggestions((current) => ({ ...current, [key]: true }));
      await loadProjectData();
    } catch (err) {
      error('应用 AI 建议失败');
      console.error('应用 AI 建议失败:', err);
    } finally {
      setApplyingSuggestionKey(null);
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
              {isGeneratingSuggestions ? 'AI 建议生成中' : 'AI 建议'}
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
            {(isGeneratingSuggestions || aiSuggestions || aiSuggestionJob?.status === 'FAILED') && (
              <Card>
                <div className="p-6">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-yellow-500" />
                      <h3 className="text-lg font-semibold text-gray-900">AI 创作建议</h3>
                    </div>
                    {isGeneratingSuggestions && (
                      <div className="flex items-center gap-2 text-sm text-blue-600">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        后台生成中
                      </div>
                    )}
                  </div>

                  {aiSuggestionJob?.status === 'FAILED' && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      {aiSuggestionJob.error || 'AI 建议生成失败'}
                    </div>
                  )}

                  {isGeneratingSuggestions && !aiSuggestions && (
                    <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
                      生成任务已保存。刷新或离开后回到此页面，会继续显示当前任务状态。
                    </div>
                  )}

                  {aiSuggestions && (
                    <div className="space-y-4">
                      {suggestionGroups.map((group) => {
                        const items = aiSuggestions[group.key] || [];
                        if (!items.length) return null;

                        return (
                          <div key={group.key}>
                            <h4 className="font-medium text-gray-800 mb-2">{group.title}</h4>
                            <div className="space-y-2">
                              {items.map((suggestion, index) => {
                                const key = `${group.key}-${index}-${suggestion}`;
                                const isApplied = !!appliedSuggestions[key];
                                return (
                                  <div
                                    key={key}
                                    className={`p-3 rounded-lg text-sm text-gray-700 flex items-start justify-between gap-3 ${
                                      group.key === 'nextSteps' ? 'bg-blue-50' : 'bg-gray-50'
                                    }`}
                                  >
                                    <div className="flex items-start gap-2">
                                      <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                      <span>{suggestion}</span>
                                    </div>
                                    <Button
                                      variant={isApplied ? 'ghost' : 'outline'}
                                      size="sm"
                                      onClick={() => applySuggestion(group.key, suggestion, index)}
                                      disabled={isApplied || applyingSuggestionKey === key}
                                      className="shrink-0"
                                    >
                                      {applyingSuggestionKey === key ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      ) : isApplied ? (
                                        <Check className="w-4 h-4 mr-2" />
                                      ) : (
                                        <Sparkles className="w-4 h-4 mr-2" />
                                      )}
                                      {isApplied ? '已应用' : group.applyLabel}
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
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
