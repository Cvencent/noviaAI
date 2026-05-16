import { Routes, Route } from 'react-router-dom'

function ProjectsPage() {
  return <div>Projects Page</div>
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<div>Home</div>} />
      <Route path="/projects" element={<ProjectsPage />} />
      <Route path="/projects/:id" element={<div>Project Detail</div>} />
    </Routes>
  )
}

export default App
