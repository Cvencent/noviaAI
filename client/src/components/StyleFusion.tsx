import { useState } from 'react'
import { WritingStylePreset, WRITING_STYLE_PRESETS, generateStylePrompt } from '../types/writing-styles'
import { Button } from '../components/ui/Button'
import { Slider } from '../components/ui/Slider'
import { GitMerge, AlertCircle, Lightbulb, Check, Save, ArrowRight } from 'lucide-react'

interface StyleFusionProps {
  onSave?: (fusedStyle: WritingStylePreset, styles: WritingStylePreset[], weights: number[]) => void
}

export function StyleFusion({ onSave }: StyleFusionProps) {
  const [selectedStyles, setSelectedStyles] = useState<WritingStylePreset[]>([])
  const [weights, setWeights] = useState<number[]>([50, 50])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [fusedStyle, setFusedStyle] = useState<WritingStylePreset | null>(null)

  const handleSelectStyle = (style: WritingStylePreset) => {
    if (selectedStyles.find(s => s.id === style.id)) {
      setSelectedStyles(prev => prev.filter(s => s.id !== style.id))
    } else if (selectedStyles.length < 3) {
      setSelectedStyles(prev => [...prev, style])
      setWeights(prev => [...prev, 50])
    }
  }

  const handleAnalyze = async () => {
    if (selectedStyles.length < 2) return

    setIsAnalyzing(true)

    setTimeout(() => {
      const conflicts: string[] = []
      const suggestions: string[] = []

      const hasSimpleStyle = selectedStyles.some(s => 
        s.language.vocabulary_level === 'simple' || s.language.description_type === 'minimal'
      )
      const hasComplexStyle = selectedStyles.some(s => 
        s.language.vocabulary_level === 'advanced' || s.language.description_type === 'rich'
      )

      if (hasSimpleStyle && hasComplexStyle) {
        conflicts.push('简洁风格与华丽风格存在冲突')
        suggestions.push('建议以一个风格为主，另一个为辅（权重差异建议40%以上）')
        suggestions.push('可以在对话和叙述部分采用不同风格')
      }

      const hasFastPacing = selectedStyles.some(s => s.narrative.pacing === 'fast')
      const hasSlowPacing = selectedStyles.some(s => s.narrative.pacing === 'slow')

      if (hasFastPacing && hasSlowPacing) {
        conflicts.push('快节奏与慢节奏的融合需要技巧')
        suggestions.push('建议采用中等节奏作为融合基调')
        suggestions.push('可以在不同章节或场景中体现不同节奏')
      }

      setAnalysisResult({
        conflicts,
        suggestions,
        fusionStrategy: '智能融合 - AI将根据各风格的权重和特点生成最优融合方案'
      })
      setIsAnalyzing(false)
    }, 1500)
  }

  const handleGenerateFusedStyle = () => {
    if (selectedStyles.length < 2) return

    const totalWeight = weights.reduce((sum, w) => sum + w, 0)
    const normalizedWeights = weights.map(w => w / totalWeight)

    const avgDialogueRatio = selectedStyles.reduce(
      (sum, s, i) => sum + s.language.dialogue_ratio * normalizedWeights[i], 0
    )

    const avgPacing = selectedStyles.reduce(
      (sum, s, i) => {
        const pacingValue = s.narrative.pacing === 'slow' ? 20 
          : s.narrative.pacing === 'fast' ? 80 : 50
        return sum + pacingValue * normalizedWeights[i]
      }, 0
    )

    const allTones = selectedStyles.flatMap(s => s.narrative.tone)
    const uniqueTones = [...new Set(allTones)].slice(0, 5)

    const allSignatureElements = selectedStyles.flatMap(s => s.style_analysis.signature_elements)
    const uniqueSignatureElements = [...new Set(allSignatureElements)].slice(0, 6)

    const fused: WritingStylePreset = {
      id: `fused_${Date.now()}`,
      name: selectedStyles.map(s => s.name.replace('风格', '')).join(' + '),
      description: `融合风格：${selectedStyles.map(s => s.name).join('、')}`,
      icon: '🎨',
      category: 'literary',
      narrative: {
        perspective: 'third_person_limited',
        tense: 'past',
        voice: 'literary',
        tone: uniqueTones,
        pacing: avgPacing < 33 ? 'slow' : avgPacing < 66 ? 'moderate' : 'fast'
      },
      language: {
        vocabulary_level: avgPacing < 40 ? 'simple' : avgPacing < 70 ? 'intermediate' : 'advanced',
        sentence_structure: 'mixed',
        paragraph_length: 'moderate',
        dialogue_ratio: avgDialogueRatio,
        description_type: 'visual',
        diction: selectedStyles.flatMap(s => s.language.diction).slice(0, 5),
        figurative_language: selectedStyles.flatMap(s => s.language.figurative_language).slice(0, 4)
      },
      formatting: {
        chapter_structure: 'conventional',
        scene_breaks: 'space',
        POV_switches: true,
        flashbacks: 'occasional',
        prologue_epilogue: false
      },
      genre_conventions: {
        expected_tropes: selectedStyles.flatMap(s => s.genre_conventions.expected_tropes).slice(0, 5),
        taboo_subjects: [],
        audience: 'adult'
      },
      style_analysis: {
        signature_elements: uniqueSignatureElements,
        narrative_techniques: selectedStyles.flatMap(s => s.style_analysis.narrative_techniques).slice(0, 5),
        character_focus: '多风格融合的人物塑造',
        theme_preferences: selectedStyles.flatMap(s => s.style_analysis.theme_preferences).slice(0, 4),
        emotional_resonance: '多元素融合的情感体验',
        pacing_pattern: `${Math.round(avgPacing)}%综合节奏`
      },
      example_texts: [],
      recommended_genres: [...new Set(selectedStyles.flatMap(s => s.recommended_genres))].slice(0, 3),
      prompt_template: `这是融合风格的提示词模板。权重配置：${selectedStyles.map((s, i) => `${s.name} ${Math.round(normalizedWeights[i] * 100)}%`).join(', ')}`
    }

    setFusedStyle(fused)
  }

  const handleSave = () => {
    if (fusedStyle && onSave) {
      onSave(fusedStyle, selectedStyles, weights)
      alert('融合风格已保存！')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <GitMerge className="w-6 h-6 text-purple-600" />
        <div>
          <h3 className="text-lg font-bold">多风格智能融合</h3>
          <p className="text-sm text-gray-600">选择2-3个风格，AI自动分析兼容性并生成融合方案</p>
        </div>
      </div>

      {/* 风格选择 */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          选择要融合的风格（2-3个）
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
          {WRITING_STYLE_PRESETS.map((style) => {
            const isSelected = selectedStyles.find(s => s.id === style.id)
            const selectedIndex = selectedStyles.findIndex(s => s.id === style.id)
            
            return (
              <button
                key={style.id}
                onClick={() => handleSelectStyle(style)}
                disabled={!isSelected && selectedStyles.length >= 3}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  isSelected
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300 disabled:opacity-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{style.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{style.name}</div>
                    {isSelected && (
                      <div className="text-xs text-purple-600">
                        权重: {weights[selectedIndex]}%
                      </div>
                    )}
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-purple-600" />}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* 权重调整 */}
      {selectedStyles.length >= 2 && (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 space-y-4">
          <h4 className="font-medium text-gray-800">调整融合权重</h4>
          {selectedStyles.map((style, idx) => (
            <div key={style.id}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{style.icon}</span>
                  <span className="font-medium">{style.name}</span>
                </div>
                <span className="text-purple-600 font-medium">{weights[idx]}%</span>
              </div>
              <Slider
                value={[weights[idx]]}
                onValueChange={(value) => {
                  const newWeights = [...weights]
                  newWeights[idx] = value[0]
                  setWeights(newWeights)
                }}
                min={10}
                max={90}
                step={5}
                className="w-full"
              />
            </div>
          ))}
          
          <Button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full">
            {isAnalyzing ? (
              <>
                <GitMerge className="w-4 h-4 mr-2 animate-spin" />
                AI分析中...
              </>
            ) : (
              <>
                分析兼容性
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      )}

      {/* 兼容性分析 */}
      {analysisResult && (
        <div className="space-y-3">
          {analysisResult.conflicts.length > 0 && (
            <div className="bg-red-50 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                检测到潜在冲突
              </h4>
              <ul className="text-sm text-red-800 space-y-1">
                {analysisResult.conflicts.map((conflict: string, idx: number) => (
                  <li key={idx}>• {conflict}</li>
                ))}
              </ul>
            </div>
          )}

          {analysisResult.suggestions.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                融合建议
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                {analysisResult.suggestions.map((suggestion: string, idx: number) => (
                  <li key={idx}>• {suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          <Button onClick={handleGenerateFusedStyle} className="w-full">
            <GitMerge className="w-4 h-4 mr-2" />
            生成融合风格
          </Button>
        </div>
      )}

      {/* 融合结果 */}
      {fusedStyle && (
        <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-6 space-y-4">
          <div className="text-center">
            <div className="text-5xl mb-3">{fusedStyle.icon}</div>
            <h4 className="text-xl font-bold">{fusedStyle.name}</h4>
            <p className="text-gray-600 mt-2">{fusedStyle.description}</p>
          </div>

          <div className="bg-white rounded-lg p-4 space-y-3">
            <div>
              <h5 className="font-medium text-gray-800 mb-2">📝 融合提示词</h5>
              <div className="text-sm font-mono max-h-48 overflow-y-auto">
                <pre className="whitespace-pre-wrap">
                  {generateStylePrompt(fusedStyle)}
                </pre>
              </div>
            </div>

            <div>
              <h5 className="font-medium text-gray-800 mb-2">🎯 融合风格特征</h5>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-gray-500">叙事视角</div>
                  <div className="font-medium">
                    {fusedStyle.narrative.perspective === 'first_person' ? '第一人称'
                      : fusedStyle.narrative.perspective === 'third_person_limited' 
                        ? '第三人称限知' : '第三人称全知'}
                  </div>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-gray-500">节奏</div>
                  <div className="font-medium">
                    {fusedStyle.narrative.pacing === 'slow' ? '缓慢' 
                      : fusedStyle.narrative.pacing === 'fast' ? '快速' : '中等'}
                  </div>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-gray-500">对话比例</div>
                  <div className="font-medium">{Math.round(fusedStyle.language.dialogue_ratio * 100)}%</div>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-gray-500">标志性元素</div>
                  <div className="font-medium text-xs">
                    {fusedStyle.style_analysis.signature_elements.slice(0, 2).join('、')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Button onClick={handleSave} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            保存融合风格
          </Button>
        </div>
      )}
    </div>
  )
}
