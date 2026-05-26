import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Search, GitBranch, CircleDot } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { OpenLoop, StoryEntity, StoryGraphAnswer, WorldStateFact, storySystemApi } from '../api/story-system'

export function StoryGraphWorkbench() {
  const { projectId } = useParams<{ projectId: string }>()
  const [entities, setEntities] = useState<StoryEntity[]>([])
  const [loops, setLoops] = useState<OpenLoop[]>([])
  const [facts, setFacts] = useState<WorldStateFact[]>([])
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [pathResult, setPathResult] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<StoryGraphAnswer | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!projectId) return
    setIsLoading(true)
    Promise.all([
      storySystemApi.listGraphEntities(projectId).catch(() => []),
      storySystemApi.listOpenLoops(projectId).catch(() => []),
      storySystemApi.listWorldFacts(projectId).catch(() => []),
    ]).then(([entityData, loopData, factData]) => {
      setEntities(entityData)
      setLoops(loopData)
      setFacts(factData)
    }).finally(() => setIsLoading(false))
  }, [projectId])

  const findPath = async () => {
    if (!projectId || !from.trim() || !to.trim()) return
    setIsLoading(true)
    try {
      setPathResult(await storySystemApi.findGraphPath(projectId, from.trim(), to.trim()))
    } finally {
      setIsLoading(false)
    }
  }

  const searchGraph = async () => {
    if (!projectId || !searchQuery.trim()) return
    setIsLoading(true)
    try {
      const result = await storySystemApi.searchStoryGraph(projectId, searchQuery.trim())
      setSearchResults(result.results)
    } finally {
      setIsLoading(false)
    }
  }

  const askGraph = async () => {
    if (!projectId || !question.trim()) return
    setIsLoading(true)
    try {
      setAnswer(await storySystemApi.askStoryGraph(projectId, question.trim()))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-full bg-[var(--bg-primary)] p-6 overflow-y-auto">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Story Graph</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">实体、伏笔、世界事实和关系路径</p>
        </div>

        <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
            <Search className="h-4 w-4" />
            Story Graph 问答
          </div>
          <div className="grid gap-2 md:grid-cols-[1fr_auto]">
            <Input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="询问实体、伏笔、世界事实或章节记忆" className="bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-color)]" />
            <Button onClick={askGraph} isLoading={isLoading}>提问</Button>
          </div>
          {answer && (
            <div className="mt-3 space-y-3 rounded border border-[var(--border-color)] bg-[var(--bg-primary)] p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-[var(--text-primary)]">{answer.status}</span>
                <span className="text-xs text-[var(--text-muted)]">{answer.sources.length} sources</span>
              </div>
              <div className="whitespace-pre-wrap text-[var(--text-secondary)]">{answer.answer}</div>
              {answer.sources.length > 0 && (
                <div className="space-y-2">
                  {answer.sources.slice(0, 3).map((source) => (
                    <div key={source.id} className="rounded border border-[var(--border-color)] bg-[var(--bg-secondary)] p-2 text-xs">
                      <div className="font-medium text-[var(--text-secondary)]">{source.sourceType} · {source.score.toFixed(3)}</div>
                      <div className="mt-1 text-[var(--text-muted)]">{source.text}</div>
                    </div>
                  ))}
                </div>
              )}
              <div className="grid gap-2 md:grid-cols-2">
                <div className="rounded border border-[var(--border-color)] bg-[var(--bg-secondary)] p-2 text-xs">
                  <div className="font-medium text-[var(--text-secondary)]">Open loops</div>
                  {answer.related.openLoops.slice(0, 3).map((loop) => (
                    <div key={loop.id} className="mt-1 text-[var(--text-muted)]">{loop.title || loop.key} · {loop.status}</div>
                  ))}
                </div>
                <div className="rounded border border-[var(--border-color)] bg-[var(--bg-secondary)] p-2 text-xs">
                  <div className="font-medium text-[var(--text-secondary)]">World facts</div>
                  {answer.related.worldFacts.slice(0, 3).map((fact) => (
                    <div key={fact.id} className="mt-1 text-[var(--text-muted)]">{fact.key}: {fact.value}</div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
            <Search className="h-4 w-4" />
            路径查询
          </div>
          <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
            <Input value={from} onChange={(event) => setFrom(event.target.value)} placeholder="起点实体" className="bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-color)]" />
            <Input value={to} onChange={(event) => setTo(event.target.value)} placeholder="终点实体" className="bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-color)]" />
            <Button onClick={findPath} isLoading={isLoading}>查询</Button>
          </div>
          {pathResult && (
            <div className="mt-3 rounded border border-[var(--border-color)] bg-[var(--bg-primary)] p-3 text-sm text-[var(--text-secondary)]">
              <div>{pathResult.from?.name || from} → {pathResult.to?.name || to}</div>
              <div className="mt-1 text-xs text-[var(--text-muted)]">
                {(pathResult.relations || []).map((relation: any) => relation.type).join(' / ') || '未找到关系路径'}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
            <Search className="h-4 w-4" />
            语义检索
          </div>
          <div className="grid gap-2 md:grid-cols-[1fr_auto]">
            <Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="搜索实体、世界事实、伏笔或章节记忆" className="bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-color)]" />
            <Button onClick={searchGraph} isLoading={isLoading}>搜索</Button>
          </div>
          {searchResults.length > 0 && (
            <div className="mt-3 space-y-2">
              {searchResults.map((item) => (
                <div key={item.id} className="rounded border border-[var(--border-color)] bg-[var(--bg-primary)] p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-[var(--text-primary)]">{item.sourceType}</span>
                    <span className="text-xs text-[var(--text-muted)]">{item.score.toFixed(3)}</span>
                  </div>
                  <div className="mt-1 text-[var(--text-secondary)]">{item.text}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <section className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
              <CircleDot className="h-4 w-4" />
              实体
            </div>
            <div className="space-y-2">
              {entities.slice(0, 30).map((entity) => (
                <div key={entity.id} className="rounded border border-[var(--border-color)] p-2 text-sm bg-[var(--bg-primary)]">
                  <div className="font-medium text-[var(--text-primary)]">{entity.name}</div>
                  <div className="text-xs text-[var(--text-muted)]">{entity.type}</div>
                </div>
              ))}
              {!entities.length && <div className="text-sm text-[var(--text-muted)]">暂无实体</div>}
            </div>
          </section>

          <section className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
              <GitBranch className="h-4 w-4" />
              开放伏笔
            </div>
            <div className="space-y-2">
              {loops.slice(0, 30).map((loop) => (
                <div key={loop.id} className="rounded border border-[var(--border-color)] p-2 text-sm bg-[var(--bg-primary)]">
                  <div className="font-medium text-[var(--text-primary)]">{loop.title || loop.key}</div>
                  <div className="text-xs text-yellow-400">{loop.status}</div>
                </div>
              ))}
              {!loops.length && <div className="text-sm text-[var(--text-muted)]">暂无开放伏笔</div>}
            </div>
          </section>

          <section className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
            <div className="mb-3 text-sm font-medium text-[var(--text-primary)]">世界事实</div>
            <div className="space-y-2">
              {facts.slice(0, 30).map((fact) => (
                <div key={fact.id} className="rounded border border-[var(--border-color)] p-2 text-sm bg-[var(--bg-primary)]">
                  <div className="font-medium text-[var(--text-primary)]">{fact.key}</div>
                  <div className="text-xs text-[var(--text-muted)]">{fact.category}</div>
                  <div className="mt-1 text-xs text-[var(--text-secondary)]">{fact.value}</div>
                  <div className="mt-1 text-xs text-[var(--text-muted)]">source: {fact.source || fact.commitId?.slice(0, 8)}</div>
                </div>
              ))}
              {!facts.length && <div className="text-sm text-[var(--text-muted)]">暂无世界事实</div>}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
