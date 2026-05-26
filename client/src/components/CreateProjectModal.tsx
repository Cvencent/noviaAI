import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { projectsApi } from '@/api/projects';
import type { CreateProjectDto } from '@/types/project';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type CreateMode = 'manual' | 'ai';

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [createMode, setCreateMode] = useState<CreateMode>('manual');
  const [aiDescription, setAiDescription] = useState('');

  const [formData, setFormData] = useState<CreateProjectDto>({
    title: '',
    subtitle: '',
    synopsis: '',
    genre: 'fantasy',
    tags: '',
    status: 'PLANNING',
  });

  const createMutation = useMutation({
    mutationFn: projectsApi.create,
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      onClose();
      resetForm();
      navigate(`/projects/${project.id}`);
    },
    onError: () => {
      alert('创建项目失败，请稍后重试');
    },
  });

  const aiGenerateMutation = useMutation({
    mutationFn: projectsApi.aiGenerate,
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      onClose();
      setAiDescription('');
      navigate(`/projects/${project.id}`);
    },
    onError: () => {
      alert('AI生成项目失败，请检查API Key配置或稍后重试');
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      synopsis: '',
      genre: 'fantasy',
      tags: '',
      status: 'PLANNING',
    });
  };

  const handleManualCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleAiGenerate = () => {
    if (!aiDescription.trim()) return;
    aiGenerateMutation.mutate(aiDescription);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">创建新项目</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-[var(--text-muted)]" />
        </button>
      </div>

      <div className="px-6 py-4">
        <div className="flex gap-4 mb-6">
          <button
            type="button"
            onClick={() => setCreateMode('manual')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              createMode === 'manual'
                ? 'bg-[var(--accent-color)] text-white'
                : 'bg-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            手动创建
          </button>
          <button
            type="button"
            onClick={() => setCreateMode('ai')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              createMode === 'ai'
                ? 'bg-[var(--accent-color)] text-white'
                : 'bg-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            AI 智能创建
          </button>
        </div>

        {createMode === 'manual' ? (
          <form onSubmit={handleManualCreate} className="space-y-4">
            <Input
              label="小说标题 *"
              placeholder="输入您的小说标题"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />

            <Input
              label="副标题"
              placeholder="一行简短的简介"
              value={formData.subtitle || ''}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
            />

            <Textarea
              label="故事简介"
              placeholder="介绍您的小说故事..."
              value={formData.synopsis}
              onChange={(e) => setFormData({ ...formData, synopsis: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="题材"
                value={formData.genre}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
              >
                <option value="fantasy">奇幻</option>
                <option value="romance">言情</option>
                <option value="scifi">科幻</option>
                <option value="mystery">悬疑</option>
                <option value="urban">都市</option>
                <option value="historical">历史</option>
                <option value="other">其他</option>
              </Select>

              <Select
                label="状态"
                value={formData.status || 'PLANNING'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="PLANNING">构思中</option>
                <option value="IN_PROGRESS">进行中</option>
                <option value="COMPLETED">已完成</option>
              </Select>
            </div>

            <Input
              label="标签"
              placeholder="用逗号分隔多个标签"
              value={formData.tags || ''}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              helpText="例如：冒险, 成长, 爱情"
            />
          </form>
        ) : (
          <div className="space-y-4">
            <Textarea
              label="描述您想要的小说"
              placeholder="例如：一个关于时间旅行的科幻小说，主角是一个年轻的物理学家，他意外发现了穿越时间的方法..."
              value={aiDescription}
              onChange={(e) => setAiDescription(e.target.value)}
              rows={6}
            />
            <div className="bg-[var(--border-color)] rounded-lg p-4">
              <h4 className="text-sm font-medium text-[var(--accent-color)] mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                提示
              </h4>
              <ul className="text-sm text-[var(--text-muted)] space-y-1">
                <li>• 描述越详细，生成的内容越符合您的期望</li>
                <li>• 可以包含题材、主角、背景、冲突等元素</li>
                <li>• 生成后您可以随时修改任何内容</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className="px-6 py-4 border-t border-[var(--border-color)] flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose}>
          取消
        </Button>
        {createMode === 'manual' ? (
          <Button
            type="submit"
            onClick={handleManualCreate}
            isLoading={createMutation.isPending}
            disabled={!formData.title.trim()}
          >
            创建项目
          </Button>
        ) : (
          <Button
            onClick={handleAiGenerate}
            isLoading={aiGenerateMutation.isPending}
            disabled={!aiDescription.trim()}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            生成项目
          </Button>
        )}
      </div>
    </Modal>
  );
};
