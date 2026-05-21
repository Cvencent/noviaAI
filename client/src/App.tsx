import { Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth'
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
})

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
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
          <Route path="usage-logs" element={<UsageLogs />} />
          <Route path="plots" element={<PlotManagement />} />
          <Route path="scenes" element={<SceneManagement />} />
          <Route path="outlines" element={<OutlineManagement />} />
          <Route path="turning-points" element={<TurningPointManagement />} />
          <Route path="timeline" element={<TimelineManagement />} />
        </Route>
      </Routes>
    </QueryClientProvider>
  )
}

export default App
