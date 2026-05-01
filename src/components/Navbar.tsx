import type { Profile } from '../hooks/useAuth'

interface NavbarProps {
  profile: Profile | null
  onCheckIn: () => void
}

export default function Navbar({ profile, onCheckIn }: NavbarProps) {
  return (
    <nav className="hidden sm:flex items-center justify-between px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-800 text-white shadow-lg">
      <div className="text-xl font-bold">
        🏪 AI 痛点集市
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">
          💰 {profile?.points ?? 0}
        </span>
        <button
          className="text-sm hover:opacity-80 transition-opacity"
          onClick={() => window.location.hash = '/leaderboard'}
        >
          📊 榜单
        </button>
        <button
          className="text-sm hover:opacity-80 transition-opacity"
          onClick={onCheckIn}
        >
          🔥 打卡
        </button>
        <div className="flex items-center gap-2">
          <span className="text-lg">{profile?.avatar}</span>
          <span className="text-sm">{profile?.nickname}</span>
        </div>
      </div>
    </nav>
  )
}
