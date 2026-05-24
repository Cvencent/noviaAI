import { Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth'
import { ToastProvider } from '@/contexts/ToastContext'
import { useToast } from '@/contexts/ToastContext'
import { Login } from '@/pages/Login'
import { Register } from '@/pages/Register'
import { Projects } from '@/pages/Projects'
import { ProjectWorkspace } from '@/pages/ProjectWorkspace'
import { ProjectOverview } from '@/pages/ProjectOverview'
import { ProjectSettings } from '@/pages/ProjectSettings'
import { AISettingsPage } from '@/pages/AISettings'
import { ConsistencyCheck } from '@/pages/ConsistencyCheck'
import { WorldSettings } from '@/pages/WorldSettings'
import { ChapterEditor } from '@/pages/ChapterEditor'
import { CharacterManagement } from '@/pages/CharacterManagement'
import { ChapterManagement } from '@/pages/ChapterManagement'
import { UsageLogs } from '@/pages/UsageLogs'
import { PlotManagement } from '@/pages/PlotManagement'
import { SceneManagement } from '@/pages/SceneManagement'
import { OutlineManagement } from '@/pages/OutlineManagement'
import { TurningPointManagement } from '@/pages/TurningPointManagement'
import { TimelineManagement } from '@/pages/TimelineManagement'
import { EnhancedCharacterNetwork } from '@/pages/EnhancedCharacterNetwork'
import { WritingStyleTestPage } from '@/pages/WritingStyleTest'
import { StyleHowItWorks } from '@/pages/StyleHowItWorks'
import { ReaderExperience } from '@/pages/ReaderExperience'
import { StoryGraphWorkbench } from '@/pages/StoryGraphWorkbench'
import { ApiErrorHandler } from '@/api/client'

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
    <Routes>
      <Route path="/" element={<Navigate to="/projects" replace />} />
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
            <AISettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:projectId"
        element={
          <ProtectedRoute>
            <ProjectWorkspace />
          </ProtectedRoute>
        }
      >
        <Route index element={<ProjectOverview />} />
        <Route path="settings" element={<ProjectSettings />} />
        <Route path="characters" element={<CharacterManagement />} />
        <Route path="character-network" element={<EnhancedCharacterNetwork />} />
        <Route path="world" element={<WorldSettings />} />
        <Route path="chapters" element={<ChapterManagement />} />
        <Route path="chapters/:chapterId" element={<ChapterEditor />} />
        <Route path="consistency-check" element={<ConsistencyCheck />} />
        <Route path="reader-experience" element={<ReaderExperience />} />
        <Route path="story-graph" element={<StoryGraphWorkbench />} />
        <Route path="usage-logs" element={<UsageLogs />} />
        <Route path="plots" element={<PlotManagement />} />
        <Route path="scenes" element={<SceneManagement />} />
        <Route path="outlines" element={<OutlineManagement />} />
        <Route path="turning-points" element={<TurningPointManagement />} />
        <Route path="timeline" element={<TimelineManagement />} />
      </Route>
    </Routes>
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
