import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  CheckCircle,
  ChevronRight,
  Clock,
  Edit2,
  Eye,
  FileText,
  GripVertical,
  Plus,
  Trash2,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { chaptersApi, type Chapter } from '../api/chapters';

const STATUS_CONFIG = {
  DRAFT: { label: '草稿', icon: Clock, color: 'text-yellow-400 bg-yellow-900/30' },
  WRITING: { label: '写作中', icon: Edit2, color: 'text-[var(--accent-color)] bg-[var(--accent-color)]/20' },
  COMPLETED: { label: '已完成', icon: CheckCircle, color: 'text-green-400 bg-green-900/30' },
  REVIEW: { label: '待审阅', icon: Eye, color: 'text-purple-400 bg-purple-900/30' },
  draft: { label: '草稿', icon: Clock, color: 'text-yellow-400 bg-yellow-900/30' },
  writing: { label: '写作中', icon: Edit2, color: 'text-[var(--accent-color)] bg-[var(--accent-color)]/20' },
  completed: { label: '已完成', icon: CheckCircle, color: 'text-green-400 bg-green-900/30' },
  review: { label: '待审阅', icon: Eye, color: 'text-purple-400 bg-purple-900/30' },
};

export const ChapterManagement: React.FC<{
  onOpenRoute?: (path: string) => void;
}> = ({ onOpenRoute }) => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchChapters();
  }, [projectId]);

  const fetchChapters = async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const data = await chaptersApi.getAll(projectId);
      setChapters(data);
    } catch (error) {
      console.error('获取章节失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openChapter = (chapterId: string) => {
    if (onOpenRoute) {
      onOpenRoute(`chapters/${chapterId}`);
    } else {
      navigate(`/projects/${projectId}/chapters/${chapterId}`);
    }
  };

  const handleCreateChapter = async () => {
    if (!projectId || !newChapterTitle.trim()) return;
    try {
      const newChapter = await chaptersApi.create(projectId, {
        title: newChapterTitle.trim(),
        status: 'DRAFT',
      });
      setChapters(current => [...current, newChapter]);
      setShowCreateModal(false);
      setNewChapterTitle('');
      openChapter(newChapter.id);
    } catch (error) {
      console.error('创建章节失败:', error);
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (!projectId) return;
    try {
      await chaptersApi.delete(projectId, chapterId);
      setChapters(current => current.filter(chapter => chapter.id !== chapterId));
    } catch (error) {
      console.error('删除章节失败:', error);
    }
  };

  const handleReorder = async (startIndex: number, endIndex: number) => {
    if (!projectId || startIndex === endIndex) return;

    const result = Array.from(chapters);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    setChapters(result);

    try {
      await chaptersApi.reorder(projectId, {
        chapterIds: result.map(chapter => chapter.id),
      });
    } catch (error) {
      console.error('更新章节顺序失败:', error);
      fetchChapters();
    }
  };

  const handleDrop = (index: number) => {
    if (draggedIndex !== null && draggedIndex !== index) {
      handleReorder(draggedIndex, index);
    }
    setDraggedIndex(null);
  };

  return (
    <div className="h-full overflow-y-auto bg-[var(--bg-primary)] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">章节管理</h1>
            <p className="text-[var(--text-muted)] mt-1">管理项目章节</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            新建章节
          </Button>
        </div>

        <Card className="bg-[var(--bg-secondary)] border-[var(--border-color)]">
          <div className="divide-y divide-[var(--border-color)]">
            {chapters.map((chapter, index) => {
              const status = STATUS_CONFIG[chapter.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.DRAFT;
              const StatusIcon = status.icon;

              return (
                <div
                  key={chapter.id}
                  draggable
                  onDragStart={() => setDraggedIndex(index)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => handleDrop(index)}
                  onDragEnd={() => setDraggedIndex(null)}
                  className={`flex items-center gap-4 p-4 hover:bg-[var(--bg-hover)] transition-colors cursor-pointer group ${
                    draggedIndex === index ? 'opacity-50' : ''
                  }`}
                  onClick={() => openChapter(chapter.id)}
                >
                  <div className="text-[var(--text-muted)] cursor-grab hover:text-[var(--text-primary)]">
                    <GripVertical className="w-5 h-5" />
                  </div>

                  <div className="w-8 text-center text-[var(--text-muted)] font-medium">
                    {(chapter.order ?? index) + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[var(--accent-color)]" />
                      <span className="font-medium text-[var(--text-primary)] truncate">
                        {chapter.title || '未命名章节'}
                      </span>
                    </div>
                    {chapter.summary && (
                      <p className="text-sm text-[var(--text-muted)] mt-1 truncate">{chapter.summary}</p>
                    )}
                  </div>

                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${status.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {status.label}
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        openChapter(chapter.id);
                      }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDeleteChapter(chapter.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <ChevronRight className="w-5 h-5 text-[var(--text-muted)]" />
                </div>
              );
            })}

            {!isLoading && chapters.length === 0 && (
              <div className="p-12 text-center">
                <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">还没有章节</p>
                <Button onClick={() => setShowCreateModal(true)} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  创建第一章
                </Button>
              </div>
            )}

            {isLoading && (
              <div className="p-12 text-center text-gray-400">章节加载中...</div>
            )}
          </div>
        </Card>
      </div>

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)}>
        <div className="bg-[var(--bg-secondary)] border-[var(--border-color)] p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">创建章节</h3>
          <Input
            label="章节标题"
            value={newChapterTitle}
            onChange={(event) => setNewChapterTitle(event.target.value)}
            placeholder="输入章节标题"
            className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg p-3 text-[var(--text-muted)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
            onKeyDown={(event) => event.key === 'Enter' && handleCreateChapter()}
          />
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              取消
            </Button>
            <Button onClick={handleCreateChapter} disabled={!newChapterTitle.trim()}>
              创建
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
