import { useCallback, useRef, useState } from 'react'
import { API_BASE_URL } from '../api/client'
import { useAuthStore } from '../store/auth'
import { AssistantAction } from '@/api/ai-assistant'

interface ChatStreamParams {
  projectId: string
  message: string
  provider?: string
  chapterId?: string
  chapterContent?: string
  chapterTitle?: string
}

interface UseChatStreamOptions {
  onThinking?: (content: string) => void
  onContent?: (content: string) => void
  onDone?: (actions: AssistantAction[]) => void
  onError?: (error: Error) => void
}

export function useChatStream(options: UseChatStreamOptions = {}) {
  const [isStreaming, setIsStreaming] = useState(false)
  const [thinking, setThinking] = useState('')
  const [content, setContent] = useState('')
  const [error, setError] = useState<Error | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const contentRef = useRef('')
  const optionsRef = useRef(options)
  optionsRef.current = options

  const startStream = useCallback(async (params: ChatStreamParams) => {
    setIsStreaming(true)
    setThinking('')
    setContent('')
    setError(null)
    contentRef.current = ''

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    try {
      const token = useAuthStore.getState().token
      const response = await fetch(`${API_BASE_URL}/ai-assistant/chat-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(params),
        signal: abortController.signal,
      })

      if (!response.ok) {
        throw new Error(`AI 助手请求失败：${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('浏览器不支持流式响应')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data: ')) continue

          const data = trimmed.slice(6)
          if (data === '[DONE]') {
            return
          }

          try {
            const parsed = JSON.parse(data) as {
              type: string
              content?: string
              actions?: AssistantAction[]
              error?: string
            }

            if (parsed.error) {
              throw new Error(parsed.error)
            }

            switch (parsed.type) {
              case 'thinking':
                if (parsed.content) {
                  setThinking(parsed.content)
                  optionsRef.current.onThinking?.(parsed.content)
                }
                break

              case 'content':
                if (parsed.content) {
                  contentRef.current = parsed.content
                  setContent(parsed.content)
                  setThinking('')
                  optionsRef.current.onContent?.(parsed.content)
                }
                break

              case 'done':
                if (parsed.actions) {
                  optionsRef.current.onDone?.(parsed.actions)
                }
                break
            }
          } catch (parseError) {
            console.error('解析流数据失败:', parseError)
          }
        }
      }
    } catch (caught) {
      if (caught instanceof Error && caught.name !== 'AbortError') {
        setError(caught)
        optionsRef.current.onError?.(caught)
      }
    } finally {
      setIsStreaming(false)
      abortControllerRef.current = null
    }
  }, [])

  const stopStream = useCallback(() => {
    abortControllerRef.current?.abort()
  }, [])

  const reset = useCallback(() => {
    setThinking('')
    setContent('')
    setError(null)
    contentRef.current = ''
  }, [])

  return { isStreaming, thinking, content, error, startStream, stopStream, reset }
}
