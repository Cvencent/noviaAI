import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Activity, AlertTriangle, BookOpen, RefreshCw } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import {
  ReaderExperienceReport,
  readerExperienceApi,
} from '../api/reader-experience'

export function ReaderExperience() {
  const { projectId } = useParams<{ projectId: string }>()
  const [report, setReport] = useState<ReaderExperienceReport | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const loadReport = async () => {
    if (!projectId) return
    setIsLoading(true)
    try {
      setReport(await readerExperienceApi.analyze(projectId))
    } catch (error) {
      console.error('加载读者体验分析失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadReport()
  }, [projectId])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">读者体验分析</h1>
            <p className="text-gray-600 mt-1">查看章节张力、可读性和潜在弃读风险</p>
          </div>
          <Button variant="outline" onClick={loadReport} isLoading={isLoading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新分析
          </Button>
        </div>

        {report && (
          <>
            <div className="grid grid-cols-4 gap-4">
              <MetricCard label="章节数" value={report.summary.chapterCount} icon={BookOpen} />
              <MetricCard label="平均可读性" value={report.summary.averageReadabilityScore} icon={Activity} />
              <MetricCard label="平均张力" value={report.summary.averageTension} icon={Activity} />
              <MetricCard label="风险点" value={report.summary.riskCount} icon={AlertTriangle} />
            </div>

            <Card>
              <div className="space-y-4">
                <div className="font-semibold text-gray-900">章节曲线</div>
                <div className="space-y-3">
                  {report.chapters.map((chapter) => (
                    <div key={chapter.chapterId} className="grid grid-cols-[10rem_1fr_6rem] items-center gap-4">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-gray-900">
                          {chapter.order + 1}. {chapter.title}
                        </div>
                        <div className="text-xs text-gray-500">{chapter.emotion.dominantTone}</div>
                      </div>
                      <div className="space-y-2">
                        <Bar label="张力" value={chapter.emotion.tension} color="bg-red-500" />
                        <Bar label="可读" value={chapter.readability.score} color="bg-indigo-500" />
                      </div>
                      <div className="text-xs text-gray-500">
                        均句 {chapter.readability.averageSentenceLength}
                        <br />
                        对话 {chapter.readability.dialogueRatio}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Card>
              <div className="space-y-4">
                <div className="font-semibold text-gray-900">风险提示</div>
                {report.risks.length > 0 ? (
                  <div className="space-y-2">
                    {report.risks.map((risk, index) => (
                      <div key={`${risk.chapterId}-${index}`} className="rounded-lg border border-yellow-100 bg-yellow-50 p-3">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-yellow-900">{risk.title}</div>
                          <div className="text-xs text-yellow-700">{risk.category} / {risk.severity}</div>
                        </div>
                        <div className="mt-1 text-sm text-yellow-800">{risk.message}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">暂无明显风险点</div>
                )}
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}

function MetricCard({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Activity }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-500">{label}</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{value}</div>
        </div>
        <Icon className="w-5 h-5 text-indigo-600" />
      </div>
    </Card>
  )
}

function Bar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="grid grid-cols-[2.5rem_1fr_2rem] items-center gap-2">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
      <div className="text-right text-xs text-gray-500">{value}</div>
    </div>
  )
}
