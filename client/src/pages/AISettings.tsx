import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, RotateCcw, Sparkles, Plus, Trash2, Key, MessageSquare, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';
import { aiConfigApi } from '@/api/ai-config';
import { apiKeysApi } from '@/api/api-keys';
import { useToast } from '@/contexts/ToastContext';
import {
  AIAction,
  AIProvider,
  AIConfigMap,
  AIActionLabels,
  AIActionDescriptions,
  AIProviderLabels,
  AIModelOptions,
} from '@/types/ai-config';
import { ModificationConfig, DEFAULT_MODIFICATION_CONFIG } from '@/types/ai-changes';

export const AISettingsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [configs, setConfigs] = useState<AIConfigMap>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [newKey, setNewKey] = useState({ name: '', provider: '', apiKey: '', baseUrl: '' });
  const { success, error } = useToast();

  const [modificationConfig, setModificationConfig] = useState<ModificationConfig>(() => {
    const saved = localStorage.getItem('modificationConfig');
    return saved ? JSON.parse(saved) : DEFAULT_MODIFICATION_CONFIG;
  });
  const [hasConfigChanges, setHasConfigChanges] = useState(false);

  const { data: savedConfigs, isLoading: configsLoading } = useQuery({
    queryKey: ['ai-configs'],
    queryFn: aiConfigApi.getConfigs,
  });

  const { data: defaultConfigs } = useQuery({
    queryKey: ['ai-config-defaults'],
    queryFn: aiConfigApi.getDefaults,
  });

  const { data: apiKeys = [], isLoading: keysLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: apiKeysApi.getAll,
  });

  useEffect(() => {
    if (savedConfigs && Object.keys(savedConfigs).length > 0) {
      setConfigs(savedConfigs);
    } else if (defaultConfigs) {
      setConfigs(defaultConfigs);
    }
  }, [savedConfigs, defaultConfigs]);

  const updateMutation = useMutation({
    mutationFn: (data: { action: string; config: any }[]) =>
      aiConfigApi.batchUpdate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-configs'] });
      setHasChanges(false);
      success('AI 配置已保存');
    },
    onError: (err) => {
      error('保存配置失败');
      console.error('保存配置失败:', err);
    }
  });

  const createKeyMutation = useMutation({
    mutationFn: apiKeysApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      setIsKeyModalOpen(false);
      setNewKey({ name: '', provider: '', apiKey: '', baseUrl: '' });
      success('API 密钥已添加');
    },
    onError: (err) => {
      error('添加 API 密钥失败');
      console.error('添加 API 密钥失败:', err);
    }
  });

  const deleteKeyMutation = useMutation({
    mutationFn: apiKeysApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      success('API 密钥已删除');
    },
    onError: (err) => {
      error('删除 API 密钥失败');
      console.error('删除 API 密钥失败:', err);
    }
  });

  const handleConfigChange = (
    action: AIAction,
    field: 'provider' | 'model' | 'apiKeyId' | 'isActive',
    value: any
  ) => {
    setConfigs((prev) => ({
      ...prev,
      [action]: {
        ...prev[action],
        [field]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    const configArray = Object.entries(configs).map(([action, config]) => {
      // 清理数据，移除空值
      const cleanConfig: any = {
        provider: config.provider,
        model: config.model,
        isActive: config.isActive,
      };
      // 只在 apiKeyId 有值时才发送
      if (config.apiKeyId) {
        cleanConfig.apiKeyId = config.apiKeyId;
      }
      return { action, config: cleanConfig };
    });
    updateMutation.mutate(configArray);
  };

  const handleReset = () => {
    if (defaultConfigs) {
      setConfigs(defaultConfigs);
      setHasChanges(true);
    }
  };

  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    createKeyMutation.mutate(newKey);
  };

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    keyId: ''
  });

  const handleDeleteKey = (id: string) => {
    setDeleteModal({ isOpen: true, keyId: id });
  };

  const confirmDeleteKey = () => {
    deleteKeyMutation.mutate(deleteModal.keyId);
    setDeleteModal({ isOpen: false, keyId: '' });
  };

  const handleSaveModificationConfig = () => {
    localStorage.setItem('modificationConfig', JSON.stringify(modificationConfig));
    setHasConfigChanges(false);
  };

  const getKeysForProvider = (provider: AIProvider) => {
    return apiKeys.filter((key) => key.provider === provider && key.isActive);
  };

  const actions = Object.values(AIAction);

  if (configsLoading || keysLoading) {
    return (
      <div className="h-full bg-[var(--bg-primary)] p-4 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="h-full bg-[var(--bg-primary)] p-6 overflow-y-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="h-8">
              <ArrowLeft className="w-4 h-4 mr-1" />
              返回
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[var(--accent-color)]" />
                AI 模块配置
              </h1>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                为不同的AI功能配置独立的服务商、模型和API密钥
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              恢复默认
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!hasChanges}>
              <Save className="w-3.5 h-3.5 mr-1" />
              保存配置
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {actions.map((action) => {
            const config = configs[action] || {
              provider: AIProvider.OPENAI,
              model: 'gpt-4',
              isActive: true,
            };

            const availableKeys = getKeysForProvider(config.provider);

            return (
              <Card key={action} className="overflow-hidden bg-[var(--bg-secondary)] border-[var(--border-color)]">
                <CardHeader className="bg-gradient-to-r from-[var(--accent-color)]/10 to-amber-900/10">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2 text-[var(--text-primary)]">
                        <span className="w-2 h-2 bg-[var(--accent-color)] rounded-full"></span>
                        {AIActionLabels[action]}
                      </CardTitle>
                      <CardDescription className="mt-2 text-[var(--text-muted)]">
                        {AIActionDescriptions[action]}
                      </CardDescription>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.isActive}
                        onChange={(e) =>
                          handleConfigChange(action, 'isActive', e.target.checked)
                        }
                        className="w-5 h-5 rounded border-[var(--border-color)] text-[var(--accent-color)] focus:ring-[var(--accent-color)]"
                      />
                      <span className="text-sm font-medium text-[var(--text-secondary)]">启用</span>
                    </label>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                        AI 服务商
                      </label>
                      <Select
                        value={config.provider}
                        onChange={(e) => {
                          const newProvider = e.target.value as AIProvider;
                          handleConfigChange(action, 'provider', newProvider);
                          handleConfigChange(action, 'apiKeyId', undefined);
                          const providerModels = AIModelOptions[newProvider];
                          if (providerModels && providerModels.length > 0) {
                            handleConfigChange(action, 'model', providerModels[0]);
                          }
                        }}
                        disabled={!config.isActive}
                      >
                        {Object.entries(AIProviderLabels).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                        模型
                      </label>
                      <Select
                        value={config.model || ''}
                        onChange={(e) =>
                          handleConfigChange(action, 'model', e.target.value)
                        }
                        disabled={!config.isActive}
                        className="bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)]"
                      >
                        {(AIModelOptions[config.provider as AIProvider] || []).map(
                          (model) => (
                            <option key={model} value={model}>
                              {model}
                            </option>
                          )
                        )}
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        API 密钥
                      </label>
                      <Select
                        value={config.apiKeyId || ''}
                        onChange={(e) =>
                          handleConfigChange(action, 'apiKeyId', e.target.value || undefined)
                        }
                        disabled={!config.isActive}
                      >
                        <option value="">使用默认密钥</option>
                        {availableKeys.map((key) => (
                          <option key={key.id} value={key.id}>
                            {key.name}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-24 overflow-hidden bg-[var(--bg-secondary)] border-[var(--border-color)]">
            <CardHeader className="bg-gradient-to-r from-[var(--accent-color)]/10 to-amber-900/10">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-[var(--text-primary)]">
                  <Key className="w-5 h-5 text-[var(--accent-color)]" />
                  API 密钥管理
                </CardTitle>
                <Button size="sm" onClick={() => setIsKeyModalOpen(true)}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              {apiKeys.length === 0 ? (
                <div className="text-center py-8 text-[var(--text-muted)]">
                  <Key className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>暂无API密钥</p>
                  <p className="text-sm">点击上方按钮添加</p>
                </div>
              ) : (
                apiKeys.map((key) => (
                  <div
                    key={key.id}
                    className="flex items-center justify-between p-3 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-color)]"
                  >
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">{key.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {AIProviderLabels[key.provider as AIProvider]}
                        {key.baseUrl && (
                          <span className="ml-2 text-[var(--accent-color)]">自定义端点</span>
                        )}
                      </p>
                      {key.baseUrl && (
                        <p className="text-xs text-[var(--text-muted)] mt-1 truncate max-w-[200px]" title={key.baseUrl}>
                          {key.baseUrl}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {key.isActive ? (
                        <span className="w-2 h-2 bg-green-500 rounded-full" />
                      ) : (
                        <span className="w-2 h-2 bg-[var(--text-muted)] rounded-full" />
                      )}
                      <button
                        onClick={() => handleDeleteKey(key.id)}
                        className="p-1 hover:bg-red-50 rounded text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="mt-6 overflow-hidden bg-[var(--bg-secondary)] border-[var(--border-color)]">
            <CardHeader className="bg-gradient-to-r from-[var(--accent-color)]/10 to-amber-900/10">
              <CardTitle className="flex items-center gap-2 text-[var(--text-primary)]">
                <MessageSquare className="w-5 h-5 text-[var(--accent-color)]" />
                AI 修改确认
              </CardTitle>
              <CardDescription className="text-[var(--text-muted)]">
                配置 AI 修改章节内容时的确认行为
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4 bg-[var(--bg-secondary)]">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-[var(--text-primary)]">需要确认修改</label>
                  <p className="text-sm text-[var(--text-muted)]">AI 建议修改时，是否需要你确认才应用</p>
                </div>
                <button
                  type="button"
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    modificationConfig.requireConfirmation ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                  onClick={() => {
                    setModificationConfig(prev => ({
                      ...prev,
                      requireConfirmation: !prev.requireConfirmation,
                    }));
                    setHasConfigChanges(true);
                  }}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    modificationConfig.requireConfirmation ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-gray-900">自动应用小改动</label>
                  <p className="text-sm text-gray-500">对于小的改动（如标点、错别字），自动应用无需确认</p>
                </div>
                <button
                  type="button"
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    modificationConfig.autoApplyMinorChanges ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                  onClick={() => {
                    setModificationConfig(prev => ({
                      ...prev,
                      autoApplyMinorChanges: !prev.autoApplyMinorChanges,
                    }));
                    setHasConfigChanges(true);
                  }}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    modificationConfig.autoApplyMinorChanges ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-gray-900">内联显示差异</label>
                  <p className="text-sm text-gray-500">在对话中直接显示修改的差异，而非弹窗</p>
                </div>
                <button
                  type="button"
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    modificationConfig.showDiffInline ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                  onClick={() => {
                    setModificationConfig(prev => ({
                      ...prev,
                      showDiffInline: !prev.showDiffInline,
                    }));
                    setHasConfigChanges(true);
                  }}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    modificationConfig.showDiffInline ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {hasConfigChanges && (
                <div className="flex justify-end pt-4 border-t">
                  <Button size="sm" onClick={handleSaveModificationConfig}>
                    <Save className="w-4 h-4 mr-1" />
                    保存配置
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {hasChanges && (
        <div className="mt-6 p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--text-secondary)]">有未保存的更改</span>
            <Button size="sm" onClick={handleSave}>
              保存
            </Button>
          </div>
        </div>
      )}

      <Modal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        title="添加API密钥"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsKeyModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreateKey} isLoading={createKeyMutation.isPending}>
              添加
            </Button>
          </div>
        }
      >
        <form id="create-key-form" onSubmit={handleCreateKey} className="space-y-4">
          <Input
            label="密钥名称"
            placeholder="例如：我的OpenAI密钥"
            value={newKey.name}
            onChange={(e) => setNewKey({ ...newKey, name: e.target.value })}
            required
          />
          <Select
            label="服务商"
            value={newKey.provider}
            onChange={(e) => setNewKey({ ...newKey, provider: e.target.value })}
            required
          >
            {Object.entries(AIProviderLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Input
            label="API密钥"
            placeholder="sk-xxxxxxxxxx..."
            value={newKey.apiKey}
            onChange={(e) => setNewKey({ ...newKey, apiKey: e.target.value })}
            required
          />
          <Input
            label="自定义API地址（可选）"
            placeholder="https://api.example.com/v1"
            value={newKey.baseUrl}
            onChange={(e) => setNewKey({ ...newKey, baseUrl: e.target.value })}
            helpText="留空使用默认地址，适用于代理或私有部署"
          />
        </form>
      </Modal>

      {/* Delete confirmation modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, keyId: '' })}
        onConfirm={confirmDeleteKey}
        title="确定要删除这个API密钥吗？"
        message="此操作无法撤销。"
      />
    </div>
  );
};
