import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Search, GitBranch, CircleDot } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { OpenLoop, StoryEntity, WorldStateFact, storySystemApi } from '../api/story-system'

export function StoryGraphWorkbench() {
  const { projectId } = useParams<{ projectId: string }>()
  const [entities, setEntities] = useState<StoryEntity[]>([])
  const [loops, setLoops] = useState<OpenLoop[]>([])
  const [facts, setFacts] = useState<WorldStateFact[]>([])
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [pathResult, setPathResult] = useState<any>(null)
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Story Graph</h1>
          <p className="mt-1 text-sm text-gray-600">实体、伏笔、世界事实和关系路径</p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-900">
            <Search className="h-4 w-4" />
            路径查询
          </div>
          <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
            <Input value={from} onChange={(event) => setFrom(event.target.value)} placeholder="起点实体" />
            <Input value={to} onChange={(event) => setTo(event.target.value)} placeholder="终点实体" />
            <Button onClick={findPath} isLoading={isLoading}>查询</Button>
          </div>
          {pathResult && (
            <div className="mt-3 rounded border border-gray-100 bg-gray-50 p-3 text-sm text-gray-700">
              <div>{pathResult.from?.name || from} → {pathResult.to?.name || to}</div>
              <div className="mt-1 text-xs text-gray-500">
                {(pathResult.relations || []).map((relation: any) => relation.type).join(' / ') || '未找到关系路径'}
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <section className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-900">
              <CircleDot className="h-4 w-4" />
              实体
            </div>
            <div className="space-y-2">
              {entities.slice(0, 30).map((entity) => (
                <div key={entity.id} className="rounded border border-gray-100 p-2 text-sm">
                  <div className="font-medium text-gray-800">{entity.name}</div>
                  <div className="text-xs text-gray-500">{entity.type}</div>
                </div>
              ))}
              {!entities.length && <div className="text-sm text-gray-500">暂无实体</div>}
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-900">
              <GitBranch className="h-4 w-4" />
              开放伏笔
            </div>
            <div className="space-y-2">
              {loops.slice(0, 30).map((loop) => (
                <div key={loop.id} className="rounded border border-gray-100 p-2 text-sm">
                  <div className="font-medium text-gray-800">{loop.title || loop.key}</div>
                  <div className="text-xs text-yellow-700">{loop.status}</div>
                </div>
              ))}
              {!loops.length && <div className="text-sm text-gray-500">暂无开放伏笔</div>}
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="mb-3 text-sm font-medium text-gray-900">世界事实</div>
            <div className="space-y-2">
              {facts.slice(0, 30).map((fact) => (
                <div key={fact.id} className="rounded border border-gray-100 p-2 text-sm">
                  <div className="font-medium text-gray-800">{fact.key}</div>
                  <div className="text-xs text-gray-500">{fact.category}</div>
                  <div className="mt-1 text-xs text-gray-700">{fact.value}</div>
                  <div className="mt-1 text-xs text-gray-400">source: {fact.source || fact.commitId?.slice(0, 8)}</div>
                </div>
              ))}
              {!facts.length && <div className="text-sm text-gray-500">暂无世界事实</div>}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
