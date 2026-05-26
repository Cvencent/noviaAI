import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Plus,
  Edit2,
  Trash2,
  Users,
  UserCircle,
  Loader2,
  Search,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Modal } from '../components/ui/Modal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { charactersApi, type Character } from '../api/characters';
import { useToast } from '../contexts/ToastContext';

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  protagonist: { label: '主角', color: 'bg-blue-500/20 text-blue-400' },
  antagonist: { label: '反派', color: 'bg-red-500/20 text-red-400' },
  supporting: { label: '配角', color: 'bg-green-500/20 text-green-400' },
  minor: { label: '龙套', color: 'bg-gray-500/20 text-gray-400' },
};

export const CharacterManagement: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; character: Character | null }>({ isOpen: false, character: null });
  const [formData, setFormData] = useState({
    name: '',
    role: 'supporting',
    appearance: '',
    personality: '',
    background: '',
    goals: '',
    flaws: '',
    arc: '',
    voice: '',
    notes: '',
  });
  const { showToast } = useToast();

  useEffect(() => {
    fetchCharacters();
  }, [projectId]);

  const fetchCharacters = async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const data = await charactersApi.getAll(projectId);
      setCharacters(data);
    } catch (error) {
      showToast({ message: '获取角色列表失败', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!projectId || !formData.name.trim()) return;
    try {
      await charactersApi.create(projectId, formData);
      showToast({ message: '角色创建成功', type: 'success' });
      setShowCreateModal(false);
      resetForm();
      fetchCharacters();
    } catch (error) {
      showToast({ message: '创建角色失败', type: 'error' });
    }
  };

  const handleUpdate = async () => {
    if (!projectId || !editingCharacter) return;
    try {
      await charactersApi.update(projectId, editingCharacter.id, formData);
      showToast({ message: '角色更新成功', type: 'success' });
      setEditingCharacter(null);
      resetForm();
      fetchCharacters();
    } catch (error) {
      showToast({ message: '更新角色失败', type: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!projectId || !deleteModal.character) return;
    try {
      await charactersApi.delete(projectId, deleteModal.character.id);
      showToast({ message: '角色删除成功', type: 'success' });
      setDeleteModal({ isOpen: false, character: null });
      fetchCharacters();
    } catch (error) {
      showToast({ message: '删除角色失败', type: 'error' });
    }
  };

  const handleOpenDeleteModal = (character: Character) => {
    setDeleteModal({ isOpen: true, character });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      role: 'supporting',
      appearance: '',
      personality: '',
      background: '',
      goals: '',
      flaws: '',
      arc: '',
      voice: '',
      notes: '',
    });
  };

  const openEditModal = (character: Character) => {
    setEditingCharacter(character);
    setFormData({
      name: character.name,
      role: character.role || 'supporting',
      appearance: character.appearance || '',
      personality: character.personality || '',
      background: character.background || '',
      goals: character.goals || '',
      flaws: character.flaws || '',
      arc: character.arc || '',
      voice: character.voice || '',
      notes: character.notes || '',
    });
  };

  const filteredCharacters = characters.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.personality?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-color)]" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-[var(--accent-color)]" />
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">人物管理</h1>
          <span className="text-sm text-[var(--text-muted)] mt-1">({characters.length} 个角色)</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="搜索角色..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-color)]"
            />
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            新建角色
          </Button>
        </div>
      </div>

      {/* Character List */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredCharacters.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <UserCircle className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg mb-2">暂无角色</p>
            <p className="text-sm">点击"新建角色"开始创建</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCharacters.map((character) => (
              <Card
                key={character.id}
                className="group p-4 hover:border-[var(--accent-color)]/40 hover:shadow-lg transition-all duration-200 cursor-pointer bg-[var(--bg-secondary)] border-[var(--border-color)]"
                onClick={() => openEditModal(character)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--accent-color)]/20 flex items-center justify-center">
                      <UserCircle className="w-6 h-6 text-[var(--accent-color)]" />
                    </div>
                    <div>
                      <h3 className="font-medium text-[var(--text-primary)]">{character.name}</h3>
                      {character.role && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            ROLE_CONFIG[character.role]?.color || 'bg-gray-500/20 text-gray-400'
                          }`}
                        >
                          {ROLE_CONFIG[character.role]?.label || character.role}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(character);
                      }}
                      className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--accent-color)] transition-all"
                      title="编辑"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDeleteModal(character);
                      }}
                      className="p-1.5 rounded hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400 transition-all"
                      title="删除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {character.personality && (
                  <p className="text-sm text-[var(--text-muted)] line-clamp-2 mb-2">
                    {character.personality}
                  </p>
                )}

                {character.appearance && (
                  <p className="text-xs text-gray-500 line-clamp-1">
                    外貌: {character.appearance}
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreateModal || editingCharacter !== null}
        onClose={() => {
          setShowCreateModal(false);
          setEditingCharacter(null);
          resetForm();
        }}
        title={editingCharacter ? '编辑角色' : '新建角色'}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                角色名称 *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="输入角色名称"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                角色定位
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-color)]"
              >
                <option value="protagonist">主角</option>
                <option value="antagonist">反派</option>
                <option value="supporting">配角</option>
                <option value="minor">龙套</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              外貌描写
            </label>
            <Textarea
              value={formData.appearance}
              onChange={(e) => setFormData({ ...formData, appearance: e.target.value })}
              placeholder="描述角色的外貌特征..."
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              性格特点
            </label>
            <Textarea
              value={formData.personality}
              onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
              placeholder="描述角色的性格..."
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              背景故事
            </label>
            <Textarea
              value={formData.background}
              onChange={(e) => setFormData({ ...formData, background: e.target.value })}
              placeholder="描述角色的背景..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                目标动机
              </label>
              <Textarea
                value={formData.goals}
                onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                placeholder="角色的目标..."
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                缺陷弱点
              </label>
              <Textarea
                value={formData.flaws}
                onChange={(e) => setFormData({ ...formData, flaws: e.target.value })}
                placeholder="角色的缺陷..."
                rows={2}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              角色弧光
            </label>
            <Textarea
              value={formData.arc}
              onChange={(e) => setFormData({ ...formData, arc: e.target.value })}
              placeholder="描述角色的成长变化..."
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              说话风格
            </label>
            <Textarea
              value={formData.voice}
              onChange={(e) => setFormData({ ...formData, voice: e.target.value })}
              placeholder="描述角色的说话方式..."
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              备注
            </label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="其他备注..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-color)]">
            <Button
              variant="secondary"
              onClick={() => {
                setShowCreateModal(false);
                setEditingCharacter(null);
                resetForm();
              }}
            >
              取消
            </Button>
            <Button
              onClick={editingCharacter ? handleUpdate : handleCreate}
              disabled={!formData.name.trim()}
            >
              {editingCharacter ? '保存' : '创建'}
            </Button>
          </div>
        </div>
      </Modal>

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, character: null })}
        onConfirm={handleDelete}
        title={`确定要删除角色「${deleteModal.character?.name || ''}」吗？`}
        message="删除后将无法恢复，请谨慎操作"
      />
    </div>
  );
};
