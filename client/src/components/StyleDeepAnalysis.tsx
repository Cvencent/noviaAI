import { useState } from 'react'
import { WritingStylePreset, WRITING_STYLE_PRESETS } from '../types/writing-styles'
import { Button } from '../components/ui/Button'
import { Sparkles, BookOpen, GitCompare, ArrowRight, Loader } from 'lucide-react'

interface StyleDeepAnalysisProps {
  style?: WritingStylePreset | null
}

export function StyleDeepAnalysis({ style }: StyleDeepAnalysisProps) {
  const [compareStyles, setCompareStyles] = useState<WritingStylePreset[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)

  const handleCompare = (compareStyle: WritingStylePreset) => {
    if (compareStyles.find(s => s.id === compareStyle.id)) {
      setCompareStyles(prev => prev.filter(s => s.id !== compareStyle.id))
    } else if (compareStyles.length < 3) {
      setCompareStyles(prev => [...prev, compareStyle])
    }
  }

  const handleAnalyze = async () => {
    if (!style) return

    setIsAnalyzing(true)

    setTimeout(() => {
      const result = {
        literaryHistory: generateLiteraryHistory(style),
        comparativeAnalysis: compareStyles.length > 0 
          ? generateComparativeAnalysis(style, compareStyles)
          : null
      }

      setAnalysisResult(result)
      setIsAnalyzing(false)
    }, 2000)
  }

  const generateLiteraryHistory = (style: WritingStylePreset) => {
    const periodMap: Record<string, string> = {
      classic: '20世纪上半叶 - 现代主义鼎盛期',
      chinese_classic: '20世纪中后期 - 港台新武侠/文学',
      sci_fi: '20世纪中后期 - 科幻黄金时代',
      mystery: '20世纪上半叶 - 古典推理时期',
      literary: '20世纪至今 - 当代文学',
      web_novel: '21世纪初 - 网络文学时代',
      fantasy: '20世纪中后期 - 现代奇幻文学',
      fiction: '19-20世纪 - 现实主义文学'
    }

    const schoolMap: Record<string, string> = {
      classic: '现代主义/迷惘的一代',
      chinese_classic: '新派武侠/现代文学',
      sci_fi: '硬科幻/新浪潮',
      mystery: '古典推理/社会派推理',
      literary: '现代主义/后现代主义',
      web_novel: '网络文学/类型文学',
      fantasy: '史诗奇幻/当代奇幻',
      fiction: '现实主义/自然主义'
    }

    return {
      period: periodMap[style.category] || '当代文学时期',
      school: schoolMap[style.category] || '当代文学流派',
      position: getPositionDescription(style),
      influences: getInfluences(style),
      influenced: getInfluenced(style)
    }
  }

  const getPositionDescription = (style: WritingStylePreset): string => {
    const descriptions: Record<string, string> = {
      hemingway: '美国"迷惘的一代"代表作家，诺贝尔文学奖得主，冰山理论的创立者',
      marquez: '魔幻现实主义代表作家，诺贝尔文学奖得主，拉美文学爆炸主将',
      jin_yong: '新派武侠小说开山鼻祖，华人世界最具影响力作家之一',
      gu_long: '浪子武侠代表，以诗化语言和悬疑风格独树一帜',
      liu_cixin: '中国科幻领军人物，雨果奖得主，宏大叙事硬科幻代表',
      haruki_murakami: '日本当代文学代表作家，都市文学和后现代主义的重要代表'
    }
    return descriptions[style.id] || `${style.name}是该领域的优秀代表作家`
  }

  const getInfluences = (style: WritingStylePreset): string[] => {
    const influences: Record<string, string[]> = {
      hemingway: ['司汤达', '马克·吐温', '斯泰因'],
      marquez: ['福克纳', '卡彭铁尔', '弗吉尼亚· Woolf'],
      jin_yong: ['还珠楼主', '平江不肖生', '中国古典文学'],
      liu_cixin: ['阿西莫夫', '克拉克', '刘慈欣'],
      haruki_murakami: ['卡夫卡', '塞林格', '雷蒙·钱德勒']
    }
    return influences[style.id] || ['经典文学传统', '时代背景']
  }

  const getInfluenced = (style: WritingStylePreset): string[] => {
    const influenced: Record<string, string[]> = {
      hemingway: ['雷蒙德·卡佛', '理查德·福特', '后辈作家'],
      marquez: ['莫言', '陈忠实', '拉美后辈作家'],
      jin_yong: ['温瑞安', '黄易', '网络武侠作家'],
      liu_cixin: ['郝景芳', '刘宇昆', '中国科幻作家'],
      haruki_murakami: ['中国都市作家', '日本后辈作家']
    }
    return influenced[style.id] || ['后世作家', '文学发展']
  }

  const generateComparativeAnalysis = (style: WritingStylePreset, compareStyles: WritingStylePreset[]) => {
    return compareStyles.map(compareStyle => {
      const similarity = calculateSimilarity(style, compareStyle)
      const similarities = findSimilarities(style, compareStyle)
      const differences = findDifferences(style, compareStyle)

      return {
        styleId: compareStyle.id,
        styleName: compareStyle.name,
        similarity,
        similarities,
        differences
      }
    })
  }

  const calculateSimilarity = (s1: WritingStylePreset, s2: WritingStylePreset): number => {
    let score = 0
    let total = 6

    if (s1.narrative.perspective === s2.narrative.perspective) score += 1
    if (s1.narrative.pacing === s2.narrative.pacing) score += 1
    if (s1.narrative.tense === s2.narrative.tense) score += 1
    if (Math.abs(s1.language.dialogue_ratio - s2.language.dialogue_ratio) < 0.15) score += 1
    if (s1.language.vocabulary_level === s2.language.vocabulary_level) score += 1
    if (s1.narrative.voice === s2.narrative.voice) score += 1

    return Math.round((score / total) * 100)
  }

  const findSimilarities = (s1: WritingStylePreset, s2: WritingStylePreset): string[] => {
    const similarities: string[] = []

    const commonTones = s1.narrative.tone.filter(t => s2.narrative.tone.includes(t))
    if (commonTones.length > 0) similarities.push(`共同基调：${commonTones.join('、')}`)

    const commonThemes = s1.style_analysis.theme_preferences.filter(t => 
      s2.style_analysis.theme_preferences.includes(t)
    )
    if (commonThemes.length > 0) similarities.push(`共同主题：${commonThemes.join('、')}`)

    if (s1.narrative.perspective === s2.narrative.perspective) {
      similarities.push(`都使用${s1.narrative.perspective === 'first_person' ? '第一人称' : '第三人称'}叙事`)
    }

    if (Math.abs(s1.language.dialogue_ratio - s2.language.dialogue_ratio) < 0.15) {
      similarities.push('对话与叙述比例相近')
    }

    if (s1.category === s2.category) {
      similarities.push(`都属于${s1.category}类型`)
    }

    return similarities.length > 0 ? similarities : ['风格上有一定相似性']
  }

  const findDifferences = (s1: WritingStylePreset, s2: WritingStylePreset): string[] => {
    const differences: string[] = []

    if (s1.narrative.pacing !== s2.narrative.pacing) {
      differences.push(`${s1.name}节奏${s1.narrative.pacing === 'slow' ? '慢' : '快'}，${s2.name}节奏${s2.narrative.pacing === 'slow' ? '慢' : '快'}`)
    }

    if (s1.language.vocabulary_level !== s2.language.vocabulary_level) {
      differences.push(`${s1.name}用词${s1.language.vocabulary_level === 'simple' ? '简单直白' : '复杂华丽'}，${s2.name}用词${s2.language.vocabulary_level === 'simple' ? '简单直白' : '复杂华丽'}`)
    }

    if (s1.language.description_type !== s2.language.description_type) {
      differences.push(`描写风格不同：${s1.name}${s1.language.description_type === 'minimal' ? '极简留白' : '丰富细腻'}，${s2.name}${s2.language.description_type === 'minimal' ? '极简留白' : '丰富细腻'}`)
    }

    if (s1.narrative.voice !== s2.narrative.voice) {
      differences.push(`叙述口吻不同：${s1.name}${s1.narrative.voice === 'casual' ? '口语化' : '文学化'}，${s2.name}${s2.narrative.voice === 'casual' ? '口语化' : '文学化'}`)
    }

    const p1 = s1.style_analysis.theme_preferences.length
    const p2 = s2.style_analysis.theme_preferences.length
    if (Math.abs(p1 - p2) > 2) {
      differences.push(`${s1.name}主题更${p1 > p2 ? '广泛' : '集中'}`)
    }

    return differences.length > 0 ? differences : ['细节上存在差异']
  }

  if (!style) {
    return (
      <div className="text-center py-12">
        <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          请先选择一个风格
        </h3>
        <p className="text-gray-600">
          在"浏览风格"中选择一个风格，然后查看深度分析
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Sparkles className="w-6 h-6 text-purple-600" />
        <div>
          <h3 className="text-lg font-bold">
            {style.icon} {style.name} - 深度分析
          </h3>
          <p className="text-sm text-gray-600">{style.description}</p>
        </div>
      </div>

      {/* 文学史定位 */}
      {analysisResult?.literaryHistory && (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-600" />
            <h4 className="font-semibold text-lg">📚 文学史定位</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">文学时期</div>
              <div className="font-medium">{analysisResult.literaryHistory.period}</div>
            </div>
            <div className="bg-white/50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">文学流派</div>
              <div className="font-medium">{analysisResult.literaryHistory.school}</div>
            </div>
          </div>

          <div className="bg-white/50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">文学史地位</div>
            <div className="font-medium">{analysisResult.literaryHistory.position}</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">受影响于</div>
              <div className="flex flex-wrap gap-1">
                {analysisResult.literaryHistory.influences.map((inf: string, idx: number) => (
                  <span key={idx} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-sm">
                    {inf}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-white/50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">影响了</div>
              <div className="flex flex-wrap gap-1">
                {analysisResult.literaryHistory.influenced.map((inf: string, idx: number) => (
                  <span key={idx} className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-sm">
                    {inf}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 对比分析 */}
      <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-green-600" />
            <h4 className="font-semibold text-lg">🔍 对比分析</h4>
          </div>
          <Button size="sm" onClick={handleAnalyze} disabled={isAnalyzing}>
            {isAnalyzing ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                分析中...
              </>
            ) : (
              <>
                开始分析
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            选择要对比的风格（可选，最多3个）
          </label>
          <div className="flex flex-wrap gap-2">
            {WRITING_STYLE_PRESETS.filter(s => s.id !== style.id).slice(0, 12).map((s) => (
              <button
                key={s.id}
                onClick={() => handleCompare(s)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  compareStyles.find(cs => cs.id === s.id)
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-green-50'
                }`}
              >
                {s.icon} {s.name}
              </button>
            ))}
          </div>
        </div>

        {analysisResult?.comparativeAnalysis && analysisResult.comparativeAnalysis.length > 0 && (
          <div className="space-y-3">
            {analysisResult.comparativeAnalysis.map((comparison: any) => (
              <div key={comparison.styleId} className="bg-white rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-semibold">{style.name} vs {comparison.styleName}</h5>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">相似度</span>
                    <span className="text-lg font-bold text-green-600">{comparison.similarity}%</span>
                  </div>
                </div>

                {comparison.similarities.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">相似点：</div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {comparison.similarities.map((sim: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-green-600">✓</span>
                          {sim}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {comparison.differences.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">差异点：</div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {comparison.differences.map((diff: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-orange-600">≠</span>
                          {diff}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 风格特征 */}
      <div className="bg-white rounded-xl p-6 space-y-4">
        <h4 className="font-semibold text-lg">🎯 风格特征总结</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">叙事视角</div>
            <div className="font-medium">
              {style.narrative.perspective === 'first_person' ? '第一人称'
                : style.narrative.perspective === 'third_person_limited' ? '第三人称限知' : '第三人称全知'}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">时态</div>
            <div className="font-medium">
              {style.narrative.tense === 'past' ? '过去时'
                : style.narrative.tense === 'present' ? '现在时' : '混合时态'}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">节奏</div>
            <div className="font-medium">
              {style.narrative.pacing === 'slow' ? '缓慢细腻'
                : style.narrative.pacing === 'fast' ? '快速紧凑' : '中等节奏'}
            </div>
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-600 mb-2">标志性元素</div>
          <div className="flex flex-wrap gap-2">
            {style.style_analysis.signature_elements.map((elem, idx) => (
              <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                {elem}
              </span>
            ))}
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-600 mb-2">叙事技巧</div>
          <div className="flex flex-wrap gap-2">
            {style.style_analysis.narrative_techniques.map((tech, idx) => (
              <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
