import { useState, useEffect } from 'react'
import { Palette, Settings, Check, Info } from 'lucide-react'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { Modal } from './ui/Modal'
import { Slider } from './ui/Slider'
import { WRITING_STYLE_PRESETS, WritingStylePreset } from '../types/writing-styles'
import { writingStylesApi, StyleApplicationConfig, StyleTuningParams } from '../api/writing-styles'

interface ProjectStyleSelectorProps {
  projectId: string
}

export function ProjectStyleSelector({ projectId }: ProjectStyleSelectorProps) {
  const [showModal, setShowModal] = useState(false)
  const [config, setConfig] = useState<StyleApplicationConfig>({
    presetId: 'hemingway',
    tuningParams: {
      dialogueRatio: 0.4,
      pacing: 50,
      vocabularyLevel: 50,
      descriptionDetail: 50,
    },
    useContextLearning: true,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [currentPreset, setCurrentPreset] = useState<WritingStylePreset | null>(null)

  useEffect(() => {
    loadConfig()
  }, [projectId])

  const loadConfig = async () => {
    try {
      const savedConfig = await writingStylesApi.getProjectStyleConfig(projectId)
      if (savedConfig) {
        setConfig(savedConfig)
        const preset = WRITING_STYLE_PRESETS.find(p => p.id === savedConfig.presetId)
        setCurrentPreset(preset || null)
      }
    } catch (error) {
      console.error('加载风格配置失败:', error)
    }
  }

  const saveConfig = async () => {
    setIsSaving(true)
    try {
      await writingStylesApi.saveProjectStyleConfig(projectId, config)
      setShowModal(false)
    } catch (error) {
      console.error('保存风格配置失败:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const selectPreset = (preset: WritingStylePreset) => {
    setConfig({
      ...config,
      presetId: preset.id,
      customStyleId: undefined,
      tuningParams: {
        dialogueRatio: preset.language.dialogue_ratio,
        pacing: 50,
        vocabularyLevel: 50,
        descriptionDetail: 50,
      },
    })
    setCurrentPreset(preset)
  }

  const updateTuning = (key: keyof StyleTuningParams, value: number) => {
    setConfig({
      ...config,
      tuningParams: {
        ...config.tuningParams,
        [key]: value,
      } as StyleTuningParams,
    })
  }

  const getPresetDisplayName = () => {
    if (!currentPreset) return '选择写作风格'
    return `${currentPreset.icon} ${currentPreset.name}`
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2"
      >
        <Palette className="w-4 h-4" />
        <span>{getPresetDisplayName()}</span>
      </Button>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="写作风格设置"
        size="xl"
      >
        <div className="space-y-6">
          {/* 预设风格选择 */}
          <div>
            <h3 className="text-lg font-medium mb-3">选择预设风格</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {WRITING_STYLE_PRESETS.slice(0, 12).map((preset) => (
                <Card
                  key={preset.id}
                  className={`p-3 cursor-pointer transition-all ${
                    config.presetId === preset.id
                      ? 'ring-2 ring-blue-500 bg-blue-50'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => selectPreset(preset)}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-2xl">{preset.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium flex items-center gap-2">
                        {preset.name}
                        {config.presetId === preset.id && (
                          <Check className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {preset.description}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* 当前风格详情 */}
          {currentPreset && (
            <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-start gap-4">
                <span className="text-4xl">{currentPreset.icon}</span>
                <div>
                  <h4 className="font-bold text-lg">{currentPreset.name}</h4>
                  <p className="text-gray-600">{currentPreset.description}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="text-xs px-2 py-1 bg-gray-200 rounded">
                      {currentPreset.category}
                    </span>
                    <span className="text-xs px-2 py-1 bg-gray-200 rounded">
                      {currentPreset.narrative.perspective}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* 风格微调 */}
          {config.tuningParams && (
            <div>
              <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                风格微调
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-sm font-medium">对话比例</label>
                    <span className="text-sm text-gray-500">
                      {Math.round(config.tuningParams.dialogueRatio * 100)}%
                    </span>
                  </div>
                  <Slider
                    value={[config.tuningParams.dialogueRatio * 100]}
                    onValueChange={([v]) => updateTuning('dialogueRatio', v / 100)}
                    min={0}
                    max={100}
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-sm font-medium">节奏快慢</label>
                    <span className="text-sm text-gray-500">
                      {config.tuningParams.pacing < 33
                        ? '慢'
                        : config.tuningParams.pacing < 66
                        ? '中'
                        : '快'}
                    </span>
                  </div>
                  <Slider
                    value={[config.tuningParams.pacing]}
                    onValueChange={([v]) => updateTuning('pacing', v)}
                    min={0}
                    max={100}
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-sm font-medium">词汇难度</label>
                    <span className="text-sm text-gray-500">
                      {config.tuningParams.vocabularyLevel < 33
                        ? '简单'
                        : config.tuningParams.vocabularyLevel < 66
                        ? '中等'
                        : '高级'}
                    </span>
                  </div>
                  <Slider
                    value={[config.tuningParams.vocabularyLevel]}
                    onValueChange={([v]) => updateTuning('vocabularyLevel', v)}
                    min={0}
                    max={100}
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-sm font-medium">描写详细程度</label>
                    <span className="text-sm text-gray-500">
                      {config.tuningParams.descriptionDetail < 33
                        ? '简洁'
                        : config.tuningParams.descriptionDetail < 66
                        ? '适中'
                        : '详细'}
                    </span>
                  </div>
                  <Slider
                    value={[config.tuningParams.descriptionDetail]}
                    onValueChange={([v]) => updateTuning('descriptionDetail', v)}
                    min={0}
                    max={100}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 上下文学习 */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-medium">从已有内容学习风格</div>
                <div className="text-sm text-gray-500">
                  AI会分析你已写的内容，保持风格一致性
                </div>
              </div>
            </div>
            <Button
              variant={config.useContextLearning ? 'primary' : 'ghost'}
              onClick={() =>
                setConfig({ ...config, useContextLearning: !config.useContextLearning })
              }
            >
              {config.useContextLearning ? '已启用' : '已禁用'}
            </Button>
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowModal(false)}>
              取消
            </Button>
            <Button onClick={saveConfig} disabled={isSaving}>
              {isSaving ? '保存中...' : '保存设置'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
