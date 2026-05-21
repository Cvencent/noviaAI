import { useState } from 'react'
import { WritingStylePreset, StyleTuningParams, generateStylePrompt } from '../types/writing-styles'
import { Button } from '../components/ui/Button'
import { Textarea } from '../components/ui/Textarea'
import { Slider } from '../components/ui/Slider'
import { Microscope, ArrowRight, Check, Save, RefreshCw, Lightbulb } from 'lucide-react'

interface StyleLearnerProps {
  onSave?: (style: WritingStylePreset, params: StyleTuningParams) => void
}

type LearnStep = 'upload' | 'analyze' | 'tune' | 'confirm' | 'save'

const CONFIRM_QUESTIONS = [
  {
    id: 'pacing',
    question: '这段文字的节奏是：',
    options: [
      { label: '慢节奏，细腻描写', value: 'slow' },
      { label: '中等节奏，平衡', value: 'moderate' },
      { label: '快节奏，紧凑推进', value: 'fast' }
    ]
  },
  {
    id: 'dialogue_ratio',
    question: '这段文字更偏向：',
    options: [
      { label: '对话驱动，节奏明快', value: 'high' },
      { label: '描写驱动，内涵丰富', value: 'low' },
      { label: '两者平衡', value: 'balanced' }
    ]
  },
  {
    id: 'vocabulary',
    question: '这段文字的词汇风格：',
    options: [
      { label: '简单直白，通俗易懂', value: 'simple' },
      { label: '中等难度，偶尔文雅', value: 'medium' },
      { label: '华丽复杂，文学性强', value: 'complex' }
    ]
  },
  {
    id: 'description',
    question: '这段文字的描写方式：',
    options: [
      { label: '极简留白，意在言外', value: 'minimal' },
      { label: '视觉画面，清晰直观', value: 'visual' },
      { label: '多感官丰富，身临其境', value: 'rich' }
    ]
  }
]

export function StyleLearner({ onSave }: StyleLearnerProps) {
  const [step, setStep] = useState<LearnStep>('upload')
  const [inputText, setInputText] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [tuningParams, setTuningParams] = useState<StyleTuningParams>({
    dialogue_ratio: 0.5,
    pacing: 50,
    vocabulary_level: 50,
    description_detail: 50
  })
  const [confirmAnswers, setConfirmAnswers] = useState<Record<string, string>>({})
  const [generatedStyle, setGeneratedStyle] = useState<WritingStylePreset | null>(null)

  const handleAnalyze = async () => {
    if (!inputText.trim()) return

    setIsAnalyzing(true)
    
    setTimeout(() => {
      const mockAnalysis = {
        dialogue_ratio: 0.4 + Math.random() * 0.3,
        pacing: 30 + Math.random() * 40,
        vocabulary_level: 40 + Math.random() * 30,
        description_detail: 35 + Math.random() * 40,
        tone: ['深情', '细腻', '怀旧'],
        signature_elements: ['情感细腻', '意象丰富', '心理描写'],
        narrative_techniques: ['第一人称', '倒叙', '心理独白']
      }

      setAnalysisResult(mockAnalysis)
      setTuningParams({
        dialogue_ratio: mockAnalysis.dialogue_ratio,
        pacing: mockAnalysis.pacing,
        vocabulary_level: mockAnalysis.vocabulary_level,
        description_detail: mockAnalysis.description_detail
      })
      setIsAnalyzing(false)
      setStep('tune')
    }, 2000)
  }

  const handleTuneComplete = () => {
    setStep('confirm')
  }

  const handleConfirmAnswers = () => {
    const style: WritingStylePreset = {
      id: `learned_${Date.now()}`,
      name: '我的写作风格',
      description: '通过学习生成的个性化风格',
      icon: '✨',
      category: 'literary',
      narrative: {
        perspective: 'first_person',
        tense: 'past',
        voice: 'literary',
        tone: analysisResult?.tone || ['独特'],
        pacing: confirmAnswers.pacing === 'slow' ? 'slow' 
          : confirmAnswers.pacing === 'fast' ? 'fast' : 'moderate'
      },
      language: {
        vocabulary_level: confirmAnswers.vocabulary === 'simple' ? 'simple'
          : confirmAnswers.vocabulary === 'complex' ? 'advanced' : 'intermediate',
        sentence_structure: 'mixed',
        paragraph_length: 'moderate',
        dialogue_ratio: confirmAnswers.dialogue_ratio === 'high' ? 0.6
          : confirmAnswers.dialogue_ratio === 'low' ? 0.3 : 0.45,
        description_type: confirmAnswers.description as any,
        diction: ['个性化用词'],
        figurative_language: ['比喻', '象征']
      },
      formatting: {
        chapter_structure: 'conventional',
        scene_breaks: 'space',
        POV_switches: false,
        flashbacks: 'occasional',
        prologue_epilogue: false
      },
      genre_conventions: {
        expected_tropes: ['情感叙事', '内心独白'],
        taboo_subjects: [],
        audience: 'adult'
      },
      style_analysis: {
        signature_elements: analysisResult?.signature_elements || [],
        narrative_techniques: analysisResult?.narrative_techniques || [],
        character_focus: '内心世界',
        theme_preferences: ['情感', '成长', '回忆'],
        emotional_resonance: '细腻深刻',
        pacing_pattern: `${tuningParams.pacing}%节奏`
      },
      example_texts: [inputText.slice(0, 200)],
      recommended_genres: ['文学小说', '情感故事'],
      prompt_template: '保持这段文字的独特风格和情感基调'
    }

    setGeneratedStyle(style)
    setStep('save')
  }

  const handleSave = () => {
    if (generatedStyle && onSave) {
      onSave(generatedStyle, tuningParams)
      alert('风格已保存到个人库！')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Microscope className="w-6 h-6 text-green-600" />
        <div>
          <h3 className="text-lg font-bold">风格学习</h3>
          <p className="text-sm text-gray-600">上传你喜欢的作品，AI自动分析并生成风格配置</p>
        </div>
      </div>

      {/* 步骤指示器 */}
      <div className="flex items-center justify-center gap-2">
        {['上传', '分析', '微调', '确认', '保存'].map((label, idx) => {
          const stepNames: LearnStep[] = ['upload', 'analyze', 'tune', 'confirm', 'save']
          const currentIdx = stepNames.indexOf(step)
          const isActive = idx <= currentIdx
          const isCurrent = idx === currentIdx

          return (
            <div key={idx} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm ${
                isActive ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'
              } ${isCurrent ? 'ring-2 ring-green-300 ring-offset-2' : ''}`}>
                {idx < currentIdx ? <Check className="w-4 h-4" /> : idx + 1}
              </div>
              <span className={`ml-2 text-sm ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                {label}
              </span>
              {idx < 4 && <ArrowRight className="w-4 h-4 mx-2 text-gray-300" />}
            </div>
          )
        })}
      </div>

      {/* 步骤1: 上传文本 */}
      {step === 'upload' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              粘贴或输入你喜欢的文字片段
            </label>
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="请粘贴一段你喜欢的文字（建议100-500字），AI将分析其写作风格..."
              rows={8}
              className="w-full"
            />
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              建议
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 选择最能代表该风格的一段文字</li>
              <li>• 建议100-500字，太短可能分析不准确</li>
              <li>• 可以是小说、散文、诗歌等各种文体</li>
            </ul>
          </div>

          <Button 
            onClick={handleAnalyze}
            disabled={!inputText.trim()}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                AI正在分析中...
              </>
            ) : (
              <>
                开始AI分析
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      )}

      {/* 步骤2: 微调 */}
      {step === 'tune' && (
        <div className="space-y-6">
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2">✨ AI分析完成！</h4>
            <p className="text-sm text-green-800">
              AI已分析出这段文字的主要风格特征，请根据你的理解微调参数。
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">对话比例</label>
                <span className="text-sm text-purple-600 font-medium">
                  {Math.round(tuningParams.dialogue_ratio * 100)}%
                </span>
              </div>
              <Slider
                value={[tuningParams.dialogue_ratio * 100]}
                onValueChange={(value) => setTuningParams(prev => ({ ...prev, dialogue_ratio: value[0] / 100 }))}
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">节奏快慢</label>
                <span className="text-sm text-purple-600 font-medium">
                  {tuningParams.pacing < 33 ? '缓慢' : tuningParams.pacing < 66 ? '中等' : '快速'}
                </span>
              </div>
              <Slider
                value={[tuningParams.pacing]}
                onValueChange={(value) => setTuningParams(prev => ({ ...prev, pacing: value[0] }))}
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">词汇难度</label>
                <span className="text-sm text-purple-600 font-medium">
                  {tuningParams.vocabulary_level < 33 ? '简单' : tuningParams.vocabulary_level < 66 ? '中等' : '复杂'}
                </span>
              </div>
              <Slider
                value={[tuningParams.vocabulary_level]}
                onValueChange={(value) => setTuningParams(prev => ({ ...prev, vocabulary_level: value[0] }))}
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">描写详细度</label>
                <span className="text-sm text-purple-600 font-medium">
                  {tuningParams.description_detail < 33 ? '简洁' : tuningParams.description_detail < 66 ? '适中' : '丰富'}
                </span>
              </div>
              <Slider
                value={[tuningParams.description_detail]}
                onValueChange={(value) => setTuningParams(prev => ({ ...prev, description_detail: value[0] }))}
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
            </div>
          </div>

          <Button onClick={handleTuneComplete} className="w-full">
            确认微调
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}

      {/* 步骤3: 确认 */}
      {step === 'confirm' && (
        <div className="space-y-6">
          <div className="bg-purple-50 rounded-lg p-4">
            <h4 className="font-medium text-purple-900 mb-2">🎯 最后确认</h4>
            <p className="text-sm text-purple-800">
              请回答以下问题，帮助AI更准确地定位你的风格。
            </p>
          </div>

          <div className="space-y-6">
            {CONFIRM_QUESTIONS.map((q) => (
              <div key={q.id} className="space-y-2">
                <label className="text-sm font-medium text-gray-700">{q.question}</label>
                <div className="grid grid-cols-1 gap-2">
                  {q.options.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setConfirmAnswers(prev => ({ ...prev, [q.id]: opt.value }))}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        confirmAnswers[q.id] === opt.value
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <Button 
            onClick={handleConfirmAnswers}
            disabled={Object.keys(confirmAnswers).length < CONFIRM_QUESTIONS.length}
            className="w-full"
          >
            生成风格配置
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}

      {/* 步骤4: 保存 */}
      {step === 'save' && generatedStyle && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-6">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">{generatedStyle.icon}</div>
              <h4 className="text-xl font-bold">{generatedStyle.name}</h4>
              <p className="text-gray-600 mt-2">{generatedStyle.description}</p>
            </div>

            <div className="space-y-4">
              <div>
                <h5 className="font-medium text-gray-800 mb-2">📝 生成提示词预览</h5>
                <div className="bg-white rounded-lg p-3 text-sm font-mono max-h-48 overflow-y-auto">
                  <pre className="whitespace-pre-wrap">
                    {generateStylePrompt(generatedStyle, undefined, tuningParams)}
                  </pre>
                </div>
              </div>

              <div>
                <h5 className="font-medium text-gray-800 mb-2">📊 风格特征</h5>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-white rounded p-2">
                    <div className="text-gray-500">节奏</div>
                    <div className="font-medium">
                      {tuningParams.pacing < 33 ? '缓慢细腻' : tuningParams.pacing < 66 ? '中等节奏' : '快速紧凑'}
                    </div>
                  </div>
                  <div className="bg-white rounded p-2">
                    <div className="text-gray-500">对话比例</div>
                    <div className="font-medium">{Math.round(tuningParams.dialogue_ratio * 100)}%</div>
                  </div>
                  <div className="bg-white rounded p-2">
                    <div className="text-gray-500">词汇难度</div>
                    <div className="font-medium">
                      {tuningParams.vocabulary_level < 33 ? '简单' : tuningParams.vocabulary_level < 66 ? '中等' : '复杂'}
                    </div>
                  </div>
                  <div className="bg-white rounded p-2">
                    <div className="text-gray-500">描写详细度</div>
                    <div className="font-medium">
                      {tuningParams.description_detail < 33 ? '简洁' : tuningParams.description_detail < 66 ? '适中' : '丰富'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Button onClick={handleSave} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            保存到个人风格库
          </Button>

          <Button variant="outline" onClick={() => setStep('upload')} className="w-full">
            继续学习其他风格
          </Button>
        </div>
      )}
    </div>
  )
}
