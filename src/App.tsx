import { createContext } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import type { Profile } from './hooks/useAuth'
import HomePage from './pages/HomePage'
import PublishPainPointPage from './pages/PublishPainPointPage'
import ShareSolutionPage from './pages/ShareSolutionPage'

export const ProfileContext = createContext<Profile | null>(null)

export default function App() {
  const { profile, loading, refreshProfile } = useAuth()

  if (loading) {
    return <div className="flex items-center justify-center h-screen">加载中...</div>
  }

  return (
    <ProfileContext.Provider value={profile}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage profile={profile} onCheckIn={async () => { await refreshProfile() }} />} />
          <Route path="/publish" element={<PublishPainPointPage />} />
          <Route path="/share" element={<ShareSolutionPage />} />
        </Routes>
      </BrowserRouter>
    </ProfileContext.Provider>
  )
}
