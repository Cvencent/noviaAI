import { useState, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import {
  Activity,
  Calendar,
  DollarSign,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Clock,
  MessageSquare,
  Bot,
  Settings,
  Trash2,
  Zap,
  Timer,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/contexts/ToastContext'
import { usageLogsApi } from '@/api/usage-logs'
import type { UsageStats, UsageLog as UsageLogType } from '@/types/usage-log'

export const UsageLogs = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const [page, setPage] = useState(1)
  const [activeTab, setActiveTab] = useState<'overview' | 'records' | 'models' | 'settings'>('overview')
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)
  const [retentionDays, setRetentionDays] = useState(30)
  const queryClient = useQueryClient()
  const { success: toastSuccess, error: toastError } = useToast()

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['usage-logs-stats', projectId],
    queryFn: () => usageLogsApi.getStats(projectId!),
    enabled: !!projectId,
    retry: false,
  })

  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ['usage-logs', projectId, page],
    queryFn: () => usageLogsApi.getLogs(projectId!, page, 20),
    enabled: !!projectId,
    retry: false,
  })

  const { data: retentionSetting } = useQuery({
    queryKey: ['usage-logs-retention', projectId],
    queryFn: () => usageLogsApi.getRetention(projectId!),
    enabled: !!projectId,
    retry: false,
  })

  const updateRetentionMutation = useMutation({
    mutationFn: (days: number) => usageLogsApi.updateRetention(projectId!, days),
    onSuccess: () => {
      toastSuccess('保存时长设置已更新')
      queryClient.invalidateQueries({ queryKey: ['usage-logs-retention', projectId] })
    },
    onError: () => toastError('更新失败'),
  })

  const cleanupMutation = useMutation({
    mutationFn: () => usageLogsApi.cleanup(projectId!),
    onSuccess: (data) => {
      toastSuccess(`已清理 ${data.deleted} 条过期日志`)
      queryClient.invalidateQueries({ queryKey: ['usage-logs', projectId] })
      queryClient.invalidateQueries({ queryKey: ['usage-logs-stats', projectId] })
    },
    onError: () => toastError('清理失败'),
  })

  const toggleExpand = useCallback((logId: string) => {
    setExpandedLogId((prev) => (prev === logId ? null : logId))
  }, [])

  useEffect(() => {
    if (retentionSetting) {
      setRetentionDays(retentionSetting.retentionDays)
    }
  }, [retentionSetting])

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

  const formatDuration = (ms?: number) => {
    if (!ms) return '-'
    if (ms < 1000) return ms + 'ms'
    return (ms / 1000).toFixed(1) + 's'
  }

  const LogDetailPanel = ({ log }: { log: UsageLogType }) => {
    const formatContent = (content?: string | object | null): string => {
      if (!content) return '无数据'
      const raw = typeof content === 'string' ? content : JSON.stringify(content, null, 2)
      try {
        const parsed = JSON.parse(raw)
        return JSON.stringify(parsed, null, 2)
      } catch {
        return raw
      }
    }
    const promptText = formatContent(log.promptContent || log.requestBody)
    const responseText = formatContent(log.responseContent || log.responseBody)

    return (
      <div className="border-t border-[var(--border-color)] bg-[var(--bg-primary)]">
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-x divide-[var(--border-color)]">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-semibold text-[var(--text-primary)]">Prompt 输入</span>
              {log.promptTokens && (
                <span className="text-xs text-[var(--text-muted)] bg-blue-500/10 px-2 py-0.5 rounded-full">
                  ~{formatNumber(log.promptTokens)} tokens
                </span>
              )}
            </div>
            <pre className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap break-all bg-[var(--bg-secondary)] rounded-lg p-3 max-h-64 overflow-y-auto scrollbar-thin font-mono leading-relaxed">
              {promptText}
            </pre>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Bot className="w-4 h-4 text-green-500" />
              <span className="text-sm font-semibold text-[var(--text-primary)]">Response 输出</span>
              {log.completionTokens && (
                <span className="text-xs text-[var(--text-muted)] bg-green-500/10 px-2 py-0.5 rounded-full">
                  ~{formatNumber(log.completionTokens)} tokens
                </span>
              )}
            </div>
            <pre className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap break-all bg-[var(--bg-secondary)] rounded-lg p-3 max-h-64 overflow-y-auto scrollbar-thin font-mono leading-relaxed">
              {responseText}
            </pre>
          </div>
        </div>
        <div className="flex items-center gap-4 px-4 py-2 text-xs text-[var(--text-muted)] bg-[var(--bg-secondary)]/50">
          {log.ipAddress && <span>IP: {log.ipAddress}</span>}
          {log.userAgent && <span className="truncate max-w-md">UA: {log.userAgent}</span>}
        </div>
      </div>
    )
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
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">使用日志</h1>
        <div className="flex gap-2">
          {[
            { key: 'overview', icon: <BarChart3 className="w-4 h-4" />, label: '概览' },
            { key: 'records', icon: <Activity className="w-4 h-4" />, label: '记录' },
            { key: 'models', icon: <Zap className="w-4 h-4" />, label: '模型统计' },
            { key: 'settings', icon: <Settings className="w-4 h-4" />, label: '设置' },
          ].map((tab) => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
            >
              {tab.icon}
              <span className="ml-1">{tab.label}</span>
            </Button>
          ))}
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
                  <p className="text-sm text-[var(--text-muted)]">总调用次数</p>
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
                  <p className="text-sm text-[var(--text-muted)]">今日调用</p>
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
                  <p className="text-sm text-[var(--text-muted)]">本周调用</p>
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
                  <p className="text-sm text-[var(--text-muted)]">总费用</p>
                  <p className="text-2xl font-bold">{formatCost(stats.totalCost)}</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">调用趋势（每日次数）</h3>
              <SimpleBarChart data={stats.dailyUsage} />
            </Card>

            <Card className="p-4">
              <h3 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">费用趋势</h3>
              <SimpleLineChart data={stats.dailyUsage} />
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <p className="text-sm text-[var(--text-muted)] mb-1">本月调用</p>
              <p className="text-3xl font-bold text-indigo-600">{formatNumber(stats.thisMonth)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-[var(--text-muted)] mb-1">总 Token 数</p>
              <p className="text-3xl font-bold text-green-600">{formatNumber(stats.totalTokens)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-[var(--text-muted)] mb-1">平均每次调用 Token</p>
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
                <div key={i} className="h-20 bg-[var(--bg-secondary)] rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : logsData?.logs && logsData.logs.length > 0 ? (
            <>
              <div className="space-y-3">
                {logsData.logs.map((log) => (
                  <div key={log.id} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] overflow-hidden transition-all hover:border-[var(--accent-color)]/30">
                    <div
                      className="p-4 cursor-pointer"
                      onClick={() => toggleExpand(log.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              log.statusCode === 200
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : 'bg-red-500/15 text-red-400'
                            }`}>
                              {log.statusCode || 'N/A'}
                            </span>
                            {log.model && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/15 text-blue-400">
                                {log.model}
                              </span>
                            )}
                            <span className="text-xs text-[var(--text-muted)]">{log.method}</span>
                            <span className="text-xs text-[var(--text-muted)]">{log.endpoint}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                            <span className="flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              {log.apiKey?.name || log.apiKeyId.slice(0, 8)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(log.createdAt)}
                            </span>
                            {log.duration && (
                              <span className="flex items-center gap-1">
                                <Timer className="w-3 h-3" />
                                {formatDuration(log.duration)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 ml-4">
                          <div className="text-right">
                            {log.tokensUsed && (
                              <p className="text-sm font-medium text-[var(--text-primary)]">{formatNumber(log.tokensUsed)} tokens</p>
                            )}
                            {log.cost !== undefined && log.cost > 0 && (
                              <p className="text-xs text-[var(--text-muted)]">{formatCost(log.cost)}</p>
                            )}
                          </div>
                          {expandedLogId === log.id ? (
                            <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                          )}
                        </div>
                      </div>
                      {expandedLogId !== log.id && (log.promptContent || log.responseContent) && (
                        <p className="mt-2 text-xs text-[var(--text-muted)] line-clamp-1">
                          {log.promptContent ? log.promptContent.slice(0, 120) + '...' : ''}
                        </p>
                      )}
                    </div>
                    {expandedLogId === log.id && <LogDetailPanel log={log} />}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-[var(--text-muted)]">
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
              <Activity className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3 opacity-30" />
              <p className="text-[var(--text-secondary)]">暂无使用记录</p>
              <p className="text-sm text-[var(--text-muted)] mt-1">开始使用 AI 功能后，这里将显示您的使用记录</p>
            </Card>
          )}
        </>
      )}

      {activeTab === 'models' && stats && (
        <>
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">按模型分组统计</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border-color)]">
                    <th className="text-left py-3 px-4 font-medium text-[var(--text-secondary)]">模型</th>
                    <th className="text-right py-3 px-4 font-medium text-[var(--text-secondary)]">调用次数</th>
                    <th className="text-right py-3 px-4 font-medium text-[var(--text-secondary)]">Token 数</th>
                    <th className="text-right py-3 px-4 font-medium text-[var(--text-secondary)]">费用</th>
                    <th className="text-right py-3 px-4 font-medium text-[var(--text-secondary)]">占比</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.byModel.length > 0 ? (
                    stats.byModel.map((model, index) => (
                      <tr key={index} className="border-b border-[var(--border-color)] last:border-0">
                        <td className="py-3 px-4 font-medium text-[var(--text-primary)]">{model.model}</td>
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
                      <td colSpan={5} className="py-8 text-center text-[var(--text-muted)]">
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
              <h3 className="text-lg font-semibold mb-4 text-[var(--text-primary)]">模型使用分布</h3>
              <div className="space-y-3">
                {stats.byModel.map((model, index) => {
                  const percentage = stats.total > 0 ? (model.count / stats.total) * 100 : 0
                  const colors = ['bg-indigo-500', 'bg-green-500', 'bg-amber-500', 'bg-purple-500', 'bg-pink-500']
                  return (
                    <div key={index}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-[var(--text-primary)]">{model.model}</span>
                        <span className="text-[var(--text-muted)]">{percentage.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
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

      {activeTab === 'settings' && (
        <div className="max-w-2xl space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Clock className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">日志保存时长</h3>
                <p className="text-sm text-[var(--text-muted)]">设置使用日志的保留天数，超过该时长的日志将被自动清理</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="text-sm text-[var(--text-secondary)] whitespace-nowrap">保留天数</label>
                <select
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(Number(e.target.value))}
                  className="flex-1 px-4 py-2.5 border rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] transition-all"
                >
                  <option value={7}>7 天</option>
                  <option value={14}>14 天</option>
                  <option value={30}>30 天（默认）</option>
                  <option value={60}>60 天</option>
                  <option value={90}>90 天</option>
                  <option value={180}>180 天</option>
                  <option value={365}>365 天</option>
                </select>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => updateRetentionMutation.mutate(retentionDays)}
                  isLoading={updateRetentionMutation.isPending}
                >
                  保存
                </Button>
              </div>

              {retentionSetting && (
                <p className="text-xs text-[var(--text-muted)]">
                  当前设置：保留 {retentionSetting.retentionDays} 天
                  （更新于 {new Date(retentionSetting.updatedAt).toLocaleDateString('zh-CN')}）
                </p>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">清理过期日志</h3>
                <p className="text-sm text-[var(--text-muted)]">手动触发清理已超过保留时长的使用日志记录</p>
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => cleanupMutation.mutate()}
              isLoading={cleanupMutation.isPending}
            >
              <Trash2 className="w-4 h-4" />
              立即清理过期日志
            </Button>
          </Card>
        </div>
      )}
    </div>
  )
}
