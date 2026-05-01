import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'

export default function App() {
  const { profile, loading } = useAuth()

  if (loading) {
    return <div className="flex items-center justify-center h-screen">加载中...</div>
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div className="p-4">Hello {profile?.nickname} {profile?.avatar} - 积分: {profile?.points}</div>} />
      </Routes>
    </BrowserRouter>
  )
}
