import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  BookOpen,
  CheckCircle,
  Globe,
  Layout,
  Lightbulb,
  Loader2,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import {
  projectsApi,
  type Project,
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
  path?: string;
}

type SuggestionGroupKey = keyof ProjectAiSuggestions;

const suggestionGroups: Array<{
  key: SuggestionGroupKey;
  title: string;
  applyLabel: string;
}> = [
  { key: 'nextSteps', title: '下一步建议', applyLabel: '生成章节草稿' },
  { key: 'contentSuggestions', title: '内容建议', applyLabel: '生成章节草稿' },
  { key: 'characterSuggestions', title: '角色建议', applyLabel: '创建人物草稿' },
  { key: 'worldSuggestions', title: '世界观建议', applyLabel: '创建设定条目' },
  { key: 'plotSuggestions', title: '剧情建议', applyLabel: '生成剧情规划' },
];

const parseSuggestionResult = (result?: string | null): ProjectAiSuggestions | null => {
  if (!result) return null;
  try {
    return JSON.parse(result) as ProjectAiSuggestions;
  } catch (error) {
    console.error('Failed to parse project suggestions:', error);
    return null;
  }
};

const getSuggestionTitle = (text: string, fallback: string) => {
  const quoted = text.match(/[“"「](.+?)[”"」]/)?.[1];
  if (quoted) return quoted.slice(0, 40);
  const cleaned = text.replace(/[。！？.!?].*$/, '').replace(/^(开始|为|制定|创建|扩展|设定|引入)/, '').trim();
  return (cleaned || fallback).slice(0, 40);
};

export const ProjectOverview: React.FC<{
  onOpenRoute?: (path: string) => void;
  projectId?: string;
}> = ({ onOpenRoute, projectId: projectIdProp }) => {
  const { projectId: routeProjectId } = useParams<{ projectId: string }>();
  const projectId = projectIdProp || routeProjectId;
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [chapterCount, setChapterCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const [worldSettingCount, setWorldSettingCount] = useState(0);
  const [suggestions, setSuggestions] = useState<ProjectAiSuggestions | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [appliedSuggestions, setAppliedSuggestions] = useState<Record<string, boolean>>({});
  const [applyingSuggestionKey, setApplyingSuggestionKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      if (!projectId) {
        setIsLoading(false);
        return;
      }

      try {
        const [projectData, chapters, characters, worldSettings] = await Promise.all([
          projectsApi.getById(projectId),
          chaptersApi.getAll(projectId),
          charactersApi.getAll(projectId),
          worldSettingsApi.getAll(projectId),
        ]);
        setProject(projectData);
        setChapterCount(chapters.length);
        setCharacterCount(characters.length);
        setWorldSettingCount(worldSettings.length);
      } catch (error) {
        console.error('Failed to fetch project data:', error);
        setError('加载项目数据失败');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!projectId) return;

      try {
        const suggestionJobs = await projectsApi.listAiSuggestionJobs(projectId);
        const completedJob = suggestionJobs.find(job => job.status === 'DONE' && job.result);
        const runningJob = suggestionJobs.find(job => job.status === 'RUNNING' || job.status === 'PENDING');
        if (completedJob) {
          setSuggestions(parseSuggestionResult(completedJob.result));
        }
        setIsGenerating(Boolean(runningJob));
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
      }
    };

    fetchSuggestions();
  }, [projectId]);

  const generateSuggestions = async () => {
    if (!projectId || isGenerating) return;

    setIsGenerating(true);
    try {
      const createdJob = await projectsApi.createAiSuggestionJob(projectId);
      const interval = window.setInterval(async () => {
        try {
          const suggestionJobs = await projectsApi.listAiSuggestionJobs(projectId);
          const suggestionJob = suggestionJobs.find(job => job.id === createdJob.id);
          if (suggestionJob?.status === 'DONE') {
            setSuggestions(parseSuggestionResult(suggestionJob.result));
            window.clearInterval(interval);
            setIsGenerating(false);
            showToast({
              message: 'AI 已经为您生成了创作建议',
              type: 'success',
            });
          } else if (suggestionJob?.status === 'FAILED') {
            window.clearInterval(interval);
            setIsGenerating(false);
            showToast({
              message: '建议生成过程中出现错误',
              type: 'error',
            });
          }
        } catch (error) {
          console.error('Failed to poll suggestions:', error);
          window.clearInterval(interval);
          setIsGenerating(false);
          showToast({
            message: '建议生成过程中出现错误',
            type: 'error',
          });
        }
      }, 2000);
    } catch (error) {
      console.error('Failed to create suggestion job:', error);
      setIsGenerating(false);
      showToast({
        message: '建议生成过程中出现错误',
        type: 'error',
      });
    }
  };

  const applySuggestion = async (group: SuggestionGroupKey, suggestion: string, index: number) => {
    if (!projectId) return;

    const key = `${group}-${index}-${suggestion}`;
    setApplyingSuggestionKey(key);
    try {
      if (group === 'characterSuggestions') {
        await charactersApi.create(projectId, {
          name: getSuggestionTitle(suggestion, `建议人物 ${characterCount + 1}`),
          role: '待完善',
          notes: suggestion,
        });
        setCharacterCount(count => count + 1);
        showToast({ message: '已创建人物草稿', type: 'success' });
      } else if (group === 'worldSuggestions') {
        await worldSettingsApi.create(projectId, {
          category: 'AI 建议',
          name: getSuggestionTitle(suggestion, `设定 ${worldSettingCount + 1}`),
          description: suggestion,
        });
        setWorldSettingCount(count => count + 1);
        showToast({ message: '已创建世界观设定', type: 'success' });
      } else {
        await chaptersApi.create(projectId, {
          title: getSuggestionTitle(suggestion, group === 'plotSuggestions' ? '剧情规划' : 'AI 建议章节'),
          summary: suggestion,
          status: 'DRAFT',
        });
        setChapterCount(count => count + 1);
        showToast({
          message: group === 'plotSuggestions' ? '已创建剧情规划章节' : '已创建章节草稿',
          type: 'success',
        });
      }

      setAppliedSuggestions(current => ({ ...current, [key]: true }));
    } catch (error) {
      console.error('Failed to apply suggestion:', error);
      showToast({ message: '应用 AI 建议失败', type: 'error' });
    } finally {
      setApplyingSuggestionKey(null);
    }
  };

  const calculateCompletion = () => {
    const completed = [
      project?.title,
      project?.subtitle,
      project?.synopsis,
      project?.genre,
      characterCount > 0,
      chapterCount > 0,
      worldSettingCount > 0,
    ].filter(Boolean).length * 25;
    return Math.min(completed, 100);
  };

  const quickActions: QuickAction[] = [
    {
      id: 'new-chapter',
      title: '创建新章节',
      description: '开始写作新的篇章',
      icon: BookOpen,
      href: `/projects/${projectId}/chapters/new`,
      path: 'chapters',
    },
    {
      id: 'add-character',
      title: '添加人物',
      description: '扩展你的角色库',
      icon: UserPlus,
      href: `/projects/${projectId}/characters`,
      path: 'characters',
    },
    {
      id: 'world-settings',
      title: '世界观设定',
      description: '构建你的故事世界',
      icon: Globe,
      href: `/projects/${projectId}/world`,
      path: 'world',
    },
    {
      id: 'plot-outline',
      title: '情节大纲',
      description: '规划故事走向',
      icon: Layout,
      href: `/projects/${projectId}/outlines`,
      path: 'outlines',
    },
  ];

  const handleQuickAction = (action: QuickAction) => {
    if (action.path && onOpenRoute) {
      onOpenRoute(action.path);
    } else {
      navigate(action.href);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--bg-primary)]">
        <Loader2 className="w-8 h-8 text-[var(--accent-color)] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[var(--bg-primary)] p-6">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-[var(--text-secondary)] text-lg mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>重新加载</Button>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--bg-primary)]">
        <p className="text-[var(--text-muted)]">未找到项目</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-[var(--bg-primary)] p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">{project.title}</h1>
            {project.subtitle && (
              <p className="text-sm text-[var(--text-muted)] mt-1">{project.subtitle}</p>
            )}
          </div>
          <Button onClick={generateSuggestions} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                获取 AI 建议
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-[var(--bg-secondary)] border-[var(--border-color)]">
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--accent-color)]/20 rounded-lg">
                  <BookOpen className="w-5 h-5 text-[var(--accent-color)]" />
                </div>
                <div>
                  <div className="text-xl font-bold text-[var(--text-primary)]">{chapterCount}</div>
                  <div className="text-xs text-[var(--text-muted)]">章节数</div>
                </div>
              </div>
            </div>
          </Card>
          <Card className="bg-[var(--bg-secondary)] border-[var(--border-color)]">
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <div className="text-xl font-bold text-[var(--text-primary)]">{characterCount}</div>
                  <div className="text-xs text-[var(--text-muted)]">人物数</div>
                </div>
              </div>
            </div>
          </Card>
          <Card className="bg-[var(--bg-secondary)] border-[var(--border-color)]">
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Globe className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <div className="text-xl font-bold text-[var(--text-primary)]">{worldSettingCount}</div>
                  <div className="text-xs text-[var(--text-muted)]">世界观设定</div>
                </div>
              </div>
            </div>
          </Card>
          <Card className="bg-[var(--bg-secondary)] border-[var(--border-color)]">
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <div className="text-xl font-bold text-[var(--text-primary)]">{calculateCompletion()}%</div>
                  <div className="text-xs text-[var(--text-muted)]">完成度</div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {project.synopsis && (
          <Card className="bg-[var(--bg-secondary)] border-[var(--border-color)]">
            <div className="p-5">
              <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2">故事简介</h3>
              <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">{project.synopsis}</p>
            </div>
          </Card>
        )}

        {suggestions && (
          <Card className="bg-[var(--bg-secondary)] border-[var(--border-color)]">
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                <h3 className="text-base font-semibold text-[var(--text-primary)]">AI 创作建议</h3>
              </div>
              <div className="space-y-3">
                {suggestionGroups.map(group => {
                  const groupSuggestions = suggestions[group.key];
                  if (!groupSuggestions || groupSuggestions.length === 0) return null;
                  return (
                    <div key={group.key}>
                      <h4 className="text-xs font-medium text-[var(--text-secondary)] mb-2">{group.title}</h4>
                      <div className="space-y-2">
                        {groupSuggestions.map((suggestion, index) => (
                          (() => {
                            const key = `${group.key}-${index}-${suggestion}`;
                            const isApplied = Boolean(appliedSuggestions[key]);
                            const isApplying = applyingSuggestionKey === key;
                            return (
                              <div
                                key={key}
                                className={`flex items-start justify-between gap-3 p-3 rounded-lg border ${
                                  isApplied ? 'bg-green-900/20 border-green-700' : 'bg-[var(--bg-primary)] border-[var(--border-color)]'
                                }`}
                              >
                                <div className="flex items-start gap-2">
                                  <CheckCircle className="w-4 h-4 text-[var(--accent-color)] flex-shrink-0 mt-0.5" />
                                  <span className="text-sm text-[var(--text-secondary)]">{suggestion}</span>
                                </div>
                                <Button
                                  variant={isApplied ? 'ghost' : 'outline'}
                                  size="sm"
                                  onClick={() => applySuggestion(group.key, suggestion, index)}
                                  disabled={isApplied || isApplying}
                                  className="shrink-0"
                                >
                                  {isApplying ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  ) : isApplied ? (
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                  ) : (
                                    <Sparkles className="w-4 h-4 mr-2" />
                                  )}
                                  {isApplied ? '已应用' : group.applyLabel}
                                </Button>
                              </div>
                            );
                          })()
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        )}

        <Card className="bg-[var(--bg-secondary)] border-[var(--border-color)]">
          <div className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-[var(--accent-color)]" />
                <h3 className="text-base font-semibold text-[var(--text-primary)]">快速操作</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {quickActions.map(action => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      onClick={() => handleQuickAction(action)}
                      className="p-3 text-left hover:bg-[var(--bg-hover)] rounded-lg border border-[var(--border-color)] transition-colors"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="p-1.5 bg-[var(--bg-tertiary)] rounded-lg">
                          <Icon className="w-4 h-4 text-[var(--accent-color)]" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-[var(--text-primary)]">{action.title}</div>
                          <div className="text-xs text-[var(--text-muted)]">{action.description}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
        </Card>
      </div>
    </div>
  );
};
