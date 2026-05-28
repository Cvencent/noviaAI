import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import {
  Sparkles,
  Zap,
  Palette,
  Layers,
  Move,
  Eye,
  CheckCircle2,
  ArrowRight,
  Plus,
  Trash2,
  Edit2,
  Search,
  Settings,
  Bell,
  MessageSquare,
  User,
  Star
} from 'lucide-react';

export const UIOptimizationDemo: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  
  const tabs = [
    { icon: Sparkles, label: '悬停效果' },
    { icon: Zap, label: '微交互' },
    { icon: Palette, label: '色彩优化' },
    { icon: Layers, label: '层级设计' },
    { icon: Move, label: '动画效果' }
  ];

  const showToast = () => {
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-8">
      {/* 标题区域 */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[var(--accent-color)] to-purple-500 rounded-xl flex items-center justify-center animate-pulse">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">UI 优化建议展示</h1>
            <p className="text-[var(--text-muted)]">探索可以改进的用户体验效果</p>
          </div>
        </div>
        
        {/* Tab 导航 */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap
                transition-all duration-300
                ${activeTab === index 
                  ? 'bg-[var(--accent-color)] text-white shadow-lg scale-105' 
                  : 'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)]'}
              `}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 内容区域 */}
      <div className="max-w-7xl mx-auto">
        {activeTab === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 卡片悬停效果对比 */}
            <Card className="hoverable">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-[var(--accent-color)]" />
                  当前效果
                </CardTitle>
                <CardDescription>基本的悬停效果</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button className="w-full">当前按钮</Button>
                  <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg">
                    <p className="text-sm">基本的阴影和边框</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-2 border-transparent hover:border-[var(--accent-color)]/50 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-color)]/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br from-[var(--accent-color)]/20 to-purple-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
              <CardHeader className="relative">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  建议效果
                </CardTitle>
                <CardDescription>增强的悬停体验</CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <div className="space-y-4">
                  <Button className="w-full group/btn relative overflow-hidden">
                    <span className="relative z-10 flex items-center gap-2">
                      优化按钮
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-color)] to-purple-500 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                  </Button>
                  <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg group-hover/card:bg-[var(--accent-color)]/10 transition-colors duration-300">
                    <p className="text-sm group-hover/card:text-[var(--accent-color)] transition-colors">
                      渐变背景 + 光晕效果 + 深度感知
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hoverable">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  图标动画
                </CardTitle>
                <CardDescription>悬停时的图标效果</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 justify-center">
                  {[Plus, Edit2, Trash2, Search, Settings, Bell, MessageSquare, User].map((Icon, i) => (
                    <button
                      key={i}
                      className="p-3 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--accent-color)] text-[var(--text-muted)] hover:text-white transition-all duration-300 hover:scale-125 hover:rotate-5"
                    >
                      <Icon className="w-5 h-5" />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 输入框微交互 */}
            <Card>
              <CardHeader>
                <CardTitle>输入框微交互</CardTitle>
                <CardDescription>焦点状态的视觉反馈</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">文本输入</label>
                  <Input placeholder="点击这里体验焦点效果..." />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">多行文本</label>
                  <Textarea placeholder="输入多行内容..." rows={3} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">下拉选择</label>
                  <Select>
                    <option>选择一个选项</option>
                    <option>选项一</option>
                    <option>选项二</option>
                    <option>选项三</option>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* 按钮交互效果 */}
            <Card>
              <CardHeader>
                <CardTitle>按钮交互效果</CardTitle>
                <CardDescription>不同状态的反馈</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-4">
                  <Button variant="primary">主要按钮</Button>
                  <Button variant="secondary">次要按钮</Button>
                  <Button variant="outline">轮廓按钮</Button>
                  <Button variant="ghost">幽灵按钮</Button>
                  <Button variant="destructive">危险按钮</Button>
                </div>
                <div className="flex flex-wrap gap-4">
                  <Button size="sm">小按钮</Button>
                  <Button size="md">中按钮</Button>
                  <Button size="lg">大按钮</Button>
                </div>
                <div className="flex gap-4">
                  <Button isLoading>加载中</Button>
                  <Button disabled>已禁用</Button>
                </div>
              </CardContent>
            </Card>

            {/* Toast 通知 */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Toast 通知动画</CardTitle>
                <CardDescription>消息提示的入场和离场效果</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Button onClick={showToast}>显示成功通知</Button>
                  <Button variant="secondary" onClick={showToast}>显示警告通知</Button>
                  <Button variant="outline" onClick={showToast}>显示信息通知</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 2 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 颜色卡片 */}
            <Card className="overflow-hidden">
              <div className="h-24 bg-[var(--accent-color)]" />
              <CardContent className="pt-4">
                <h4 className="font-semibold">主色调</h4>
                <p className="text-sm text-[var(--text-muted)]">用于主要按钮和强调</p>
                <code className="text-xs bg-[var(--bg-tertiary)] px-2 py-1 rounded mt-2 block">
                  var(--accent-color)
                </code>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <div className="h-24 bg-gradient-to-r from-[var(--accent-color)] to-purple-500" />
              <CardContent className="pt-4">
                <h4 className="font-semibold">渐变效果</h4>
                <p className="text-sm text-[var(--text-muted)]">用于背景和装饰</p>
                <code className="text-xs bg-[var(--bg-tertiary)] px-2 py-1 rounded mt-2 block">
                  linear-gradient
                </code>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <div className="h-24 bg-[var(--bg-secondary)]" />
              <CardContent className="pt-4">
                <h4 className="font-semibold">次要背景</h4>
                <p className="text-sm text-[var(--text-muted)]">用于卡片和面板</p>
                <code className="text-xs bg-[var(--bg-tertiary)] px-2 py-1 rounded mt-2 block">
                  var(--bg-secondary)
                </code>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <div className="h-24 bg-[var(--bg-tertiary)]" />
              <CardContent className="pt-4">
                <h4 className="font-semibold">三级背景</h4>
                <p className="text-sm text-[var(--text-muted)]">用于输入和交互</p>
                <code className="text-xs bg-[var(--bg-tertiary)] px-2 py-1 rounded mt-2 block">
                  var(--bg-tertiary)
                </code>
              </CardContent>
            </Card>

            {/* 色彩对比示例 */}
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle>色彩层次建议</CardTitle>
                <CardDescription>确保足够的对比度和可访问性</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-6 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)]">
                    <h5 className="font-semibold text-[var(--text-primary)] mb-2">主要文本</h5>
                    <p className="text-[var(--text-secondary)]">次要信息</p>
                    <p className="text-[var(--text-muted)] mt-1 text-sm">辅助说明</p>
                  </div>
                  <div className="p-6 bg-[var(--accent-color)]/10 rounded-lg border border-[var(--accent-color)]/30">
                    <h5 className="font-semibold text-[var(--accent-color)] mb-2">强调区域</h5>
                    <p className="text-[var(--accent-color)]/70">高亮显示内容</p>
                  </div>
                  <div className="p-6 bg-red-500/10 rounded-lg border border-red-500/30">
                    <h5 className="font-semibold text-red-500 mb-2">危险区域</h5>
                    <p className="text-red-500/70">警告和错误提示</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 3 && (
          <div className="space-y-8">
            {/* 阴影层级 */}
            <Card>
              <CardHeader>
                <CardTitle>阴影层级系统</CardTitle>
                <CardDescription>通过阴影建立视觉层次</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-8 items-end justify-center py-8">
                  {['shadow-sm', 'shadow', 'shadow-md', 'shadow-lg', 'shadow-xl', 'shadow-2xl'].map((shadow, i) => (
                    <div key={i} className="text-center">
                      <div 
                        className={`w-20 h-20 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] ${shadow}`}
                        style={{
                          boxShadow: `0 ${(i + 1) * 2}px ${(i + 1) * 4}px rgba(0,0,0,${0.1 + i * 0.05})`
                        }}
                      />
                      <p className="mt-2 text-sm text-[var(--text-muted)]">{shadow}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Z-index 层级 */}
            <Card>
              <CardHeader>
                <CardTitle>Z-index 层级</CardTitle>
                <CardDescription>正确的堆叠顺序</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative h-64 bg-[var(--bg-tertiary)] rounded-xl overflow-hidden">
                  {[
                    { z: 10, color: 'bg-blue-500/20', label: '背景' },
                    { z: 20, color: 'bg-green-500/20', label: '内容' },
                    { z: 30, color: 'bg-yellow-500/20', label: '悬浮' },
                    { z: 40, color: 'bg-orange-500/20', label: '下拉' },
                    { z: 50, color: 'bg-red-500/20', label: '模态框' },
                  ].map((layer, i) => (
                    <div
                      key={i}
                      className={`absolute ${layer.color} rounded-lg flex items-center justify-center font-medium`}
                      style={{
                        zIndex: layer.z,
                        left: `${i * 40}px`,
                        top: `${i * 30}px`,
                        width: `${200 - i * 20}px`,
                        height: `${120 - i * 10}px`,
                      }}
                    >
                      <span className="text-sm">z-index: {layer.z} - {layer.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 4 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 动画缓动函数 */}
            <Card>
              <CardHeader>
                <CardTitle>动画缓动函数</CardTitle>
                <CardDescription>不同的动画曲线效果</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'ease-out', cubic: 'cubic-bezier(0, 0, 0.2, 1)', desc: '快速开始，慢速结束' },
                    { name: 'ease-in', cubic: 'cubic-bezier(0.4, 0, 1, 1)', desc: '慢速开始，快速结束' },
                    { name: 'ease-in-out', cubic: 'cubic-bezier(0.4, 0, 0.2, 1)', desc: '慢速开始和结束' },
                    { name: 'bounce', cubic: 'cubic-bezier(0.34, 1.56, 0.64, 1)', desc: '弹性回弹效果' },
                  ].map((easing, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 bg-[var(--bg-tertiary)] rounded-lg">
                      <div className="flex-1">
                        <h5 className="font-medium">{easing.name}</h5>
                        <p className="text-xs text-[var(--text-muted)]">{easing.desc}</p>
                        <code className="text-xs text-[var(--text-muted)]">{easing.cubic}</code>
                      </div>
                      <div className="relative w-32 h-8 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                        <div 
                          className="absolute w-6 h-6 bg-[var(--accent-color)] rounded-full top-1 animate-move-demo"
                          style={{ 
                            left: '4px',
                            animation: `moveDemo 2s ${easing.cubic} infinite`
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 动画时间 */}
            <Card>
              <CardHeader>
                <CardTitle>动画时长建议</CardTitle>
                <CardDescription>不同场景的合适时长</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { duration: '100-150ms', useCase: '微交互（悬停、点击）', desc: '快速响应' },
                    { duration: '200-300ms', useCase: '状态切换（开关、折叠）', desc: '平衡体验' },
                    { duration: '300-500ms', useCase: '页面过渡、模态框', desc: '流畅自然' },
                    { duration: '500-1000ms', useCase: '入场动画、强调', desc: '引人注意' },
                  ].map((item, i) => (
                    <div key={i} className="p-4 bg-[var(--bg-tertiary)] rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <h5 className="font-medium">{item.duration}</h5>
                        <span className="text-sm text-[var(--accent-color)]">{item.useCase}</span>
                      </div>
                      <p className="text-sm text-[var(--text-muted)]">{item.desc}</p>
                      <div className="mt-2 h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[var(--accent-color)] rounded-full"
                          style={{ 
                            width: `${(i + 1) * 25}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 模态框演示 */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>模态框动画</CardTitle>
                <CardDescription>优雅的打开和关闭效果</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setIsModalOpen(true)}>打开模态框</Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Toast 通知 */}
      {toastVisible && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h4 className="font-medium">操作成功</h4>
              <p className="text-sm text-[var(--text-muted)]">你的更改已保存</p>
            </div>
          </div>
        </div>
      )}

      {/* 模态框 */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="优化后的模态框">
        <div className="space-y-4">
          <p>这是一个带有平滑动画效果的模态框示例。</p>
          <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg">
            <h5 className="font-medium mb-2">改进点：</h5>
            <ul className="text-sm text-[var(--text-muted)] space-y-1">
              <li>✓ 背景模糊效果</li>
              <li>✓ 弹性入场动画</li>
              <li>✓ 点击外部区域关闭</li>
              <li>✓ ESC 键支持</li>
              <li>✓ 键盘焦点管理</li>
            </ul>
          </div>
          <div className="flex gap-3 justify-end pt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>取消</Button>
            <Button onClick={() => setIsModalOpen(false)}>确认</Button>
          </div>
        </div>
      </Modal>

      {/* 自定义动画样式 */}
      <style>{`
        @keyframes moveDemo {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(88px); }
        }
      `}</style>
    </div>
  );
};
