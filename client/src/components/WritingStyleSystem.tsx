import { useState } from 'react'
import { 
  WritingStylePreset, 
  WRITING_STYLE_PRESETS,
  StyleTuningParams
} from '../types/writing-styles'
import { StyleTuner } from './StyleTuner'
import { StylePreview } from './StylePreview'
import { WritingStyleSelector } from './WritingStyleSelector'
import { StyleLearner } from './StyleLearner'
import { StyleFusion } from './StyleFusion'
import { StyleDeepAnalysis } from './StyleDeepAnalysis'
import { Button } from '../components/ui/Button'
import { Sparkles, Settings, Eye, BookOpen, GitMerge, Microscope } from 'lucide-react'

type TabType = 'browse' | 'tune' | 'preview' | 'learn' | 'fusion' | 'analysis'

interface WritingStyleSystemProps {
  onStyleSelect?: (style: WritingStylePreset) => void
  currentStyle?: WritingStylePreset | null
}

export function WritingStyleSystem({ 
  onStyleSelect,
  currentStyle 
}: WritingStyleSystemProps) {
  const [activeTab, setActiveTab] = useState<TabType>('browse')
  const [showStyleSelector, setShowStyleSelector] = useState(false)
  const [rewrittenTexts] = useState<{ [styleId: string]: string }>({})
  const [localCurrentStyle, setLocalCurrentStyle] = useState<WritingStylePreset | null>(currentStyle || null)

  const effectiveCurrentStyle = currentStyle || localCurrentStyle

  const handleStyleSelect = (style: WritingStylePreset) => {
    setLocalCurrentStyle(style)
    if (onStyleSelect) {
      onStyleSelect(style)
    }
  }

  const handleRewriteRequest = (text: string, style: WritingStylePreset) => {
    console.log('Rewrite requested:', { text, style: style.name })
  }

  const handleSaveLearnedStyle = (style: WritingStylePreset, params: StyleTuningParams) => {
    console.log('Save learned style:', { style, params })
  }

  const handleSaveFusedStyle = (fusedStyle: WritingStylePreset, styles: WritingStylePreset[], weights: number[]) => {
    console.log('Save fused style:', { fusedStyle, styles, weights })
  }

  const tabs = [
    { id: 'browse' as TabType, label: '浏览风格', icon: BookOpen },
    { id: 'tune' as TabType, label: '风格微调', icon: Settings },
    { id: 'preview' as TabType, label: '实时预览', icon: Eye },
    { id: 'learn' as TabType, label: '风格学习', icon: Microscope },
    { id: 'fusion' as TabType, label: '多风格融合', icon: GitMerge },
    { id: 'analysis' as TabType, label: '深度分析', icon: Sparkles },
  ]

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🎨 写作风格系统
        </h1>
        <p className="text-gray-600">
          专业级写作风格管理：预设库、微调、融合、预览、深度分析
        </p>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        {activeTab === 'browse' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">风格预设库</h2>
                <p className="text-gray-600 mt-1">
                  选择一个预设风格作为基础
                </p>
              </div>
              <Button onClick={() => setShowStyleSelector(true)}>
                <Sparkles className="w-4 h-4 mr-2" />
                打开风格选择器
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {WRITING_STYLE_PRESETS.map((style) => (
                <div
                  key={style.id}
                  onClick={() => handleStyleSelect(style)}
                  className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                    effectiveCurrentStyle?.id === style.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{style.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-semibold">{style.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {style.description}
                      </p>
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {style.narrative.tone.slice(0, 3).map((tone, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                          >
                            {tone}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'tune' && effectiveCurrentStyle && (
          <StyleTuner 
            style={effectiveCurrentStyle}
            onApply={(params) => console.log('Apply tuning:', params)}
            onSaveAsNew={(style, params) => console.log('Save as new:', { style, params })}
          />
        )}

        {activeTab === 'tune' && !effectiveCurrentStyle && (
          <div className="text-center py-12">
            <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              请先选择一个风格
            </h3>
            <p className="text-gray-600 mb-4">
              在"浏览风格"中选择一个风格，然后回到这里进行微调
            </p>
            <Button onClick={() => setActiveTab('browse')}>
              去浏览风格
            </Button>
          </div>
        )}

        {activeTab === 'preview' && (
          <StylePreview 
            onRewriteRequest={handleRewriteRequest}
            rewrittenTexts={rewrittenTexts}
          />
        )}

        {activeTab === 'learn' && (
          <StyleLearner onSave={handleSaveLearnedStyle} />
        )}

        {activeTab === 'fusion' && (
          <StyleFusion onSave={handleSaveFusedStyle} />
        )}

        {activeTab === 'analysis' && effectiveCurrentStyle && (
          <StyleDeepAnalysis style={effectiveCurrentStyle} />
        )}

        {activeTab === 'analysis' && !effectiveCurrentStyle && (
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              请先选择一个风格
            </h3>
            <p className="text-gray-600 mb-4">
              在"浏览风格"中选择一个风格，然后查看深度分析
            </p>
            <Button onClick={() => setActiveTab('browse')}>
              去浏览风格
            </Button>
          </div>
        )}
      </div>

      {showStyleSelector && (
        <WritingStyleSelector
          selectedStyle={effectiveCurrentStyle}
          onSelectStyle={(style) => {
            handleStyleSelect(style)
            setShowStyleSelector(false)
          }}
          onClose={() => setShowStyleSelector(false)}
        />
      )}
    </div>
  )
}
