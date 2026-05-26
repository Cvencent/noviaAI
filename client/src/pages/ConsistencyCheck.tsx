import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Textarea } from '../components/ui/Textarea';
import { 
  consistencyCheckApi, 
  ConsistencyCheckRule, 
  ConsistencyCheckReport, 
  ReportData,
  ReportIssue,
} from '../api/consistency-check';

enum CheckCategory {
  CHECK_CHARACTER = 'CHECK_CHARACTER',
  CHECK_TIMELINE = 'CHECK_TIMELINE',
  CHECK_WORLD = 'CHECK_WORLD',
  CHECK_PLOT = 'CHECK_PLOT',
  CHECK_RELATIONSHIP = 'CHECK_RELATIONSHIP',
  CHECK_GEOGRAPHY = 'CHECK_GEOGRAPHY',
}

enum Severity {
  CRITICAL = 'CRITICAL',
  NORMAL = 'NORMAL',
  MINOR = 'MINOR',
}

const categoryLabels: Record<CheckCategory, string> = {
  [CheckCategory.CHECK_CHARACTER]: '人物',
  [CheckCategory.CHECK_TIMELINE]: '时间线',
  [CheckCategory.CHECK_WORLD]: '世界观',
  [CheckCategory.CHECK_PLOT]: '情节',
  [CheckCategory.CHECK_RELATIONSHIP]: '人物关系',
  [CheckCategory.CHECK_GEOGRAPHY]: '地理',
};

const severityColors: Record<Severity, string> = {
  [Severity.CRITICAL]: 'text-red-400 bg-red-900/30',
  [Severity.NORMAL]: 'text-yellow-400 bg-yellow-900/30',
  [Severity.MINOR]: 'text-blue-400 bg-blue-900/30',
};

export function ConsistencyCheck() {
  const { projectId } = useParams<{ projectId: string }>();
  const [rules, setRules] = useState<ConsistencyCheckRule[]>([]);
  const [reports, setReports] = useState<ConsistencyCheckReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<ConsistencyCheckReport | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [checkContent, setCheckContent] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<CheckCategory[]>([]);
  const [activeTab, setActiveTab] = useState<'check' | 'reports' | 'rules'>('check');

  useEffect(() => {
    loadRules();
    loadReports();
  }, [projectId]);

  const loadRules = async () => {
    try {
      const data = await consistencyCheckApi.getRules(projectId!);
      setRules(data);
      setSelectedCategories(data.filter(r => r.isEnabled).map(r => r.category as CheckCategory));
    } catch (error) {
      console.error('加载规则失败:', error);
    }
  };

  const loadReports = async () => {
    if (!projectId) return;
    try {
      const data = await consistencyCheckApi.getReports(projectId);
      setReports(data.reports);
    } catch (error) {
      console.error('加载报告失败:', error);
    }
  };

  const handleUpdateRule = async (ruleId: string, updates: Partial<ConsistencyCheckRule>) => {
    try {
      await consistencyCheckApi.updateRule(projectId!, ruleId, updates);
      await loadRules();
    } catch (error) {
      console.error('更新规则失败:', error);
    }
  };

  const handlePerformCheck = async () => {
    if (!projectId || !checkContent.trim()) return;
    
    setIsChecking(true);
    try {
      await consistencyCheckApi.performCheck(projectId, {
        content: checkContent,
      });
      await loadReports();
      setCheckContent('');
      setActiveTab('reports');
    } catch (error) {
      console.error('检查失败:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleMarkReviewed = async (reportId: string) => {
    try {
      await consistencyCheckApi.markReportAsReviewed(projectId!, reportId);
      await loadReports();
      if (selectedReport?.id === reportId) {
        const updated = await consistencyCheckApi.getReports(projectId!);
        const found = updated.reports.find((r: ConsistencyCheckReport) => r.id === reportId);
        setSelectedReport(found || null);
      }
    } catch (error) {
      console.error('标记已审查失败:', error);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      await consistencyCheckApi.deleteReport(projectId!, reportId);
      await loadReports();
      if (selectedReport?.id === reportId) {
        setSelectedReport(null);
      }
    } catch (error) {
      console.error('删除报告失败:', error);
    }
  };

  const getCategoryStats = () => {
    const stats: Record<string, number> = {};
    reports.forEach(report => {
      const reportData = (report as any).reportData as ReportData;
      const issues = reportData?.issues || [];
      issues.forEach((issue: ReportIssue) => {
        const cat = issue.category;
        stats[cat] = (stats[cat] || 0) + 1;
      });
    });
    return stats;
  };

  const categoryStats = getCategoryStats();

  return (
    <div className="h-full bg-[var(--bg-primary)] p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">一致性检查</h1>
          <p className="text-[var(--text-muted)] mt-1">智能检测文本中的人物、时间线、世界观等一致性问题</p>
        </div>

        <div className="flex gap-4 mb-6 border-b border-[var(--border-color)]">
          <button
            onClick={() => setActiveTab('check')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'check'
                ? 'text-[var(--accent-color)] border-b-2 border-[var(--accent-color)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            执行检查
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'reports'
                ? 'text-[var(--accent-color)] border-b-2 border-[var(--accent-color)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            检查报告 ({reports.length})
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'rules'
                ? 'text-[var(--accent-color)] border-b-2 border-[var(--accent-color)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            检查规则
          </button>
        </div>

        {activeTab === 'check' && (
          <Card className="bg-[var(--bg-secondary)] border-[var(--border-color)]">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  选择检查维度
                </label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <label
                      key={value}
                      className={`inline-flex items-center px-3 py-1 rounded-full cursor-pointer transition-colors ${
                        selectedCategories.includes(value as CheckCategory)
                          ? 'bg-[var(--accent-color)]/20 text-[var(--accent-color)] border border-[var(--accent-color)]/50'
                          : 'bg-[var(--border-color)] text-[var(--text-muted)] border border-[var(--border-color)] hover:bg-[var(--bg-hover)]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(value as CheckCategory)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCategories([...selectedCategories, value as CheckCategory]);
                          } else {
                            setSelectedCategories(selectedCategories.filter(c => c !== value));
                          }
                        }}
                        className="sr-only"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  待检查文本
                </label>
                <Textarea
                  value={checkContent}
                  onChange={(e) => setCheckContent(e.target.value)}
                  placeholder="请输入或粘贴需要检查的文本内容..."
                  rows={12}
                  className="w-full bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-color)]"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handlePerformCheck}
                  disabled={isChecking || !checkContent.trim()}
                >
                  {isChecking ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>检查中...</span>
                    </div>
                  ) : (
                    '开始检查'
                  )}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'reports' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">历史报告</h2>
              
              {reports.length === 0 ? (
                <Card className="text-center py-8 bg-[var(--bg-secondary)] border-[var(--border-color)]">
                  <p className="text-gray-400">暂无检查报告</p>
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('check')}
                    className="mt-4"
                  >
                    立即检查
                  </Button>
                </Card>
              ) : (
                reports.map(report => (
                  <Card
                    key={report.id}
                    className={`cursor-pointer transition-all bg-[var(--bg-secondary)] border-[var(--border-color)] hover:border-[var(--accent-color)]/50 ${
                      selectedReport?.id === report.id ? 'ring-2 ring-[var(--accent-color)]' : ''
                    }`}
                    onClick={() => setSelectedReport(report)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm text-[var(--text-muted)]">
                            {new Date(report.createdAt).toLocaleString('zh-CN')}
                          </span>
                          {report.isReviewed && (
                            <span className="text-xs bg-green-900/30 text-green-400 px-2 py-0.5 rounded">
                              已审查
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold text-[var(--text-primary)]">
                            {report.totalIssues}
                          </span>
                          <span className="text-sm text-gray-400">个问题</span>
                        </div>
                        <div className="flex gap-2 mt-2">
                          {report.criticalCount > 0 && (
                            <span className="text-xs bg-red-900/30 text-red-400 px-2 py-0.5 rounded">
                              严重 {report.criticalCount}
                            </span>
                          )}
                          {report.normalCount > 0 && (
                            <span className="text-xs bg-yellow-900/30 text-yellow-400 px-2 py-0.5 rounded">
                              一般 {report.normalCount}
                            </span>
                          )}
                          {report.minorCount > 0 && (
                            <span className="text-xs bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded">
                              轻微 {report.minorCount}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteReport(report.id);
                        }}
                        className="text-gray-500 hover:text-red-400"
                      >
                        删除
                      </button>
                    </div>
                  </Card>
                ))
              )}
            </div>

            <div>
              {selectedReport ? (
                <ReportDetail
                  report={selectedReport}
                  onMarkReviewed={() => handleMarkReviewed(selectedReport.id)}
                />
              ) : (
                <Card className="text-center py-12 bg-[var(--bg-secondary)] border-[var(--border-color)]">
                  <p className="text-[var(--text-muted)]">选择左侧报告查看详情</p>
                </Card>
              )}
            </div>
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(categoryLabels).map(([category, label]) => (
                <Card key={category} className="bg-[var(--bg-secondary)] border-[var(--border-color)]">
                  <h3 className="font-semibold text-[var(--text-primary)] mb-3">{label}</h3>
                  <div className="space-y-2">
                    {rules
                      .filter(r => r.category === category)
                      .map(rule => (
                        <div
                          key={rule.id}
                          className="flex items-start justify-between p-2 rounded hover:bg-[var(--bg-hover)]"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-[var(--text-secondary)]">
                                {rule.name}
                              </span>
                              <span className={`text-xs px-1.5 py-0.5 rounded ${severityColors[rule.severity as Severity]}`}>
                                {rule.severity === Severity.CRITICAL ? '严重' : 
                                 rule.severity === Severity.NORMAL ? '一般' : '轻微'}
                              </span>
                            </div>
                            {rule.description && (
                              <p className="text-xs text-[var(--text-muted)] mt-1">{rule.description}</p>
                            )}
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={rule.isEnabled}
                              onChange={(e) => handleUpdateRule(rule.id, { isEnabled: e.target.checked })}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-[var(--border-color)] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--accent-color)]/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[var(--text-primary)] after:border-gray-600 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--accent-color)]"></div>
                          </label>
                        </div>
                      ))}
                  </div>
                </Card>
              ))}
            </div>

            <Card className="bg-[var(--bg-secondary)] border-[var(--border-color)]">
              <h3 className="font-semibold text-[var(--text-primary)] mb-4">统计概览</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {Object.entries(categoryStats).map(([category, count]) => (
                  <div key={category} className="text-center">
                    <div className="text-2xl font-bold text-[var(--accent-color)]">{count}</div>
                    <div className="text-sm text-[var(--text-secondary)]">
                      {categoryLabels[category as CheckCategory] || category}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function ReportDetail({ report, onMarkReviewed }: { report: ConsistencyCheckReport; onMarkReviewed: () => void }) {
  const reportData = (report as any).reportData as ReportData;
  const reportIssues = reportData?.issues || [];
  const reportMetadata = reportData?.metadata || { checkedAt: '', contentLength: 0, chaptersIncluded: [], rulesApplied: [] };

  return (
    <Card className="bg-[var(--bg-secondary)] border-[var(--border-color)]">
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">检查详情</h2>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              {new Date(reportMetadata.checkedAt).toLocaleString('zh-CN')}
            </p>
          </div>
          {!report.isReviewed && (
            <Button variant="outline" size="sm" onClick={onMarkReviewed}>
              标记已审查
            </Button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 p-4 bg-[var(--bg-tertiary)] rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">{report.criticalCount}</div>
            <div className="text-sm text-gray-400">严重</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">{report.normalCount}</div>
            <div className="text-sm text-gray-400">一般</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{report.minorCount}</div>
            <div className="text-sm text-gray-400">轻微</div>
          </div>
        </div>

        {reportIssues.length > 0 ? (
          <div className="space-y-3">
            <h3 className="font-medium text-[var(--text-primary)]">发现问题</h3>
            {reportIssues.map((issue: ReportIssue, index: number) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  issue.severity === Severity.CRITICAL
                    ? 'bg-red-900/20 border-red-500'
                    : issue.severity === Severity.NORMAL
                    ? 'bg-yellow-900/20 border-yellow-500'
                    : 'bg-blue-900/20 border-blue-500'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${severityColors[issue.severity as Severity]}`}>
                    {issue.severity === Severity.CRITICAL ? '严重' : 
                     issue.severity === Severity.NORMAL ? '一般' : '轻微'}
                  </span>
                  <span className="text-sm text-gray-400">
                    {categoryLabels[issue.category as CheckCategory] || issue.category}
                  </span>
                </div>
                <h4 className="font-medium text-[var(--text-primary)] mt-2">{issue.title}</h4>
                <p className="text-sm text-[var(--text-secondary)] mt-1 whitespace-pre-line">
                  {issue.description}
                </p>
                {issue.location && (
                  <div className="mt-2 p-2 bg-[var(--bg-primary)] rounded text-xs">
                    <span className="text-[var(--text-primary)]">位置：</span>
                    {issue.location.chapterTitle && (
                      <span className="text-[var(--text-muted)]">{issue.location.chapterTitle}</span>
                    )}
                    {issue.location.position && (
                      <span className="text-[var(--text-muted)]"> · {issue.location.position}</span>
                    )}
                  </div>
                )}
                {issue.suggestions && issue.suggestions.length > 0 && (
                  <div className="mt-2">
                    <span className="text-sm font-medium text-[var(--text-secondary)]">建议：</span>
                    <ul className="mt-1 space-y-1">
                      {issue.suggestions.map((suggestion: string, i: number) => (
                        <li key={i} className="text-sm text-[var(--text-secondary)] flex items-start gap-1">
                          <span className="text-green-400">•</span>
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-2 text-green-400">✓</div>
            <p className="text-[var(--text-muted)]">未发现一致性问题</p>
          </div>
        )}

        <div className="text-xs text-[var(--text-muted)] space-y-1 pt-4 border-t border-[var(--border-color)]">
          <p>检查字数：{reportMetadata.contentLength}</p>
          <p>涉及章节：{reportMetadata.chaptersIncluded.join('、') || '无'}</p>
          <p>应用规则：{reportMetadata.rulesApplied.join('、')}</p>
        </div>
      </div>
    </Card>
  );
}
