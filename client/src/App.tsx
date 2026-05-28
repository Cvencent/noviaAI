import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth'
import { ToastProvider } from '@/contexts/ToastContext'
import { useToast } from '@/contexts/ToastContext'
import { Login } from '@/pages/Login'
import { Register } from '@/pages/Register'
import { Projects } from '@/pages/Projects'
import { ProjectWorkspace } from '@/pages/ProjectWorkspace'
import { WritingStyleTestPage } from '@/pages/WritingStyleTest'
import { StyleHowItWorks } from '@/pages/StyleHowItWorks'
import { UIOptimizationDemo } from '@/pages/UIOptimizationDemo'
import { ApiErrorHandler } from '@/api/client'

import { PageTransitionWrapper } from '@/components/PageTransitionWrapper'

const AISettingsPage = lazy(() => import('@/pages/AISettings').then(m => ({ default: m.AISettingsPage })))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: (failureCount, error) => {
        if (failureCount >= 3) return false
        const status = (error as any)?.response?.status
        return status === 429 || status === 502 || status === 503 || status === 504
      },
      staleTime: 5 * 60 * 1000,
      gcTime: 15 * 60 * 1000,
    },
    mutations: {
      retry: (failureCount, error) => {
        if (failureCount >= 2) return false
        const status = (error as any)?.response?.status
        return status === 429 || status === 502 || status === 503 || status === 504
      },
    },
  },
})

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function AppContent() {
  const { error: showErrorToast } = useToast()

  queryClient.setDefaultOptions({
    queries: {
      throwOnError: (error) => {
        const apiError = ApiErrorHandler.fromAxiosError(error as any)
        showErrorToast(apiError.message)
        return false
      },
    },
  })

  return (
    <PageTransitionWrapper>
      <Routes>
        <Route path="/" element={<Navigate to="/projects" replace />} />
        <Route path="/ui-optimization-demo" element={<UIOptimizationDemo />} />
        <Route path="/writing-style-test" element={<WritingStyleTestPage />} />
        <Route path="/style-how-it-works" element={<StyleHowItWorks />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/projects"
          element={
            <ProtectedRoute>
              <Projects />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai-settings"
          element={
            <ProtectedRoute>
              <Suspense fallback={null}>
                <AISettingsPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:projectId/*"
          element={
            <ProtectedRoute>
              <ProjectWorkspace />
            </ProtectedRoute>
          }
        />
      </Routes>
    </PageTransitionWrapper>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </QueryClientProvider>
  )
}

export default App
