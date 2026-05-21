import { useState } from 'react'
import { WritingStylePreset, WRITING_STYLE_PRESETS, generateStylePrompt } from '@/types/writing-styles'

export function StyleHowItWorks() {
  const [selectedStyle, setSelectedStyle] = useState<WritingStylePreset>(WRITING_STYLE_PRESETS[0])
  const [generatedPrompt, setGeneratedPrompt] = useState('')

  const handleSelectStyle = (style: WritingStylePreset) => {
    setSelectedStyle(style)
    const prompt = generateStylePrompt(style, '老人缓缓抬起头，望着远方的地平线。')
    setGeneratedPrompt(prompt)
  }

  const getStyleData = () => {
    return [
      {
        section: '📖 叙事要求',
        items: [
          { key: '视角', value: selectedStyle.narrative.perspective === 'first_person' ? '第一人称' : selectedStyle.narrative.perspective === 'third_person_limited' ? '第三人称限知' : '第三人称全知' },
          { key: '时态', value: selectedStyle.narrative.tense === 'past' ? '过去时' : selectedStyle.narrative.tense === 'present' ? '现在时' : '混合' },
          { key: '口吻', value: selectedStyle.narrative.voice === 'casual' ? '随意' : selectedStyle.narrative.voice === 'literary' ? '文学化' : selectedStyle.narrative.voice === 'formal' ? '正式' : selectedStyle.narrative.voice === 'conversational' ? '对话感' : '诗意化' },
          { key: '基调', value: selectedStyle.narrative.tone.join('、') },
          { key: '节奏', value: selectedStyle.narrative.pacing === 'slow' ? '缓慢' : selectedStyle.narrative.pacing === 'fast' ? '快速' : '中等' },
        ]
      },
      {
        section: '🎨 语言风格',
        items: [
          { key: '词汇难度', value: selectedStyle.language.vocabulary_level === 'simple' ? '简单' : selectedStyle.language.vocabulary_level === 'intermediate' ? '中等' : '高级' },
          { key: '句式结构', value: selectedStyle.language.sentence_structure === 'short' ? '短句' : selectedStyle.language.sentence_structure === 'mixed' ? '混合' : '复杂' },
          { key: '段落长度', value: selectedStyle.language.paragraph_length === 'concise' ? '简短' : selectedStyle.language.paragraph_length === 'moderate' ? '中等' : '详细' },
          { key: '对话比例', value: `${Math.round(selectedStyle.language.dialogue_ratio * 100)}%` },
          { key: '描写侧重', value: selectedStyle.language.description_type === 'visual' ? '视觉' : selectedStyle.language.description_type === 'sensory' ? '感官' : selectedStyle.language.description_type === 'emotional' ? '情感' : selectedStyle.language.description_type === 'minimal' ? '极简' : '丰富' },
        ]
      },
      {
        section: '✨ 标志性特征',
        items: selectedStyle.style_analysis.signature_elements.map(e => ({ key: '', value: e }))
      }
    ]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🎨 写作风格系统 - 工作原理</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            了解我们如何把结构化的风格数据，转换成 AI 能够理解和使用的提示词
          </p>
        </div>

        {/* Process Flow */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { num: '1️⃣', title: '风格定义', desc: '结构化数据' },
            { num: '2️⃣', title: '提示词生成', desc: '转换为自然语言' },
            { num: '3️⃣', title: '发送给 AI', desc: '融入对话上下文' },
            { num: '4️⃣', title: 'AI 模仿', desc: '按照风格创作' },
          ].map((step, idx) => (
            <div key={idx} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-center">
              <div className="text-4xl mb-3">{step.num}</div>
              <div className="font-bold text-gray-900 mb-1">{step.title}</div>
              <div className="text-sm text-gray-500">{step.desc}</div>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Style Selection & Data */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">1️⃣ 选择风格</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {WRITING_STYLE_PRESETS.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => handleSelectStyle(style)}
                    className={`w-full text-left p-4 rounded-lg transition-all ${
                      selectedStyle.id === style.id
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{style.icon}</span>
                      <div className="flex-1">
                        <div className="font-medium">{style.name}</div>
                        <div className="text-sm opacity-90">{style.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">2️⃣ 风格数据</h2>
              <div className="space-y-4">
                {getStyleData().map((section, idx) => (
                  <div key={idx}>
                    <div className="font-semibold text-indigo-700 mb-2">{section.section}</div>
                    <div className="space-y-1">
                      {section.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                          {item.key && <span className="text-gray-500">{item.key}:</span>}
                          <span className={item.key ? 'text-gray-900' : 'text-indigo-700'}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2: Generated Prompt */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">3️⃣ 生成的提示词</h2>
              <div className="bg-gray-900 text-gray-100 rounded-lg p-6 max-h-[600px] overflow-y-auto">
                <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                  {generatedPrompt || generateStylePrompt(selectedStyle, '老人缓缓抬起头，望着远方的地平线。')}
                </pre>
              </div>
            </div>

            {/* How it works */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border border-yellow-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">💡 工作原理</h2>
              <div className="space-y-3 text-gray-700">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📊</span>
                  <div>
                    <div className="font-medium">1. 结构化数据定义</div>
                    <div className="text-sm">每种风格都有详细的参数（视角、节奏、词汇等）</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🔄</span>
                  <div>
                    <div className="font-medium">2. generateStylePrompt() 函数</div>
                    <div className="text-sm">把参数转换成自然语言描述，让 AI 能理解</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📝</span>
                  <div>
                    <div className="font-medium">3. 发送给 AI</div>
                    <div className="text-sm">提示词会加入到 AI 的上下文对话中</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">✨</span>
                  <div>
                    <div className="font-medium">4. AI 模仿创作</div>
                    <div className="text-sm">AI 根据提示词，自动模仿相应的风格</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Example Output */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">4️⃣ AI 输出示例</h2>
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6">
                <div className="text-sm text-gray-500 mb-2">使用 {selectedStyle.name} 续写:</div>
                <div className="text-gray-800 leading-relaxed">
                  {selectedStyle.id === 'hemingway' && (
                    <>
                      <p className="mb-4">老人放下钓索，慢慢坐下。海风带着咸腥的味道，吹过他的脸颊。他已经在这里坐了很久了，什么也没钓到。</p>
                      <p className="mb-4">不着急，他想。海还是海，明天会更好的。</p>
                      <p>他伸手拿起脚边的酒瓶，喝了一口。酒很热，烧过喉咙。他望着远方的地平线，那里有一片淡淡的金色。</p>
                    </>
                  )}
                  {selectedStyle.id === 'marquez' && (
                    <>
                      <p className="mb-4">多年以后，当他站在那片海滩上，准会想起父亲带他去看大海的那个遥远的下午。</p>
                      <p className="mb-4">那时的海还是蓝的，天空也很清澈。他在沙滩上写下自己的名字，然后被海浪冲走，仿佛他从未存在过。</p>
                      <p>海风带着盐的味道，还有远处传来的渔歌声。他忽然觉得，自己已经在这里站了一百年。</p>
                    </>
                  )}
                  {selectedStyle.id === 'jin_yong' && (
                    <>
                      <p className="mb-4">那人负手而立，望着远方的海面。海风吹起他的衣袍，猎猎作响。</p>
                      <p className="mb-4">他已经在这里等了三天三夜，只为等一个人。</p>
                      <p>远处，一艘小船正在缓缓驶来。船头站着一个白衣少女，腰悬长剑，正是他要等的人。</p>
                    </>
                  )}
                  {!['hemingway', 'marquez', 'jin_yong'].includes(selectedStyle.id) && (
                    <p className="text-gray-500 italic">（选择海明威、马尔克斯或金庸风格查看示例）</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Architecture Diagram */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">🏗️ 系统架构</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg p-4 mb-3">
                <div className="text-3xl mb-1">📚</div>
                <div className="font-bold">预设风格库</div>
              </div>
              <div className="text-sm text-gray-600">
                20+详细定义的风格配置
              </div>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-lg p-4 mb-3">
                <div className="text-3xl mb-1">🔄</div>
                <div className="font-bold">提示词生成</div>
              </div>
              <div className="text-sm text-gray-600">
                generateStylePrompt() 函数
              </div>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-br from-green-500 to-teal-600 text-white rounded-lg p-4 mb-3">
                <div className="text-3xl mb-1">🤖</div>
                <div className="font-bold">AI 创作</div>
              </div>
              <div className="text-sm text-gray-600">
                GPT-4 / Claude / DeepSeek
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
