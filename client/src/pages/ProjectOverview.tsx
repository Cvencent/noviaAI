import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, Users, MapPin, FileText, TrendingUp, Clock, Sparkles, Loader2, AlertTriangle, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { projectsApi } from '@/api/projects';
import { charactersApi } from '@/api/characters';
import { worldSettingsApi } from '@/api/world-settings';
import { chaptersApi } from '@/api/chapters';

export const ProjectOverview = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isGeneratingCharacters, setIsGeneratingCharacters] = useState(false);
  const [isGeneratingWorldSettings, setIsGeneratingWorldSettings] = useState(false);

  const { data: project, isLoading: isLoadingProject } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectId ? projectsApi.getById(projectId) : null,
    enabled: !!projectId
  });

  const { data: characters, isLoading: isLoadingCharacters } = useQuery({
    queryKey: ['characters', projectId],
    queryFn: () => projectId ? charactersApi.getAll(projectId) : [],
    enabled: !!projectId
  });

  const { data: worldSettings, isLoading: isLoadingWorldSettings } = useQuery({
    queryKey: ['worldSettings', projectId],
    queryFn: () => projectId ? worldSettingsApi.getAll(projectId) : [],
    enabled: !!projectId
  });

  const { data: chapters, isLoading: isLoadingChapters } = useQuery({
    queryKey: ['chapters', projectId],
    queryFn: () => projectId ? chaptersApi.getAll(projectId) : [],
    enabled: !!projectId
  });

  const { data: wordCountData, isLoading: isLoadingWordCount } = useQuery({
    queryKey: ['wordCount', projectId],
    queryFn: () => projectId ? chaptersApi.getProjectWordCount(projectId) : Promise.resolve({ wordCount: 0 }),
    enabled: !!projectId
  });

  const isLoading = isLoadingProject || isLoadingCharacters || isLoadingWorldSettings || isLoadingChapters || isLoadingWordCount;

  const handleGenerateCharacters = async () => {
    if (!projectId) return;
    setIsGeneratingCharacters(true);
    try {
      await projectsApi.aiGenerateCharacters(projectId, 3);
      queryClient.invalidateQueries({ queryKey: ['characters', projectId] });
    } catch (error) {
      console.error('生成角色失败:', error);
      alert('生成角色失败，请检查 API Key 配置或稍后重试');
    } finally {
      setIsGeneratingCharacters(false);
    }
  };

  const handleGenerateWorldSettings = async () => {
    if (!projectId) return;
    setIsGeneratingWorldSettings(true);
    try {
      await projectsApi.aiGenerateWorldSettings(projectId, 3);
      queryClient.invalidateQueries({ queryKey: ['worldSettings', projectId] });
    } catch (error) {
      console.error('生成世界观设定失败:', error);
      alert('生成世界观设定失败，请检查 API Key 配置或稍后重试');
    } finally {
      setIsGeneratingWorldSettings(false);
    }
  };

  const stats = [
    { 
      icon: FileText, 
      label: '总字数', 
      value: wordCountData?.wordCount?.toLocaleString() || '0',
      isLoading: isLoadingWordCount
    },
    { 
      icon: Users, 
      label: '人物', 
      value: characters?.length?.toString() || '0',
      isLoading: isLoadingCharacters,
      path: projectId ? `/projects/${projectId}/characters` : undefined
    },
    { 
      icon: MapPin, 
      label: '世界观', 
      value: worldSettings?.length?.toString() || '0',
      isLoading: isLoadingWorldSettings,
      path: projectId ? `/projects/${projectId}/world` : undefined
    },
    { 
      icon: BookOpen, 
      label: '章节', 
      value: chapters?.length?.toString() || '0',
      isLoading: isLoadingChapters,
      path: projectId ? `/projects/${projectId}/chapters` : undefined
    },
  ];

  const recentChapters = React.useMemo(() => {
    if (!chapters || chapters.length === 0) return [];
    return [...chapters]
      .sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt || 0);
        const dateB = new Date(b.updatedAt || b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 5);
  }, [chapters]);

  const projectHealthItems = React.useMemo(() => {
    const items: Array<{ title: string; description: string; action: string; target: string; tone: 'red' | 'amber' | 'indigo' }> = [];
    const characterCount = characters?.length || 0;
    const worldSettingCount = worldSettings?.length || 0;
    const chapterCount = chapters?.length || 0;
    const emptyChapters = chapters?.filter(chapter => (chapter.wordCount || 0) === 0) || [];
    const lowInfoCharacters = characters?.filter(character => {
      const filledFields = [character.appearance, character.personality, character.background, character.goals, character.notes]
        .filter(value => value && value.trim()).length;
      return filledFields <= 1;
    }) || [];

    if (chapterCount === 0) {
      items.push({
        title: '还没有章节',
        description: '先创建章节，AI 才能基于正文帮你抽取人物、世界观和冲突。',
        action: '去写章节',
        target: `/projects/${projectId}/chapters`,
        tone: 'indigo',
      });
    } else if (emptyChapters.length > 0) {
      items.push({
        title: `${emptyChapters.length} 个章节还没有正文`,
        description: `例如「${emptyChapters[0].title}」，可以先补正文再做 AI 整理。`,
        action: '查看章节',
        target: `/projects/${projectId}/chapters`,
        tone: 'amber',
      });
    }

    if (characterCount === 0) {
      items.push({
        title: '角色档案为空',
        description: '建议先生成或创建核心角色，后续关系分析会更准确。',
        action: '补角色',
        target: `/projects/${projectId}/characters`,
        tone: 'red',
      });
    } else if (lowInfoCharacters.length > 0) {
      items.push({
        title: `${lowInfoCharacters.length} 个角色信息偏少`,
        description: `例如「${lowInfoCharacters[0].name}」，可以补充背景、目标或性格。`,
        action: '查看角色',
        target: `/projects/${projectId}/characters`,
        tone: 'amber',
      });
    }

    if (worldSettingCount === 0) {
      items.push({
        title: '世界观设定为空',
        description: '建议先补基础设定，章节冲突检测才有可参照的规则。',
        action: '补设定',
        target: `/projects/${projectId}/world`,
        tone: 'red',
      });
    }

    if (items.length === 0) {
      items.push({
        title: '项目基础资料较完整',
        description: '下一步可以进入最近章节续写，并让 AI 自动抽取新人物、关系和世界观。',
        action: '继续写作',
        target: recentChapters[0]?.id ? `/projects/${projectId}/chapters/${recentChapters[0].id}` : `/projects/${projectId}/chapters`,
        tone: 'indigo',
      });
    }

    return items.slice(0, 3);
  }, [characters, chapters, projectId, recentChapters, worldSettings]);

  const healthToneClass = {
    red: 'border-red-200 bg-red-50 text-red-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    indigo: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8">
        <div className="mb-8">
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-64" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-64" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          {project?.title || '未命名项目'}
        </h1>
        {project?.subtitle && (
          <p className="text-gray-600 mt-1">{project.subtitle}</p>
        )}
        {project?.synopsis && (
          <p className="text-gray-700 mt-4 leading-relaxed">{project.synopsis}</p>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        {stats.map((stat, index) => (
          <Card
            key={index}
            hoverable={Boolean(stat.path)}
            role={stat.path ? 'button' : undefined}
            tabIndex={stat.path ? 0 : undefined}
            className={stat.path ? 'cursor-pointer' : undefined}
            onClick={() => stat.path && navigate(stat.path)}
            onKeyDown={(event) => {
              if (!stat.path || (event.key !== 'Enter' && event.key !== ' ')) return;
              event.preventDefault();
              navigate(stat.path);
            }}
          >
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-indigo-100 to-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <stat.icon className="w-5 h-5 md:w-6 md:h-6 text-indigo-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-gray-600">{stat.label}</p>
                  <p className="text-xl md:text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              AI 项目健康摘要
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {projectHealthItems.map((item, index) => (
              <div key={`${item.title}-${index}`} className={`p-3 rounded-lg border ${healthToneClass[item.tone]}`}>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                    <button
                      type="button"
                      onClick={() => navigate(item.target)}
                      className="inline-flex items-center gap-1 text-sm font-medium mt-2 hover:underline"
                    >
                      {item.action}
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              最近更新的章节
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentChapters.length > 0 ? (
              <div className="space-y-3">
                {recentChapters.map((chapter) => (
                  <div
                    key={chapter.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/projects/${projectId}/chapters/${chapter.id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                        {chapter.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {chapter.wordCount?.toLocaleString() || 0} 字
                        </span>
                        {chapter.status && (
                          <span className="px-2 py-0.5 bg-gray-100 rounded-full">
                            {chapter.status}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 flex-shrink-0 ml-4">
                      {formatDate(chapter.updatedAt || chapter.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>还没有章节</p>
                <p className="text-sm mt-1">开始创作后这里会显示您的章节</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              快速开始
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* AI 生成角色按钮 */}
            <div 
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-indigo-50 cursor-pointer transition-colors border border-indigo-200 bg-indigo-50/50"
              onClick={handleGenerateCharacters}
            >
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                {isGeneratingCharacters ? (
                  <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-indigo-900">AI 生成角色</p>
                <p className="text-sm text-indigo-600">根据项目信息自动生成 3 个角色</p>
              </div>
            </div>

            {/* AI 生成世界观按钮 */}
            <div 
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-amber-50 cursor-pointer transition-colors border border-amber-200 bg-amber-50/50"
              onClick={handleGenerateWorldSettings}
            >
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                {isGeneratingWorldSettings ? (
                  <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5 text-amber-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-amber-900">AI 生成世界观</p>
                <p className="text-sm text-amber-600">根据项目信息自动生成 3 个设定</p>
              </div>
            </div>

            {/* 手动创建按钮 */}
            <div 
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => navigate(`/projects/${projectId}/characters`)}
            >
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">手动创建角色</p>
                <p className="text-sm text-gray-500">自己定义角色信息</p>
              </div>
            </div>

            <div 
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => navigate(`/projects/${projectId}/world`)}
            >
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">手动创建世界观</p>
                <p className="text-sm text-gray-500">自己定义世界观设定</p>
              </div>
            </div>

            <div 
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => navigate(`/projects/${projectId}/chapters`)}
            >
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">开始写第一章</p>
                <p className="text-sm text-gray-500">开始您的故事</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
