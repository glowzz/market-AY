import { createContext, useCallback, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { usePoints } from './hooks/usePoints'
import type { Profile } from './hooks/useAuth'
import HomePage from './pages/HomePage'
import PublishPainPointPage from './pages/PublishPainPointPage'
import ShareSolutionPage from './pages/ShareSolutionPage'
import PainPointDetailPage from './pages/PainPointDetailPage'
import SolutionDetailPage from './pages/SolutionDetailPage'
import LeaderboardPage from './pages/LeaderboardPage'
import SeedPage from './pages/SeedPage'

export const ProfileContext = createContext<Profile | null>(null)

export default function App() {
  const { profile, loading, refreshProfile } = useAuth()
  const { checkIn } = usePoints(profile, refreshProfile)
  const [toast, setToast] = useState('')

  const handleCheckIn = useCallback(async () => {
    const result = await checkIn()
    if (result) {
      setToast(result.message)
      setTimeout(() => setToast(''), 3000)
    }
  }, [checkIn])

  if (loading) {
    return <div className="flex items-center justify-center h-screen">加载中...</div>
  }

  return (
    <ProfileContext.Provider value={profile}>
      <BrowserRouter basename="/market-AY">
        {toast && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-purple-600 text-white px-6 py-3 rounded-xl shadow-lg text-sm font-medium">
            {toast}
          </div>
        )}
        <Routes>
          <Route path="/" element={<HomePage profile={profile} onCheckIn={handleCheckIn} />} />
          <Route path="/publish" element={<PublishPainPointPage />} />
          <Route path="/share" element={<ShareSolutionPage />} />
          <Route path="/pain-point/:id" element={<PainPointDetailPage />} />
          <Route path="/solution/:id" element={<SolutionDetailPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/seed" element={<SeedPage />} />
        </Routes>
      </BrowserRouter>
    </ProfileContext.Provider>
  )
}
