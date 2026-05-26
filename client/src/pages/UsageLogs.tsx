import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import {
  Activity,
  Calendar,
  DollarSign,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { usageLogsApi } from '@/api/usage-logs'
import type { UsageStats } from '@/types/usage-log'

export const UsageLogs = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const [page, setPage] = useState(1)
  const [activeTab, setActiveTab] = useState<'overview' | 'records' | 'models'>('overview')

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['usage-logs-stats', projectId],
    queryFn: () => usageLogsApi.getStats(projectId!),
    enabled: !!projectId,
  })

  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ['usage-logs', projectId, page],
    queryFn: () => usageLogsApi.getLogs(projectId!, page, 20),
    enabled: !!projectId,
  })

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  const formatCost = (cost: number) => {
    if (cost < 0.01) return '$' + cost.toFixed(4)
    return '$' + cost.toFixed(2)
  }

  const SimpleBarChart = ({ data }: { data: UsageStats['dailyUsage'] }) => {
    if (!data || data.length === 0) return <div className="text-gray-400 text-sm">暂无数据</div>

    const maxCount = Math.max(...data.map((d) => d.count), 1)

    return (
      <div className="space-y-2">
        <div className="flex items-end gap-1 h-40">
          {data.map((item, index) => {
            const height = (item.count / maxCount) * 100
            return (
              <div
                key={index}
                className="flex-1 bg-indigo-500 rounded-t transition-all hover:bg-indigo-600 relative group"
                style={{ height: `${Math.max(height, 4)}%` }}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">
                  {item.count}
                </div>
              </div>
            )
          })}
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>{data[0]?.date}</span>
          <span>{data[data.length - 1]?.date}</span>
        </div>
      </div>
    )
  }

  const SimpleLineChart = ({ data }: { data: UsageStats['dailyUsage'] }) => {
    if (!data || data.length === 0) return <div className="text-gray-400 text-sm">暂无数据</div>

    const maxCost = Math.max(...data.map((d) => d.cost), 0.01)

    const points = data.map((item, index) => {
      const x = (index / (data.length - 1 || 1)) * 100
      const y = 100 - (item.cost / maxCost) * 100
      return `${x},${y}`
    }).join(' ')

    return (
      <div className="space-y-2">
        <svg viewBox="0 0 100 100" className="w-full h-40" preserveAspectRatio="none">
          <defs>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polyline
            fill="none"
            stroke="rgb(99, 102, 241)"
            strokeWidth="2"
            points={points}
          />
          <polygon
            fill="url(#lineGradient)"
            points={`0,100 ${points} 100,100`}
          />
        </svg>
        <div className="flex justify-between text-xs text-gray-500">
          <span>{data[0]?.date}</span>
          <span>{data[data.length - 1]?.date}</span>
        </div>
      </div>
    )
  }

  if (statsLoading) {
    return (
      <div className="h-full p-4 overflow-y-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full p-4 overflow-y-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">使用日志</h1>
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'overview' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('overview')}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            概览
          </Button>
          <Button
            variant={activeTab === 'records' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('records')}
          >
            <Activity className="w-4 h-4 mr-2" />
            记录
          </Button>
          <Button
            variant={activeTab === 'models' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('models')}
          >
            模型统计
          </Button>
        </div>
      </div>

      {activeTab === 'overview' && stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Activity className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">总调用次数</p>
                  <p className="text-2xl font-bold">{formatNumber(stats.total)}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">今日调用</p>
                  <p className="text-2xl font-bold">{formatNumber(stats.today)}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">本周调用</p>
                  <p className="text-2xl font-bold">{formatNumber(stats.thisWeek)}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">总费用</p>
                  <p className="text-2xl font-bold">{formatCost(stats.totalCost)}</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">调用趋势（每日次数）</h3>
              <SimpleBarChart data={stats.dailyUsage} />
            </Card>

            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">费用趋势</h3>
              <SimpleLineChart data={stats.dailyUsage} />
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <p className="text-sm text-gray-500 mb-1">本月调用</p>
              <p className="text-3xl font-bold text-indigo-600">{formatNumber(stats.thisMonth)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-500 mb-1">总 Token 数</p>
              <p className="text-3xl font-bold text-green-600">{formatNumber(stats.totalTokens)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-500 mb-1">平均每次调用 Token</p>
              <p className="text-3xl font-bold text-purple-600">
                {stats.total > 0 ? Math.round(stats.totalTokens / stats.total) : 0}
              </p>
            </Card>
          </div>
        </>
      )}

      {activeTab === 'records' && (
        <>
          {logsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : logsData?.logs && logsData.logs.length > 0 ? (
            <>
              <div className="space-y-3">
                {logsData.logs.map((log) => (
                  <Card key={log.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              log.statusCode === 200
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {log.statusCode || 'N/A'}
                          </span>
                          <span className="font-medium">{log.endpoint}</span>
                          <span className="text-gray-400">|</span>
                          <span className="text-gray-600">{log.method}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>API Key: {log.apiKey?.name || log.apiKeyId.slice(0, 8)}...</span>
                          <span>{formatDate(log.createdAt)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        {log.tokensUsed && (
                          <p className="text-sm font-medium">{formatNumber(log.tokensUsed)} tokens</p>
                        )}
                        {log.cost !== undefined && log.cost > 0 && (
                          <p className="text-sm text-gray-500">{formatCost(log.cost)}</p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  共 {logsData.pagination.total} 条记录，第 {page} / {logsData.pagination.totalPages} 页
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= logsData.pagination.totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <Card className="p-8 text-center">
              <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">暂无使用记录</p>
              <p className="text-sm text-gray-400 mt-1">开始使用 AI 功能后，这里将显示您的使用记录</p>
            </Card>
          )}
        </>
      )}

      {activeTab === 'models' && stats && (
        <>
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">按模型分组统计</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">模型</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">调用次数</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Token 数</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">费用</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">占比</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.byModel.length > 0 ? (
                    stats.byModel.map((model, index) => (
                      <tr key={index} className="border-b last:border-0">
                        <td className="py-3 px-4 font-medium">{model.model}</td>
                        <td className="py-3 px-4 text-right">{formatNumber(model.count)}</td>
                        <td className="py-3 px-4 text-right">{formatNumber(model.tokens)}</td>
                        <td className="py-3 px-4 text-right">{formatCost(model.cost)}</td>
                        <td className="py-3 px-4 text-right">
                          {stats.total > 0 ? ((model.count / stats.total) * 100).toFixed(1) : 0}%
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-500">
                        暂无数据
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {stats.byModel.length > 0 && (
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4">模型使用分布</h3>
              <div className="space-y-3">
                {stats.byModel.map((model, index) => {
                  const percentage = stats.total > 0 ? (model.count / stats.total) * 100 : 0
                  const colors = ['bg-indigo-500', 'bg-green-500', 'bg-amber-500', 'bg-purple-500', 'bg-pink-500']
                  return (
                    <div key={index}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{model.model}</span>
                        <span className="text-gray-500">{percentage.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${colors[index % colors.length]} rounded-full transition-all`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
