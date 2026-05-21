import { useParams } from 'react-router-dom'
import { Shield, BookOpen } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { ProjectStyleSelector } from '../components/ProjectStyleSelector'

export function ProjectSettings() {
  const { projectId } = useParams<{ projectId: string }>()

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-6 h-6 text-gray-600" />
        <h1 className="text-2xl font-bold">项目设置</h1>
      </div>

      <div className="space-y-6">
        {/* 写作风格 */}
        <div className="bg-white rounded-xl p-6 border">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">写作风格</h2>
            <p className="text-sm text-gray-600 mt-1">
              选择适合你故事的写作风格，AI 会遵循这个风格进行续写
            </p>
          </div>
          {projectId && <ProjectStyleSelector projectId={projectId} />}
        </div>

        {/* 基础信息 */}
        <div className="bg-white rounded-xl p-6 border">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            基本信息
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                项目标题
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="我的小说"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                类型
              </label>
              <select className="w-full px-3 py-2 border rounded-lg">
                <option>奇幻</option>
                <option>科幻</option>
                <option>悬疑</option>
                <option>言情</option>
                <option>文学</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                简介
              </label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="这是一个关于..."
              />
            </div>
          </div>
        </div>

        {/* 保存按钮 */}
        <div className="flex justify-end gap-3">
          <Button variant="outline">取消</Button>
          <Button>保存设置</Button>
        </div>
      </div>
    </div>
  )
}
