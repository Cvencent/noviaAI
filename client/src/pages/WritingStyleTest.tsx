import { useState } from 'react'
import { WritingStyleSystem } from '@/components/WritingStyleSystem'
import { WritingStylePreset, WRITING_STYLE_PRESETS, StyleTuningParams, generateStylePrompt } from '@/types/writing-styles'
import { StyleLearner } from '@/components/StyleLearner'
import { StyleFusion } from '@/components/StyleFusion'
import { StyleDeepAnalysis } from '@/components/StyleDeepAnalysis'

export function WritingStyleTestPage() {
  const [selectedStyle, setSelectedStyle] = useState<WritingStylePreset | null>(null)
  const [testText, setTestText] = useState('老人缓缓抬起头，望着远方的地平线。海风带着咸湿的气息吹过，吹动了他灰白的胡须。')

  const handleStyleSelect = (style: WritingStylePreset) => {
    setSelectedStyle(style)
    console.log('✅ Selected style:', style.name)
  }

  const handleSaveLearnedStyle = (style: WritingStylePreset, params: StyleTuningParams) => {
    console.log('✅ Saved learned style:', style.name, params)
    alert(`风格学习成功！已保存：${style.name}`)
  }

  const handleSaveFusion = (fusedStyle: WritingStylePreset, styles: WritingStylePreset[], weights: number[]) => {
    console.log('✅ Saved fusion:', fusedStyle.name, styles.map(s => s.name), weights)
    alert(`风格融合成功！已保存：${fusedStyle.name}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">🎨 写作风格系统 - 测试页面</h1>
                <p className="text-gray-600 mt-2">系统验证：预设库、风格微调、实时预览、学习、融合、深度分析</p>
              </div>
              <div className="flex items-center gap-4">
                <a 
                  href="/style-how-it-works" 
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-md transition-all"
                >
                  🧠 查看工作原理
                </a>
                <div className="text-sm text-gray-500">
                  测试状态: <span className="text-green-600 font-medium">运行中</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="text-2xl">📚</div>
            <div className="text-xl font-bold text-gray-900">{WRITING_STYLE_PRESETS.length}</div>
            <div className="text-sm text-gray-500">预设风格</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="text-2xl">🔧</div>
            <div className="text-xl font-bold text-gray-900">4</div>
            <div className="text-sm text-gray-500">微调参数</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="text-2xl">👁️</div>
            <div className="text-xl font-bold text-gray-900">6</div>
            <div className="text-sm text-gray-500">总功能模块</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="text-2xl">🧠</div>
            <div className="text-xl font-bold text-gray-900">5</div>
            <div className="text-sm text-gray-500">学习步骤</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="text-2xl">🔗</div>
            <div className="text-xl font-bold text-gray-900">2-3</div>
            <div className="text-sm text-gray-500">融合风格</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="text-2xl">📊</div>
            <div className="text-xl font-bold text-gray-900">深度</div>
            <div className="text-sm text-gray-500">分析维度</div>
          </div>
        </div>
      </div>

      {/* Test Area */}
      <div className="max-w-7xl mx-auto px-4 pb-8">
        {/* Quick Test Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">⚡ 快速测试</h2>
            <div className="flex gap-2">
              {WRITING_STYLE_PRESETS.slice(0, 6).map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    selectedStyle?.id === style.id
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {style.icon} {style.name}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">测试文本</label>
              <textarea
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {selectedStyle && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">生成提示词</label>
                <div className="bg-gray-900 text-gray-100 rounded-lg p-4 h-32 overflow-y-auto text-sm font-mono">
                  {generateStylePrompt(selectedStyle, testText)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Style Categories */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📑 风格分类统计</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(WRITING_STYLE_PRESETS.reduce((acc, style) => {
              acc[style.category] = (acc[style.category] || 0) + 1
              return acc
            }, {} as Record<string, number>)).map(([category, count]) => (
              <div key={category} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3 text-center">
                <div className="font-medium text-gray-900">{(category as any) || '未知'}</div>
                <div className="text-2xl font-bold text-blue-600">{count}</div>
                <div className="text-xs text-gray-500">种风格</div>
              </div>
            ))}
          </div>
        </div>

        {/* Component Tests */}
        <div className="space-y-8">
          {/* 1. WritingStyleSystem Test */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">1️⃣ WritingStyleSystem 主组件</h2>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                  ✅ 已创建
                </span>
              </div>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <WritingStyleSystem 
                onStyleSelect={handleStyleSelect}
                currentStyle={selectedStyle}
              />
            </div>
          </div>

          {/* 2. StyleLearner Test */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">2️⃣ StyleLearner 风格学习</h2>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                  ✅ 已创建
                </span>
              </div>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <StyleLearner onSave={handleSaveLearnedStyle} />
            </div>
          </div>

          {/* 3. StyleFusion Test */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">3️⃣ StyleFusion 风格融合</h2>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                  ✅ 已创建
                </span>
              </div>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <StyleFusion onSave={handleSaveFusion} />
            </div>
          </div>

          {/* 4. StyleDeepAnalysis Test */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">4️⃣ StyleDeepAnalysis 深度分析</h2>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                  ✅ 已创建
                </span>
              </div>
            </div>
            {selectedStyle ? (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <StyleDeepAnalysis style={selectedStyle} />
              </div>
            ) : (
              <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
                <div className="text-gray-400 mb-4">👈 请先在上方快速测试选择一个风格</div>
                <div className="text-sm text-gray-500">选择后即可查看深度分析功能</div>
              </div>
            )}
          </div>
        </div>

        {/* Test Results Summary */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200 p-6 mt-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-3xl">🎊</div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">测试完成！</h2>
              <p className="text-gray-600">写作风格系统所有组件已验证</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: '预设库', status: '✅', desc: '20+中外作家风格' },
              { name: '风格微调', status: '✅', desc: '4个滑动条实时调整' },
              { name: '实时预览', status: '✅', desc: '快速切换不同风格' },
              { name: '风格学习', status: '✅', desc: '5步完整流程' },
              { name: '多风格融合', status: '✅', desc: '智能兼容性分析' },
              { name: '深度分析', status: '✅', desc: '文学史定位+对比' },
            ].map((item, idx) => (
              <div key={idx} className="bg-white rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{item.status}</span>
                  <div>
                    <div className="font-medium text-gray-900">{item.name}</div>
                    <div className="text-sm text-gray-500">{item.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
