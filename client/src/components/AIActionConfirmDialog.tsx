import React, { useState, useEffect } from 'react'
import { Check, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from './ui/Button'
import { Modal } from './ui/Modal'
import { cn } from '@/utils/cn'

export interface ActionParameter {
  name: string
  type: 'string' | 'number' | 'boolean' | 'array' | 'object'
  required: boolean
  description?: string
  defaultValue?: any
}

export interface ActionSuggestion {
  id: string
  name: string
  description: string
  type: string
  actionType: string
  parameters: ActionParameter[]
}

interface AIActionConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  action: ActionSuggestion | null
  onConfirm: (params: Record<string, any>) => Promise<void>
  isLoading?: boolean
}

export const AIActionConfirmDialog: React.FC<AIActionConfirmDialogProps> = ({
  isOpen,
  onClose,
  action,
  onConfirm,
  isLoading = false
}) => {
  const [params, setParams] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (action && isOpen) {
      const initialParams: Record<string, any> = {}
      action.parameters.forEach(param => {
        if (param.defaultValue !== undefined) {
          initialParams[param.name] = param.defaultValue
        }
      })
      setParams(initialParams)
      setErrors({})
    }
  }, [action, isOpen])

  const validateForm = (): boolean => {
    if (!action) return false
    
    const newErrors: Record<string, string> = {}
    let isValid = true

    action.parameters.forEach(param => {
      if (param.required && (params[param.name] === undefined || params[param.name] === '')) {
        newErrors[param.name] = `${param.description || param.name} 是必填项`
        isValid = false
      }
    })

    setErrors(newErrors)
    return isValid
  }

  const handleConfirm = async () => {
    if (!validateForm()) return
    
    try {
      await onConfirm(params)
      onClose()
    } catch (error) {
      console.error('执行操作失败:', error)
    }
  }

  const handleParamChange = (name: string, value: any) => {
    setParams(prev => ({
      ...prev,
      [name]: value
    }))
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const renderParamInput = (param: ActionParameter) => {
    const value = params[param.name] ?? param.defaultValue ?? ''

    switch (param.type) {
      case 'boolean':
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => handleParamChange(param.name, e.target.checked)}
              className="w-4 h-4 rounded border-[var(--border-color)] bg-[var(--bg-hover)] text-[var(--accent-color)] focus:ring-[var(--accent-color)]"
            />
            <span className="text-sm text-[var(--text-secondary)]">{param.description || param.name}</span>
          </label>
        )
      
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleParamChange(param.name, Number(e.target.value))}
            placeholder={param.description || param.name}
            className={cn(
              "w-full px-3 py-2 bg-[var(--bg-hover)] border rounded-md text-[var(--text-primary)] focus:outline-none focus:ring-1",
              errors[param.name] ? "border-red-500 focus:ring-red-500" : "border-[var(--border-color)] focus:ring-[var(--accent-color)]"
            )}
          />
        )
      
      case 'string':
      default:
        return (
          <textarea
            value={value}
            onChange={(e) => handleParamChange(param.name, e.target.value)}
            placeholder={param.description || param.name}
            rows={3}
            className={cn(
              "w-full px-3 py-2 bg-[var(--bg-hover)] border rounded-md text-[var(--text-primary)] focus:outline-none focus:ring-1 resize-none",
              errors[param.name] ? "border-red-500 focus:ring-red-500" : "border-[var(--border-color)] focus:ring-[var(--accent-color)]"
            )}
          />
        )
    }
  }

  const getActionTypeColor = (type: string) => {
    switch (type) {
      case 'character': return 'text-pink-400 bg-pink-400/10'
      case 'plot': return 'text-cyan-400 bg-cyan-400/10'
      case 'setting': return 'text-indigo-400 bg-indigo-400/10'
      default: return 'text-gray-400 bg-gray-400/10'
    }
  }

  if (!action) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="确认操作">
      <div className="space-y-6">
        {/* 操作信息 */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className={cn("p-3 rounded-lg", getActionTypeColor(action.type))}>
              <Check className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-200">{action.name}</h3>
              <p className="text-sm text-gray-400">{action.description}</p>
            </div>
          </div>
        </div>

        {/* 参数表单 */}
        {action.parameters.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-300">参数配置</h4>
            <div className="space-y-4">
              {action.parameters.map((param) => (
                <div key={param.name} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-300">
                      {param.description || param.name}
                      {param.required && <span className="text-red-400 ml-1">*</span>}
                    </label>
                    <span className="text-xs text-gray-500 bg-[var(--bg-hover)] px-2 py-0.5 rounded">
                      {param.type}
                    </span>
                  </div>
                  {renderParamInput(param)}
                  {errors[param.name] && (
                    <div className="flex items-center gap-1 text-xs text-red-400">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors[param.name]}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 按钮 */}
        <div className="flex gap-3 pt-4 border-t border-[var(--border-color)]">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={isLoading}
          >
            取消
          </Button>
          <Button
            className="flex-1"
            onClick={handleConfirm}
            disabled={isLoading}
            isLoading={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                执行中...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                确认执行
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
