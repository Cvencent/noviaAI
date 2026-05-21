import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  ChevronRight, 
  ChevronDown,
  FolderOpen,
  Sparkles,
  Globe,
  Scale,
  Clock,
  Map,
  Users,
  Shield,
  Crown
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Modal } from '../components/ui/Modal';
import { worldSettingsApi } from '../api/world-settings';
import type { WorldSetting, CreateWorldSettingDto, UpdateWorldSettingDto } from '../api/world-settings';

interface WorldSettingItem {
  id?: string;
  name: string;
  description?: string;
  details?: any;
}

const PRESET_CATEGORIES = [
  { 
    id: 'geography', 
    name: '地理环境', 
    icon: Map,
    color: 'bg-green-500',
    items: ['大陆', '国家/地区', '城市/城镇', '特殊地点', '地形地貌']
  },
  { 
    id: 'politics', 
    name: '政治体系', 
    icon: Crown,
    color: 'bg-purple-500',
    items: ['政体类型', '统治阶级', '法律制度', '官僚机构', '外交关系']
  },
  { 
    id: 'magic', 
    name: '魔法/科技', 
    icon: Sparkles,
    color: 'bg-blue-500',
    items: ['力量来源', '使用规则', '限制条件', '历史演变', '社会影响']
  },
  { 
    id: 'history', 
    name: '历史背景', 
    icon: Clock,
    color: 'bg-amber-500',
    items: ['创世传说', '重大事件', '黄金时代', '黑暗时代', '当代局势']
  },
  { 
    id: 'culture', 
    name: '文化风俗', 
    icon: Globe,
    color: 'bg-pink-500',
    items: ['宗教信仰', '节日庆典', '饮食服饰', '艺术娱乐', '语言文字']
  },
  { 
    id: 'social', 
    name: '社会结构', 
    icon: Users,
    color: 'bg-indigo-500',
    items: ['阶层划分', '职业群体', '家族宗族', '秘密组织', '民间势力']
  },
  { 
    id: 'economy', 
    name: '经济体系', 
    icon: Scale,
    color: 'bg-yellow-500',
    items: ['货币制度', '贸易路线', '主要产业', '商业势力', '贫富差距']
  },
  { 
    id: 'military', 
    name: '军事力量', 
    icon: Shield,
    color: 'bg-red-500',
    items: ['军队类型', '武器装备', '战术战略', '情报系统', '战争历史']
  },
];

export function WorldSettings() {
  const { projectId } = useParams<{ projectId: string }>();
  const [settings, setSettings] = useState<WorldSetting[]>([]);
  const [categories, setCategories] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedSetting, setSelectedSetting] = useState<WorldSetting | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<{
    category: string;
    name: string;
    description: string;
    items: WorldSettingItem[];
  }>({
    category: '',
    name: '',
    description: '',
    items: [],
  });

  useEffect(() => {
    loadSettings();
  }, [projectId]);

  const loadSettings = async () => {
    if (!projectId) return;
    try {
      const data = await worldSettingsApi.getAll(projectId);
      setSettings(data);
      const cats = new Set(data.map(s => s.category));
      setCategories(cats);
      setExpandedCategories(new Set(cats));
    } catch (error) {
      console.error('加载世界观设定失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = (category?: string) => {
    setModalMode('create');
    setFormData({
      category: category || '',
      name: '',
      description: '',
      items: [],
    });
    setIsModalOpen(true);
  };

  const handleEdit = (setting: WorldSetting) => {
    setModalMode('edit');
    setSelectedSetting(setting);
    setFormData({
      category: setting.category,
      name: setting.name,
      description: setting.description || '',
      items: setting.items?.map(item => ({
        name: item.name,
        description: item.description,
        details: item.details,
      })) || [],
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (setting: WorldSetting) => {
    if (!projectId || !confirm(`确定要删除「${setting.name}」吗？`)) return;
    try {
      await worldSettingsApi.delete(projectId, setting.id);
      await loadSettings();
    } catch (error) {
      console.error('删除失败:', error);
    }
  };

  const handleSubmit = async () => {
    if (!projectId || !formData.name.trim()) return;
    
    try {
      const dto: CreateWorldSettingDto | UpdateWorldSettingDto = {
        category: formData.category,
        name: formData.name,
        description: formData.description,
        items: formData.items.filter(item => item.name.trim()),
      };

      if (modalMode === 'create') {
        await worldSettingsApi.create(projectId, dto as CreateWorldSettingDto);
      } else if (selectedSetting) {
        await worldSettingsApi.update(projectId, selectedSetting.id, dto as UpdateWorldSettingDto);
      }

      setIsModalOpen(false);
      await loadSettings();
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { name: '', description: '' }],
    });
  };

  const updateItem = (index: number, field: 'name' | 'description', value: string) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const getSettingsByCategory = (category: string) => {
    return settings.filter(s => s.category === category);
  };

  const getUncategorizedSettings = () => {
    return settings.filter(s => !PRESET_CATEGORIES.find(c => c.name === s.category));
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">世界观设定</h1>
            <p className="text-gray-600 mt-1">构建你的故事世界，包括地理、政治、文化、魔法体系等</p>
          </div>
          <Button onClick={() => handleCreate()}>
            <Plus className="w-4 h-4 mr-2" />
            添加设定
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {settings.length === 0 ? (
              <Card className="text-center py-12">
                <FolderOpen className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">还没有世界观设定</h3>
                <p className="text-gray-500 mb-4">开始构建你的故事世界吧</p>
                <Button onClick={() => handleCreate()}>创建第一个设定</Button>
              </Card>
            ) : (
              <>
                {PRESET_CATEGORIES.map(preset => {
                  const categorySettings = getSettingsByCategory(preset.name);
                  if (categorySettings.length === 0) return null;

                  const isExpanded = expandedCategories.has(preset.name);
                  const Icon = preset.icon;

                  return (
                    <Card key={preset.id} className="overflow-hidden">
                      <button
                        onClick={() => toggleCategory(preset.name)}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${preset.color}`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="text-left">
                            <h3 className="font-semibold text-gray-900">{preset.name}</h3>
                            <p className="text-sm text-gray-500">{categorySettings.length} 个设定</p>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="border-t border-gray-100">
                          {categorySettings.map(setting => (
                            <div
                              key={setting.id}
                              className="p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900">{setting.name}</h4>
                                  {setting.description && (
                                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                      {setting.description}
                                    </p>
                                  )}
                                  {setting.items && setting.items.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      {setting.items.slice(0, 3).map((item, i) => (
                                        <span
                                          key={i}
                                          className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                                        >
                                          {item.name}
                                        </span>
                                      ))}
                                      {setting.items.length > 3 && (
                                        <span className="text-xs text-gray-400">
                                          +{setting.items.length - 3} 更多
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div className="flex gap-2 ml-4">
                                  <button
                                    onClick={() => handleEdit(setting)}
                                    className="p-1 text-gray-400 hover:text-blue-600"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(setting)}
                                    className="p-1 text-gray-400 hover:text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  );
                })}

                {getUncategorizedSettings().length > 0 && (
                  <Card>
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-900">其他设定</h3>
                    </div>
                    {getUncategorizedSettings().map(setting => (
                      <div
                        key={setting.id}
                        className="p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-gray-900">{setting.name}</h4>
                              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                                {setting.category}
                              </span>
                            </div>
                            {setting.description && (
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {setting.description}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => handleEdit(setting)}
                              className="p-1 text-gray-400 hover:text-blue-600"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(setting)}
                              className="p-1 text-gray-400 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </Card>
                )}
              </>
            )}
          </div>

          <div className="space-y-4">
            <Card>
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">预设分类</h3>
                <p className="text-sm text-gray-500 mt-1">快速添加设定</p>
              </div>
              <div className="p-2">
                {PRESET_CATEGORIES.map(preset => {
                  const Icon = preset.icon;
                  const count = getSettingsByCategory(preset.name).length;

                  return (
                    <button
                      key={preset.id}
                      onClick={() => handleCreate(preset.name)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className={`p-2 rounded-lg ${preset.color}`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-gray-900 text-sm">{preset.name}</div>
                        <div className="text-xs text-gray-500">{preset.items.length} 个子项</div>
                      </div>
                      {count > 0 && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </Card>

            <Card>
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">统计</h3>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{settings.length}</div>
                    <div className="text-sm text-gray-500">设定总数</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{categories.size}</div>
                    <div className="text-sm text-gray-500">分类数量</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? '创建世界观设定' : '编辑世界观设定'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">选择分类...</option>
              {PRESET_CATEGORIES.map(preset => (
                <option key={preset.id} value={preset.name}>{preset.name}</option>
              ))}
              <option value="custom">自定义分类</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="例如：三国鼎立、魔法体系、货币制度..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="详细描述这个设定的内容..."
              rows={3}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">详细条目</label>
              <Button variant="outline" size="sm" onClick={addItem}>
                <Plus className="w-4 h-4 mr-1" />
                添加条目
              </Button>
            </div>

            {formData.items.length > 0 && (
              <div className="space-y-2">
                {formData.items.map((item, index) => (
                  <div key={index} className="flex gap-2 items-start p-2 bg-gray-50 rounded-lg">
                    <div className="flex-1 space-y-2">
                      <Input
                        value={item.name}
                        onChange={(e) => updateItem(index, 'name', e.target.value)}
                        placeholder="条目名称"
                        className="text-sm"
                      />
                      <Input
                        value={item.description || ''}
                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                        placeholder="条目描述（可选）"
                        className="text-sm"
                      />
                    </div>
                    <button
                      onClick={() => removeItem(index)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {formData.items.length === 0 && (
              <div className="text-center py-4 text-gray-500 text-sm border-2 border-dashed border-gray-200 rounded-lg">
                点击上方按钮添加详细条目
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.name.trim()}>
              {modalMode === 'create' ? '创建' : '保存'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
