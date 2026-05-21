import { useState, useMemo } from 'react'
import {
  WritingStylePreset,
  CATEGORIES,
  CATEGORY_NAMES,
  getStylesByCategory,
  searchStyles,
  generateStylePrompt
} from '../types/writing-styles'
import { Sparkles, Eye, Check, ArrowLeft, Copy, Code } from 'lucide-react'
import { Button } from '../components/ui/Button'

interface WritingStyleSelectorProps {
  selectedStyle: WritingStylePreset | null
  onSelectStyle: (style: WritingStylePreset) => void
  onClose: () => void
}

export function WritingStyleSelector({
  selectedStyle,
  onSelectStyle,
  onClose
}: WritingStyleSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [viewingStyle, setViewingStyle] = useState<WritingStylePreset | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showPrompt, setShowPrompt] = useState(false)

  const filteredPresets = useMemo(() => {
    if (searchQuery) {
      return searchStyles(searchQuery)
    }
    return getStylesByCategory(selectedCategory)
  }, [selectedCategory, searchQuery])

  const handleCopyPrompt = () => {
    if (viewingStyle) {
      const prompt = generateStylePrompt(viewingStyle)
      navigator.clipboard.writeText(prompt)
      alert('提示词已复制到剪贴板！')
    }
  }

  if (viewingStyle) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b p-4 flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setViewingStyle(null)
                setShowPrompt(false)
              }}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回
            </Button>
            <div className="flex-1">
              <h2 className="text-xl font-bold">
                {viewingStyle.icon} {viewingStyle.name}
              </h2>
              <p className="text-sm text-gray-600">{viewingStyle.description}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPrompt(!showPrompt)}
            >
              <Code className="w-4 h-4 mr-2" />
              {showPrompt ? '隐藏提示词' : '查看AI提示词'}
            </Button>
          </div>

          <div className="p-6 space-y-6">
            <section>
              <h3 className="text-lg font-semibold mb-3">🎯 风格核心分析</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-purple-800 mb-2">标志性元素</h4>
                  <div className="flex flex-wrap gap-2">
                    {viewingStyle.style_analysis.signature_elements.map((elem, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-white/70 rounded-full text-xs text-purple-700"
                      >
                        {elem}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-2">叙事技巧</h4>
                  <div className="flex flex-wrap gap-2">
                    {viewingStyle.style_analysis.narrative_techniques.map((tech, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-white/70 rounded-full text-xs text-green-700"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">人物关注点</div>
                  <div className="text-sm font-medium">
                    {viewingStyle.style_analysis.character_focus}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">情感共鸣</div>
                  <div className="text-sm font-medium">
                    {viewingStyle.style_analysis.emotional_resonance}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">节奏模式</div>
                  <div className="text-sm font-medium">
                    {viewingStyle.style_analysis.pacing_pattern}
                  </div>
                </div>
              </div>

              <div className="mt-4 bg-yellow-50 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">主题偏好</h4>
                <div className="flex flex-wrap gap-2">
                  {viewingStyle.style_analysis.theme_preferences.map((theme, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Eye className="w-5 h-5" />
                示例文本
              </h3>
              <div className="space-y-3">
                {viewingStyle.example_texts.map((text, idx) => (
                  <div
                    key={idx}
                    className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 border-l-4 border-blue-400"
                  >
                    <div className="text-xs text-gray-500 mb-2">示例 {idx + 1}</div>
                    <div className="text-gray-700 leading-relaxed">{text}</div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">📝 语言配置详情</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500">词汇难度</div>
                    <div className="font-medium">
                      {viewingStyle.language.vocabulary_level === 'simple'
                        ? '简单易懂'
                        : viewingStyle.language.vocabulary_level === 'intermediate'
                        ? '中等难度'
                        : viewingStyle.language.vocabulary_level === 'advanced'
                        ? '高级词汇'
                        : '学术化'}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500">句式结构</div>
                    <div className="font-medium">
                      {viewingStyle.language.sentence_structure === 'short'
                        ? '短句有力'
                        : viewingStyle.language.sentence_structure === 'mixed'
                        ? '长短句结合'
                        : viewingStyle.language.sentence_structure === 'complex'
                        ? '复杂长句'
                        : '行云流水'}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500">段落长度</div>
                    <div className="font-medium">
                      {viewingStyle.language.paragraph_length === 'concise'
                        ? '简短精炼'
                        : viewingStyle.language.paragraph_length === 'moderate'
                        ? '中等长度'
                        : viewingStyle.language.paragraph_length === 'descriptive'
                        ? '详细描述'
                        : '史诗级'}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500">对话比例</div>
                    <div className="font-medium">
                      {Math.round(viewingStyle.language.dialogue_ratio * 100)}% 对话
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">描写侧重</div>
                    <div className="font-medium">
                      {viewingStyle.language.description_type === 'visual'
                        ? '视觉画面'
                        : viewingStyle.language.description_type === 'sensory'
                        ? '多种感官'
                        : viewingStyle.language.description_type === 'emotional'
                        ? '情感内心'
                        : viewingStyle.language.description_type === 'minimal'
                        ? '极简留白'
                        : '丰富细节'}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">用词偏好</div>
                    <div className="flex flex-wrap gap-1">
                      {viewingStyle.language.diction.map((word, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs"
                        >
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">常用修辞</div>
                    <div className="flex flex-wrap gap-1">
                      {viewingStyle.language.figurative_language.map((fig, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-pink-100 text-pink-700 rounded text-xs"
                        >
                          {fig}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-3">🎬 叙事配置</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500">视角</div>
                  <div className="font-medium">
                    {viewingStyle.narrative.perspective === 'first_person'
                      ? '第一人称'
                      : viewingStyle.narrative.perspective === 'third_person_limited'
                      ? '第三人称限知'
                      : '第三人称全知'}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500">时态</div>
                  <div className="font-medium">
                    {viewingStyle.narrative.tense === 'past'
                      ? '过去时'
                      : viewingStyle.narrative.tense === 'present'
                      ? '现在时'
                      : '混合时态'}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500">叙述口吻</div>
                  <div className="font-medium">
                    {viewingStyle.narrative.voice === 'casual'
                      ? '随意口语化'
                      : viewingStyle.narrative.voice === 'literary'
                      ? '文学化'
                      : viewingStyle.narrative.voice === 'formal'
                      ? '正式严肃'
                      : viewingStyle.narrative.voice === 'conversational'
                      ? '对话感强'
                      : '诗意化'}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500">节奏</div>
                  <div className="font-medium">
                    {viewingStyle.narrative.pacing === 'slow'
                      ? '缓慢细腻'
                      : viewingStyle.narrative.pacing === 'moderate'
                      ? '中等节奏'
                      : viewingStyle.narrative.pacing === 'fast'
                      ? '快速紧凑'
                      : '多变节奏'}
                  </div>
                </div>
              </div>
              <div className="mt-3 bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">语气基调</div>
                <div className="flex flex-wrap gap-1.5">
                  {viewingStyle.narrative.tone.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            {showPrompt && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">🤖 AI提示词</h3>
                  <Button variant="outline" size="sm" onClick={handleCopyPrompt}>
                    <Copy className="w-4 h-4 mr-2" />
                    复制
                  </Button>
                </div>
                <div className="bg-gray-900 text-gray-100 rounded-lg p-4 text-sm font-mono overflow-x-auto max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap">{generateStylePrompt(viewingStyle)}</pre>
                </div>
              </section>
            )}

            <section>
              <h3 className="text-lg font-semibold mb-3">✨ 推荐使用场景</h3>
              <div className="flex flex-wrap gap-2">
                {viewingStyle.recommended_genres.map((genre) => (
                  <span
                    key={genre}
                    className="px-3 py-1.5 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-full text-sm font-medium"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </section>

            <div className="pt-4 border-t flex gap-3">
              <Button
                onClick={() => {
                  onSelectStyle(viewingStyle)
                  setViewingStyle(null)
                }}
                className="flex-1"
              >
                <Check className="w-4 h-4 mr-2" />
                选择此风格
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                选择写作风格
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                选择适合你故事的预设风格，包含详细的风格分析和AI提示词
              </p>
            </div>
            <Button variant="ghost" onClick={onClose}>
              关闭
            </Button>
          </div>

          <div className="mt-4">
            <div className="relative">
              <input
                type="text"
                placeholder="搜索风格..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat === 'all' ? '全部' : CATEGORY_NAMES[cat]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {filteredPresets.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              没有找到匹配的风格
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPresets.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => setViewingStyle(preset)}
                  className={`border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedStyle?.id === preset.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{preset.icon}</span>
                      <div>
                        <h3 className="font-semibold">{preset.name}</h3>
                        <p className="text-xs text-gray-500">
                          {CATEGORY_NAMES[preset.category]}
                        </p>
                      </div>
                    </div>
                    {selectedStyle?.id === preset.id && (
                      <span className="flex items-center gap-1 text-blue-600 text-sm font-medium">
                        <Check className="w-4 h-4" />
                        已选择
                      </span>
                    )}
                  </div>

                  <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                    {preset.description}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {preset.narrative.tone.slice(0, 3).map((tone, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                      >
                        {tone}
                      </span>
                    ))}
                  </div>

                  <div className="mt-3 pt-3 border-t flex items-center justify-between">
                    <div className="text-xs text-gray-500 line-clamp-1">
                      推荐: {preset.recommended_genres.join('、')}
                    </div>
                    <Button variant="ghost" size="sm">
                      预览
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SearchIcon({ className }: { className: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}
