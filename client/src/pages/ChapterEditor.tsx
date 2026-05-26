import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, CheckCircle2, Loader2, Network, Save } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { RichTextEditor } from '../components/editor/RichTextEditor';
import { chaptersApi, type Chapter } from '../api/chapters';
import { storySystemApi } from '../api/story-system';

interface ChapterEditorProps {
  onOpenRoute?: (path: string) => void;
  projectId?: string;
  chapterId?: string;
}

const looksLikeHtml = (value: string) => /<\/?[a-z][\s\S]*>/i.test(value);

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const plainTextToHtml = (value: string) =>
  value
    .split(/\n{2,}/)
    .map(paragraph => paragraph.trim())
    .filter(Boolean)
    .map(paragraph => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
    .join('');

const chapterContentToHtml = (chapter: Chapter) =>
  chapter.contents
    ?.map(item => (looksLikeHtml(item.content) ? item.content : plainTextToHtml(item.content)))
    .join('') || '';

const editorContentToPlainText = (value: string) => {
  if (!value) return '';
  if (!looksLikeHtml(value)) return value;
  const element = document.createElement('div');
  element.innerHTML = value.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '</p>\n\n');
  return element.textContent || '';
};

export const ChapterEditor: React.FC<ChapterEditorProps> = ({
  onOpenRoute,
  projectId: projectIdProp,
  chapterId: chapterIdProp,
}) => {
  const { projectId: routeProjectId, chapterId: routeChapterId } = useParams<{
    projectId: string;
    chapterId: string;
  }>();
  const projectId = projectIdProp || routeProjectId;
  const chapterId = chapterIdProp || routeChapterId;
  const navigate = useNavigate();

  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncingGraph, setIsSyncingGraph] = useState(false);
  const [graphSyncStatus, setGraphSyncStatus] = useState<'idle' | 'synced' | 'failed'>('idle');
  const [graphSyncMessage, setGraphSyncMessage] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plainContent = useMemo(() => editorContentToPlainText(content), [content]);

  const chapterContext = useMemo(() => {
    if (!chapterId) return undefined;
    return {
      chapterId,
      chapterContent: plainContent,
      chapterTitle: title,
    };
  }, [chapterId, plainContent, title]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('chapterContextUpdate', { detail: chapterContext }));
    return () => {
      window.dispatchEvent(new CustomEvent('chapterContextUpdate', { detail: undefined }));
    };
  }, [chapterContext]);

  useEffect(() => {
    const fetchChapter = async () => {
      if (!projectId || !chapterId) {
        setIsLoading(false);
        setError('缺少项目或章节 ID');
        return;
      }

      setIsLoading(true);
        setError(null);
      try {
        const nextChapter = await chaptersApi.getById(projectId, chapterId);
        const nextContent = chapterContentToHtml(nextChapter);
        setChapter(nextChapter);
        setTitle(nextChapter.title || '');
        setContent(nextContent);
        setSummary(nextChapter.summary || '');
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error('加载章节失败:', error);
        setError('加载章节失败');
      } finally {
        setIsLoading(false);
      }
    };

    fetchChapter();
  }, [projectId, chapterId]);

  const handleBack = () => {
    if (onOpenRoute) {
      onOpenRoute('chapters');
    } else {
      navigate(`/projects/${projectId}/chapters`);
    }
  };

  const handleSave = async () => {
    if (!projectId || !chapterId || !hasUnsavedChanges) return;

    setIsSaving(true);
    setError(null);
    setGraphSyncStatus('idle');
    setGraphSyncMessage('');
    try {
      await chaptersApi.update(projectId, chapterId, { title, summary });
      await chaptersApi.updateContent(projectId, chapterId, {
        title,
        contents: plainContent.trim() ? [{ content, order: 0 }] : [],
      });
      setHasUnsavedChanges(false);
      if (plainContent.trim()) {
        setIsSyncingGraph(true);
        try {
          const reviewResult = await storySystemApi.review(projectId, chapterId, plainContent);
          const commit = await storySystemApi.createCommit(projectId, chapterId, {
            content: plainContent,
            reviewResult,
            extractionResult: {
              acceptedEvents: [{ eventType: 'CHAPTER_SAVED', subject: title || 'chapter' }],
              stateDeltas: [],
              entityDeltas: [],
              summaryText: summary.trim() || plainContent.replace(/\s+/g, ' ').trim().slice(0, 120),
            },
          });

          if (commit.status === 'ACCEPTED') {
            setGraphSyncStatus('synced');
            setGraphSyncMessage('Story Graph 已自动更新');
          } else {
            setGraphSyncStatus('failed');
            setGraphSyncMessage('Story Graph 未更新：章节提交被审查规则拦截');
          }
        } catch (syncError) {
          console.error('Story Graph 同步失败:', syncError);
          setGraphSyncStatus('failed');
          setGraphSyncMessage('Story Graph 同步失败，章节内容已保存');
        } finally {
          setIsSyncingGraph(false);
        }
      }
    } catch (error) {
      console.error('保存章节失败:', error);
      setError('保存章节失败');
    } finally {
      setIsSaving(false);
    }
  };

  const updateTitle = (value: string) => {
    setTitle(value);
    setHasUnsavedChanges(true);
    setGraphSyncStatus('idle');
    setGraphSyncMessage('');
  };

  const updateContent = (value: string) => {
    setContent(value);
    setHasUnsavedChanges(true);
    setGraphSyncStatus('idle');
    setGraphSyncMessage('');
  };

  const updateSummary = (value: string) => {
    setSummary(value);
    setHasUnsavedChanges(true);
    setGraphSyncStatus('idle');
    setGraphSyncMessage('');
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--bg-primary)]">
        <Loader2 className="w-8 h-8 text-[var(--accent-color)] animate-spin" />
      </div>
    );
  }

  if (error && !chapter) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[var(--bg-primary)] p-6">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-[var(--text-secondary)] mb-4">{error}</p>
        <Button onClick={handleBack}>返回章节列表</Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[var(--bg-primary)]">
      <header className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)] px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回
            </Button>
            <div className="h-6 w-px bg-[var(--border-color)]" />
            <Input
              value={title}
              onChange={(event) => updateTitle(event.target.value)}
              className="text-lg font-semibold border-none bg-transparent focus:bg-[var(--bg-tertiary)] px-2 py-1"
              placeholder="章节标题"
            />
          </div>
          <Button onClick={handleSave} disabled={!hasUnsavedChanges || isSaving} isLoading={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            保存
          </Button>
        </div>
      </header>

      {error && (
        <div className="bg-red-900/30 border-b border-red-700 px-4 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-hidden grid grid-cols-[minmax(0,1fr)_320px]">
        <main className="h-full overflow-hidden p-6">
          <RichTextEditor
            content={content}
            onChange={updateContent}
            className="chapter-rich-text-editor"
            placeholder="开始写作..."
          />
        </main>

        <aside className="h-full overflow-y-auto border-l border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">章节摘要</h2>
          <textarea
            value={summary}
            onChange={(event) => updateSummary(event.target.value)}
            className="h-40 w-full resize-none rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] p-3 text-sm text-[var(--text-secondary)] outline-none focus:border-[var(--accent-color)]"
            placeholder="记录章节摘要..."
          />

          <div className="mt-6 space-y-2 text-sm text-[var(--text-muted)]">
            <div className="flex justify-between">
              <span>字数</span>
              <span>{plainContent.replace(/\s/g, '').length}</span>
            </div>
            <div className="flex justify-between">
              <span>状态</span>
              <span>{chapter?.status || 'DRAFT'}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Story Graph</span>
              <span className="flex items-center gap-1 text-xs">
                {isSyncingGraph ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent-color)]" />
                    同步中
                  </>
                ) : graphSyncStatus === 'synced' ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                    已同步
                  </>
                ) : graphSyncStatus === 'failed' ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-yellow-300" />
                    未同步
                  </>
                ) : (
                  <>
                    <Network className="w-3.5 h-3.5" />
                    自动
                  </>
                )}
              </span>
            </div>
            {graphSyncMessage && (
              <div className={graphSyncStatus === 'failed' ? 'text-yellow-300' : 'text-green-500'}>
                {graphSyncMessage}
              </div>
            )}
            {hasUnsavedChanges && (
              <div className="flex items-center gap-2 pt-3 text-yellow-300">
                <AlertTriangle className="w-4 h-4" />
                有未保存的更改
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
