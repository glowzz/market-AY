import { useNavigate } from 'react-router-dom'
import type { Profile } from '../hooks/useAuth'

interface NavbarProps {
  profile: Profile | null
  onCheckIn: () => void
}

export default function Navbar({ profile, onCheckIn }: NavbarProps) {
  const navigate = useNavigate()

  return (
    <nav className="bg-gradient-to-r from-purple-600 to-purple-800 text-white shadow-lg">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3">
        <div className="text-lg sm:text-xl font-bold">
          🏪 AI 痛点集市
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="text-xs sm:text-sm font-medium">
            💰 {profile?.points ?? 0}
          </span>
          <button
            className="text-xs sm:text-sm hover:opacity-80 transition-opacity"
            onClick={() => navigate('/leaderboard')}
          >
            📊 榜单
          </button>
          <button
            className="text-xs sm:text-sm hover:opacity-80 transition-opacity"
            onClick={onCheckIn}
          >
            🔥 打卡
          </button>
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="text-base sm:text-lg">{profile?.avatar}</span>
            <span className="text-xs sm:text-sm">{profile?.nickname}</span>
          </div>
        </div>
      </div>
    </nav>
  )
}
