import { useState, useEffect } from 'react'
import { WritingStylePreset, StyleTuningParams, generateStylePrompt } from '../types/writing-styles'
import { Slider } from '../components/ui/Slider'
import { Button } from '../components/ui/Button'
import { Sparkles, Copy, RotateCcw, Save } from 'lucide-react'

interface StyleTunerProps {
  style: WritingStylePreset
  onSaveAsNew?: (tunedStyle: WritingStylePreset, params: StyleTuningParams) => void
  onApply?: (params: StyleTuningParams) => void
}

export function StyleTuner({ style, onSaveAsNew, onApply }: StyleTunerProps) {
  const [tuningParams, setTuningParams] = useState<StyleTuningParams>({
    dialogue_ratio: style.language.dialogue_ratio,
    pacing: style.narrative.pacing === 'slow' ? 20 : style.narrative.pacing === 'fast' ? 80 : 50,
    vocabulary_level: style.language.vocabulary_level === 'simple' ? 20 
      : style.language.vocabulary_level === 'advanced' ? 80 : 50,
    description_detail: style.language.description_type === 'minimal' ? 20 
      : style.language.description_type === 'rich' ? 80 : 50
  })

  const [generatedPrompt, setGeneratedPrompt] = useState('')

  useEffect(() => {
    const prompt = generateStylePrompt(style, undefined, tuningParams)
    setGeneratedPrompt(prompt)
  }, [style, tuningParams])

  const handleReset = () => {
    setTuningParams({
      dialogue_ratio: style.language.dialogue_ratio,
      pacing: style.narrative.pacing === 'slow' ? 20 : style.narrative.pacing === 'fast' ? 80 : 50,
      vocabulary_level: style.language.vocabulary_level === 'simple' ? 20 
        : style.language.vocabulary_level === 'advanced' ? 80 : 50,
      description_detail: style.language.description_type === 'minimal' ? 20 
        : style.language.description_type === 'rich' ? 80 : 50
    })
  }

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(generatedPrompt)
    alert('提示词已复制到剪贴板！')
  }

  const handleSaveAsNew = () => {
    if (onSaveAsNew) {
      const tunedStyle: WritingStylePreset = {
        ...style,
        id: `tuned_${style.id}_${Date.now()}`,
        name: `${style.name}（微调版）`,
        description: `${style.description} - 已根据参数微调`
      }
      onSaveAsNew(tunedStyle, tuningParams)
    }
  }

  const handleApply = () => {
    if (onApply) {
      onApply(tuningParams)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-purple-600" />
          <div>
            <h3 className="text-lg font-bold">风格微调</h3>
            <p className="text-sm text-gray-600">调整参数，自定义风格</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleReset}>
          <RotateCcw className="w-4 h-4 mr-2" />
          重置
        </Button>
      </div>

      <div className="space-y-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              对话比例
            </label>
            <span className="text-sm text-purple-600 font-medium">
              {Math.round(tuningParams.dialogue_ratio * 100)}%
            </span>
          </div>
          <Slider
            value={[tuningParams.dialogue_ratio * 100]}
            onValueChange={(value) => setTuningParams(prev => ({ 
              ...prev, 
              dialogue_ratio: value[0] / 100 
            }))}
            min={0}
            max={100}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>叙述为主</span>
            <span>对话为主</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              节奏快慢
            </label>
            <span className="text-sm text-purple-600 font-medium">
              {tuningParams.pacing < 33 ? '缓慢细腻' : tuningParams.pacing < 66 ? '中等节奏' : '快速紧凑'}
            </span>
          </div>
          <Slider
            value={[tuningParams.pacing]}
            onValueChange={(value) => setTuningParams(prev => ({ 
              ...prev, 
              pacing: value[0] 
            }))}
            min={0}
            max={100}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>慢节奏</span>
            <span>快节奏</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              词汇难度
            </label>
            <span className="text-sm text-purple-600 font-medium">
              {tuningParams.vocabulary_level < 33 ? '简单易懂' : tuningParams.vocabulary_level < 66 ? '中等难度' : '高级复杂'}
            </span>
          </div>
          <Slider
            value={[tuningParams.vocabulary_level]}
            onValueChange={(value) => setTuningParams(prev => ({ 
              ...prev, 
              vocabulary_level: value[0] 
            }))}
            min={0}
            max={100}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>简单词汇</span>
            <span>复杂词汇</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              描述详细度
            </label>
            <span className="text-sm text-purple-600 font-medium">
              {tuningParams.description_detail < 33 ? '简洁留白' : tuningParams.description_detail < 66 ? '视觉画面' : '丰富细节'}
            </span>
          </div>
          <Slider
            value={[tuningParams.description_detail]}
            onValueChange={(value) => setTuningParams(prev => ({ 
              ...prev, 
              description_detail: value[0] 
            }))}
            min={0}
            max={100}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>简洁留白</span>
            <span>丰富描写</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-800">实时提示词预览</h4>
          <Button variant="outline" size="sm" onClick={handleCopyPrompt}>
            <Copy className="w-4 h-4 mr-2" />
            复制
          </Button>
        </div>
        
        <div className="bg-gray-900 text-gray-100 rounded-lg p-4 text-sm font-mono max-h-96 overflow-y-auto">
          <pre className="whitespace-pre-wrap">{generatedPrompt}</pre>
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={handleApply} className="flex-1">
          应用此微调
        </Button>
        {onSaveAsNew && (
          <Button variant="outline" onClick={handleSaveAsNew}>
            <Save className="w-4 h-4 mr-2" />
            另存为新风格
          </Button>
        )}
      </div>
    </div>
  )
}
