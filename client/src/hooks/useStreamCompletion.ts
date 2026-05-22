import { useCallback, useRef, useState } from 'react'
import { API_BASE_URL } from '../api/client'
import { useAuthStore } from '../store/auth'

interface StreamParams {
  projectId: string
  chapterId?: string
  content: string
  provider?: 'openai' | 'claude' | 'deepseek' | 'mimo'
  model?: string
  temperature?: number
  maxTokens?: number
}

interface UseStreamCompletionOptions {
  onComplete?: (fullText: string) => void | Promise<void>
  onError?: (error: Error) => void
}

export function useStreamCompletion(options: UseStreamCompletionOptions = {}) {
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamedText, setStreamedText] = useState('')
  const [error, setError] = useState<Error | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const streamedTextRef = useRef('')
  const optionsRef = useRef(options)
  optionsRef.current = options

  const startStream = useCallback(async (params: StreamParams) => {
    setIsStreaming(true)
    setStreamedText('')
    setError(null)
    streamedTextRef.current = ''

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    try {
      const token = useAuthStore.getState().token
      const response = await fetch(`${API_BASE_URL}/ai/text-complete-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(params),
        signal: abortController.signal,
      })

      if (!response.ok) {
        throw new Error(`AI 续写请求失败：${response.status}`)
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
            await optionsRef.current.onComplete?.(streamedTextRef.current)
            return
          }

          const parsed = JSON.parse(data) as { token?: string; error?: string }
          if (parsed.error) {
            throw new Error(parsed.error)
          }
          if (parsed.token) {
            streamedTextRef.current += parsed.token
            setStreamedText(streamedTextRef.current)
          }
        }
      }

      await optionsRef.current.onComplete?.(streamedTextRef.current)
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
    void optionsRef.current.onComplete?.(streamedTextRef.current)
    abortControllerRef.current?.abort()
  }, [])

  const reset = useCallback(() => {
    setStreamedText('')
    setError(null)
    streamedTextRef.current = ''
  }, [])

  return { isStreaming, streamedText, error, startStream, stopStream, reset }
}
